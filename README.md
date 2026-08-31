<div align="center">

# 🏛️ CivicSense™ — Next-Gen Civic Grievance & Municipal Intelligence Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Microsoft SQL Server](https://img.shields.io/badge/MS%20SQL%20Server-2022-CC292B?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/sql-server)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Leaflet GIS](https://img.shields.io/badge/Leaflet-GIS%20Heatmaps-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![CyberShield](https://img.shields.io/badge/Security-OWASP%20Hardened-8A2BE2?style=for-the-badge&logo=shield&logoColor=white)](#-defense-in-depth-security-architecture)
[![Blockchain Ledger](https://img.shields.io/badge/Ledger-SHA--256%20Immutable-F7931A?style=for-the-badge&logo=blockchain.com&logoColor=white)](#-tamper-evident-blockchain-audit-ledger)
[![Capacitor Native](https://img.shields.io/badge/Mobile-Android%20%7C%20iOS-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<p align="center">
  <b>A zero-friction, AI-orchestrated civic responsibility engine connecting citizens with municipal authorities across all 60 wards of Mangaluru with automated EXIF geocoding, computer vision triage, spatial duplicate suppression, and cryptographic blockchain accountability.</b>
</p>

[Explore Live Telemetry](#-interactive-telemetry--gis-heatmaps) • [System Architecture](#-system-architecture) • [AI & Vision Pipeline](#-ai--computer-vision-triage-pipeline) • [Security Suite](#-defense-in-depth-security-architecture) • [Quickstart Guide](#-quickstart--installation)

---

</div>

## 📑 Table of Contents
1. [Executive Briefing & Problem Landscape](#-executive-briefing--problem-landscape)
2. [Key Innovations & Platform Highlights](#-key-innovations--platform-highlights)
3. [System Architecture](#-system-architecture)
4. [AI & Computer Vision Triage Pipeline](#-ai--computer-vision-triage-pipeline)
5. [Spatial Intelligence & 60-Ward Geofencing](#-spatial-intelligence--60-ward-geofencing)
6. [Spatial-Temporal Duplicate Detection Engine](#-spatial-temporal-duplicate-detection-engine)
7. [Tamper-Evident Blockchain Audit Ledger](#-tamper-evident-blockchain-audit-ledger)
8. [Municipal Hierarchy & Role-Based Access Control](#-municipal-hierarchy--role-based-access-control-rbac)
9. [Defense-in-Depth Security Architecture](#-defense-in-depth-security-architecture)
10. [Database Schema & Migration Engine](#-database-schema--migration-engine)
11. [REST API Specification](#-rest-api-specification)
12. [Interactive Telemetry & GIS Heatmaps](#-interactive-telemetry--gis-heatmaps)
13. [Mobile Portability (Android & iOS)](#-mobile-portability-android--ios)
14. [Quickstart & Installation](#-quickstart--installation)
15. [Environment Configuration Reference](#-environment-configuration-reference)
16. [Contributing & License](#-contributing--license)

---

## 🌍 Executive Briefing & Problem Landscape

Municipal governance in fast-growing urban centers faces significant operational bottlenecks:

| Traditional Grievance Bottleneck | How CivicSense™ Solves It |
| :--- | :--- |
| **Bureaucratic Friction**: Citizens must manually categorize issues into complex departments (e.g., MCC vs. MESCOM vs. Water Board). | **Zero-Config AI Dispatch**: Google Gemini 1.5 Flash vision model parses image pixels to classify departments, assess hazard severities, and generate descriptions automatically. |
| **Location Imprecision**: Text-based address descriptions ("near the bakery") cause delayed emergency dispatches and wasted fuel. | **EXIF Telemetry & OSM Reverse Geocoding**: GPS decimal coordinates are extracted straight from raw image bytes and reverse-geocoded to street-level fidelity without human intervention. |
| **Ticket Spam & Fragmented Reports**: 20 citizens reporting the same pothole create 20 disconnected tickets. | **Spatial Haversine Clustering**: Reports within a 100-meter radius of the same category are merged into a unified master ticket with aggregated community upvotes. |
| **Accountability Deficit**: Status updates ("Resolved") often lack proof, breeding civic cynicism. | **Proof-of-Work Verification + Blockchain Ledger**: Requires photographic "After" evidence and seals all state transitions into an append-only SHA-256 cryptographic audit chain. |

---

## ⚡ Key Innovations & Platform Highlights

- 📸 **Single-Tap Grievance Ingestion**: Drop a photo, video, or snapshot; EXIF metadata parser (`exifr`) extracts exact latitude/longitude coordinates instantly.
- 🧠 **Google Gemini 1.5 Flash Vision AI**: Multimodal reasoning parses street hazards, detects defect dimensions, estimates risk severities, and generates municipal triage summaries.
- 🗺️ **60-Ward Geofencing Engine**: Hardened alias resolution matrix indexing all 60 electoral wards of Mangaluru Municipal Corporation (Surathkal West to Kasba Bengre).
- ⛓️ **Cryptographic SHA-256 Audit Trail**: Local immutable blockchain ledger recording every ticket creation, status update, contractor assignment, and resolution hash.
- 👥 **Multi-Tier Municipal RBAC Matrix**: Dedicated operational workspaces for Super Admins, Ward Corporators, Executive Engineers (EE), Assistant Engineers (AE), Linemen, Health Inspectors, and Empanelled Contractors.
- 🛡️ **CyberShield Defense-in-Depth**: OWASP-aligned security layer featuring SQL injection signature interception, path traversal blockers, brute-force rate limiters, and XSS sanitization.
- 🔥 **Live GIS Heatmap & Telemetry**: Dynamic Leaflet & Leaflet.heat map engine visualizing municipal hazard clusters, ward severity rankings, and real-time resolution metrics.
- 📱 **Native Mobile Portability**: Built with Capacitor 6 for native Android and iOS APK/AAB distribution with hardware camera and geolocation access.

---

## 🏛️ System Architecture

CivicSense operates on a decoupled client-server micro-architecture engineered for high throughput, data integrity, and deterministic triage:

```mermaid
graph TB
    subgraph ClientLayer["Frontend & Mobile Layer"]
        CitizenApp["📱 Citizen Web & Mobile Client (React + Vite + Capacitor)"]
        AdminDashboard["💻 Administrative & Official Portal (RBAC Dashboards)"]
        GISMap["🗺️ Leaflet Geospatial Heatmap & Live Telemetry"]
    end

    subgraph SecurityGate["CyberShield Security Middleware"]
        Helmet["🛡️ Helmet HTTP Hardening"]
        RateLimiter["⏱️ Express Rate Limiters (Auth & API)"]
        WAF["🛑 SQLi & Path Traversal Signature Interceptor"]
        Sanitizer["🧹 XSS Sanitization & Body Size Caps"]
    end

    subgraph CoreBackend["Express.js API Gateway (Node.js)"]
        AuthRouter["🔑 Auth & Whitelist Controller (/api/auth)"]
        GrievanceRouter["📋 Grievance & Dispatch Controller (/api/grievances)"]
        FeedRouter["📡 Public Telemetry Feed (/api/public)"]
    end

    subgraph ProcessingEngines["Intelligence & Ingestion Engines"]
        EXIFParser["📍 exifr GPS Extraction Pipeline"]
        Nominatim["🌍 OpenStreetMap Nominatim Reverse Geocoder"]
        GeminiVision["🤖 Google Gemini 1.5 Flash Vision Classifier"]
        WardMatrix["🏘️ 60-Ward Boundary & Alias Resolver"]
        DuplicateCluster["🔄 Haversine Spatial Duplicate Detector (100m Radius)"]
        BlockchainLedger["⛓️ Immutable SHA-256 Cryptographic Audit Ledger"]
    end

    subgraph StorageLayer["Data & Media Persistence Layer"]
        MSSQL[("🗄️ Microsoft SQL Server 2022 (Complaints, Users, Officials, Comments)")]
        Cloudinary["☁️ Cloudinary Secure Media CDN (Evidence & After Photos)"]
        SMTPMail["✉️ Nodemailer Live SMTP Gateway (Citizen & Official Alerts)"]
    end

    CitizenApp --> SecurityGate
    AdminDashboard --> SecurityGate
    GISMap --> SecurityGate
    SecurityGate --> CoreBackend

    CoreBackend --> EXIFParser
    CoreBackend --> Nominatim
    CoreBackend --> GeminiVision
    CoreBackend --> WardMatrix
    CoreBackend --> DuplicateCluster
    CoreBackend --> BlockchainLedger

    CoreBackend --> MSSQL
    CoreBackend --> Cloudinary
    CoreBackend --> SMTPMail
```

---

## 🤖 AI & Computer Vision Triage Pipeline

When an image is submitted, CivicSense executes a 5-stage automated perception pipeline:

```mermaid
sequenceDiagram
    autonumber
    actor Citizen as Citizen / Complainant
    participant API as Express API Gateway
    participant EXIF as EXIF Parser Engine
    participant OSM as OSM Reverse Geocoder
    participant AI as Gemini 1.5 Flash Vision
    participant Dup as Duplicate Detection Engine
    participant DB as MS SQL Server & Ledger

    Citizen->>API: Multipart POST /api/grievances/submit (Image + Optional Text)
    API->>EXIF: Extract GPS Coordinates (Lat/Lon) & Timestamp
    EXIF-->>API: Decimal Coordinates (e.g. 12.8703, 74.8436)
    API->>OSM: Query Nominatim Reverse Geocoding (lat, lon)
    OSM-->>API: Structured Physical Address String
    API->>AI: Transmit Image Buffer + Context to Gemini 1.5 Flash
    Note over AI: Visual Hazard Segmentation<br/>Category Classification<br/>Severity Estimation<br/>Location Type & Size Assessment
    AI-->>API: JSON: { department, category, severity, description, location_type, issue_size }
    API->>Dup: Check Spatial Proximity (Haversine <= 100m) & Category Match
    alt Potential Duplicate Detected
        Dup-->>API: Linked to Parent Complaint ID, Flagged for Merge
    else New Unique Issue
        Dup-->>API: Assigned Unique Ticket ID
    end
    API->>DB: Persist Record in MSSQL & Commit SHA-256 Ledger Block
    API-->>Citizen: 201 Created + Ticket Metadata + Telemetry Position
```

### Deterministic Urgency & Severity Matrix

If the AI operates in hybrid mode or fallback is triggered, CivicSense applies a deterministic severity matrix based on roadway infrastructure and defect volume:

$$\text{Severity} = f(\text{Location Type}, \text{Issue Size})$$

| Roadway Classification | Defect Size / Volume | Assigned Severity Rating | SLA Target |
| :--- | :--- | :--- | :--- |
| **Main Road / Highway / Junction** | Large (Crater / Flooding / Burst) | 🔴 **High** (Immediate Public Safety Danger / Outage) | 12 - 24 Hours |
| **Main Road / Highway / Junction** | Medium (Pothole / Debris) | 🔴 **High** (Immediate Public Safety Danger / Outage) | 24 Hours |
| **Main Road / Highway / Junction** | Small (Minor Crack / Patch) | 🟡 **Medium** (Hinders Daily Routine / Minor Hazard) | 48 Hours |
| **Inner Residential / Lane** | Large (Sewer Overflow / Tree Fall) | 🔴 **High** (Immediate Public Safety Danger / Outage) | 24 Hours |
| **Inner Residential / Lane** | Medium (Standard Pothole / Leak) | 🟡 **Medium** (Hinders Daily Routine / Minor Hazard) | 48 - 72 Hours |
| **Inner Residential / Lane** | Small (Streetlight Flickering) | 🟢 **Low** (General Maintenance / Inquiry) | 5 - 7 Days |

---

## 🗺️ Spatial Intelligence & 60-Ward Geofencing

CivicSense implements an exhaustive geographic alias matrix mapped to the 60 official wards of Mangaluru Municipal Corporation:

```
Mangaluru Municipal Corporation (60 Wards)
├── Zone 1 (Surathkal & Coastal North): Wards 1 to 10 (Surathkal, Katipalla, Idya, Hosabettu, Kulai, Baikampady)
├── Zone 2 (Airport Corridor & Panambur): Wards 11 to 20 (Panambur, Kunjathbail, Marakada, Kavoor, Pacchanady, Tiruvail)
├── Zone 3 (Central Residential): Wards 21 to 30 (Padavu, Kadri Padav, Derebail North/East/South/West, Boloor, Mannagudda, Kodialbail)
├── Zone 4 (Commercial & Administrative): Wards 31 to 40 (Bejai, Kadri North/South, Shivbagh, Padav, Maroli, Bendoor, Falnir, Court)
├── Zone 5 (Market & Port Area): Wards 41 to 50 (Central Market, Kudroli, Bunder, Port, Cantonment, Milagres, Valencia, Kankanady, Alape)
└── Zone 6 (Southern Corridor): Wards 51 to 60 (Alape North, Kannur, Bajal, Jeppinamogaru, Attavara, Mangaladevi, Hoigebazar, Bolara, Jeppu, Bengre)
```

Each complaint is programmatically bound to its municipal corporator and assigned engineering vector using coordinate geofencing and regex spatial alias matching.

---

## 🔄 Spatial-Temporal Duplicate Detection Engine

To prevent municipal queue flooding, every new complaint undergoes real-time spatial clustering against all open tickets:

```mermaid
graph TD
    NewTicket["New Ingestion Ticket (Lat_1, Lon_1, Category)"] --> CalcDist["Compute Haversine Distance (d) to Active Tickets"]
    CalcDist --> Condition{"d <= 100 meters & Category Match?"}
    Condition -- "Yes" --> MarkDup["Flag as Potential Duplicate<br/>Link parent_complaint_id<br/>Increment Community Vote Score"]
    Condition -- "No" --> CreateMaster["Register as New Master Ticket"]
    MarkDup --> NotifyCitizen["Notify Complainant: Merged with Existing Issue"]
    CreateMaster --> DispatchTicket["Dispatch to Department Queue"]
```

The distance between coordinates $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$ is computed using the Great-Circle Haversine Formula:

$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2 \cdot R \cdot \arcsin\left(\sqrt{a}\right) \quad \text{where } R = 6371 \text{ km}$$

If $d \le 0.1 \text{ km}$ (100 meters) and the categories match, the complaint is linked to the existing master thread, consolidating civic backing.

---

## ⛓️ Tamper-Evident Blockchain Audit Ledger

To prevent administrative tampering or false "Resolved" declarations, CivicSense maintains an append-only, Merkle-linked cryptographic ledger in `blockchain_ledger.json`.

```
┌────────────────────────────────────────────────────────┐
│                      GENESIS BLOCK                     │
│ Index: 0                                               │
│ Action: GENESIS_BLOCK                                  │
│ Hash: a89f...                                          │
│ PreviousHash: 0000000000000000000000000000000000000000 │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   BLOCK #1: TICKET_CREATED             │
│ Index: 1                                               │
│ Complaint ID: #1042                                    │
│ Action: COMPLAINT_FILED                                │
│ DataHash: sha256(GPS + Category + EvidenceURL)         │
│ PreviousHash: a89f...                                  │
│ BlockHash: sha256(Index + Timestamp + DataHash + Prev)│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│               BLOCK #2: STATUS_RESOLVED_VERIFIED       │
│ Index: 2                                               │
│ Complaint ID: #1042                                    │
│ Action: ISSUE_RESOLVED_AFTER_EVIDENCE                  │
│ DataHash: sha256(AfterPhotoURL + OfficialSignoff)      │
│ PreviousHash: Block #1 Hash                            │
│ BlockHash: sha256(Index + Timestamp + DataHash + Prev)│
└────────────────────────────────────────────────────────┘
```

The system verifies chain continuity on demand:
```javascript
const { verifyComplaintIntegrity } = require('./utils/blockchainLedger');
const status = verifyComplaintIntegrity(complaintNo, complaintPayload);
// Returns: { verified: true, blockIndex: 2, txHash: "3f7c...", chainCorrupted: false }
```

---

## 👥 Municipal Hierarchy & Role-Based Access Control (RBAC)

CivicSense implements an 8-tier hierarchical governance matrix with strict JWT verification:

```
👑 Super Admin (Full Platform Control, Whitelist Management, Cross-Ward Oversight)
│
├── 🏛️ Ward Corporators (Elected Councilors — Ward Specific Monitoring & Feedback)
│
├── 👷 Civil Engineering Vector (MCC)
│   ├── Executive Engineer (EE) / Assistant Executive Engineer (AEE)
│   ├── Assistant Engineer (AE) / Junior Engineer (JE)
│   └── Empanelled MCC Contractors / Ward Inspectors
│
├── ⚡ Electrical & Power Grid Vector (MESCOM)
│   ├── Executive Engineer (EE — Electrical)
│   ├── Section Officer (SO) / Assistant Engineer (AE)
│   └── Lineman / Junior Lineman (JLM) & MESCOM Contractors
│
├── 🚰 Water Supply & Sewage Board
│   ├── Assistant Executive Engineer (AEE — Water Supply)
│   └── Water Board Maintenance Contractors
│
├── 🐾 Stray Animal Welfare & Public Health
│   ├── Health Officer / Chief Veterinary Officer
│   ├── Senior/Junior Health Inspectors (SHI / JHI)
│   └── Animal Catching Squad / Field Handlers
│
└── 👤 Citizens (Lodge Grievances, Track Status, Community Upvoting, Verification)
```

---

## 🛡️ Defense-in-Depth Security Architecture

The backend implements a multi-layer **CyberShield™** security middleware:

```mermaid
flowchart LR
    Req["Incoming HTTP Request"] --> H["1. Helmet Hardening<br/>(CSP, CORP, Strict-Referrer)"]
    H --> RL["2. Rate Limiters<br/>(Auth: 25/15m, API: 300/15m)"]
    RL --> CORS["3. Origin & Header Policy<br/>(CORS Guard)"]
    CORS --> SizeCap["4. Buffer Overflow Protection<br/>(10MB Body Cap)"]
    SizeCap --> WAF["5. WAF Deep Inspector<br/>(SQLi & Path Traversal Block)"]
    WAF --> XSS["6. XSS Sanitizer<br/>(HTML Injection Neutralizer)"]
    XSS --> Timeout["7. Slowloris Defense<br/>(30s Timeout Monitor)"]
    Timeout --> Controller["Application Logic"]
```

### Security Highlights
- **Zero Secret Commits**: Real credentials exist exclusively in an unversioned `.env` file guarded by multiple `.gitignore` boundaries.
- **SQL Injection Interceptor**: Deep-scans nested payloads for SQL injection patterns (`UNION`, `DROP`, `XP_CMDSHELL`, `OR 1=1`) and rejects malicious packets with `400 Bad Request`.
- **Path Traversal Guard**: Scans string parameters for relative directory traversal signatures (`../`, `..\`).
- **Sanitized Global Error Handler**: Catches all unhandled server exceptions and returns standardized messages, preventing raw stack traces or database connection strings from leaking to clients.

---

## 🗄️ Database Schema & Migration Engine

CivicSense uses Microsoft SQL Server with an automated self-healing schema migrator (`backend/db.js`):

```mermaid
erDiagram
    USERS ||--o{ COMPLAINTS : "files"
    USERS ||--o{ COMPLAINT_COMMENTS : "authors"
    COMPLAINTS ||--o{ COMPLAINT_COMMENTS : "has"
    COMPLAINTS ||--o{ UPVOTES : "receives"
    USERS ||--o{ UPVOTES : "casts"
    APPROVED_OFFICIALS ||--o{ COMPLAINTS : "assigned_to"

    USERS {
        int ID PK
        string NAME
        string EMAIL UK
        string PHONE
        string PASSWORD "bcrypt hash"
        string role "citizen | super_admin | engineer | corporator | ..."
        string department
    }

    COMPLAINTS {
        int complaint_no PK
        string ward_number
        string department
        string category
        string description
        string landmark
        string severity
        string status "Registered | Under Process | Resolved | Rejected"
        int vote_score
        decimal latitude
        decimal longitude
        string media_attachments "Cloudinary CDN URL"
        string after_media_attachments "Cloudinary CDN URL"
        string location_type "main_road | inner_road"
        string issue_size "small | medium | large"
        string assigned_contractor
        int parent_complaint_id FK
        bit is_potential_duplicate
        datetime created_at
    }

    COMPLAINT_COMMENTS {
        int id PK
        int complaint_no FK
        string author_name
        string department
        string comment_text
        datetime created_at
    }

    APPROVED_OFFICIALS {
        int id PK
        string email UK
        string role
        string department
        string ward_assignment
        string invited_by
        datetime invited_at
    }
```

---

## 📡 REST API Specification

### Authentication & Official Whitelisting (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Enrolls a citizen account with bcrypt password hashing. |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, evaluates whitelist status, and issues a 24-hour JWT token. |
| `POST` | `/api/auth/invite-official` | Super Admin | Whitelists an official email, assigns role/ward, and dispatches SMTP invitation. |
| `GET` | `/api/auth/officials` | Super Admin | Retrieves all whitelisted municipal officials and ward assignments. |
| `DELETE`| `/api/auth/officials/:email` | Super Admin | Revokes official administrative privileges. |

### Grievance Operations & Telemetry (`/api/grievances`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/grievances/submit` | Citizen | Uploads evidence, extracts EXIF coordinates, runs Gemini Vision AI, and records ticket. |
| `GET` | `/api/grievances/my-logs` | Citizen | Returns grievance records filed by the authenticated citizen. |
| `GET` | `/api/grievances/department-feed` | Officials | Returns filtered grievances matching the official's department and ward assignment. |
| `PATCH`| `/api/grievances/:id/upvote` | Citizen | Casts an upvote on an issue, enforcing single-vote integrity. |
| `PATCH`| `/api/grievances/:id/status` | Officials | Updates ticket status (`Under Process`, `Resolved`), logging state transitions. |
| `POST` | `/api/grievances/:id/verify` | Officials | Resolves issue with mandatory photographic "After" evidence and seals blockchain block. |
| `POST` | `/api/grievances/:id/comments` | Officials | Appends department remark to complaint timeline. |
| `GET` | `/api/grievances/:id/audit-chain`| Public | Returns the cryptographic SHA-256 blockchain verification proof for a ticket. |
| `GET` | `/api/public/complaints` | Public | High-speed parameterized query endpoint for global GIS map markers and heatmaps. |

---

## 🗺️ Interactive Telemetry & GIS Heatmaps

The frontend embeds Leaflet and `Leaflet.heat` for geospatial visualization:

- **Density Heatmap**: Generates weighted Gaussian gradient kernels based on complaint frequency and severity density across Mangaluru.
- **Dynamic Filtering**: Filter active pins by Department (MCC, MESCOM, Water Board, Health), Status (Registered, In Progress, Resolved), or Severity.
- **Geolocated Focus**: Tap any ticket in your dashboard to animate the map directly to its GPS coordinate coordinates with custom status markers.

---

## 📱 Mobile Portability (Android & iOS)

CivicSense is natively wrapped using Capacitor 6:

```bash
# Step 1: Build the optimized React production bundle
cd frontend
npm run build

# Step 2: Synchronize web assets to native Android project
npx cap sync android

# Step 3: Launch in Android Studio for APK/AAB compilation
npx cap open android
```

### Native Permissions Configured
- `CAMERA`: Capturing immediate evidence photos on-site.
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`: High-accuracy real-time GPS telemetry.
- `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`: Selecting media from gallery with EXIF metadata preservation.

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **Microsoft SQL Server** (2019/2022 local `SQLEXPRESS` or Azure SQL with TCP/IP enabled)

### Step 1: Clone Repository
```bash
git clone https://github.com/AmithColaco/Civic_Responsibilty.git
cd Civic_Responsibilty
```

### Step 2: Backend Setup
```bash
cd backend
npm install

# Create local environment configuration from template
cp .env.example .env
```
*Configure your database credentials, Cloudinary keys, and Gemini API key in `backend/.env`.*

```bash
# Start the OWASP-hardened Express backend
node server.js
```
*The database migrator will automatically check, create, and seed all schemas, super admin accounts, and 60-ward official records on startup.*

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install

# Start Vite hot-reloading development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⚙️ Environment Configuration Reference

Create a `backend/.env` file based on `backend/.env.example`:

```ini
# Server Port
PORT=8000

# Microsoft SQL Server Connection Matrix
DB_USER=sa
DB_PASSWORD=your_db_password
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_NAME=CivicSense

# JWT Authentication Secret Key
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary Media Storage CDN
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Google Gemini Vision API (Multimodal Triage)
GEMINI_API_KEY=your_gemini_api_key_here

# SMTP Live Email Delivery Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_notifications_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM="CivicSense Notifications" <noreply@civicsense.mangaluru.in>
```

---

## 👥 Default Accounts (Auto-Seeded)

For testing and local demonstration, the database auto-seeds:

| Account Type | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `amithcolaco@gmail.com` | `Winston@2006` | Global Administration & Whitelisting |
| **Super Admin Portal** | `admin@civicsense.in` | `Winston@2006` | Global Administration |
| **MCC Admin** | `admin@mangaluru.gov.in` | `Winston@2006` | City Municipal Oversight |
| **Corporator (Ward 18)** | `corporator.kavoor@mangaluru.gov.in` | `qwerty` | Ward 18 - Kavoor |
| **Corporator (Ward 15)** | `dhritim07@gmail.com` | `qwerty` | Ward 15 - Kunjathbail South |

---

## 📄 Contributing & License

Contributions are welcome! Please create a feature branch, commit your changes, and open a Pull Request.

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ for civic responsibility, transparent governance, and smarter cities.</sub>
</div>