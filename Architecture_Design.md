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

**Stage 2 — real-time delivery (Days 19–22):**
Everything built so far follows request → response → connection closes. Chat needs the opposite: a connection that _stays open_, so the server can push a new message to the recipient's screen the instant it arrives, without them refreshing. This requires WebSockets — a genuinely different communication model layered _on top of_ the same `MessageService` and `messages` table already built. The database and business logic don't change; only the delivery mechanism does.

**A second design correction, found while wiring up the frontend:** the WebSocket auth interceptor (`WebSocketAuthInterceptor`) originally read the STOMP `CONNECT` frame with `StompHeaderAccessor.wrap(message)`, then called `accessor.setUser(...)` to attach the sender's identity to the session. This looked correct — no exception was thrown, and a debug log even confirmed `principal set for alice@test.com` — but every message sent _after_ that first `CONNECT` frame arrived with a `null` principal, crashing `ChatSocketController.sendMessage()`. The cause: `wrap()` builds a detached accessor around the message's headers rather than the mutable accessor Spring itself attaches to inbound STOMP messages, so the identity never actually persisted into the session past that one frame. The fix was one line — `MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class)` instead of `StompHeaderAccessor.wrap(message)` — but finding it required instrumenting both the `CONNECT` and `SEND` branches with logging and comparing session IDs side by side, since the failure was silent (no exception, no error) rather than loud.

**A third fix, in the same area:** `SecurityConfig`'s `authorizeHttpRequests` had no rule for `/ws/**`, so the WebSocket handshake — a plain HTTP `GET` before it upgrades — was being rejected by the `anyRequest().authenticated()` catch-all before `WebSocketAuthInterceptor` ever got a chance to run. Adding `.requestMatchers("/ws/**").permitAll()` let the handshake through at the HTTP layer, while identity is still fully enforced at the STOMP layer by the interceptor above — so this didn't weaken auth, it just moved where it happens.

### Phase 5 — Organizer Approval & Admin Oversight (added after the original blueprint)

The original six-week plan didn't include this phase — it came out of a design review after Phase 4 shipped, once a real gap became visible: `AuthController.register` built the new user's `Role` directly from whatever string the client sent (`Role.valueOf(request.getRole().toUpperCase())`). The frontend only ever offered "Participant" or "Organizer" as choices, but nothing on the server stopped a direct API call from registering as `ADMIN` — self-service privilege escalation, sitting live in a "finished" auth system.

**The fix, and the decision behind it:** registration now always creates a `PARTICIPANT`, full stop — `Role.PARTICIPANT` is hardcoded in `AuthController.register`, and the `role` field in the request is ignored regardless of what's sent. Organizer access is no longer something you select; it's something you're granted. This meant building an actual approval workflow rather than just deleting the "Organizer" option from the sign-up form:

1. **`OrganizerRequest` entity** — `user`, `reason` (free text), `status` (`PENDING` / `APPROVED` / `REJECTED`), `createdAt`. Same shape as `Connection`: one row per request, status flips in place rather than creating new rows.
2. **`POST /organizer-requests`** — any `PARTICIPANT` can submit one, with a service-level check blocking a second `PENDING` request from the same user (mirrors the duplicate-connection check from Phase 4).
3. **`GET /organizer-requests/me`** — lets the frontend show "your request is pending" / "your last request was rejected, you can apply again" without the user having to remember what they last did.
4. **Admin review** — `GET /organizer-requests` (admin-only, pending queue), `POST /organizer-requests/{id}/approve`, `POST /organizer-requests/{id}/reject`. Approval doesn't just flip the request's status — it calls `UserService.updateRole(userId, Role.ORGANIZER)`, the actual privilege grant, and reuses Phase 4's `NotificationService` to tell the user their request was approved or rejected. Same pattern as before: the side effect (role change, notification) lives inside the service method that already runs, not bolted on separately.

**A consequence worth calling out:** because a JWT's `role` claim is baked in at login time and never re-checked against the database mid-session, an approved user doesn't see their new `ORGANIZER` powers until they log out and back in. This is a deliberate tradeoff of stateless JWTs (no server-side session to invalidate) rather than a bug — documented here so it isn't mistaken for one later.

**Admin oversight pages**, once there was an admin role worth building for:

- `GET /users/participants` / `GET /users/organizers` — both admin-only, both just `UserRepository.findByRole(...)` filtered and mapped to `UserResponse`. Simple by design; the interesting logic is entirely in the approval flow above.
- `GET /events/overview` — every event, plus each one's live registration count via `RegistrationService.getEventRegistrations(id).size()`. This is deliberately a second endpoint rather than a parameter on the existing `GET /events`, because the registration count is only meaningful (and only exposed) to admins — participants browsing events don't get it.
- `GET /events/mine` — the organizer-facing equivalent, filtered to `organizer_id = <requester>` via `EventRepository.findByOrganizerId`, which already existed in the repository unused until this phase needed it.

**The connection-request rule, decided alongside this phase:** admins were never meant to be "attendees" in the networking sense, so `ConnectionService.sendRequest()` now rejects the request outright — with a clear message, not a silent no-op — if _either_ the sender or the receiver has role `ADMIN`. Participants and organizers still connect with each other exactly as before; only the admin side of that relationship was cut off. This is enforced in the service layer, not just hidden in the UI, so a direct API call can't route around it either — verified by calling the endpoint directly with an admin's token and confirming the rejection.

---

## 3. Cross-cutting fixes discovered while building Phase 5

Two problems surfaced only once a real "delete" and "approve" flow existed to trigger them — both were latent since much earlier phases, invisible until something actually exercised the path.

**No cascade on event deletion.** `EventController` had a `DELETE /{id}` endpoint from Phase 2, but nothing had ever called it in earnest until this phase added an organizer-facing delete button. The first real attempt failed: Postgres rejected the delete with a foreign-key violation, because `registrations` (and transitively `tickets` and `attendance`) still referenced the event. `EventService.deleteEvent` now explicitly clears `Attendance → Ticket → Registration` for that event before deleting it — in that order, since each layer's FK points at the one before it.

**No global exception handling, anywhere.** Chasing the delete bug above surfaced a bigger issue: there was no `@RestControllerAdvice` in the entire backend. Every business-rule exception — `IllegalArgumentException`, `IllegalStateException`, `SecurityException` — fell through to Spring Boot's default error handling, which returns a **bodyless 500** unless `server.error.include-message` is explicitly enabled (it wasn't). Every frontend page's `error.response?.data?.message || 'fallback text'` had been silently showing the generic fallback this whole time, for every error, on every page — not because the backend messages were bad, but because they were never actually reaching the client. A `GlobalExceptionHandler` now maps `IllegalArgumentException` → 400, `IllegalStateException` → 409, `SecurityException` → 403, and bean-validation failures → 400 with the first field error's message, all with the real message in the body.

**The one subtlety that mattered:** a naive catch-all `@ExceptionHandler(Exception.class)` would also intercept Spring Security's `AccessDeniedException` — the exception `@PreAuthorize` throws on a role check failure — because that exception resolves _inside_ `DispatcherServlet`, before it would ever reach `ExceptionTranslationFilter`. Without an explicit handler for it, every `@PreAuthorize` denial across the whole app (e.g. a participant hitting an organizer-only endpoint) would have silently regressed from a correct `403` to an incorrect `500`. `GlobalExceptionHandler` handles `AccessDeniedException` explicitly, ahead of the generic catch-all, specifically to avoid that regression — confirmed by testing a role-mismatched request before and after.

**One more masking layer, found in the same pass:** `SecurityConfig` had no rule permitting `/error`, so when an exception _did_ reach Spring Boot's default error handling (before `GlobalExceptionHandler` existed, and still true for anything it doesn't catch), the internal servlet forward to `/error` was itself being rejected by the security filter chain — replacing whatever the real status was with an unrelated `403`. Permitting `/error` fixed this for every endpoint at once, not just the one that surfaced it.

---

## 4. How the pieces connect — the full user journey, traced through the code

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

**11. Applying to become an organizer**
`POST /organizer-requests` → `@PreAuthorize` requires an authenticated user, then `OrganizerRequestService.submitRequest()` checks the caller is a `PARTICIPANT` and has no existing `PENDING` request → saves an `OrganizerRequest` row with `status = PENDING`.

**12. Admin reviewing the request**
`GET /organizer-requests` (`@PreAuthorize("hasRole('ADMIN')")`) → the pending queue. `POST /organizer-requests/{id}/approve` → `OrganizerRequestService.approve()`: flips the request to `APPROVED`, calls `UserService.updateRole()` to actually grant `ORGANIZER`, and creates a `Notification` for the applicant — three effects from one admin click, all inside the same service method so they can't drift out of sync with each other.

---

## 5. Data model summary

```
User ─┬─< Event (as organizer)
      ├─< Registration >─ Event
      │        │
      │        └─ Ticket ─ Attendance
      ├─< Connection >─ User        (sender/receiver, self-referencing; blocked entirely if either side is ADMIN)
      ├─< Message >─ User           (sender/receiver, self-referencing; requires an ACCEPTED Connection)
      ├─< OrganizerRequest >─ User  (one user, one request at a time; approval promotes User.role)
      └─< Notification >─ User     (one recipient; created as a side effect of Connection/Message/OrganizerRequest actions, never on its own)
```

Every entity beyond `User` and `Event` exists because a previous entity created the need for it:

- `Registration` needed `User` + `Event` to already exist
- `Ticket` needed `Registration` to exist (it's issued _for_ a registration)
- `Attendance` needed `Ticket` to exist (it's recorded _against_ a ticket)
- `Message` was deliberately made to depend on `Connection` (a message can only be sent if a connection exists)
- `OrganizerRequest` needed `User` + `Role` to already exist as a concept — it's the audit trail for a privilege change, not just a status flag on `User` itself, specifically so a rejected request doesn't erase the fact that someone asked
- `Notification` depends on all of the above — it's never created directly by a controller, only as a side effect inside `ConnectionService`, `MessageService`, and `OrganizerRequestService`, so it's structurally impossible for one of those actions to happen without also notifying the person it affects

---

## 6. Frontend — from functional to production-ready

For most of this project's life, the frontend was plain inline-styled React — functional, but visibly a testing UI, not something you'd show anyone. It was redesigned in place, page by page, without changing any API calls or business logic underneath — a pure presentation-layer rebuild, the same way Stage 2 of Phase 4 changed chat's delivery mechanism without touching `MessageService`.

**Tailwind CSS + a small component kit**, not a component library. `Button`, `Input`, `Textarea`, `Card`, `Badge` in `components/ui/` cover every recurring pattern in the app; everything else is Tailwind utility classes directly on the page. This was a deliberate sizing decision — a full library (MUI, Chakra, shadcn's CLI) would have been more machinery than an app this size needed.

**Two decisions made explicitly, not by default:**

- **Event cover photos.** The brief asked for a drag-and-drop upload control, but the backend has no image field or storage endpoint, and building one wasn't in scope. Rather than ship a fake upload control that silently drops whatever you give it (a real "no half-finished implementations" trap), events instead get a deterministic gradient generated from their ID — colorful, consistent per event, and honest about what it is. If real photo uploads are added later, this is the one place that needs to change.
- **Registration's role picker.** Removed from the sign-up form the same day Phase 5's server-side lockdown went in (see above) — leaving the picker in the UI while the backend silently ignored it would have been actively misleading, so both changed together, not one before the other.

**Role-aware navigation.** `Navbar.jsx` computes `isParticipant` / `isOrganizer` / `isAdmin` once from the JWT's stored role and gates every link off those three booleans — "Create event" and "Check in" only for organizers, "My tickets" only for participants, the four admin pages only for admins, "Connections" hidden entirely for admins per the Phase 5 rule above. The gate is UI-only convenience, not the actual security boundary — every one of those routes is independently enforced server-side by `@PreAuthorize`, so hiding a link is about not showing someone a button that would just 403, not about protecting anything.

---
