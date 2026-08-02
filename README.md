# MyOwnExpense Backend

Production-ready Express + MongoDB (Atlas) backend for a personal expense tracker: user auth, multiple debit/credit accounts per user, and transactions linked to accounts with automatic balance updates.

## Folder structure

```
MyOwnExpense/
├── src/
│   ├── config/
│   │   ├── env.js              # loads & validates environment variables
│   │   └── db.js                # Mongoose/MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js               # name, email, hashed password
│   │   ├── Account.js            # per-user debit/credit accounts + balance/credit fields
│   │   └── Transaction.js        # income/expense entries linked to an account (userId, accountId, amount, category, type, date)
│   ├── controllers/
│   │   ├── auth.controller.js         # signup, login, refresh, me
│   │   ├── account.controller.js      # account CRUD
│   │   └── transaction.controller.js  # transaction CRUD + balance sync
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── account.routes.js
│   │   ├── transaction.routes.js
│   │   └── index.js              # mounts all routes under /api/v1
│   ├── middleware/
│   │   ├── auth.js               # verifies JWT access token
│   │   └── errorHandler.js       # centralized error + 404 handling
│   ├── utils/
│   │   ├── ApiError.js           # typed HTTP error class
│   │   └── token.js              # sign/verify access & refresh JWTs
│   ├── app.js                    # Express app (middleware + routes)
│   └── server.js                 # entry point: connects DB, starts server
├── .env.example
├── .gitignore
└── package.json
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in real values (MongoDB Atlas URI, JWT secrets).
3. Run in development (auto-restart):
   ```bash
   npm run dev
   ```
4. Run in production:
   ```bash
   npm start
   ```

## Environment variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | Port the server listens on |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (must differ from access secret) |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `7d` |
| `CLIENT_ORIGIN` | Allowed CORS origin for your frontend |

## Architecture notes

- **Layering**: routes → middleware (auth) → controllers → models. Controllers contain business logic; models contain schema/validation/hooks only.
- **Auth**: stateless JWT. Access tokens are short-lived and sent as `Authorization: Bearer <token>`; refresh tokens are long-lived and exchanged via `POST /api/v1/auth/refresh`. Passwords are hashed with bcryptjs (12 salt rounds) in a pre-save hook, and `password` is never returned (`select: false` + `toJSON` override).
- **Balance integrity**: creating, updating, or deleting a transaction updates the linked account's `balance` inside a MongoDB session transaction (`session.withTransaction`), so the transaction record and the account balance never drift apart even if a write fails midway. This requires MongoDB Atlas (or any replica set) — Atlas clusters support this by default.
- **Error handling**: controllers throw `ApiError` (or let Mongoose errors bubble up); `express-async-errors` forwards rejected promises to the centralized `errorHandler`, which normalizes Mongoose `ValidationError`/`CastError`/duplicate-key errors into consistent JSON responses.
- **Security**: `helmet` for HTTP headers, `cors` scoped to `CLIENT_ORIGIN`, `express-rate-limit` on auth endpoints, request body size capped at 10kb, no secrets logged.

## API Routes

Base URL: `/api/v1`

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Liveness check |

### Auth (`/auth`)
| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/signup` | No | `{ name, email, password }` | Create a user, returns user + tokens |
| POST | `/auth/login` | No | `{ email, password }` | Returns user + tokens |
| POST | `/auth/refresh` | No | `{ refreshToken }` | Returns a new token pair |
| GET | `/auth/me` | Yes | — | Returns the authenticated user |

### Accounts (`/accounts`) — all routes require `Authorization: Bearer <accessToken>`
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/accounts` | `{ name, type, balance?, creditLimit?, billingCycleDate?, dueDate? }` | Create an account (`type`: `debit` \| `credit`; `billingCycleDate`/`dueDate` are day-of-month integers 1-31, relevant for credit accounts) |
| GET | `/accounts` | — | List the current user's accounts |
| GET | `/accounts/:id` | — | Get one account |
| PATCH | `/accounts/:id` | `{ name?, creditLimit?, billingCycleDate?, dueDate? }` | Update account metadata |
| DELETE | `/accounts/:id` | — | Delete an account (blocked if it has transactions) |

### Transactions (`/transactions`) — all routes require `Authorization: Bearer <accessToken>`
| Method | Path | Body / Query | Description |
|---|---|---|---|
| POST | `/transactions` | `{ accountId, type, amount, category?, date? }` | Create a transaction (`type`: `income` \| `expense`); updates the account balance atomically |
| GET | `/transactions` | query: `accountId?, type?, category?, from?, to?, page?, limit?` | List/filter/paginate the current user's transactions |
| GET | `/transactions/:id` | — | Get one transaction |
| PATCH | `/transactions/:id` | `{ type?, amount?, category?, date? }` | Update a transaction; reconciles the account balance |
| DELETE | `/transactions/:id` | — | Delete a transaction; reverses its effect on the account balance |

### Example requests

```bash
# Signup
curl -X POST http://localhost:5000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"supersecret1"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"supersecret1"}'

# Create an account (use the accessToken from login/signup)
curl -X POST http://localhost:5000/api/v1/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"name":"Main Checking","type":"debit","balance":1000}'

# Create a transaction
curl -X POST http://localhost:5000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"accountId":"<accountId>","type":"expense","amount":42.5,"category":"groceries"}'
```

## Notes for production deployment

- Set strong, random values for `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (e.g. `openssl rand -hex 64`).
- Restrict `CLIENT_ORIGIN` to your real frontend domain(s).
- Put the app behind HTTPS (e.g. a reverse proxy or platform-managed TLS) — `helmet` assumes it.
- Consider adding structured logging/monitoring (e.g. pino + a log aggregator) before scaling past a single instance.
