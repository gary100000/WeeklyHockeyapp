# Weekly Hockey App

Production-oriented MVP scaffold for one recreational hockey team.

## Stack
Next.js, TypeScript, PostgreSQL, Prisma, Twilio.

## Setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Fill in PostgreSQL and Twilio credentials.
4. Run `npm install`.
5. Run `npx prisma migrate dev --name init`.
6. Run `npm run dev`.
7. Configure Twilio's incoming SMS webhook to:
   `/api/twilio/webhook`

## Important
Before production deployment, add a real admin authentication provider, Twilio signature validation, rate limiting, scheduled reminder/deadline jobs, audit logging, and managed database backups.

The substitute engine intentionally contacts only one substitute at a time and waits for the response before moving to the next.
