# EventSphere — Architecture & Design Journey

This document explains _how_ EventSphere was built, in the order it was actually built, and _why_ each piece exists. It's not a feature list — it's the reasoning trail: what problem each layer solves, and how every component connects to the ones around it.

---

## 1. The build philosophy

Every feature in this project was built in the same repeating pattern, one layer at a time:

```
Entity  →  Repository  →  Service  →  Controller  →  (Frontend)
```

- **Entity** — defines what the data looks like and how it's stored in Postgres
- **Repository** — Spring Data JPA interface; talks to the database, no SQL written by hand
- **Service** — business rules and logic (ownership checks, duplicate checks, validation)
- **Controller** — the HTTP door; turns requests into service calls and shapes the response

This same four-layer shape was repeated for every single feature — `User`, `Event`, `Registration`, `Ticket`, `Attendance`, `Connection`, `Message` — which is why, once the pattern clicked once, every subsequent feature took less time to reason about.

**Rule that held throughout:** Controllers never talk to Repositories directly. Services never know about HTTP. This kept each layer replaceable — e.g. Day 20's WebSocket handler can call the exact same `MessageService.sendMessage()` that the REST controller uses, without duplicating any logic.

---

## 2. Build order, and why that order

### Phase 1 — Authentication (the foundation everything else needs)

Nothing else could be built safely without first answering: _who is making this request, and are they who they claim to be?_

1. **`User` entity + `UserRepository`** — the one table every other feature eventually links back to
2. **Password hashing (BCrypt)** — passwords are never stored in readable form
3. **`POST /auth/register`** — first real endpoint, proves the whole chain (Controller → Service → Repository → Postgres) works
4. **JWT generation (`POST /auth/login`)** — issues a signed token containing the user's email _and role_
5. **`JwtAuthFilter`** — runs on _every_ request, reads the token, and (if valid) attaches the user's identity + role to that request
6. **`@PreAuthorize` + `@EnableMethodSecurity`** — lets individual endpoints say "only ORGANIZER" or "only PARTICIPANT" and have it actually enforced

**Why this had to come first:** every later feature — creating an event, registering, checking in, sending a connection request — needs to know _who_ is doing it and _what they're allowed to do_. This is the layer that answers both.

### Phase 2 — Events (the first real product feature)

With auth working, `Event` was the natural next entity, since it's the center of the whole platform — everything else (registrations, tickets, connections between people at the _same_ event) hangs off it.

- `Event` links to `User` via `organizer_id` — a direct foreign key, meaning every event always knows exactly who owns it
- CRUD endpoints were split by access level: `GET /events` is public (anyone can browse), but `POST/PUT/DELETE` require `ROLE_ORGANIZER` **and** ownership (an organizer can only edit _their own_ events, not someone else's)
- This is also where the React frontend was connected for the first time — proving the whole stack (Postgres → Spring Boot → React) talks correctly end to end

### Phase 3 — Registration → Ticket → Attendance (the core "attend an event" loop)

This phase was built as **one continuous chain**, because each entity only makes sense in relation to the one before it:

```
Registration  →  Ticket  →  Attendance
(a person signs   (a QR code is    (the ticket is
 up for an event)  generated for    scanned at the
                   that signup)     door, once)
```

- **`Registration`** links `User` + `Event`, with a unique constraint so the same person can't register twice for the same event
- **`Ticket`** is created _automatically_, the moment a registration succeeds — not as a separate manual step. A random unique code (`TICKET-{id}-{random}`) is generated and stored as plain text; the actual QR _image_ is never stored — it's generated fresh, on request, using the ZXing library, from that stored code
- **`Attendance`** is created only when an organizer scans a ticket's code via `POST /attendance/check-in`. A unique constraint on `ticket_id` means the same ticket can never be checked in twice — both in application logic and as a database-level guarantee

**Why tickets are generated automatically instead of requested separately:** it mirrors the real-world action — the moment you register for an event, you _have_ a ticket. There's no meaningful in-between state.

**Why the QR image is generated on-demand, not stored:** the image is just a visual encoding of a string that's already saved. Storing the image itself would duplicate data and bloat the database for something regenerable at any time, instantly, for free.

**Who does what, physically:** the participant only ever _displays_ their ticket (`GET /tickets/{code}/image`, restricted to the ticket's owner). Only an organizer can _scan and confirm_ it (`POST /attendance/check-in`, restricted to `ROLE_ORGANIZER`) — the same relationship as a passenger showing a boarding pass versus a gate agent scanning it.

### Phase 4 — Connections & Chat (the networking layer)

This phase is being built in two stages, on purpose:

**Stage 1 — plain REST (Days 17–18):**

- `Connection` — one row per pair of users, tracking `sender`, `receiver`, and `status` (`PENDING` / `ACCEPTED` / `REJECTED`). A duplicate check (in either direction) prevents two connection rows existing for the same pair
- `Message` — one row per message sent, with `sender`, `receiver`, `content`, `sentAt`. Fetching a conversation pulls every message between two specific people, in either direction, ordered chronologically

**A key design correction made along the way:** initially, `Message` and `Connection` were built as two independent features with no relationship between them — meaning anyone could message anyone, whether or not they were connected. This was identified as a real design gap and fixed: `MessageService.sendMessage()` now checks, before saving any message, whether an `ACCEPTED` connection exists between the two users. If not, the message is rejected. This is what makes "connecting" with someone an actual permission gate, not just a decorative feature sitting unused next to chat.

**Stage 2 — real-time delivery (Days 19–22, in progress):**
Everything built so far follows request → response → connection closes. Chat needs the opposite: a connection that _stays open_, so the server can push a new message to the recipient's screen the instant it arrives, without them refreshing. This requires WebSockets — a genuinely different communication model layered _on top of_ the same `MessageService` and `messages` table already built. The database and business logic don't change; only the delivery mechanism does.

---

## 3. How the pieces connect — the full user journey, traced through the code

Here is one continuous walkthrough of a real user's path through the system, showing exactly which files are involved at each step.

**1. Registering an account**
`POST /auth/register` → `AuthController` → `UserService.registerUser()` hashes the password via `PasswordEncoder` → `UserRepository.save()` → a row lands in the `users` table.

**2. Logging in**
`POST /auth/login` → `AuthController` → `UserService.authenticate()` verifies the password against the stored hash → `JwtService.generateToken()` builds a signed token containing the user's email and role → returned to the client.

**3. Every request after login**
Client attaches `Authorization: Bearer <token>` → `JwtAuthFilter` intercepts the request _before_ it reaches any controller → `JwtService` verifies the signature and extracts the role → `SecurityContextHolder` is stamped with "this request belongs to user X, role Y" for the rest of that one request.

**4. Browsing events**
`GET /events` → `EventController.getAllEvents()` — no `@PreAuthorize`, so this works even without a token → `EventService` → `EventRepository.findAll()`.

**5. Registering for an event**
`POST /events/{id}/register` → `@PreAuthorize("hasRole('PARTICIPANT')")` checks the stamp from step 3 → `RegistrationController` → `RegistrationService.registerForEvent()`:

- checks for an existing registration (blocks duplicates)
- saves the `Registration`
- immediately calls `TicketService.issueTicket()`, which generates a unique code and saves a `Ticket` row linked to that registration

**6. Viewing the ticket**
`GET /tickets/{code}/image` → `TicketController` checks the requester's identity against `ticket.getRegistration().getUser()` (ownership check) → if it matches, `QrCodeService` generates a PNG from the stored code using ZXing → image bytes returned directly in the response.

**7. Checking in at the venue**
`POST /attendance/check-in` → `@PreAuthorize("hasRole('ORGANIZER')")` → `AttendanceController` → `AttendanceService.checkIn()`:

- looks up the `Ticket` by its code
- checks whether an `Attendance` row already exists for it (blocks double check-in)
- saves a new `Attendance` row with the current timestamp

**8. Organizer's live dashboard**
`GET /events/{id}/dashboard` → ownership check (only _this event's_ organizer can view it) → pulls the count of `Registration`s and the list of `Attendance`s for that event, via a JPA query that traverses `Attendance → Ticket → Registration → Event` without any hand-written SQL.

**9. Connecting with another participant**
`POST /connections/request/{receiverId}` → `ConnectionService.sendRequest()` checks (in either direction) that no connection already exists between the two users → saves a `Connection` row with `status = PENDING`.
`POST /connections/{id}/accept` → ownership check (only the actual receiver can accept) → flips `status` to `ACCEPTED`.

**10. Messaging a connection**
`POST /chat/messages/{receiverId}` → `MessageService.sendMessage()` first checks `ConnectionRepository` for an `ACCEPTED` connection between sender and receiver → if none exists, rejected → if it exists, the `Message` is saved.
`GET /chat/messages/{otherUserId}` → pulls every message between the two users, in either direction, ordered by time.

---

## 4. Data model summary

```
User ─┬─< Event (as organizer)
      ├─< Registration >─ Event
      │        │
      │        └─ Ticket ─ Attendance
      ├─< Connection >─ User   (sender/receiver, self-referencing)
      └─< Message >─ User      (sender/receiver, self-referencing)
```

Every entity beyond `User` and `Event` exists because a previous entity created the need for it:

- `Registration` needed `User` + `Event` to already exist
- `Ticket` needed `Registration` to exist (it's issued _for_ a registration)
- `Attendance` needed `Ticket` to exist (it's recorded _against_ a ticket)
- `Message` was deliberately made to depend on `Connection` (a message can only be sent if a connection exists)

---
