# Real Estate CRM Backend

NestJS + Prisma + PostgreSQL backend for Real Estate CRM & Matching Platform.

## Tech Stack

- **Framework:** NestJS 11
- **ORM:** Prisma 7
- **Database:** PostgreSQL 15+
- **Auth:** JWT (passport-jwt)
- **Validation:** class-validator
- **API Docs:** Swagger

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy example env
cp .env.example .env

# Edit .env with your database credentials
```

**.env example:**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/realestate_crm?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Run Database Migrations

```bash
# Create database first in PostgreSQL
# CREATE DATABASE realestate_crm;

# Run migrations
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run start:dev
```

Server will be running at: http://localhost:3000

Swagger docs available at: http://localhost:3000/docs

## Project Structure

```
backend/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── prisma/                 # Prisma service
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── auth/                   # Authentication
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── guards/
│   │   └── strategies/
│   ├── listings/               # Listings CRUD
│   │   ├── listings.module.ts
│   │   ├── listings.controller.ts
│   │   ├── listings.service.ts
│   │   └── dto/
│   ├── contacts/               # CRM Contacts
│   │   ├── contacts.module.ts
│   │   ├── contacts.controller.ts
│   │   ├── contacts.service.ts
│   │   └── dto/
│   ├── search-requests/        # Search requests + Matching
│   │   ├── search-requests.module.ts
│   │   ├── search-requests.controller.ts
│   │   ├── search-requests.service.ts
│   │   ├── matching.service.ts
│   │   └── dto/
│   ├── activities/             # CRM Activities
│   │   ├── activities.module.ts
│   │   ├── activities.controller.ts
│   │   ├── activities.service.ts
│   │   └── dto/
│   └── common/                 # Shared utilities
│       ├── decorators/
│       ├── filters/
│       └── dto/
├── prisma/                     # (uses ../prisma/schema.prisma)
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.example
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in development mode (hot reload) |
| `npm run start:debug` | Start with debugger |
| `npm run build` | Build for production |
| `npm run start:prod` | Start production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio |

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Listings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/listings` | Create listing |
| GET | `/api/listings` | List with filters |
| GET | `/api/listings/:id` | Get by ID |
| PATCH | `/api/listings/:id` | Update |
| DELETE | `/api/listings/:id` | Soft delete |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/contacts` | Create contact |
| GET | `/api/contacts` | List contacts |
| GET | `/api/contacts/:id` | Get by ID |
| PATCH | `/api/contacts/:id` | Update |
| DELETE | `/api/contacts/:id` | Soft delete |

### Search Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search-requests` | Create search request |
| GET | `/api/search-requests` | List requests |
| GET | `/api/search-requests/:id` | Get by ID with matches |
| POST | `/api/search-requests/:id/match` | Run matching |

### Activities
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/activities` | Create activity |
| GET | `/api/activities` | List activities |

## Listing Filters

Available query parameters for `GET /api/listings`:

| Parameter | Type | Example |
|-----------|------|---------|
| `page` | number | `1` |
| `limit` | number | `20` |
| `listingType` | enum | `sale`, `rent` |
| `propertyType` | enum | `apartment`, `villa`, etc. |
| `status` | enum | `active`, `draft`, etc. |
| `city` | string | `İstanbul` |
| `district` | string | `Kadıköy` |
| `neighborhood` | string | `Moda` |
| `minPrice` | number | `1000000` |
| `maxPrice` | number | `5000000` |
| `minSqm` | number | `80` |
| `maxSqm` | number | `200` |
| `roomCount` | string | `3+1` |
| `furnished` | boolean | `true` |

## Match Score Breakdown

When running `/api/search-requests/:id/match`, response includes:

```json
{
  "scoreBreakdown": {
    "location_match": 100,  // 30% weight
    "price_match": 85,      // 25% weight
    "size_match": 90,       // 20% weight
    "room_match": 100,      // 15% weight
    "features_match": 70,   // 10% weight
    "total": 89
  }
}
```

## Error Response Format

```json
{
  "errorCode": "VALIDATION_ERROR",
  "message": "Validation failed",
  "details": ["field must be a valid value"]
}
```

## Authorization

All endpoints except `/auth/register` and `/auth/login` require JWT token:

```
Authorization: Bearer <token>
```

Users can only access their own resources (listings, contacts, etc.).

## Development Notes

- Prisma schema is at `../prisma/schema.prisma` (project root)
- Soft delete is implemented using `deletedAt` field
- All timestamps are in UTC (TIMESTAMPTZ)
- UUIDs are used for all primary keys
