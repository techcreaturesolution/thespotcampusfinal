# S0-05 — Database & Business Logic Dependency Mapping

**Project:** The Spot Campus (`thespotcampusfinal`)  
**Cross-Reference:** `docs/S0-04/S0-04_API_DATABASE_MAPPING.md`, `docs/S0-04/S0-04_COLLEGE_INSTITUTE_DEPENDENCY_MAP.md`

---

## 1. API Architecture & Flow Diagrams

### A. Overall API Architecture
```mermaid
flowchart LR
    Client["Web (React) / Mobile (Flutter)"] --> App["app.js (Helmet, CORS, Sanitize, RateLimit, Idempotency)"]
    App --> Auth["authenticateUser / authorizePermissions"]
    Auth --> Routes["27 Mounted Routers (217 Endpoints)"]
    Routes --> Ctrl["Controllers (Business Logic)"]
    Ctrl --> Svc["Services (jobFinder only) & Utils (OpenAI, Razorpay, Cloudinary, SMTP)"]
    Ctrl --> DB["MongoDB (39 Mongoose Models)"]
```

### B. Authentication Flow
```mermaid
sequenceDiagram
    participant C as Client (Web / Flutter)
    participant A as POST /api/login
    participant DB as 6 User Collections
    C->>A: { email, password }
    A->>DB: Sequential lookup (Admin -> Student -> Company -> College -> University -> TPO)
    A->>A: Check isVerifiedByTPO / *_verified === "Approved"
    A->>A: bcrypt comparePassword()
    A-->>C: 200 { token, user, role } + Set-Cookie: token (httpOnly)
```

### C. College-to-Institute API Dependency Flow
```mermaid
flowchart TD
    Drop["/api/dropdown/* (7 endpoints)"] --> College["/api/college/* & /api/university/*"]
    College --> Stud["/api/student/* & /api/register/*"]
    College --> Acad["/api/degree/*, /api/branch/*, /api/tpo/*"]
    College --> Jobs["/api/jobs/* (approved_colleges, job_college)"]
    Jobs --> Apps["/api/application/institution"]
    College --> Stats["/api/stats (College/University/TPO)"]
```

---

## 2. College-to-Institute API Dependency Summary

- **Directly Dependent API Groups (10):** `/api/university/*`, `/api/college/*`, `/api/tpo/*`, `/api/degree/*`, `/api/branch/*`, `/api/dropdown/*`, `/api/student/*` & `/api/register/*`, `/api/jobs/*`, `/api/application/*`, `/api/stats/*`.
- **Key Contract Coupling:**
  - `POST /api/jobs` & `PATCH /api/jobs/:id` accept `approved_colleges[]`, `jobEntries[]` (`job_university_id`, `job_college_id`, `job_degree_id`, `job_branch_id`), and `target_degree`.
  - `GET /api/dropdown/*` exposes `/universities`, `/colleges`, `/degrees`, `/branches`, `/colleges-by-degree`.
  - `POST /api/login` returns `role: "College"` or `"University"` (coupled to `DashboardLayout.jsx` & JWT claims).
  - **Zero `institute_id` or `/api/institute` contracts exist today.**
