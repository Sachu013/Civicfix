# CivicFix — AI-Powered Multi-Department Civic Management Platform

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Stack: MERN](https://img.shields.io/badge/Stack-MERN-green.svg)](https://react.dev)
[![Database: MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)

CivicFix is a modern, enterprise-grade civic grievance platform designed to connect citizens with municipal administrations. Built on a MERN stack architecture with artificial intelligence, semantic vector search, and geospatial intelligence, CivicFix automatically classifies reported issues, detects duplicate complaints, routes tasks to specialized departments, and calculates SLA metrics.

---

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [User Roles & Access Matrix](#user-roles--access-matrix)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [AI & Intelligent Features](#ai--intelligent-features)
- [Geospatial & Heatmap Intelligence](#geospatial--heatmap-intelligence)
- [Image Management](#image-management)
- [Testing](#testing)
- [Demo Credentials](#demo-credentials)

---

## Overview

CivicFix transforms municipal issue tracking from fragmented manual workflows into a unified, multi-department response engine. Citizens can submit issues with photo evidence and geolocation data. The backend automatically evaluates complaint context using semantic embeddings, determines priority and severity, checks for duplicates in real-time, and assigns the issue to one of 20 municipal departments.

---

## Core Features

- **Citizen Issue Portal & "My Complaints" Vault**: Dedicated citizen dashboard to report, search, filter, and track complaint resolution progress.
- **Geospatial GeoJSON Mapping**: Precision map integration using Leaflet & OpenStreetMap, backed by MongoDB `2dsphere` spatial indexing.
- **Image Evidence Uploads**: Multi-format image evidence processing with Cloudinary storage integration.
- **Semantic Duplicate Detection**: Dual-stage lexical and vector embedding analysis to identify nearby duplicate complaints within customizable spatial radii.
- **AI-Assisted Classification**: Category, subcategory, severity (`Low`, `Medium`, `High`, `Critical`), and priority prediction.
- **Centralized 20-Department Taxonomy**: Dynamic routing across 20 municipal departments (Roads, Water, Waste, Electrical, Sanitation, etc.).
- **Dynamic SLA Engine**: Live SLA calculation, warning thresholds, and breach tracking based on category and priority severity.
- **Unified Admin Dashboard**: Single role-aware administrative dashboard serving Super Admins, Department Heads, and Department Staff Officers.
- **Civic Analytics & Hotspot Intelligence**: Real-time KPI metrics, category breakdowns, department workload distribution, and spatial hotspot cluster detection.

---

## Architecture

```
                                ┌───────────────────────────────────┐
                                │       React 19 SPA Client         │
                                │   (Lucide, Chart.js, Leaflet)     │
                                └─────────────────┬─────────────────┘
                                                  │ REST API / Axios
                                ┌─────────────────▼─────────────────┐
                                │       Node.js / Express API       │
                                │  (JWT Auth, Role & Scope Rules)   │
                                └─────────────────┬─────────────────┘
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 │                                │                                │
 ┌───────────────▼───────────────┐┌───────────────▼───────────────┐┌───────────────▼───────────────┐
 │   MongoDB Atlas Database      ││     Cloudinary Media Store    ││  Xenova Transformers Pipeline │
 │  (GeoJSON 2dsphere Indexing)  ││   (Image Evidence & Buffers)  ││  (Semantic Vector Embeddings) │
 └───────────────────────────────┘└───────────────────────────────┘└───────────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Framework**: React 19, Vite 7
- **Routing**: React Router DOM 7
- **Styling**: Vanilla TailwindCSS 3
- **Icons**: Lucide React
- **Mapping**: Leaflet 1.9 & React-Leaflet
- **Charts**: Chart.js & React-Chartjs-2

### Backend
- **Runtime**: Node.js & Express 5
- **Database**: MongoDB Atlas with Mongoose 9 ORM
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **FileUploads**: Multer & Cloudinary SDK
- **AI & NLP**: `@xenova/transformers` (local MiniLM embeddings)

---

## Project Structure

```
CivicFix/
├── package.json               # Root workspace script launcher
├── README.md                  # System overview and deployment guide
├── docs/                      # Technical documentation
│   ├── architecture.md        # Architectural decisions and data flow
│   └── api.md                 # REST API reference documentation
├── client/                    # React 19 Vite Frontend
│   ├── src/
│   │   ├── api/               # Axios HTTP client configuration
│   │   ├── components/        # Reusable UI components (LocationPicker, AnalyticsMap)
│   │   ├── context/           # AuthContext provider
│   │   ├── pages/             # Page components (Home, AdminDashboard, AdminAnalytics, SubmitComplaint)
│   │   └── App.jsx            # Top-level routing & role protection
│   └── package.json
└── server/                    # Node.js Express Backend
    ├── config/                # Database, Cloudinary, Taxonomy & SLA configs
    ├── controllers/           # HTTP Request handlers
    ├── middleware/            # Auth, Role Authorization, Department Scope & Uploads
    ├── models/                # Mongoose Models (Complaint, User, Department, Alert)
    ├── routes/                # Express API Route Definitions
    ├── services/              # Business logic (AI, Routing, SLA, Analytics, Duplicates)
    ├── tests/                 # Automated Security & Integration Test Suites
    ├── seed.js                # Local development database seeder
    └── server.js              # HTTP Server entry point
```

---

## User Roles & Access Matrix

| Role | Scope | Key Capabilities |
| :--- | :--- | :--- |
| **Citizen** | Personal (`req.user._id`) | Report issues, track personal complaints, view status & resolution feedback |
| **Super Admin** | Global (All 20 Depts) | System-wide analytics, department user creation, global complaint management |
| **Department Head** | Department Scoped | Department complaint queue, staff assignment, priority revision, department analytics |
| **Department Staff** | Department Scoped | Assigned complaint queue, status updates (`In Progress`, `Resolved`), evidence upload |

---

## Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB Atlas database or local MongoDB instance
- Cloudinary account (optional, for image evidence storage)

### Installation

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Sachu013/smartcity.git
   cd Civicfix
   ```

2. **Install Server Dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**:
   Copy `.env.example` in `server/` to `.env` and fill in your connection details:
   ```bash
   cd ../server
   cp .env.example .env
   ```

5. **Seed Initial Database**:
   ```bash
   npm run seed
   ```

6. **Start Application**:
   - Backend API: `npm start` (Runs on `http://localhost:5000`)
   - Frontend Client: `cd ../client && npm run dev` (Runs on `http://localhost:5173`)

---

## Environment Variables

Refer to [server/.env.example](file:///d:/Civicfix/server/.env.example):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/civicfix
JWT_SECRET=your_jwt_secret_key_here

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMBEDDING_PROVIDER=local
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
DUPLICATE_RADIUS_METERS=500
```

---

## AI & Intelligent Features

1. **Semantic Vector Search**: Generates text embeddings using `@xenova/transformers` (`all-MiniLM-L6-v2`) to compare incoming complaints against existing records.
2. **Hybrid Lexical & Vector Matching**: Blends lexical similarity (35%) with vector cosine similarity (65%) for accurate duplicate detection within spatial boundaries.
3. **Automated Category & Priority Classification**: Predicts civic categories and severity level on complaint submission.
4. **Audit Trail**: Manual admin priority or category adjustments preserve original AI classification predictions for full audit transparency.

---

## Geospatial & Heatmap Intelligence

- Complaints store coordinates using GeoJSON `Point` schemas with `2dsphere` indexes.
- Hotspot spatial grid clustering detects problem areas containing $\ge 5$ complaints within tight geohash cells.

---

## Image Management

- Multi-part image evidence uploads processed via Multer memory buffers and sent securely to Cloudinary.
- Returns public secure URLs, dimensions, mime-types, and image metadata.

---

## Testing

Run domain-driven automated test suites from the root directory or `server/`:

```bash
# Execute master test runner across all test suites
npm run test:all

# Execute domain-specific test suites
npm run test:unit        # Unit tests (Classification, Duplicate Detection, Vector Similarity)
npm run test:integration # Integration tests (Complaint Lifecycle, SLA, Routing, Analytics)
npm run test:security    # Security tests (RBAC Scoping, Access Control, Ownership)
```

The test suite is organized under `server/tests/`:
- `tests/unit/`: `classification.test.js`, `duplicateDetection.test.js`, `semanticDuplicates.test.js`
- `tests/integration/`: `complaintLifecycle.test.js`, `departmentAuthorization.test.js`, `analyticsOverview.test.js`, `analyticsHotspots.test.js`
- `tests/security/`: `securityBoundary.test.js`, `accessControl.test.js`

---

## Demo Credentials

> [!NOTE]
> Development demo credentials are generated locally when executing `npm run seed`.
> - **Citizen**: `citizen@demo.com` / `123456`
> - **Super Admin**: `admin@smartcity.gov` / `admin123`
> - **Department Heads**: `<department_code>_head@smartcity.gov` / `head123` (e.g., `roads_head@smartcity.gov`)
> - **Department Staff**: `<department_code>_staff@smartcity.gov` / `staff123` (e.g., `water_staff@smartcity.gov`)

---

## License

This project is licensed under the ISC License.
