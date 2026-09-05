# ☕ NexaSphere Java Backend

## Spring Boot 3 REST API

> **Enterprise-grade REST API** for NexaSphere community platform with real-time data synchronization

<br/>

---
## 📌 Overview

<br/>

### Purpose

Spring Boot 3 backend service providing:

- ✓ Event management (CRUD operations)
- ✓ Core team member management
- ✓ User form submission handling
- ✓ Admin authentication & authorization
- ✓ Real-time data synchronization

<br/>

### Key Specifications

| Specification           | Details          |
| ----------------------- | ---------------- |
| **Runtime**             | Java 17+         |
| **Framework**           | Spring Boot 3    |
| **Build Tool**          | Maven 3.8+       |
| **Default Database**    | H2 (development) |
| **Production Database** | PostgreSQL       |
| **Port**                | 8080             |

<br/>

---

## ⚙️ Prerequisites

<br/>

Before starting, ensure you have:

| Tool           | Version | Download                                  |
| -------------- | ------- | ----------------------------------------- |
| **Java JDK**   | 17+     | https://www.oracle.com/java/technologies/ |
| **Maven**      | 3.8+    | https://maven.apache.org/download.cgi     |
| **PostgreSQL** | Latest  | https://www.postgresql.org/download/      |

<br/>

---

## 🚀 Quick Start

<br/>

### 1️⃣ Build Project

<br/>

```bash
cd server-java
mvn clean install
```

**What this does:**

- Downloads all dependencies
- Compiles source code
- Runs unit tests
- Creates executable JAR

<br/>

---
### 2️⃣ Run Development Server

<br/>

**Using H2 (in-memory database):**

```bash
mvn spring-boot:run
```

<br/>

**✅ Server Running on:** http://localhost:8080

<br/>

---
### 3️⃣ Run Production Server

<br/>

**Setup PostgreSQL:**

```bash
# Export environment variables
export DB_URL=jdbc:postgresql://localhost:5432/nexasphere
export DB_DRIVER=org.postgresql.Driver
export DB_USER=postgres
export DB_PASS=yourpassword

# Run the server
mvn spring-boot:run
```

<br/>

---

## 📋 Environment Variables

<br/>

### Essential Variables

| Variable           | Example                     | Purpose                  |
| ------------------ | --------------------------- | ------------------------ |
| **ADMIN_EMAIL**    | nexasphere@glbajajgroup.org | Admin login email        |
| **ADMIN_PASSWORD** | Admin@123                   | Admin login password     |
| **CORS_ORIGIN**    | http://localhost:5173       | Allowed frontend origins |

<br/>

### Database Configuration

| Variable      | Dev Value                | Prod Value                             |
| ------------- | ------------------------ | -------------------------------------- |
| **DB_URL**    | jdbc:h2:mem:nexaspheredb | jdbc:postgresql://host:5432/nexasphere |
| **DB_DRIVER** | org.h2.Driver            | org.postgresql.Driver                  |
| **DB_USER**   | sa                       | postgres                               |
| **DB_PASS**   | _(empty)_                | your-password                          |

<br/>

### application.properties File

<br/>

Create `src/main/resources/application.properties`:

```properties
# ========== Server Configuration ==========
server.port=8080
spring.profiles.active=dev

# ========== Database (H2 - Development) ==========
spring.datasource.url=jdbc:h2:mem:nexaspheredb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# ========== Database (PostgreSQL - Production) ==========
# Uncomment for production
# spring.datasource.url=jdbc:postgresql://localhost:5432/nexasphere
# spring.datasource.driverClassName=org.postgresql.Driver
# spring.datasource.username=postgres
# spring.datasource.password=yourpassword

# ========== JPA/Hibernate Configuration ==========
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# ========== Admin Credentials ==========
app.admin.email=nexasphere@glbajajgroup.org
app.admin.password=Admin@123

# ========== CORS Configuration ==========
app.cors.origin=http://localhost:5173,https://nexasphere-glbajaj.vercel.app

# ========== Logging ==========
logging.level.root=INFO
logging.level.org.nexasphere=DEBUG
logging.level.org.springframework.web=DEBUG
```

<br/>

---

## 📁 Project Structure

<br/>

```
server-java/
│
├── src/
│   ├── main/
│   │   ├── java/org/nexasphere/
│   │   │   ├── NexaSphereApplication.java      ← Spring Boot Entry Point
│   │   │   ├── controller/                     ← REST Endpoints
│   │   │   ├── service/                        ← Business Logic
│   │   │   ├── model/                          ← JPA Entities
│   │   │   ├── repository/                     ← Data Access Layer
│   │   │   ├── config/                         ← Spring Configuration
│   │   │   ├── exception/                      ← Custom Exceptions
│   │   │   └── util/                           ← Utility Classes
│   │   └── resources/
│   │       ├── application.properties          ← Configuration
│   │       └── data.sql                        ← Seed Data
│   └── test/
│       └── java/org/nexasphere/
│           └── NexaSphereApplicationTests.java
│
├── pom.xml                                     ← Maven Dependencies
├── mvnw & mvnw.cmd                            ← Maven Wrapper
└── README.md
```

<br/>

---

## 🧪 Testing

<br/>

### Run All Tests

```bash
mvn test
```

<br/>

### Run with Coverage Report

```bash
mvn clean test jacoco:report
```

**📊 View Coverage:** `target/site/jacoco/index.html`

<br/>

### Run Full Verification

```bash
mvn verify
```

<br/>

---

## 🏛️ Architecture

<br/>

### Layer Breakdown

<table>
  <tr>
    <td width="50%">
      <h3>🎯 Controller Layer</h3>
      <ul>
        <li>REST endpoint handlers</li>
        <li>Request/response mapping</li>
        <li>Input validation</li>
        <li>CORS configuration</li>
      </ul>
    </td>
    <td width="50%">
      <h3>🔧 Service Layer</h3>
      <ul>
        <li>Business logic</li>
        <li>Data processing</li>
        <li>Business rules</li>
        <li>Transaction management</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🗄️ Repository Layer</h3>
      <ul>
        <li>Database queries</li>
        <li>CRUD operations</li>
        <li>JPA interfaces</li>
        <li>Custom queries</li>
      </ul>
    </td>
    <td width="50%">
      <h3>📦 Model Layer</h3>
      <ul>
        <li>JPA entities</li>
        <li>Database tables</li>
        <li>Entity relationships</li>
        <li>Validation annotations</li>
      </ul>
    </td>
  </tr>
</table>

<br/>

---

## 🌐 API Endpoints

<br/>

### Public Endpoints

<br/>

```
GET  /api/content/events
GET  /api/content/events/{id}
GET  /api/content/activity-events/{activityKey}
GET  /api/content/core-team
GET  /api/content/core-team/{id}
POST /api/forms/membership
POST /api/forms/recruitment
POST /api/core-team/apply
```

<br/>

### Admin Endpoints (Requires Authentication)

<br/>

```
POST   /api/admin/events
PUT    /api/admin/events/{id}
DELETE /api/admin/events/{id}

POST   /api/admin/core-team
PUT    /api/admin/core-team/{id}
DELETE /api/admin/core-team/{id}

POST   /api/admin/login
POST   /api/admin/logout
```

<br/>

---
## 🔐 Authentication

<br/>

### Admin Login

```bash
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"nexasphere@glbajajgroup.org",
    "password":"Admin@123"
  }'
```

<br/>

### Response

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

<br/>

### Using Token

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8080/api/admin/events
```

<br/>

---

## 📚 Database Setup

<br/>

### Development (H2)

**Automatic Setup:**

- ✓ Creates in-memory database on startup
- ✓ Creates tables from JPA entities
- ✓ Loads seed data from `data.sql`
- ✓ No manual configuration needed

<br/>

### Production (PostgreSQL)

<br/>

**Step 1: Create Database**

```bash
createdb nexasphere
```

<br/>

**Step 2: Configure Connection**

Update `application.properties` with PostgreSQL credentials

<br/>

**Step 3: Initialize**

Spring Boot auto-creates tables on startup via JPA

<br/>

---

## 🚀 Deployment

<br/>

### Railway Deployment

<br/>

**1. Install Railway CLI**

```bash
npm i -g @railway/cli
```

<br/>

**2. Login & Deploy**

```bash
railway login
cd server-java
railway init
railway up
```

<br/>

**3. Set Environment Variables**

In Railway Dashboard, add:

```
ADMIN_EMAIL=nexasphere@glbajajgroup.org
ADMIN_PASSWORD=Admin@123
CORS_ORIGIN=https://nexasphere-glbajaj.vercel.app
DB_URL=jdbc:postgresql://[rail-host]:5432/railway
DB_DRIVER=org.postgresql.Driver
DB_USER=postgres
DB_PASS=[from-dashboard]
```

<br/>

---

## 🐛 Troubleshooting

<br/>

### Build Issues

<br/>

**❌ Maven command not found**

```bash
# Solution: Add Maven to PATH
# Or use Maven wrapper
./mvnw clean install
```

<br/>

**❌ Java 17 not found**

```bash
# Solution: Download Java 17+
# Verify: java -version
```

<br/>

### Runtime Issues

<br/>

**❌ Connection refused on port 8080**

```bash
# Solution: Port already in use
# Change port in application.properties
server.port=9090
```

<br/>

**❌ Database connection failed**

```bash
# Solution: Verify PostgreSQL is running
# Check credentials in application.properties
```

<br/>

---

## 📖 Additional Resources

<br/>

- **[Spring Boot Docs](https://spring.io/projects/spring-boot)**
- **[Maven Guide](https://maven.apache.org/guides/)**
- **[PostgreSQL Docs](https://www.postgresql.org/docs/)**
- **[JPA/Hibernate](https://hibernate.org/)**

<br/>

---

<br/>

<div align="center">

### Questions? 📧 Contact nexasphere@glbajajgroup.org

**Backend Version:** 1.0 | **Last Updated:** May 2026

</div>
