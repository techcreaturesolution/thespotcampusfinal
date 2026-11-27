# S0-06 — System Architecture Overview

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Owner:** Dev 1 (with Joint System Flow) | **Baseline:** Branch `ravi`, Commit `66220d594954ba077cf1d4a709eba3a084a74abc`  
**Status:** Architecture Review Only (No Code Modified)

---

## 1. Platform Topology

The Spot Campus is a **three-tier multi-client platform**:
1. **Web Frontend (`client/`):** React `18.3.1` + Vite `6.3.5` + Tailwind CSS `3.4.4` SPA serving all **6 roles** (`Admin`, `University`, `College`, `TPO`, `Company`, `Student`) across `74` page files and `67` routes (`client/src/App.jsx`).
2. **Flutter Mobile App (`flutter_student_app/`):** Flutter `3.41.9` / Dart `3.11.5` mobile app serving the **Student** role (`28` screens, `27` routes in `lib/main.dart` + `1` `MaterialPageRoute`, native Camera + Google MLKit proctoring).
3. **Backend API & Real-Time Server (`server/`):** Node.js `v22.23.5` + Express `4.18.2` modular monolith + Socket.IO `4.7.5` (`server/src/app.js`, `server/src/config/socket.js`) backed by **MongoDB** (Mongoose `7.0.5`, `39` models).

---

## 2. Overall System Architecture (Existing — Verified)

```mermaid
flowchart TB
    subgraph Clients
        Web["Web SPA (React 18 + Vite)<br/>6 Roles | 74 Pages | 215 API calls"]
        Mob["Flutter App (Dart 3.11)<br/>Student Only | 28 Screens | 55 API calls"]
    end

    subgraph Edge["Express Pipeline (server/src/app.js)"]
        Sec["helmet + mongoSanitize + cors + sanitizeInput"]
        RL["Rate Limiters (general/auth/payment/search)"]
        Idemp["requireIdempotency (tbl_idempotency_keys)"]
        Auth["authenticateUser / authorizePermissions"]
    end

    subgraph Core["Backend Modules (17 Domain + 4 Support)"]
        Ctrl["Controllers (Direct Business Logic & DB)"]
        Svc["jobFinder/services (Only Dedicated Service Layer)"]
        WS["Socket.IO (Proctoring + WebRTC Signaling)"]
    end

    subgraph External["External Integrations"]
        OAI["OpenAI (gpt-4o-mini)"]
        RZP["Razorpay Payments"]
        CLD["Cloudinary Media"]
        SMTP["Nodemailer SMTP"]
        JF["SerpAPI / Adzuna / Jooble / Apify / OSM"]
    end

    DB[("MongoDB<br/>39 Collections | 56 Indexes")]

    Web -->|HTTPS/JSON + Cookie/Bearer| Sec
    Mob -->|HTTPS/JSON + Cookie/Bearer| Sec
    Web <-->|WebSocket| WS
    Sec --> RL --> Idemp --> Auth --> Ctrl
    Ctrl --> Svc
    Ctrl --> DB
    Svc --> DB
    Ctrl --> OAI & RZP & CLD & SMTP
    Svc --> JF
```

---

## 3. End-to-End Request Flow & Deviations

- **Intended Flow:** `User → Web/Flutter → Route → Middleware (Auth/RBAC/Validation) → Controller → Service → Database → Error/Response`.
- **Verified Deviations:**
  1. **Missing Service Layer:** 16 of 17 domain modules place business logic and Mongoose queries directly inside controllers (only `jobFinder` uses a `services/` layer).
  2. **Inconsistent Auth/RBAC:** 5 public/unprotected route groups (`auth/register`, `university`, `degreeMaster`, `register`, `contact`) and 182/217 mounted routes lack route-level `authorizePermissions` (`S0-05`).
  3. **Bypassed Error Middleware:** Many controllers catch errors and return `res.status(500).json({ error: err.message })` directly instead of delegating to `errorHandlerMiddleware.js`.
