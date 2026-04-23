# 🔍 LoanLens

> **AI-powered loan approval prediction platform** — full-stack application combining a React frontend, Spring Boot REST API, and a Python XGBoost ML service, deployed on Netlify + Render.

[![Tests](https://img.shields.io/badge/JUnit-34%2F34_passing-brightgreen)](https://github.com/Parth152-create/LoanLens)
[![Tests](https://img.shields.io/badge/pytest-43%2F43_passing-brightgreen)](https://github.com/Parth152-create/LoanLens)
[![Java](https://img.shields.io/badge/Java-21-blue)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-green)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-Vite-61DAFB)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow)](https://python.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML-orange)](https://xgboost.readthedocs.io/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [System Workflow](#system-workflow)
- [Project Structure](#project-structure)
- [Getting Started (Local)](#getting-started-local)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [ML Service](#ml-service)
- [Deployment Guide](#deployment-guide)
- [Example Workflow](#example-workflow)
- [Testing](#testing)
- [Security](#security)

---

## Overview

LoanLens is a production-ready loan approval system that uses machine learning to assess loan applications in real time. Users register, submit their loan application details, and receive an instant prediction (Approved / Rejected) powered by a trained XGBoost model served via FastAPI.

**Key capabilities:**
- JWT-secured user authentication (register / login)
- Loan application submission and history tracking
- Real-time ML prediction with XGBoost (FastAPI microservice)
- Full audit trail stored in PostgreSQL
- Fully containerised — Spring Boot and FastAPI each run as Docker services on Render

---

## Architecture

```
User / Browser
      │
      ▼  HTTPS
┌─────────────────────────┐
│  React + Vite Frontend  │  ← Netlify (auto-deploy, main branch)
│  /api/* → proxy         │
└────────────┬────────────┘
             │ REST /api/**
             ▼
┌─────────────────────────┐        ┌────────────────────────────┐
│  Spring Boot 3.5        │──────▶│  FastAPI ML Service        │
│  Java 21 · port 8081    │  HTTP  │  Python 3.11 · XGBoost     │
│  JWT Auth + Business    │◀──────│  uvicorn · /predict        │
│  Logic + Persistence    │        └────────────────────────────┘
└────────────┬────────────┘
             │ JDBC
             ▼
┌─────────────────────────┐
│  PostgreSQL             │  ← Render Managed Database
│  database: loanlens     │
└─────────────────────────┘
```

**Deploy order (must follow):**

| Step | Service | Platform | Notes |
|------|---------|----------|-------|
| ① | PostgreSQL | Render managed DB | Free tier, set DB name = `loanlens` |
| ② | FastAPI ML | Render Docker | Root dir: `ml-service/` |
| ③ | Spring Boot | Render Docker | Root dir: `backend/`, needs ML_SERVICE_URL from ② |
| ④ | React | Netlify | Auto from `netlify.toml`, needs Spring Boot URL from ③ |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite | Latest |
| Backend | Spring Boot | 3.5.13 |
| Runtime | Java (Eclipse Temurin) | 21 |
| ML Service | FastAPI + uvicorn | Latest |
| ML Model | XGBoost | Latest |
| ML Runtime | Python | 3.11 |
| Database | PostgreSQL | 15 |
| Auth | JWT (stateless) | — |
| Containerisation | Docker (multi-stage) | — |
| Frontend hosting | Netlify | — |
| Backend hosting | Render | — |

---

## System Workflow

### End-to-end loan prediction flow

```
1. User registers / logs in
        │
        ▼
2. Frontend sends POST /api/auth/register or /api/auth/login
        │
        ▼  JWT token returned
3. User fills in loan application form
   (income, loan amount, credit score, employment type, etc.)
        │
        ▼
4. Frontend sends POST /api/loans/apply  [Authorization: Bearer <token>]
        │
        ▼
5. Spring Boot validates request → persists application to PostgreSQL
        │
        ▼
6. Spring Boot sends POST <ML_SERVICE_URL>/predict  (feature payload)
        │
        ▼
7. FastAPI runs XGBoost model → returns { prediction: "APPROVED" | "REJECTED", confidence: 0.87 }
        │
        ▼
8. Spring Boot writes result back to DB → returns full response to frontend
        │
        ▼
9. React displays result card with decision + confidence score
        │
        ▼
10. User can view full application history at GET /api/loans/history
```

---

## Project Structure

```
LoanLens/
├── backend/                        # Spring Boot service
│   ├── src/
│   │   └── main/java/com/loanlens/
│   │       ├── controller/         # REST controllers
│   │       ├── service/            # Business logic
│   │       ├── repository/         # JPA repositories
│   │       ├── model/              # JPA entities
│   │       ├── dto/                # Request / response DTOs
│   │       ├── security/           # JWT + SecurityConfig
│   │       └── client/             # ML service HTTP client
│   ├── src/main/resources/
│   │   └── application.yml         # Reads env vars via ${...}
│   ├── Dockerfile                  # Multi-stage Eclipse Temurin 21 build
│   └── pom.xml
│
├── ml-service/                     # FastAPI ML microservice
│   ├── main.py                     # FastAPI app + /predict endpoint
│   ├── model/                      # Serialised XGBoost model
│   ├── requirements.txt
│   └── Dockerfile                  # Python 3.11-slim + uvicorn
│
├── frontend/                       # React + Vite app
│   ├── src/
│   │   ├── pages/                  # Login, Register, Apply, History
│   │   ├── components/             # UI components
│   │   └── api/                    # Axios API client
│   ├── dist/                       # Built output (Netlify publishes this)
│   └── vite.config.js
│
├── netlify.toml                    # Netlify build + /api/* proxy config
├── docker-compose.yml              # Local full-stack dev environment
└── README.md
```

---

## Getting Started (Local)

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend dev without Docker)
- Java 21 + Maven (for backend dev without Docker)
- Python 3.11 (for ML service dev without Docker)

### Run everything with Docker Compose

```bash
git clone https://github.com/Parth152-create/LoanLens.git
cd LoanLens

# Copy and fill in environment variables
cp .env.example .env

# Start all services
docker-compose up --build
```

Services will be available at:

| Service | URL |
|---------|-----|
| React frontend | http://localhost:5173 |
| Spring Boot API | http://localhost:8081 |
| FastAPI ML service | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

### Run services individually

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
```

**ML Service:**
```bash
cd ml-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Spring Boot (Render — set in Environment tab)

| Variable | Example Value | Description |
|----------|--------------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<render-db-host>/loanlens` | Render external DB URL |
| `SPRING_DATASOURCE_USERNAME` | `loanlens` | DB username from Render |
| `SPRING_DATASOURCE_PASSWORD` | `<from Render DB page>` | DB password from Render |
| `ML_SERVICE_URL` | `https://<fastapi-service>.onrender.com` | FastAPI service URL (set after step ②) |
| `JWT_SECRET` | `<random 32+ char string>` | Secret key for signing JWT tokens |
| `SERVER_PORT` | `8081` | Spring Boot listen port |

### FastAPI (no additional env vars required by default)

The ML service reads the serialised model from `model/` at startup. No secrets needed unless you add auth to the ML service.

---

## API Reference

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Parth Shah",
  "email": "parth@example.com",
  "password": "securepassword"
}
```
```json
// Response 201
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "uuid-here"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "parth@example.com",
  "password": "securepassword"
}
```
```json
// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "uuid-here"
}
```

### Loan Applications

#### Submit application
```http
POST /api/loans/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "applicantName": "Parth Shah",
  "loanAmount": 250000,
  "annualIncome": 800000,
  "creditScore": 720,
  "employmentType": "SALARIED",
  "loanTerm": 60,
  "existingDebt": 50000
}
```
```json
// Response 200
{
  "applicationId": "loan-uuid",
  "decision": "APPROVED",
  "confidence": 0.89,
  "appliedAt": "2025-07-01T10:30:00Z"
}
```

#### Get application history
```http
GET /api/loans/history
Authorization: Bearer <token>
```
```json
// Response 200
[
  {
    "applicationId": "loan-uuid",
    "loanAmount": 250000,
    "decision": "APPROVED",
    "confidence": 0.89,
    "appliedAt": "2025-07-01T10:30:00Z"
  }
]
```

#### Get single application
```http
GET /api/loans/{applicationId}
Authorization: Bearer <token>
```

---

## ML Service

### FastAPI endpoints

#### Health check
```http
GET /health
```
```json
// Response 200
{ "status": "ok", "model": "xgboost" }
```

#### Predict
```http
POST /predict
Content-Type: application/json

{
  "loan_amount": 250000,
  "annual_income": 800000,
  "credit_score": 720,
  "employment_type": "SALARIED",
  "loan_term": 60,
  "existing_debt": 50000
}
```
```json
// Response 200
{
  "prediction": "APPROVED",
  "confidence": 0.89
}
```

The XGBoost model was trained on historical loan data. Features are normalised inside `main.py` before being passed to the model.

---

## Deployment Guide

### Step 1 — PostgreSQL on Render

1. Go to [render.com](https://render.com) → **New → PostgreSQL**
2. Set:
   - **Name:** `loanlens-db`
   - **Database:** `loanlens`
   - **User:** `loanlens`
   - **Region:** closest to your users
   - **Plan:** Free
3. After creation, copy the **External Database URL** from the Info tab.

---

### Step 2 — FastAPI ML service on Render

1. **New → Web Service**
2. Connect to `github.com/Parth152-create/LoanLens`
3. Set:
   - **Root Directory:** `ml-service`
   - **Runtime:** Docker
   - **Branch:** `main`
4. No environment variables needed.
5. Deploy and copy the service URL (e.g. `https://loanlens-ml.onrender.com`).

---

### Step 3 — Spring Boot backend on Render

1. **New → Web Service**
2. Connect same repo
3. Set:
   - **Root Directory:** `backend`
   - **Runtime:** Docker
   - **Branch:** `main`
4. Add all environment variables from the table above, using:
   - The PostgreSQL external URL from Step 1
   - The FastAPI URL from Step 2 as `ML_SERVICE_URL`
5. Deploy and copy the service URL (e.g. `https://loanlens-backend.onrender.com`).

---

### Step 4 — Update CORS + netlify.toml, then deploy frontend

After Spring Boot is live:

**a) Update `netlify.toml`** — replace the placeholder with the real backend URL:
```toml
[[redirects]]
  from = "/api/*"
  to = "https://loanlens-backend.onrender.com/api/:splat"
  status = 200
  force = true
```

**b) Update `SecurityConfig.java`** — add Netlify URL to CORS allowed origins:
```java
.allowedOrigins(
    "http://localhost:5173",
    "https://<your-site>.netlify.app"
)
```

**c) Commit, push to main** — Netlify auto-deploys from `netlify.toml` config.

Netlify config reference:
```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "frontend/dist"
```

---

## Example Workflow

### Complete user journey

```
1. Navigate to https://<your-site>.netlify.app

2. Click "Register" → fill name, email, password
   POST /api/auth/register → receive JWT token

3. Fill loan application:
   - Loan Amount:      ₹2,50,000
   - Annual Income:    ₹8,00,000
   - Credit Score:     720
   - Employment:       Salaried
   - Loan Term:        60 months
   - Existing Debt:    ₹50,000

4. Click "Check Eligibility"
   POST /api/loans/apply → Spring Boot → FastAPI XGBoost → result

5. See result card:
   ✅ APPROVED  —  Confidence: 89%

6. Click "View History" to see all past applications
   GET /api/loans/history
```

---

## Testing

```bash
# Backend — JUnit
cd backend
./mvnw test
# Result: 34 tests, 0 failures

# ML Service — pytest
cd ml-service
pytest
# Result: 43 tests, 0 failures
```

Test coverage includes:
- Backend: controller layer, service layer, JWT filter, ML client
- ML service: feature preprocessing, model inference, edge cases, API contract

---

## Security

- **JWT (stateless):** All `/api/loans/**` endpoints require `Authorization: Bearer <token>`
- **CORS:** Only Netlify production URL + localhost:5173 are allowed
- **Password hashing:** BCrypt via Spring Security
- **No ML service auth:** The FastAPI service is internal-only; Spring Boot is the only caller. On Render, it is not exposed to the public internet unless you explicitly open it.
- **Secrets management:** All credentials are injected via environment variables — no secrets are committed to the repo

---

## License

MIT — see [LICENSE](LICENSE)

---

*Built by [Parth152-create](https://github.com/Parth152-create)*
