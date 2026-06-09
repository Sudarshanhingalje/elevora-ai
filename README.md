# Elevora AI

Elevora AI is a multi-tenant AI SaaS marketplace platform for the Indian market. The Phase 1 MVP includes Docker infrastructure, Spring Boot authentication, product marketplace APIs, Razorpay checkout, Docker deployment triggers, React marketplace pages, Dental AI chat, user dashboard, and admin dashboard.

## Prerequisites

- Docker Desktop
- Java 17
- Node 18 or newer

## Setup

1. Clone the project and enter the folder.

```powershell
cd D:\elevora_projects\elevora-ai\elevora-ai-main
```

2. Create your local environment file.

```powershell
Copy-Item .env.example .env
```

3. Edit `.env` and set real local secrets for database, Redis, JWT, MinIO, Razorpay, Qdrant, n8n, Grafana, and mail.

4. Start infrastructure.

```powershell
docker compose up -d
```

5. Start the backend.

```powershell
cd backend
.\gradlew.bat bootRun
```

6. Start the frontend.

```powershell
cd ..\frontend
npm run dev
```

## Service URLs

| Service | URL / Port |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| MySQL | localhost:3307 |
| Redis | localhost:6379 |
| MinIO Console | http://localhost:9001 |
| Mailpit Inbox | http://localhost:8026 |
| n8n | http://localhost:5678 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |
| Qdrant | http://localhost:6333 |
| Ollama | http://localhost:11434 |

## Environment Variables

| Variable | Required | Secret | Purpose |
| --- | --- | --- | --- |
| `DB_HOST` | Yes | No | MySQL host |
| `MYSQL_PORT` | Yes | No | Local MySQL port, default `3307` |
| `DB_NAME` | Yes | No | Application database |
| `DB_USERNAME` | Yes | No | Application DB user |
| `DB_PASSWORD` | Yes | Yes | Application DB password |
| `DB_ROOT_PASSWORD` | Yes | Yes | MySQL root password |
| `REDIS_HOST` | Yes | No | Redis host |
| `REDIS_PORT` | Yes | No | Redis port |
| `REDIS_PASSWORD` | Yes | Yes | Redis password |
| `JWT_SECRET` | Yes | Yes | 64+ byte JWT signing secret |
| `JWT_EXPIRY` | Yes | No | Access token expiry seconds |
| `JWT_REFRESH_EXPIRY` | Yes | No | Refresh token expiry seconds |
| `RAZORPAY_KEY_ID` | Yes | Yes | Razorpay key id |
| `RAZORPAY_SECRET` | Yes | Yes | Razorpay API secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Yes | Razorpay webhook secret |
| `MINIO_ROOT_USER` | Yes | Yes | MinIO root user |
| `MINIO_ROOT_PASSWORD` | Yes | Yes | MinIO root password |
| `MINIO_ACCESS_KEY` | Yes | Yes | MinIO application access key |
| `OLLAMA_HOST` | Yes | No | Ollama base URL |
| `QDRANT_API_KEY` | Yes | Yes | Qdrant API key |
| `CORS_ALLOWED_ORIGINS` | Yes | No | Allowed browser origins |
| `MAIL_HOST` | Yes | No | SMTP host |
| `MAIL_PORT` | Yes | No | SMTP port |
| `MAIL_SMTP_PORT` | Yes | No | Local Mailpit SMTP mapped port |
| `MAIL_WEB_PORT` | Yes | No | Local Mailpit inbox mapped port |
| `MAIL_SMTP_AUTH` | Yes | No | Enable SMTP authentication in production |
| `MAIL_STARTTLS` | Yes | No | Enable SMTP STARTTLS in production |
| `MAIL_USERNAME` | Yes | Yes | SMTP username |
| `MAIL_PASSWORD` | Yes | Yes | SMTP password |
| `N8N_ENCRYPTION_KEY` | Yes | Yes | n8n credential encryption key |
| `GRAFANA_ADMIN_PASSWORD` | Yes | Yes | Grafana admin password |



<img width="2611" height="2536" alt="db" src="https://github.com/user-attachments/assets/0cead333-c028-4932-b281-a9374be0c434" />
[database_schmena.pdf](https://github.com/user-attachments/files/28737482/database_schmena.pdf)


## Security Rules

- Store JWT only in HTTP-only cookies.
- Never use `localStorage` or `sessionStorage` for tokens.
- Store passwords only as bcrypt hashes with cost factor 12.
- Keep every tenant-owned query filtered by `tenant_id`.
- Keep real `.env` files out of Git.
- Allow CORS only for `https://elevora.ai` and `http://localhost:3000`.
- Enforce rate limiting with Redis and Nginx.
- Block `.env` and hidden files at Nginx.

## Phase 1 Done Criteria

Phase 1 is complete when all of these are true:

- Docker services are healthy, including Mailpit for local OTP email testing.
- Backend runs on port `8080`.
- Frontend runs on port `3000`.
- Login and signup work with HTTP-only JWT cookies.
- One product is purchasable.
- Payment success triggers deployment.
- Deployment stores container id and subdomain.
- User dashboard shows orders and deployments.
- Admin dashboard shows tenants, revenue, deployments, recent orders, and Grafana.

## Verification Commands

```powershell
cd backend
.\gradlew.bat test --no-daemon
.\gradlew.bat bootRun
```

```powershell
cd frontend
npm run build
npm audit --omit=dev
```
