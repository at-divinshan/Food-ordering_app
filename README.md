# Foodie — Food Ordering System

FastAPI + SQLAlchemy + PyMySQL backend, connected to the React/Vite frontend in the existing project folders. The yellow/white customer interface and dark admin sidebar follow the supplied reference. The original source files were empty; they have been implemented in place.

## Start the application

Requirements: Python 3.12+, Node.js 20.19+ (or 22.12+), and the existing MySQL `food_ordering_db` database.

Backend, in one terminal:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# .env is already configured locally. For another machine, copy .env.example to .env and fill it in.
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Frontend, in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. API documentation: **http://127.0.0.1:8000/docs**.

Vite forwards `/api` to FastAPI on port 8000. `frontend/.env.example` describes the optional `VITE_API_URL` override. CORS permits `http://localhost:5173`.

## Accounts

The default administrator has been created in the existing `users` table:

- Email: `admin@foodorder.com`
- Password: `Admin@12345`

The database stores an Argon2 hash, never the plaintext password. For setup on another database with the same existing schema, run this once from `backend`:

```bash
ADMIN_PASSWORD='Admin@12345' .venv/bin/python -m app.seed_admin
```

The command leaves an existing administrator's password unchanged. Customer registration always creates a `customer` user and its linked customer profile in one transaction. Login uses the database; React has no hardcoded login check. JWTs expire after eight hours and are stored in browser session storage. Every protected request checks the current database user and active status. Disabling a customer immediately invalidates their access.

## Flows

- Customer: register/login → browse/search/filter/sort foods → cart → checkout → confirmation/order details → My Orders.
- Admin: login → dashboard → categories/foods CRUD → orders/status management → customers/users → statistics.
- Guests can browse and build a cart. Their cart transfers to their customer account on login. Account carts are stored separately in local storage.
- Admins can activate/deactivate customer accounts. Administrator accounts cannot be disabled from this screen.
- Food/category deletes return a conflict when existing records reference them. Mark ordered foods unavailable instead of deleting order history.
- Order status transitions: Pending → Preparing → Out for Delivery → Delivered. Pending and Preparing orders can be cancelled. Delivered and Cancelled are terminal.

## Existing database preserved

The models match the inspected `categories`, `foods`, `customers`, `orders`, `order_items`, and `users` tables. The application does **not** run migrations, `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, or `create_all`. No sample menu/customer/order rows are seeded into your database. Use the admin forms to add categories and foods if the catalog is empty.

Orders lock food rows, read current prices/availability, calculate item subtotals and the order total with decimal arithmetic, and save the order and all items atomically. Client-supplied prices/totals are rejected. Historical unit prices and subtotals are stored in `order_items`.

The existing schema has no delivery-fee, delivery-type, delivery-note, or historical address columns. Checkout therefore uses home delivery with no additional fee; total equals the sum of item subtotals. Contact/address information is stored on the customer profile, and order details display that **current** profile. Changing a customer's address changes the contact information shown on their older orders; historical address snapshots would require a separately authorized schema change.

Revenue means **delivered orders only**. Dashboard popular foods count quantities on non-cancelled orders. Order charts show the last seven dates with recorded orders.

Hero/login photos and fonts load from Unsplash and Google Fonts; food images use the URLs stored in MySQL, with a fallback when absent/unavailable. No paid services are required.

## Verification

```bash
# Frontend build and component integration tests
cd frontend
npm run build
npm test

# Backend integration tests, from backend/
MYSQL_INTEGRATION=1 .venv/bin/python -m pytest -q
```

Backend tests use the **existing** MySQL schema, savepoints, and an outer rollback. They do not create/drop tables, and test records are not retained (MySQL auto-increment counters can advance). Tests cover authentication/role restrictions, order ownership and totals, invalid-order rollback, state transitions, catalog CRUD and filters, and account deactivation.

The local `.env` contains the supplied database connection and a generated JWT signing secret; it is excluded by `.gitignore`. See `backend/README.md` for API details.
