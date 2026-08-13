# CivicFix REST API Reference

This document outlines key API endpoints available in CivicFix.

---

## Authentication Endpoints (`/api/auth`)

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Register new citizen account |
| `/api/auth/login` | `POST` | Public | Authenticate user and receive JWT token |
| `/api/auth/profile` | `GET` | Protected | Fetch current user profile |

---

## Complaint Endpoints (`/api/complaints`)

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/complaints` | `POST` | Protected | Submit a new civic complaint with image & location |
| `/api/complaints/my` | `GET` | Citizen | Fetch complaints owned by current user |
| `/api/complaints/track/:id` | `GET` | Public | Track public status of a complaint by ID |
| `/api/complaints/check-duplicate` | `POST` | Protected | Perform semantic duplicate detection |

---

## Admin Endpoints (`/api/admin`)

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/admin/complaints` | `GET` | Admin / Dept Roles | Fetch department-scoped complaint list |
| `/api/admin/complaints/:id/status` | `PUT` / `PATCH` | Admin / Dept Roles | Update complaint status and attach resolution image |
| `/api/admin/complaints/:id/priority` | `PATCH` / `PUT` | Admin / Dept Roles | Update complaint priority (`Low`, `Medium`, `High`, `Critical`) |
| `/api/admin/complaints/:id/assign` | `POST` | Admin / Dept Roles | Reassign complaint to another department or staff member |
| `/api/admin/metrics` | `GET` | Admin / Dept Roles | Fetch role-aware summary metrics |

---

## Analytics Endpoints (`/api/analytics`)

| Endpoint | Method | Access | Description |
| :--- | :--- | :--- | :--- |
| `/api/analytics/overview` | `GET` | Admin / Dept Roles | Fetch overview KPI metrics |
| `/api/analytics/categories` | `GET` | Admin / Dept Roles | Fetch complaint category distribution |
| `/api/analytics/departments` | `GET` | Admin / Dept Roles | Fetch department performance metrics |
| `/api/analytics/hotspots` | `GET` | Admin / Dept Roles | Fetch spatial hotspot cluster points |
