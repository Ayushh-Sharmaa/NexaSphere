# 🐍 NexaSphere Python Backend

## FastAPI Microservice for Form Processing

> **High-performance form submission service** with Google Sheets and Supabase integration

<br/>

---
## 📌 Overview

<br/>

### Purpose

FastAPI microservice handling:

- ✓ Form submission processing
- ✓ Google Sheets integration
- ✓ Supabase database synchronization
- ✓ CORS-enabled API endpoints
- ✓ Real-time data persistence

<br/>

### Key Specifications

| Specification | Details            |
| ------------- | ------------------ |
| **Runtime**   | Python 3.11+       |
| **Framework** | FastAPI            |
| **Server**    | Uvicorn ASGI       |
| **Port**      | 8000               |
| **Auto Docs** | Swagger UI & ReDoc |

<br/>

---

## ⚙️ System Requirements

<br/>

| Requirement      | Version | Purpose             |
| ---------------- | ------- | ------------------- |
| **Python**       | 3.11+   | Runtime environment |
| **pip**          | Latest  | Package manager     |
| **Google Cloud** | -       | Form storage        |
| **Supabase**     | Latest  | Database backup     |

<br/>

---
## 🚀 Quick Start

<br/>

### Step 1️⃣: Create Virtual Environment

<br/>

**macOS/Linux:**

```bash
cd server-python
python -m venv venv
source venv/bin/activate
```

<br/>

**Windows:**

```bash
cd server-python
python -m venv venv
venv\Scripts\activate
```

<br/>

---

<br/>

### Step 2️⃣: Install Dependencies

<br/>

```bash
pip install -r requirements.txt
```

<br/>

**Key Dependencies:**

- **fastapi** — Web framework
- **uvicorn** — ASGI server
- **pydantic** — Data validation
- **google-cloud-sheets** — Google integration
- **supabase** — Database client
- **python-dotenv** — Environment management

<br/>

---

<br/>

### Step 3️⃣: Configure Environment

<br/>

Create `.env` file in `server-python/`:

```bash
# Google Cloud Setup
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-sheet-id

# Supabase Setup
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
CORS_ORIGIN=http://localhost:5173,https://nexasphere-glbajaj.vercel.app
DEBUG=True
```

<br/>

---

<br/>

### Step 4️⃣: Run Development Server

<br/>

```bash
uvicorn main:app --reload --port 8000
```

<br/>

**✅ Server Running on:** http://localhost:8000

<br/>

**📚 Interactive Documentation:**

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

<br/>

---

## 🔑 Environment Variables Guide

<br/>

### Google Cloud Authentication

<br/>

**Getting Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Sheets API
4. Create Service Account
5. Generate JSON key file
6. Share Google Sheet with service account email

<br/>

**Required Variables:**

```bash
GOOGLE_PROJECT_ID=your-gcp-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=serviceaccount@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1a2b3c4d5e6f7g8h9i0j
```

<br/>

---

<br/>

### Supabase Configuration

<br/>

**Getting Credentials:**

1. Create account at [Supabase](https://supabase.com)
2. Create new project
3. Get project URL from settings
4. Get service role key from API settings
5. Create required tables

<br/>

**Required Variables:**

```bash
SUPABASE_URL=https://projectid.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

<br/>

---
## 📁 Project Structure

<br/>

```
server-python/
│
├── main.py                         ← Application Entry Point
├── requirements.txt                ← Python Dependencies
├── .env.example                    ← Environment Template
├── .env                            ← Local Environment (gitignored)
│
├── routers/                        ← API Routes
│   ├── __init__.py
│   └── forms.py                    ← Form submission endpoints
│
├── services/                       ← Business Logic
│   ├── __init__.py
│   ├── sheets.py                   ← Google Sheets integration
│   └── supabase.py                 ← Supabase operations
│
├── models/                         ← Data Models
│   ├── __init__.py
│   └── forms.py                    ← Pydantic schemas
│
└── README.md
```

<br/>

---

<br/>

## 🔗 API Endpoints

<br/>

### Health Check

```
GET /health
GET /api/forms/status
```

<br/>

### Membership Form

<br/>

```http
POST /api/forms/membership
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "whatsapp": "9876543210",
  "year": "3rd Year",
  "branch": "Computer Science",
  "section": "A",
  "reason": "Want to join the community"
}
```

<br/>

**Response:**

```json
{
  "id": 1,
  "status": "success",
  "message": "Form submitted successfully"
}
```

<br/>

---

<br/>

### Recruitment Form

<br/>

```http
POST /api/forms/recruitment
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "whatsapp": "9876543210",
  "year": "2nd Year",
  "branch": "Electronics",
  "section": "B",
  "reason": "Interested in contributing"
}
```

<br/>

---

<br/>

### Core Team Application

<br/>

```http
POST /api/forms/core-team
Content-Type: application/json

{
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "whatsapp": "9876543210",
  "year": "4th Year",
  "branch": "IT",
  "section": "A",
  "reason": "Leadership experience"
}
```

<br/>

---

## 📊 Google Sheets Integration

<br/>

### Sheet Structure

<br/>

Create a Google Sheet with these tabs:

<br/>

**Tab 1: Membership Forms**

| Column | Header    |
| ------ | --------- |
| A      | Timestamp |
| B      | Name      |
| C      | Email     |
| D      | WhatsApp  |
| E      | Year      |
| F      | Branch    |
| G      | Section   |
| H      | Reason    |

<br/>

**Tab 2: Recruitment Forms** (Same structure)

**Tab 3: Core Team Applications** (Same structure)

<br/>

### Setup Instructions

<br/>

1. **Create Google Sheet**
   - Go to [Google Sheets](https://sheets.new)
   - Add three tabs as shown above
   - Add headers in first row

2. **Share with Service Account**
   - Get email from `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - Click Share → Add service account email
   - Grant Editor access

3. **Copy Sheet ID**
   - Sheet URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Add `{SHEET_ID}` to `.env`

<br/>

---

## 💾 Supabase Integration

<br/>

### Create Tables

<br/>

Login to Supabase and run these SQL scripts:

<br/>

```sql
-- Membership Forms Table
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

-- Recruitment Forms Table
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

-- Core Team Applications Table
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

### Run All Tests

```bash
pytest
```

<br/>

### Run with Coverage

```bash
pytest --cov=. --cov-report=html
```

**📊 View Coverage:** `htmlcov/index.html`

<br/>

### Run Specific Test

```bash
pytest tests/test_forms.py::test_membership_submission
```

<br/>

---

## 🚀 Deployment

<br/>

### Production Server

<br/>

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

<br/>

### Railway Deployment

<br/>

```bash
cd server-python
railway init
railway up
```

<br/>

### Render Deployment

<br/>

1. Connect GitHub repository to Render
2. Set **Build Command:** `pip install -r requirements.txt`
3. Set **Start Command:** `uvicorn main:app --host 0.0.0.0 --port 8000`
4. Add environment variables
5. Deploy

<br/>

### Fly.io Deployment

<br/>

```bash
fly auth login
fly launch
fly deploy
```

<br/>

### Production Environment Variables

<br/>

```bash
GOOGLE_PROJECT_ID=production-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=prod-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=[from-service-account-json]
GOOGLE_SHEET_ID=production-sheet-id
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=production-key
CORS_ORIGIN=https://nexasphere-glbajaj.vercel.app
DEBUG=False
```

<br/>

---

## 🐛 Troubleshooting

<br/>

### Module Errors

<br/>

**❌ ModuleNotFoundError: No module named 'fastapi'**

```bash
# Solution: Activate venv and install dependencies
source venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
```

<br/>

### Google Sheets Errors

<br/>

**❌ 403 Forbidden when accessing Sheet**

```bash
# Solution: Share sheet with service account
# 1. Copy GOOGLE_SERVICE_ACCOUNT_EMAIL
# 2. Open Google Sheet
# 3. Click Share → Add email → Editor
```

<br/>

**❌ Invalid GOOGLE_SHEET_ID**

```bash
# Solution: Extract from URL
# https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
# Copy the {SHEET_ID} part
```

<br/>

### Connection Errors

<br/>

**❌ Connection refused to Supabase**

```bash
# Solution: Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
```

<br/>

### CORS Issues

<br/>

**❌ CORS policy error from frontend**

```bash
# Solution: Check CORS_ORIGIN environment variable
# Ensure frontend URL is included
CORS_ORIGIN=https://nexasphere-glbajaj.vercel.app
```

<br/>

---

<br/>

## 📚 Resources

<br/>

- **[FastAPI Docs](https://fastapi.tiangolo.com/)**
- **[Uvicorn](https://www.uvicorn.org/)**
- **[Google Sheets API](https://developers.google.com/sheets/api)**
- **[Supabase Docs](https://supabase.com/docs)**
- **[Pydantic](https://docs.pydantic.dev/)**

<br/>

---

<br/>

<div align="center">

### Questions? 📧 Contact nexasphere@glbajajgroup.org

**Backend Version:** 1.0 | **Last Updated:** May 2026

</div>
