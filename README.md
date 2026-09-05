# 🌟 NexaSphere

## Official Community Platform — GL Bajaj Group of Institutions, Mathura

> **Connecting students with opportunities** across Tech and Non-Tech domains through an integrated digital ecosystem
<br/>

<p align="center"> <img src="image.png" alt="NexaSphere homepage preview" width="100%" /></p>
<br/>

---

## 🔗 Quick Access

<div align="center">

| Resource               | Link                                                                           |
| ---------------------- | ------------------------------------------------------------------------------ |
| 🌐 **Live Website**    ||
| 🔑 **Admin Dashboard** | |
| 📧 **Contact**         | nexasphere@glbajajgroup.org                                                    |
| 💼 **Institution**     | GL Bajaj Group of Institutions, Mathura                                        |

</div>

<br/>

---

## 🚀 Technology Stack

Modern, scalable architecture built with industry-leading technologies:

<br/>

<table>
  <tr>
    <td align="center" width="50%">
      <h3>Frontend Layer</h3>
      <p>⚡ React 18 + Vite 5</p>
      <p>🎨 Vanilla CSS with Advanced Motion</p>
      <p>📦 Vercel Hosting</p>
    </td>
    <td align="center" width="50%">
      <h3>Backend Layer</h3>
      <p>☕ Java 17 + Spring Boot 3</p>
      <p>🐍 Python 3.11 + FastAPI</p>
      <p>🚀 Railway / Render / Fly.io</p>
    </td>
  </tr>
  <tr>
    <td align="center">
      <h3>Database</h3>
      <p>🗄️ PostgreSQL (Production)</p>
      <p>💾 H2 (Development)</p>
      <p>📊 Supabase Integration</p>
    </td>
    <td align="center">
      <h3>Services</h3>
      <p>📝 Google Sheets Integration</p>
      <p>🔐 JWT Authentication</p>
      <p>🔄 Real-time Updates</p>
    </td>
  </tr>
</table>

<br/>

---

## 📁 Project Architecture

```
nexasphere/
│
├── 📂 src/                          ← Main Frontend Application
│   ├── pages/                       ← Page Components
│   │   ├── home/
│   │   ├── about/
│   │   ├── activities/
│   │   ├── events/
│   │   ├── team/
│   │   ├── contact/
│   │   ├── membership/
│   │   ├── recruitment/
│   │   └── admin/
│   ├── shared/                      ← Reusable Components & Utilities
│   ├── services/                    ← API Client Layer
│   ├── styles/                      ← Global Stylesheets
│   ├── data/                        ← Static Content & Configuration
│   └── App.jsx, main.jsx
│
├── 📂 admin-dashboard/              ← Standalone Admin Application
│   ├── src/
│   │   ├── pages/                   ← Admin Pages
│   │   ├── components/              ← Admin Components
│   │   ├── services/                ← API Integration
│   │   └── hooks/                   ← Custom React Hooks
│   └── package.json
│
├── 📂 server-java/                  ← REST API Backend
│   ├── src/main/java/org/nexasphere/
│   │   ├── controller/              ← REST Endpoints
│   │   ├── service/                 ← Business Logic
│   │   ├── model/                   ← JPA Entities
│   │   ├── repository/              ← Data Access Layer
│   │   └── config/                  ← Spring Configuration
│   ├── pom.xml
│   └── README.md
│
├── 📂 server-python/                ← Forms Microservice
│   ├── routers/                     ← API Routes
│   ├── services/                    ← Business Logic
│   ├── models/                      ← Data Models
│   ├── requirements.txt
│   └── README.md
│
├── Configuration Files
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   ├── netlify.toml
│   └── index.html
│
└── README.md                        ← This File
```

<br/>

---

## 🛠️ Local Development Setup

### ✅ Prerequisites

Make sure you have these installed on your system:

<br/>

| Tool           | Version | Purpose                                   |
| -------------- | ------- | ----------------------------------------- |
| **Node.js**    | 20+     | Frontend development & package management |
| **Java JDK**   | 17+     | Java backend compilation & execution      |
| **Maven**      | 3.8+    | Java project build tool                   |
| **Python**     | 3.11+   | Forms service runtime                     |
| **PostgreSQL** | Latest  | Database (optional for development)       |

<br/>

### 🎯 Step 1: Frontend Setup

<br/>

**Clone and Install:**

```bash
cd nexasphere
npm install
npm run dev
```

<br/>

**▶️ Access:** http://localhost:5173

<br/>

**📋 Environment Variables (.env.local):**

```bash
VITE_API_BASE=http://localhost:8080
```

<br/>

---

### ☕ Step 2: Java Backend Setup

<br/>

**Build and Run:**

```bash
cd server-java
mvn clean install
mvn spring-boot:run
```

<br/>

**▶️ Access:** http://localhost:8080

<br/>

**📋 Environment Variables (application.properties):**

```properties
# Admin Credentials
ADMIN_EMAIL=nexasphere@glbajajgroup.org
ADMIN_PASSWORD=Admin@123

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,https://nexasphere-glbajaj.vercel.app

# Database (Development - H2)
DB_URL=jdbc:h2:mem:nexaspheredb
DB_DRIVER=org.h2.Driver
DB_USER=sa
DB_PASS=
```

<br/>

**For PostgreSQL (Production):**

```properties
DB_URL=jdbc:postgresql://localhost:5432/nexasphere
DB_DRIVER=org.postgresql.Driver
DB_USER=postgres
DB_PASS=yourpassword
```

<br/>

---

### 🐍 Step 3: Python Forms Service

<br/>

**Setup Virtual Environment & Run:**

```bash
cd server-python

# Create virtual environment
python -m venv venv

# Activate (choose based on your OS)
source venv/bin/activate          # macOS/Linux
# OR
venv\Scripts\activate             # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000
```

<br/>

**▶️ Access:** http://localhost:8000

**📋 Interactive Docs:** http://localhost:8000/docs

<br/>

**📋 Environment Variables (.env):**

```bash
# Google Cloud Authentication
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-sheet-id

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CORS & Server
CORS_ORIGIN=http://localhost:5173,
```

<br/>

---

### 👨‍💼 Step 4: Admin Dashboard

<br/>

**Install and Run:**

```bash
cd admin-dashboard
npm install
npm run dev
```

<br/>

**▶️ Access:** http://localhost:5174

<br/>

**📋 Environment Variables (.env.local):**

```bash
VITE_API_BASE=http://localhost:8080
```

<br/>

---

## 🌐 API Documentation

### 🔓 Public Endpoints (No Authentication)

<br/>

| Method | Endpoint                             | Description                    |
| ------ | ------------------------------------ | ------------------------------ |
| `GET`  | `/api/content/events`                | Fetch all community events     |
| `GET`  | `/api/content/activity-events/{key}` | Get events by activity type    |
| `GET`  | `/api/content/core-team`             | List all core team members     |
| `POST` | `/api/forms/membership`              | Submit membership application  |
| `POST` | `/api/forms/recruitment`             | Submit recruitment application |
| `POST` | `/api/core-team/apply`               | Submit core team application   |

<br/>

### 🔐 Protected Endpoints (Admin Only)

<br/>

| Method   | Endpoint                    | Description             |
| -------- | --------------------------- | ----------------------- |
| `POST`   | `/api/admin/events`         | Create new event        |
| `PUT`    | `/api/admin/events/{id}`    | Update existing event   |
| `DELETE` | `/api/admin/events/{id}`    | Delete event            |
| `POST`   | `/api/admin/core-team`      | Create core team member |
| `PUT`    | `/api/admin/core-team/{id}` | Update core team member |
| `DELETE` | `/api/admin/core-team/{id}` | Delete core team member |

<br/>

---

## 👨‍💻 Admin Dashboard Features

<br/>

<table>
  <tr>
    <td width="50%">
      <h3>📊 Event Management</h3>
      <ul>
        <li>✓ Create new events</li>
        <li>✓ Edit event details</li>
        <li>✓ Delete events</li>
        <li>✓ Real-time updates</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🎯 Activity Events</h3>
      <ul>
        <li>✓ Manage 8 activity categories</li>
        <li>✓ Hackathon, Codathon, Ideathon</li>
        <li>✓ Workshops & Insight Sessions</li>
        <li>✓ Open Source Day & Tech Debate</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>👥 Team Management</h3>
      <ul>
        <li>✓ Add core team members</li>
        <li>✓ Edit member profiles</li>
        <li>✓ Manage roles & contacts</li>
        <li>✓ Remove members</li>
      </ul>
    </td>
    <td width="50%">
      <h3>⚡ Real-time Updates</h3>
      <ul>
        <li>✓ Event-driven architecture</li>
        <li>✓ No page reloads</li>
        <li>✓ Instant UI synchronization</li>
        <li>✓ Seamless user experience</li>
      </ul>
    </td>
  </tr>
</table>

**🔑 Admin Credentials:**

- **Email:** nexasphere@glbajajgroup.org
- **Password:** Admin@123

<br/>

---
## 🚀 Production Deployment

### 🌐 Frontend Deployment (Vercel)

<br/>

1. **Connect Repository:** Link GitHub repo to Vercel
2. **Configure Build:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Set Environment Variables:**
   - `VITE_API_BASE=https://your-api-url.railway.app`
4. **Deploy** and monitor

<br/>

**📍 Live URL:** 

<br/>

---

### 👨‍💼 Admin Dashboard Deployment (Vercel)

<br/>

1. **Create Separate Vercel Project** from `admin-dashboard/` folder
2. **Configure (same as frontend):**
   - Build: `npm run build`
   - Output: `dist`
   - Env: `VITE_API_BASE=https://your-api-url.railway.app`

<br/>

**📍 Live URL:** 

<br/>

---

### ☕ Java Backend Deployment (Railway)

<br/>

**Installation:**

```bash
npm i -g @railway/cli
railway login
cd server-java
railway init
railway up
```

<br/>

**📋 Production Environment Variables:**

```
ADMIN_EMAIL=nexasphere@glbajajgroup.org
ADMIN_PASSWORD=Admin@123
CORS_ORIGIN=
DB_URL=jdbc:postgresql://[host]:5432/railway
DB_DRIVER=org.postgresql.Driver
DB_USER=postgres
DB_PASS=[from-dashboard]
```

<br/>

---

### 🐍 Python Service Deployment

<br/>

**Railway Deployment:**

```bash
cd server-python
railway init
railway up
```

<br/>

**Environment Variables:** (Same as local `.env`)

<br/>

---

<br/>

## 🗄️ Database Configuration

### 💾 Development (H2 In-Memory)

Auto-configured on startup:

- ✓ Tables created automatically
- ✓ Seed data loaded
- ✓ No manual setup required

<br/>

### 🗄️ Production (PostgreSQL)

<br/>

**Create Database:**

```sql
CREATE DATABASE nexasphere;
```

<br/>

**Setup:**

- Spring Boot creates tables via JPA
- Seed data loads from `data.sql`
- Ready for production use

<br/>

**Supabase Tables:**

```sql
CREATE TABLE membership_forms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(10) NOT NULL,
  year VARCHAR(20) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  section VARCHAR(1) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recruitment_forms (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(10) NOT NULL,
  year VARCHAR(20) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  section VARCHAR(1) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE core_team_applications (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(10) NOT NULL,
  year VARCHAR(20) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  section VARCHAR(1) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

<br/>

---

## 🧪 Testing

<br/>

### React Frontend

```bash
npm run test
npm run test:coverage
```

<br/>

### Java Backend

```bash
mvn test
mvn verify
```

<br/>

### Python Service

```bash
pytest
pytest --cov
```

<br/>

---

## 📖 Documentation

For detailed information about specific components, visit:

<br/>

- **[server-java/README.md](server-java/README.md)** — Java backend build, setup, and deployment
- **[server-python/README.md](server-python/README.md)** — Python backend setup and integrations
- **[admin-dashboard/README.md](admin-dashboard/README.md)** — Admin dashboard installation

<br/>

---

## 🤝 Contributing

This is an **internal project** for the NexaSphere core team.

<br/>

### Workflow

1. Clone the repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes with quality standards
4. Test thoroughly before submission
5. Submit pull request for review

<br/>

### 📋 Code Quality Standards

- ✓ No `console.log` statements
- ✓ Functions under 40 lines
- ✓ Consistent naming conventions
- ✓ Zero unused imports
- ✓ Meaningful commit messages
- ✓ Comprehensive documentation

<br/>

---

## 📋 Project Checklist

<br/>

### Documentation ✅

- [x] Complete API documentation
- [x] Environment variable guides
- [x] Setup instructions for all services
- [x] Deployment procedures
- [x] Database configuration

<br/>

### Infrastructure 🚀

- [x] Frontend hosting (Vercel)
- [x] API backend available
- [x] Database configured
- [x] Admin dashboard deployed
- [x] CORS properly configured

<br/>

### Future Improvements 🎯

- [ ] Architecture diagrams
- [ ] Video tutorials
- [ ] API Swagger documentation
- [ ] Performance monitoring
- [ ] Security audit logs

<br/>

---
## 📝 License & Usage

**Internal Project** — GL Bajaj NexaSphere Core Team  
All rights reserved. Not for external distribution.

<br/>

---

## 📧 Contact & Support

<br/>

<table>
  <tr>
    <th>Resource</th>
    <th>Details</th>
  </tr>
  <tr>
    <td>📧 Email</td>
    <td>nexasphere@glbajajgroup.org</td>
  </tr>
  <tr>
    <td>🏢 Institution</td>
    <td>GL Bajaj Group of Institutions, Mathura</td>
  </tr>
  <tr>
    <td>🌐 Website</td>
    <td>https://nexa-sphere-sigma.vercel.app</td>
  </tr>
  <tr>
    <td>👨‍💼 Admin Panel</td>
    <td>https://admin-nexasphere.vercel.app</td>
  </tr>
</table>

<br/>

---

<br/>

<div align="center">

### Made with ❤️ by NexaSphere Core Team

**Version 1.0** | Last Updated: May 2026

</div>

