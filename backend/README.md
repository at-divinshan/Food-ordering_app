# Foodie API

Run commands from `backend/`. Configuration is read from `backend/.env` regardless of the current working directory. The supplied local configuration points to `food_ordering_db` using `food_user` on localhost:3306. Password characters are safely handled through SQLAlchemy's `URL.create`.

```bash
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive OpenAPI: http://127.0.0.1:8000/docs

All routes below start with `/api`. Protected endpoints require `Authorization: Bearer <access_token>`.

| Resource | Endpoints | Access |
| --- | --- | --- |
| Health | `GET /health` | Public; checks MySQL |
| Authentication | `POST /auth/register`, `POST /auth/login` | Public |
| Current user | `GET /auth/me` | Signed in |
| Categories | `GET /categories`, `GET /categories/{id}` | Public |
| Category management | `POST /categories`, `PUT /categories/{id}`, `DELETE /categories/{id}` | Admin |
| Foods | `GET /foods`, `GET /foods/{id}` | Public |
| Food management | `POST /foods`, `PUT /foods/{id}`, `DELETE /foods/{id}` | Admin |
| Customer profile | `GET /customers/me`, `PUT /customers/me` | Customer |
| Customer directory | `GET /customers`, `GET /customers/{id}` | Admin |
| Place order | `POST /orders` | Customer |
| My Orders | `GET /orders/mine` | Customer; own orders only |
| Order details | `GET /orders/{id}` | Owner or admin |
| Order management | `GET /orders`, `PATCH /orders/{id}/status` | Admin |
| Users | `GET /users`, `PATCH /users/{id}` | Admin |
| Dashboard/statistics | `GET /dashboard` | Admin |

`GET /foods` supports `search`, `category_id`, `is_available`, `min_price`, `max_price`, `sort`, `page`, and `page_size`. Sort values: `popular`, `newest`, `name`, `price_asc`, `price_desc`. Paginated endpoints return `{items, total, page, page_size}`. Page sizes are bounded to 100. Order lists accept `status`; admin order lists also accept a customer name or numeric order ID in `search`. Users support name/email search.

Registration body:

```json
{"name":"Customer Name","email":"customer@example.com","password":"your-password"}
```

Login body:

```json
{"email":"customer@example.com","password":"your-password"}
```

Both return `{access_token, token_type, user}`. Registration cannot set roles. User responses never include password hashes.

Order creation body (food IDs must exist and be available):

```json
{
  "customer": {"name":"Customer Name","phone":"0771234567","address":"123 Main Street, Jaffna"},
  "items": [{"food_id":1,"quantity":2}]
}
```

Prices, subtotals, customer IDs, and totals are not accepted from clients. Quantities must be integers from 1 to 99, including aggregated duplicate items. Updating a customer's profile and placing their order share one transaction. A failed order rolls back both. Status update body is `{"status":"Preparing"}`. User update body is `{"is_active":false}`.

Validation errors return 422, missing authentication 401, forbidden access 403, missing resources 404, uniqueness/reference/status conflicts 409, and unavailable database connections 503. Unauthorized order IDs return 404 to avoid exposing another customer's orders.

No schema creation or migration code runs at startup. `app.seed_admin` only inserts the requested default administrator if it does not exist. For setup and schema limitations, see the root README.
