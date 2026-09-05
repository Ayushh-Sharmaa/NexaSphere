# NexaSphere Admin Dashboard

Standalone React admin panel for managing NexaSphere content.

## Setup

```bash
npm install
cp .env.example .env        # set VITE_API_BASE to your Java backend URL
npm run dev                 # runs on http://localhost:5174
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE` | Java backend URL (e.g. `https://api.nexasphere.in`) |

## Deployment (Vercel)

1. Create a new Vercel project pointing to the `admin-dashboard/` folder
2. Set `VITE_API_BASE` environment variable
3. Deploy — access via `admin.nexasphere-glbajaj.vercel.app`

Also add the admin dashboard URL to `CORS_ORIGIN` in the Java backend environment.

## Features

- Login with email/password → JWT stored in localStorage
- Events CRUD (create, edit, delete)
- Activity Events management per category (8 activity types)
- Core Team member add/remove
- Event-driven UI — no page reloads on mutations
- Skeleton loaders, toast notifications, confirm dialogs
- Auto-redirect to login on session expiry
## 👨‍💼 NexaSphere Admin Dashboard

## Standalone React + Vite Application

 > **Complete admin interface** for managing NexaSphere community events,
 > activities and team members

<br/>

---
## 📌 Overview

<br/>

### Purpose

Dedicated admin application providing:

- ✓ Event management (create, edit, delete)
- ✓ Activity event management (8 categories)
- ✓ Core team member management
- ✓ Real-time UI updates
- ✓ Role-based access control

<br/>

### Key Specifications

| Specification      | Details                   |
| ------------------ | ------------------------- |
| **Frontend**       | React 18 + Vite 5         |
| **Backend**        | Java Spring Boot API      |
| **Hosting**        | Vercel (separate project) |
| **Port (Dev)**     | 5174                      |
| **Authentication** | JWT Tokens                |

<br/>

---
## ⚙️ Requirements

<br/>

| Requirement              | Version               |
| ------------------------ | --------------------- |
| **Node.js**              | 20+                   |
| **npm**                  | Latest                |
| **Running Java Backend** | http://localhost:8080 |

<br/>

---

## 🚀 Quick Start

<br/>

### Step 1️⃣: Install Dependencies

<br/>

```bash
cd admin-dashboard
npm install
```

<br/>

---

<br/>

### Step 2️⃣: Configure Environment

<br/>

Create `.env.local` file:

```bash
VITE_API_BASE=http://localhost:8080
```

<br/>

---

<br/>

### Step 3️⃣: Start Development Server

<br/>

```bash
npm run dev
```

<br/>

**✅ Access Dashboard:** http://localhost:5174

<br/>

---

## 🔑 Login Credentials

<br/>

<table align="center">
  <tr>
    <td><strong>Email</strong></td>
    <td>nexasphere@glbajajgroup.org</td>
  </tr>
  <tr>
    <td><strong>Password</strong></td>
    <td>Admin@123</td>
  </tr>
</table>

<br/>

---
## 📋 Environment Variables

<br/>

### Development Configuration

<br/>

**`.env.local`** (Development)

```bash
# API Base URL
VITE_API_BASE=http://localhost:8080

# Optional
VITE_ENVIRONMENT=development
```

<br/>

### Production Configuration

<br/>

**`.env.production.local`** (Production)

```bash
# API Base URL
VITE_API_BASE=https://your-java-backend-url.railway.app

# Environment
VITE_ENVIRONMENT=production
```

<br/>

---

## 📁 Project Structure

<br/>

```
admin-dashboard/
│
├── src/
│   ├── pages/                       ← Page Components
│   │   ├── LoginPage.jsx            ← Admin login interface
│   │   ├── DashboardPage.jsx        ← Main dashboard
│   │   ├── EventsPage.jsx           ← Event management
│   │   ├── ActivitiesPage.jsx       ← Activity management
│   │   ├── TeamPage.jsx             ← Team member management
│   │   └── NotFoundPage.jsx         ← 404 page
│   │
│   ├── components/                  ← Reusable Components
│   │   ├── EventForm.jsx            ← Event creation/edit
│   │   ├── ActivityEventForm.jsx    ← Activity event form
│   │   ├── TeamMemberForm.jsx       ← Team member form
│   │   ├── DataTable.jsx            ← Generic data table
│   │   ├── Modal.jsx                ← Reusable modal
│   │   ├── Navbar.jsx               ← Top navigation
│   │   └── Sidebar.jsx              ← Side navigation
│   │
│   ├── services/                    ← API Services
│   │   ├── apiClient.js             ← API request handler
│   │   ├── authService.js           ← Authentication logic
│   │   ├── eventService.js          ← Event API calls
│   │   ├── activityService.js       ← Activity API calls
│   │   └── teamService.js           ← Team API calls
│   │
│   ├── hooks/                       ← Custom React Hooks
│   │   ├── useAuth.js               ← Authentication hook
│   │   ├── useEvents.js             ← Events data hook
│   │   ├── useActivities.js         ← Activities data hook
│   │   └── useTeam.js               ← Team data hook
│   │
│   ├── styles/                      ← Stylesheets
│   │   ├── globals.css              ← Global styles
│   │   ├── dashboard.css            ← Dashboard styles
│   │   └── forms.css                ← Form styles
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.html
│
├── package.json
├── vite.config.js
├── .env.local
├── .env.example
└── README.md
```

<br/>

---


## 🎯 Core Features

<br/>

### 1️⃣ Event Management

<br/>

<table>
  <tr>
    <td width="50%">
      <h3>✨ Capabilities</h3>
      <ul>
        <li>📝 Create new events</li>
        <li>✏️ Edit existing events</li>
        <li>🗑️ Delete events</li>
        <li>📅 Set dates & times</li>
        <li>📍 Add locations</li>
        <li>📄 Add descriptions</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔄 Updates</h3>
      <ul>
        <li>⚡ Real-time sync</li>
        <li>🔔 Instant updates</li>
        <li>🎯 No page reload</li>
        <li>✅ Success feedback</li>
        <li>⚠️ Error handling</li>
        <li>🔄 Refresh data</li>
      </ul>
    </td>
  </tr>
</table>

<br/>

---

<br/>

### 2️⃣ Activity Event Management

<br/>

**8 Activity Categories:**

- 🔨 **Hackathon** — 24-48 hour coding events
- 💻 **Codathon** — Competitive programming
- 💡 **Ideathon** — Innovation & brainstorming
- ⚡ **Promptathon** — AI prompt engineering
- 🎓 **Workshop** — Technical trainings
- 🎤 **Insight Session** — Expert talks
- 🌍 **Open Source Day** — Community contribution
- 🗣️ **Tech Debate** — Discussions & debates

<br/>

**Features:**

- Add/edit/delete activities
- Category-based organization
- Scheduled event listing
- Real-time updates

<br/>

---

<br/>

### 3️⃣ Core Team Management

<br/>

<table>
  <tr>
    <td width="50%">
      <h3>👥 Member Profile</h3>
      <ul>
        <li>Name & Email</li>
        <li>Phone number</li>
        <li>Role & Position</li>
        <li>Department</li>
        <li>Social links</li>
        <li>Profile photo</li>
      </ul>
    </td>
    <td width="50%">
      <h3>⚙️ Operations</h3>
      <ul>
        <li>✏️ Add members</li>
        <li>📝 Edit details</li>
        <li>🖼️ Upload photos</li>
        <li>🔗 Add socials</li>
        <li>🗑️ Remove members</li>
        <li>📄 View profiles</li>
      </ul>
    </td>
  </tr>
</table>

<br/>

---

<br/>

### 4️⃣ Real-time Updates

<br/>

**Architecture:**

- Event-driven system
- No page reloads
- Instant UI synchronization
- Seamless user experience

<br/>

---

## 🔐 Authentication Flow

<br/>

```
┌─────────────┐
│  Login Page │
└──────┬──────┘
       │ Submit credentials
       ▼
┌────────────────────┐
│  Java Backend API  │
│  /api/admin/login  │
└──────┬─────────────┘
       │ JWT Token returned
       ▼
┌──────────────────┐
│  localStorage    │
│  Store JWT Token │
└─────┬────────────┘
      │ Include in header
      ▼
┌──────────────────────┐
│  Protected Requests  │
│ Authorization: Bearer │
└──────────────────────┘
```

<br/>

---

## 🌐 API Integration

<br/>

### Authentication Endpoints

<br/>

```http
POST /api/admin/login
POST /api/admin/logout
```

<br/>

### Event Endpoints

<br/>

```http
GET    /api/admin/events           ← Fetch all events
POST   /api/admin/events           ← Create new event
PUT    /api/admin/events/{id}      ← Update event
DELETE /api/admin/events/{id}      ← Delete event
```

<br/>

### Activity Endpoints

<br/>

```http
GET    /api/admin/activities/{key}/events        ← Get activity events
POST   /api/admin/activities/{key}/events        ← Create activity event
PUT    /api/admin/activities/{key}/events/{id}   ← Update
DELETE /api/admin/activities/{key}/events/{id}   ← Delete
```

<br/>

### Team Endpoints

<br/>

```http
GET    /api/admin/core-team        ← List team members
POST   /api/admin/core-team        ← Add member
PUT    /api/admin/core-team/{id}   ← Update member
DELETE /api/admin/core-team/{id}   ← Delete member
```

<br/>

---
## 🧪 Testing

<br/>

### Run Tests

```bash
npm run test
```

<br/>

### Run with Coverage

```bash
npm run test:coverage
```

<br/>

### Test Specific Components

```bash
npm run test EventForm.test.jsx
```

<br/>

---


## 🚀 Deployment Guide

<br/>

### Vercel Deployment

<br/>

### Step 1️⃣: Prepare Repository

<br/>

Push code to GitHub with:

```
admin-dashboard/
├── src/
├── package.json
├── vite.config.js
├── .env.example
└── .gitignore
```

<br/>

### Step 2️⃣: Create Vercel Project

<br/>

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Select GitHub repository
4. Choose `admin-dashboard` folder as root

<br/>

### Step 3️⃣: Configure Build Settings

<br/>

<table>
  <tr>
    <td><strong>Field</strong></td>
    <td><strong>Value</strong></td>
  </tr>
  <tr>
    <td>Framework</td>
    <td>Vite</td>
  </tr>
  <tr>
    <td>Build Command</td>
    <td>npm run build</td>
  </tr>
  <tr>
    <td>Output Directory</td>
    <td>dist</td>
  </tr>
  <tr>
    <td>Install Command</td>
    <td>npm install</td>
  </tr>
</table>

<br/>

### Step 4️⃣: Add Environment Variables

<br/>

In Vercel Dashboard:

```
VITE_API_BASE = https://your-java-backend-url.railway.app
```

<br/>

### Step 5️⃣: Deploy

<br/>

Click **"Deploy"** and wait for completion.

<br/>

**📍 Live URL:** https://admin-nexasphere.vercel.app

<br/>

---

<br/>

## 📝 Build for Production

<br/>

### Build Optimized Version

```bash
npm run build
```

<br/>

**Creates:** `dist/` folder with optimized files

<br/>

### Preview Production Build

```bash
npm run preview
```

<br/>

**Access:** http://localhost:4173

<br/>

---

## 🐛 Troubleshooting

<br/>

### Build Issues

<br/>

**❌ npm command not found**

```bash
# Install Node.js from https://nodejs.org/
# Verify: node -v && npm -v
```

<br/>

**❌ Port 5174 already in use**

```bash
# Use different port
npm run dev -- --port 5175
```

<br/>

### API Connection Issues

<br/>

**❌ CORS error from backend**

```bash
# Verify VITE_API_BASE in .env.local
# Ensure Java backend is running
# Check Backend CORS configuration
```

<br/>

**❌ 401 Unauthorized on protected routes**

```bash
# Clear browser storage: localStorage
# Delete browser cookies
# Re-login with correct credentials
```

<br/>

### Deployment Issues

<br/>

**❌ Blank page after Vercel deployment**

```bash
# Check Vercel build logs
# Verify environment variables are set
# Ensure API endpoint is accessible
```

<br/>

**❌ API requests failing in production**

```bash
# Verify VITE_API_BASE points to production backend
# Check CORS configuration on Java backend
# Ensure backend is deployed and running
```

<br/>

---

## 📚 Development Guidelines

<br/>

### Code Quality

<br/>

- ✓ Use ESLint configuration
- ✓ Format with Prettier
- ✓ No `console.log` in production
- ✓ Write meaningful component names
- ✓ Keep functions under 50 lines
- ✓ Add JSDoc comments for complex logic

<br/>

### Component Best Practices

<br/>

```javascript
// Good component structure
export default function EventForm({ onSubmit, event }) {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return <form onSubmit={handleSubmit}>{/* Form JSX */}</form>;
}
```

<br/>

---

## 📖 Resources

<br/>

- **[React 18 Docs](https://react.dev)**
- **[Vite Documentation](https://vitejs.dev)**
- **[Vercel Docs](https://vercel.com/docs)**
- **[Fetch API](https://mdn.io/Fetch_API)**
- **[JWT Auth](https://jwt.io/introduction)**

<br/>

---
## 🚀 Performance Tips

<br/>

- 📦 Code splitting with lazy loading
- 🖼️ Image optimization
- 🗜️ CSS & JS minification
- 💾 Caching strategies
- ⚡ Debounce API calls
- 🎯 Virtual scrolling for large lists

<br/>

---

<br/>

<div align="center">

### Questions? 📧 Contact nexasphere@glbajajgroup.org

**Dashboard Version:** 1.0 | **Last Updated:** May 2026

</div>
