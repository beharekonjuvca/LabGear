# LabGear – Equipment Lending System

A full-stack app for managing items, reservations, and loans.

## Stack

- **Frontend:** React + Ant Design + Tailwind (Vite)
- **Backend:** Node.js (Express) + Prisma
- **Auth:** JWT access token + HttpOnly refresh cookie
- **DB:** MySQL (Prisma Migrate)
- **Upload:** Multer (local `/uploads`), public via Express static

## Quick start

### 1 Server

```bash
cd server
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

2. Client
   cd client
   cp .env.example .env # VITE_API_ORIGIN=http://localhost:4000
   npm install
   npm run dev

Server: http://localhost:4000

Client: http://localhost:5173

Roles

ADMIN/STAFF: manage items, approve/cancel reservations, manage loans

MEMBER: browse items, create reservations, view own reservations

Folder structure
server/
src/
routes/ (auth, items, reservations, loans, users, upload)
middleware/ (auth, roles)
utils/ (jwt, validators)
prisma.js
prisma/ (schema.prisma, migrations, seed.js)
uploads/ (images)
client/
src/
pages/ (Dashboard, Items, Reservations, Loans, Browse, Profile, Login, Register)
api/ (axios instance, items, reservations, loans, auth)
components/ (Layout, KPI, etc.)

Env

# server/.env

DATABASE_URL="mysql://user:pass@localhost:3306/labgear"
JWT_SECRET="dev_jwt"
REFRESH_SECRET="dev_refresh"
ACCESS_TTL="15m"
REFRESH_TTL="7d"
CORS_ORIGIN="http://localhost:5173"

# client/.env

VITE_API_ORIGIN="http://localhost:4000"

API (summary)
Auth

POST /api/auth/register { email, password, full_name }

POST /api/auth/login { email, password } → { accessToken, user } + sets rt cookie

POST /api/auth/refresh → { accessToken } (uses HttpOnly cookie)

POST /api/auth/logout clears cookie

Items (ADMIN/STAFF for write)

GET /api/items?search=&page=&limit=&category=&available=

GET /api/items/:id

POST /api/items (multipart: imageFile or body image_url)

PUT /api/items/:id (multipart optional)

DELETE /api/items/:id

GET /api/items/:id/availability?from=&to=

Reservations

GET /api/reservations?status=&from=&to=&q=&page=&limit=

MEMBER → own; STAFF/ADMIN → all

POST /api/reservations { item_id, start_date, end_date }

POST /api/reservations/:id/approve (STAFF/ADMIN)

POST /api/reservations/:id/cancel (STAFF/ADMIN or owner if allowed)

Loans (STAFF/ADMIN)

GET /api/loans?status=&from=&to=&q=&page=&limit=

POST /api/loans { reservation_id, due_at } (converts approved reservation)

POST /api/loans/:id/return

Uploads

Static files served at GET /uploads/...

Security

Bearer access token in Authorization header.

HttpOnly refresh cookie with rotation.

Role-based guards for admin/staff endpoints.

Database design

Entities: User, Item, Reservation, Loan, RefreshToken, Label (many-to-many via ItemLabel)

Key constraints & indexes: unique codes, indexes for filters and date ranges

See prisma/schema.prisma

Scripts

server: npm run dev, npm run db:seed

client: npm run dev, npm run build, npm run preview

Screenshots

Dashboard KPIs

Browse (cards + availability)

Items CRUD (with image)

Reservations & Loans (filters, pagination)

Profile (edit)

Notes

Responsive tables & forms

Conflict detection for reservations and loans

Basic input validation (backend & frontend)
