# Elevora AI Mobile

Expo app for Month 4 Week 13 and Week 14.

## Run

```bash
cd mobile
npm install
npm run start
```

The app uses the backend API at `http://localhost:8080`, configured in `app.json`.

## Screens

- Login
- Signup with OTP verification
- Marketplace listing
- Product detail

Authentication requests are sent to the Spring Boot backend. The web app remains the primary purchase and HTTP-only cookie flow; the mobile app is prepared for native token/session hardening in Week 15.
