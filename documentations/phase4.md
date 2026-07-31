# Phase 4 — Networking & Real-Time Chat

This document explains Phase 4 in simple words, with real examples. It covers: Connections (like "add friend"), Chat (messaging), how real-time actually works, which libraries are used, how security works, and how Notifications work.

We'll use **Alice** and **Bob** as our example people throughout.

---

## 1. The big picture

Phase 4 answers one question: **"How do two people using EventSphere find each other and talk?"**

It has three parts, built one after another:

1. **Connections** — like sending a "friend request." You can't just message anyone; you have to connect first.
2. **Chat** — sending and receiving messages, only allowed between connected people.
3. **Notifications** — a little "you have something new" record, so you don't miss a request or message even if you weren't online at the time.

```
Alice sends Bob a Connection request
        ↓
Bob accepts it
        ↓
Now Alice and Bob are "connected"
        ↓
Alice can now send Bob a Chat message
        ↓
Bob gets a Notification saying "Alice sent you a message"
```

---

## 2. Connections — "Add Friend"

### What it is

A `Connection` is just one row in a database table that remembers three things:

- **Who sent** the request (`sender`)
- **Who received** it (`receiver`)
- **What's the status** — `PENDING`, `ACCEPTED`, or `REJECTED`

### Example

Alice sends Bob a request:

```
Connection {
  sender: Alice
  receiver: Bob
  status: PENDING
}
```

Bob accepts it. The **same row** just changes:

```
Connection {
  sender: Alice
  receiver: Bob
  status: ACCEPTED
}
```

We don't create a new row when Bob accepts — we just flip the status on the row that already exists.

### Rules we enforce

- **You can't connect with yourself.**
- **You can't send the same request twice.** If Alice already sent Bob a request, she can't send another one — the system checks in _both directions_ (Alice→Bob and Bob→Alice count as the same relationship).
- **Only the receiver can accept or reject.** Alice can't accept her own request pretending to be Bob. The system checks: "is the person clicking Accept actually the receiver?"

### The endpoints

| What               | How                                 |
| ------------------ | ----------------------------------- |
| Send a request     | `POST /connections/request/{bobId}` |
| Accept a request   | `POST /connections/{id}/accept`     |
| Reject a request   | `POST /connections/{id}/reject`     |
| See my connections | `GET /connections/me`               |

---

## 3. Chat — sending messages

### The most important rule: you must be connected first

This is the part that makes Connections actually matter. Before Phase 4 was fully built, there was a bug: **anyone could message anyone**, even without connecting first — which made the whole "Add Friend" idea pointless. We fixed this.

**Now, every time someone tries to send a message, the system checks:**

> "Do these two people have an `ACCEPTED` connection between them?"

If **no** → the message is rejected, with a clear reason: _"You must be connected with this user to send messages."_
If **yes** → the message is saved and delivered.

### Example

```
Ankit (not connected to Alice) tries to message Alice
   → REJECTED: "You must be connected with this user to send messages"

Bob (connected to Alice) sends Alice a message
   → SUCCESS: message saved and delivered
```

### Where messages are stored

Every message is a row in a `messages` table:

```
Message {
  sender: Bob
  receiver: Alice
  content: "Hey Alice, are you at the hackathon?"
  sentAt: 2026-07-30 04:49 PM
}
```

Nothing fancy — it's just a permanent row in the database, exactly like every other piece of data in this app (users, events, tickets). It never disappears, and every message ever sent between two people can be fetched later as "conversation history."

---

## 4. How REAL-TIME chat actually works

This is the trickiest part of Phase 4, so let's slow down.

### The problem

Everything else in EventSphere works like this: **you ask, the server answers, done.** For example, "give me the list of events" → server replies with the list → connection closes.

But chat needs something different. If Bob sends Alice a message, **Alice's screen needs to update immediately** — without her having to ask "did I get a new message? did I get a new message?" over and over.

### The solution: WebSockets

A **WebSocket** is a connection that **stays open**, like a phone call that doesn't hang up. Once Alice's browser opens this connection, the server can push new messages to her screen the instant they arrive — she doesn't have to ask.

**Simple analogy:**

- Normal API calls = **sending letters**. Write it, mail it, wait for a reply letter.
- WebSocket = **a phone call**. Once connected, either person can talk anytime.

### Why not just refresh the page every few seconds instead?

You _could_ — this is called "polling." But it's wasteful (checking "anything new?" hundreds of times even when nothing happened) and not truly instant (there's always a small delay). WebSockets solve both problems at once.

### The libraries used

| Library                                                                        | What it's for                                                                                                                                                        |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Spring Boot's built-in WebSocket support** (`spring-boot-starter-websocket`) | Lets the Java backend accept WebSocket connections. Part of Spring itself — no separate download needed.                                                             |
| **STOMP**                                                                      | A simple set of rules on top of WebSockets. It adds "addresses" (like `/chat.send`) so messages can be routed to the right place, similar to how REST APIs use URLs. |
| **`@stomp/stompjs`** (frontend)                                                | A JavaScript library that lets React talk STOMP over a WebSocket connection.                                                                                         |

**Important:** we do **not** use Socket.IO. Socket.IO is a different technology usually paired with Node.js backends. Since our backend is Java/Spring Boot, we use Spring's own WebSocket + STOMP system instead.

### The three "addresses" that matter

| Address prefix | Direction        | Meaning                                                                                     |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------- |
| `/app/...`     | Browser → Server | "Here's something I want to do" (e.g. send a message)                                       |
| `/queue/...`   | Server → Browser | "This is just for you" (private, one person only)                                           |
| `/topic/...`   | Server → Browser | "This is for everyone subscribed" (not used yet in chat, but available for future features) |

**Chat only uses `/app` and `/queue`** — because a chat message is always private, between exactly two people.

---

## 5. How a message actually travels — step by step

Let's trace one real message from Bob to Alice.

1. **Bob types "Hey Alice!" and hits Send.**
   His browser sends it to `/app/chat.send` over the open WebSocket connection.

2. **The backend's `ChatSocketController` catches it.**
   It figures out who Bob is (from his authenticated session — more on this below).

3. **It calls `MessageService.sendMessage()`** — the exact same method used by the regular REST chat endpoint. This checks:
   - Are Bob and Alice connected? (If not — stop here, send an error back to Bob only.)
   - If yes — save the message to the database.

4. **The backend pushes the saved message to two places:**
   - Alice's private queue (`/user/alice/queue/messages`) — so her screen updates live
   - Bob's own private queue too — so _his_ screen also shows the message immediately, confirming it sent

5. **Both Alice's and Bob's browsers**, since they're subscribed to their own queues, instantly receive the message and update the chat window — no refresh needed.

**Why the same `MessageService` is used for both regular chat and live chat:** so we don't have to write the "check connection, save message" logic twice. One method, two ways to trigger it (a normal API call, or a live WebSocket message).

---

## 6. Authentication for WebSockets — how does the server know who's chatting?

Normal API requests carry a JWT token in a header (`Authorization: Bearer ...`) on _every single request_. WebSockets don't work that way — once the connection opens, there are no more headers on each message.

**So we authenticate once, at the very start, using a "bouncer" that checks ID at the door:**

1. When Bob's browser opens the WebSocket connection, it sends his JWT token _one time_, during the initial "CONNECT" handshake.
2. A piece of backend code called `WebSocketAuthInterceptor` checks that token — is it real? Is it expired?
3. If it's valid, the server **remembers** "this connection belongs to Bob" for as long as the connection stays open.
4. Every message Bob sends afterward automatically carries this remembered identity — he doesn't have to re-send his token each time.

**Simple analogy:** it's like a wristband at a concert. Security checks your ID once at the entrance (the CONNECT step), gives you a wristband (your remembered identity), and after that, staff just glance at your wristband — no need to show ID again every time you get a drink.

---

## 7. Security — what stops abuse

| Rule                                               | How it's enforced                                                                                                                                                                               |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| You must be logged in to chat at all               | `WebSocketAuthInterceptor` rejects connections with no valid token                                                                                                                              |
| You can only message people you're connected with  | `MessageService.sendMessage()` checks for an `ACCEPTED` connection before saving anything                                                                                                       |
| You can't accept someone else's connection request | `ConnectionService` checks that the person clicking Accept is really the receiver                                                                                                               |
| Errors are visible, not silent                     | If a message is rejected (e.g. not connected), the sender gets an error pushed to their own private `/queue/errors` — they're told clearly why it failed, instead of the message just vanishing |

---

## 8. Notifications — the "you have something new" feature

### What problem this solves

Real-time chat is great _if you're online right now_. But what if Bob sends Alice a message while she's not even looking at her screen? Without notifications, she'd have no record that anything happened unless she manually checked the chat again.

**Notifications solve this** by creating a small, permanent record every time something worth knowing about happens — a connection request or a new message — so it's there waiting for you, whether you were online or not.

### How it's built

A `Notification` is a simple row:

```
Notification {
  user: Alice          (who this notification is FOR)
  type: "NEW_MESSAGE"
  message: "Bob sent you a message"
  isRead: false
  createdAt: ...
}
```

### Where notifications get created

Notifications aren't a separate feature you have to trigger manually — they happen automatically as a side effect of things that already occur:

- **When someone sends a connection request** → `ConnectionService` creates a notification for the receiver: _"Alice sent you a connection request."_
- **When someone sends a message** → `MessageService` creates a notification for the receiver: _"Bob sent you a message."_

This is deliberate — instead of building a whole separate "notification system" that has to be triggered by hand everywhere, we just added one line inside the methods that already existed (`sendRequest`, `sendMessage`). This means it's genuinely impossible to send a message or connection request _without_ also creating a notification — they can't get out of sync.

### Marking a notification as "read"

When Bob actually opens and sees a notification, the app tells the server:

```
POST /notifications/{id}/read
```

The backend checks: _"Is this notification actually Bob's?"_ (same ownership pattern used everywhere else in this project — you can't mark someone else's notification as read). If it checks out, `isRead` flips from `false` to `true`.

### Example, start to finish

1. Bob sends Alice a message: _"Are you coming to the workshop?"_
2. Behind the scenes, two things happen from that one action:
   - The message is saved in the `messages` table
   - A notification is saved in the `notifications` table, for Alice, saying "Bob sent you a message"
3. Later, Alice logs in and calls `GET /notifications/me` → sees the notification, `isRead: false`
4. Alice clicks on it, opens the chat, reads the message
5. The app calls `POST /notifications/{id}/read` → `isRead` becomes `true`
6. Next time Alice checks her notifications, this one no longer shows as new

---

## 9. Putting it all together — one full example

Let's walk through the entire phase, start to finish, with Alice and Bob.

1. **Alice sends Bob a connection request.**
   `POST /connections/request/{bobId}` → a `Connection` row is created with `status: PENDING` → a `Notification` is created for Bob: _"Alice sent you a connection request."_

2. **Bob checks his notifications**, sees the request, and accepts it.
   `POST /connections/{id}/accept` → the same `Connection` row updates to `status: ACCEPTED`.

3. **Now that they're connected, Bob opens a chat with Alice.**
   His React app connects to the WebSocket, sending his JWT once during the handshake. `WebSocketAuthInterceptor` verifies it and remembers his identity for the session.

4. **Bob types a message and hits Send.**
   It travels to `/app/chat.send` → `ChatSocketController` reads Bob's remembered identity → calls `MessageService.sendMessage()` → checks the connection (✅ accepted) → saves the message → also creates a notification for Alice.

5. **If Alice is online right now**, her screen updates instantly — the message appears in her chat window with no refresh, because her browser is subscribed to her own private queue.

6. **If Alice is _not_ online**, she doesn't see it live — but next time she logs in, `GET /notifications/me` shows her: _"Bob sent you a message,"_ `isRead: false`. She can click into the chat and see it, and it fetches the full history via the regular REST endpoint (`GET /chat/messages/{bobId}`), which shows every message ever exchanged, live or not.

---

## 10. Summary — one sentence per piece

- **Connection** = a row tracking a friend-request-style relationship between two people, with a status.
- **Message** = a row containing chat content, only ever created if the two people have an accepted connection.
- **WebSocket** = a connection that stays open, letting the server push new messages instantly instead of the browser having to keep asking.
- **STOMP** = the addressing system on top of WebSockets that routes messages to the right place (`/app` in, `/queue` out).
- **WebSocketAuthInterceptor** = checks your JWT once, at connection time, and remembers who you are for that whole session.
- **Notification** = a permanent, readable record created automatically whenever a connection request or message happens, so nothing gets missed even if you were offline.
