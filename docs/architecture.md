# CivicFix Architecture & Technical Design

This document details the architectural design, security model, and data flow of the CivicFix platform.

---

## Technical Overview

CivicFix is structured as a decoupled MERN stack application featuring:
- **Stateless RESTful API** backend with JWT authentication and middleware-enforced role & department authorization.
- **Service-Oriented Architecture** delegating business logic to modular services (`complaintService`, `routingService`, `duplicateDetectionService`, `analyticsService`, `slaService`).
- **Geospatial & Vector Intelligence** utilizing MongoDB `2dsphere` spatial indexing and Xenova transformers for semantic vector similarity analysis.

---

## High-Level System Data Flow

```
[ Citizen / Admin ]
        │
        ▼
[ React 19 Frontend ] ──── API Requests (Axios) ────► [ Express REST API Gateway ]
                                                             │
                                                   ┌─────────┴─────────┐
                                                   ▼                   ▼
                                            [ Auth Middleware ]  [ Role Scope ]
                                                   │                   │
                                                   └─────────┬─────────┘
                                                             │
                                                             ▼
                                                    [ Service Layer ]
                                                             │
                                       ┌─────────────────────┼─────────────────────┐
                                       ▼                     ▼                     ▼
                               [ MongoDB Atlas ]     [ Cloudinary Media ]  [ MiniLM Vectors ]
```

---

## Department Routing & SLA Engine

1. **Taxonomy & Routing**:
   - 20 municipal departments configured in `config/departmentConfig.js`.
   - On complaint submission, `routingService.determineDepartment()` maps category/subcategory taxonomy to target department codes (`ROADS`, `WATER`, `WASTE`, `SEWAGE`, `LIGHTING`, etc.).

2. **Dynamic SLA Tracking**:
   - SLA duration is computed dynamically based on category severity (`Critical`: 24h, `High`: 48h, `Medium`: 72h, `Low`: 128h).
   - SLA status is evaluated on retrieval (`on_track`, `due_soon`, `breached`, `completed`).

---

## Security & Scoping Rules

1. **Citizen Isolation**: Citizens query personal complaints via `GET /api/complaints/my`. Query parameter tampering (e.g. `?userId=...`) is ignored; identity is derived strictly from JWT (`req.user._id`).
2. **Department Isolation**: `enforceDepartmentScope` middleware forces `req.query.departmentCode` to match `req.user.departmentCode` for `department_head` and `department_staff`. Parameter override attacks are blocked with `403 Forbidden`.
3. **Super Admin Scope**: Super Admins possess global visibility across all 20 departments.
