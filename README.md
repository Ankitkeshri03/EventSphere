# EventSphere

A full-stack event management and networking platform for hackathons, workshops, and conferences — built with React, Spring Boot, and Spring AI.

> 🚧 **Work in progress** — this project is being built incrementally, day by day. This README will be updated as new features are completed.

## What it does

EventSphere brings the entire lifecycle of an event into one platform:

- Organizers create and manage events, generate QR tickets, and track attendance
- Participants browse events, register, get digital tickets, and connect with other attendees
- AI-assisted features help with event descriptions and recommendations

## Tech stack

- **Frontend:** React
- **Backend:** Spring Boot (Java)
- **Database:** PostgreSQL
- **Caching:** Redis
- **AI:** Spring AI
- **Auth:** Spring Security + JWT
- **Infra (local dev):** Docker Compose

## Project structure

```
eventsphere/
├── eventsphere-backend/     # Spring Boot API
├── eventsphere-frontend/    # React app
├── documentations/          # Design docs, ER diagram, blueprint
└── docker-compose.yml       # Postgres + Redis for local dev
```

## Getting started (local dev)

**Prerequisites:** Java 17+, Node.js 20+, Docker Desktop

```bash
# 1. Start Postgres + Redis
docker compose up -d

# 2. Configure the backend
cd eventsphere-backend
cp src/main/resources/application.properties.example src/main/resources/application.properties
# then edit application.properties with your local values

# 3. Run the backend
./mvnw spring-boot:run

# 4. Run the frontend (in a separate terminal)
cd eventsphere-frontend
npm install
npm run dev
```

## Progress

- [x] Project setup (Docker, Postgres, Spring Boot, React scaffolding)
- [x] Authentication — register, login, JWT, protected routes
- [x] Event management (create, browse, edit events)
- [x] Registration & QR ticketing
- [x] Attendance tracking
- [x] Networking & real-time chat
- [ ] AI-assisted features
- [ ] Deployment

---

\_Built as a portfolio project to demonstrate full-stack architecture, authentication, real-time features, and AI integration.
