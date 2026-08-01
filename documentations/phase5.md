# Phase 5 — Organizer Approval & Admin Oversight

This document explains Phase 5 in simple words, with real examples. It covers: the security gap that started it, applying to become an organizer, admin approval/rejection, the admin oversight pages, and the connection rule that changed for admins.

We'll use **Alice** (a participant who wants to organize), **Bob** (a regular participant), and **the Admin** as our example people throughout.

---

## 1. The problem that started this phase

Phase 5 wasn't in the original plan. It exists because of one line of code, discovered during a later review of `AuthController`:

```java
Role role = Role.valueOf(request.getRole().toUpperCase());
```

This built a new user's role from whatever string the client sent in the registration request. The React frontend only ever offered "Participant" or "Organizer" as choices — but nothing stopped someone from calling the API directly:

```
POST /auth/register
{ "name": "Anyone", "email": "anyone@example.com", "password": "...", "role": "ADMIN" }
```

That request would have succeeded. **Anyone could register themselves as an admin.** This is a real security hole, not a hypothetical one — it just happened to be invisible because the UI never offered the option.

### The fix

Registration now **always** creates a `PARTICIPANT`, no matter what role is sent:

```java
User user = userService.registerUser(
        request.getName(), request.getEmail(), request.getPassword(),
        Role.PARTICIPANT   // hardcoded — the request's role field is ignored
);
```

This one change had a bigger consequence than it looks like: if nobody can self-select "Organizer" anymore, there needs to be *some* way to become one. That's the rest of this phase.

---

## 2. Applying to become an organizer

### What it is

An `OrganizerRequest` is one row remembering three things, same shape as a `Connection`:

- **Who's asking** (`user`)
- **Why** (`reason` — free text, e.g. "I want to run a monthly React meetup")
- **Status** — `PENDING`, `APPROVED`, or `REJECTED`

### Example

Alice applies:

```
OrganizerRequest {
  user: Alice
  reason: "I want to run a monthly React meetup for my local dev community"
  status: PENDING
}
```

### Rules we enforce

- **Only participants can apply.** If Alice is already an `ORGANIZER` (or somehow `ADMIN`), the request is rejected — becoming an organizer twice doesn't mean anything.
- **You can't have two pending requests at once.** If Alice already has a `PENDING` request, she can't submit another until it's resolved.
- **A rejected request doesn't block trying again.** Only an existing `PENDING` request blocks a new submission — if Alice's last request was rejected, she's free to apply again.

### The endpoints

| What                       | How                              |
| -------------------------- | --------------------------------- |
| Submit a request           | `POST /organizer-requests`        |
| Check my own request(s)    | `GET /organizer-requests/me`      |
| See all pending (admin)    | `GET /organizer-requests`         |
| Approve a request (admin)  | `POST /organizer-requests/{id}/approve` |
| Reject a request (admin)   | `POST /organizer-requests/{id}/reject`  |

---

## 3. Admin review — what actually happens on approval

Approving a request isn't just changing a status field. One click does three things, all inside `OrganizerRequestService.approve()`:

```
1. request.status → APPROVED
2. Alice's User.role → ORGANIZER   (the actual privilege grant)
3. A Notification is created for Alice: "Your organizer request was approved — you can now create events"
```

All three happen together, inside one method, for the same reason notifications in Phase 4 were built as a side effect rather than a separate step: it should be structurally impossible for an admin to approve someone without that person's role actually changing, or without them finding out.

Rejection is simpler — just `status → REJECTED` plus a notification: *"Your organizer request was not approved."*

### A gotcha worth knowing

Alice's JWT already has `role: PARTICIPANT` baked into it from when she logged in. Spring doesn't re-check the database on every request — it trusts the token. So even though her `User.role` in the database is now `ORGANIZER` the instant admin approves, **Alice's browser still thinks she's a participant** until she logs out and back in, generating a fresh token with the new role.

This isn't a bug — it's how stateless JWTs work (no server-side session to invalidate). It's just worth knowing so it isn't mistaken for one.

---

## 4. Admin oversight — seeing the whole platform

Once there was an admin role worth building for, four read-only views were added:

| Page | Endpoint | Shows |
| --- | --- | --- |
| Organizer requests | `GET /organizer-requests` | Everyone currently `PENDING`, with Approve/Reject buttons |
| Participants | `GET /users/participants` | Every user with role `PARTICIPANT` |
| Organizers | `GET /users/organizers` | Every user with role `ORGANIZER` |
| All events | `GET /events/overview` | Every event on the platform, with its organizer's name and a **live registration count** |

The registration count on the "all events" page comes from the exact same method the organizer's own dashboard uses (`RegistrationService.getEventRegistrations(id).size()`) — reused, not reimplemented.

**Why these are separate endpoints instead of admin just reusing `GET /events`:** the registration count is only meaningful — and only exposed — to admins. A participant browsing events publicly has no reason to see how many people registered for someone else's event, so it isn't bundled into the response everyone gets.

Admins can also open any individual event and see a **read-only** version of the "who's registered" list — the same underlying data participants and organizers see (`GET /events/{id}/attendees`), just without the "Connect" button, because of the rule below.

---

## 5. The connection rule — admins don't network

This was a deliberate decision made alongside this phase, not an accident of what got built first: **admins are not attendees.** They review the platform; they don't participate in it the way a participant or organizer does.

So `ConnectionService.sendRequest()` gained one more check:

```
if sender is ADMIN  → rejected: "Admins cannot send connection requests"
if receiver is ADMIN → rejected: "You cannot send a connection request to an admin"
```

### What this means in practice

```
Alice (participant) → Bob (participant)     ✅ allowed, same as before
Alice (participant) → Verified Organizer    ✅ allowed, same as before
Bob (participant)   → the Admin              ❌ rejected
the Admin            → Alice                 ❌ rejected
```

Participants and organizers connect with each other exactly as they always have — nothing changed on that side. Only the admin's side of the relationship was cut off, in both directions.

**This is enforced in the service layer, not just hidden in the UI.** The frontend simply doesn't show a "Connect" button next to an admin (there's nowhere that would even display one, since admins don't show up in event attendee lists as attendees). But even if someone called the API directly with an admin's own token, `ConnectionService` would still reject it — the rule doesn't depend on the UI cooperating.

---

## 6. Putting it all together — one full example

1. **Alice registers.** Regardless of anything she might try to send, she becomes a `PARTICIPANT`.
2. **Alice wants to run events.** She goes to "Become an organizer," writes her reason, and submits. An `OrganizerRequest` is created with `status: PENDING`.
3. **The Admin checks the organizer requests page**, sees Alice's application and her reason, and clicks Approve.
   → Alice's `OrganizerRequest` becomes `APPROVED`.
   → Alice's `User.role` becomes `ORGANIZER`.
   → A notification is created for Alice.
4. **Alice logs out and back in** (to pick up her new role in a fresh token), and now sees "Create event," "My events," and "Check in" in her navbar for the first time.
5. **Alice creates an event.** Bob registers for it.
6. **Bob opens the event page**, sees Alice's name as organizer and sees who else registered, and sends a connection request to another attendee — this still works exactly as it did in Phase 4.
7. **Bob tries to message the Admin directly** (say, out of curiosity) — rejected immediately, both if he tries it through the UI (no such option exists) and if he tried calling the API directly.
8. **Meanwhile, the Admin checks the "All events" overview** and sees Alice's event listed with a live count of how many people (including Bob) have registered — without needing to ask Alice or dig through the database.

---

## 7. Summary — one sentence per piece

- **The gap this phase fixes:** registration used to trust whatever role string the client sent, including `ADMIN` — now it always creates a `PARTICIPANT`, server-side, no exceptions.
- **`OrganizerRequest`** = a row tracking one participant's application to become an organizer, with a status, mirroring how `Connection` tracks a relationship request.
- **Approval** = one admin action that changes three things together — the request's status, the user's actual role, and a notification — so none of them can fall out of sync.
- **The JWT gotcha** = a freshly-approved organizer still needs to log out and back in before the app sees their new role, because the role lives in the token, not re-checked per request.
- **Admin oversight pages** = read-only views (participants, organizers, all events with live registration counts) built once there was a role that needed them, reusing existing service methods rather than duplicating logic.
- **The connection rule** = admins can neither send nor receive connection requests, enforced in `ConnectionService` itself — not a UI-only restriction.
