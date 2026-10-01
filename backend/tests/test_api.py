"""Integration tests against existing MySQL tables; all test records are rolled back."""

import os
from decimal import Decimal
from uuid import uuid4

import pytest
from app.database import engine, get_db
from app.dependencies import create_token, hash_password
from app.main import app
from app.models import Category, Customer, Food, User
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

pytestmark = pytest.mark.skipif(
    os.environ.get("MYSQL_INTEGRATION") != "1",
    reason="Set MYSQL_INTEGRATION=1 to test the existing MySQL schema",
)


@pytest.fixture()
def env():
    connection = engine.connect()
    transaction = connection.begin()
    db = Session(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
    )
    tag = uuid4().hex[:12]
    admin = User(
        name="Test admin",
        email=f"a-{tag}@example.com",
        password_hash=hash_password("Testing@123"),
        role="admin",
    )
    customer = User(
        name="Test customer",
        email=f"c-{tag}@example.com",
        password_hash=hash_password("Testing@123"),
        role="customer",
    )
    other = User(
        name="Other customer",
        email=f"o-{tag}@example.com",
        password_hash=hash_password("Testing@123"),
        role="customer",
    )
    db.add_all([admin, customer, other])
    db.flush()
    db.add_all(
        [
            Customer(
                user_id=u.id,
                name=u.name,
                email=u.email,
                phone="0771234567",
                address="Test address",
            )
            for u in (customer, other)
        ]
    )
    category = Category(name=f"Test {tag}", description="Integration test")
    db.add(category)
    db.flush()
    food = Food(
        name=f"Test food {tag}",
        price=Decimal("123.45"),
        category_id=category.id,
        is_available=True,
    )
    db.add(food)
    db.commit()

    def override():
        try:
            yield db
        except Exception:
            db.rollback()
            raise

    app.dependency_overrides[get_db] = override
    with TestClient(app) as client:
        yield client, db, admin, customer, other, food
    app.dependency_overrides.clear()
    db.close()
    transaction.rollback()
    connection.close()


def headers(user):
    return {"Authorization": f"Bearer {create_token(user)}"}


def payload(food):
    return {
        "customer": {
            "name": "Customer Name",
            "phone": "0771234567",
            "address": "123 Test Street",
        },
        "items": [{"food_id": food.id, "quantity": 2}],
    }


def test_register_login_and_role_protection(env):
    client, db, admin, customer, other, food = env
    email = f"register-{uuid4().hex}@example.com"
    result = client.post(
        "/api/auth/register",
        json={"name": "New Customer", "email": email, "password": "Strong@123"},
    )
    assert result.status_code == 201, result.text
    token = result.json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}
    assert result.json()["user"]["role"] == "customer"
    stored = db.scalar(select(User).where(User.email == email))
    assert stored.password_hash.startswith("$argon2")
    assert client.get("/api/customers/me", headers=auth).json()["user_id"] == stored.id
    assert (
        client.post(
            "/api/auth/login", json={"email": email, "password": "Strong@123"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": email, "password": "wrong"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/register",
            json={"name": "New Customer", "email": email, "password": "Strong@123"},
        ).status_code
        == 409
    )
    assert (
        client.post(
            "/api/auth/register",
            json={
                "name": "Exploit",
                "email": f"x-{email}",
                "password": "Strong@123",
                "role": "admin",
            },
        ).status_code
        == 422
    )
    for path in ("/api/dashboard", "/api/users", "/api/orders", "/api/customers"):
        assert client.get(path, headers=auth).status_code == 403
        assert client.get(path).status_code == 401
    assert client.get("/api/dashboard", headers=headers(admin)).status_code == 200
    assert (
        client.post(
            "/api/categories", headers=auth, json={"name": "Forbidden"}
        ).status_code
        == 403
    )
    assert (
        client.get(
            "/api/auth/me", headers={"Authorization": "Bearer invalid"}
        ).status_code
        == 401
    )


def test_order_total_ownership_and_status(env):
    client, db, admin, customer, other, food = env
    body = payload(food)
    # Duplicate food lines are aggregated, at the database price.
    body["items"].append({"food_id": food.id, "quantity": 1})
    response = client.post("/api/orders", headers=headers(customer), json=body)
    assert response.status_code == 201, response.text
    order = response.json()
    oid = order["id"]
    assert Decimal(str(order["total_amount"])) == Decimal("370.35")
    assert Decimal(str(order["subtotal"])) == Decimal("370.35")
    assert len(order["items"]) == 1 and order["items"][0]["quantity"] == 3
    assert client.get(f"/api/orders/{oid}", headers=headers(other)).status_code == 404
    assert client.get("/api/orders/mine", headers=headers(other)).json()["total"] == 0
    assert (
        client.get("/api/orders/mine", headers=headers(customer)).json()["items"][0][
            "id"
        ]
        == oid
    )
    assert (
        client.patch(
            f"/api/orders/{oid}/status",
            headers=headers(customer),
            json={"status": "Delivered"},
        ).status_code
        == 403
    )
    assert (
        client.patch(
            f"/api/orders/{oid}/status",
            headers=headers(admin),
            json={"status": "Delivered"},
        ).status_code
        == 409
    )
    for status in ("Preparing", "Out for Delivery", "Delivered"):
        assert (
            client.patch(
                f"/api/orders/{oid}/status",
                headers=headers(admin),
                json={"status": status},
            ).status_code
            == 200
        )
    assert (
        client.patch(
            f"/api/orders/{oid}/status",
            headers=headers(admin),
            json={"status": "Pending"},
        ).status_code
        == 409
    )
    # Price changes never rewrite the stored purchase price.
    food.price = Decimal("999.00")
    db.commit()
    assert Decimal(
        str(
            client.get(f"/api/orders/{oid}", headers=headers(customer)).json()[
                "total_amount"
            ]
        )
    ) == Decimal("370.35")
    assert (
        client.delete(f"/api/foods/{food.id}", headers=headers(admin)).status_code
        == 409
    )


def test_invalid_orders_are_atomic(env):
    client, db, admin, customer, other, food = env
    auth = headers(customer)
    body = payload(food)
    body["total_amount"] = 1
    assert client.post("/api/orders", headers=auth, json=body).status_code == 422
    body = payload(food)
    body["items"][0]["unit_price"] = 1
    assert client.post("/api/orders", headers=auth, json=body).status_code == 422
    for quantity in (0, -1, 100, 1.5, True):
        body = payload(food)
        body["items"][0]["quantity"] = quantity
        assert client.post("/api/orders", headers=auth, json=body).status_code == 422
    body = payload(food)
    body["items"] = []
    assert client.post("/api/orders", headers=auth, json=body).status_code == 422
    food.is_available = False
    db.commit()
    assert (
        client.post("/api/orders", headers=auth, json=payload(food)).status_code == 409
    )
    assert client.get("/api/orders/mine", headers=auth).json()["total"] == 0
    profile = client.get("/api/customers/me", headers=auth).json()
    assert (
        profile["name"] == "Test customer"
    )  # Profile update rolled back with rejected order.


def test_catalog_crud_filters_and_validation(env):
    client, db, admin, customer, other, food = env
    auth = headers(admin)
    category = client.post(
        "/api/categories", headers=auth, json={"name": f"CRUD {uuid4().hex}"}
    ).json()
    cid = category["id"]
    body = {
        "name": "Unique test meal " + uuid4().hex,
        "price": "20.50",
        "category_id": cid,
        "is_available": True,
    }
    response = client.post("/api/foods", headers=auth, json=body)
    assert response.status_code == 201, response.text
    fid = response.json()["id"]
    assert (
        client.get(
            "/api/foods",
            params={
                "search": body["name"],
                "category_id": cid,
                "min_price": 20,
                "max_price": 21,
                "is_available": True,
            },
        ).json()["total"]
        == 1
    )
    assert (
        client.get("/api/foods", params={"category_id": cid, "max_price": 10}).json()[
            "total"
        ]
        == 0
    )
    assert client.get("/api/foods", params={"page": 0}).status_code == 422
    assert (
        client.get("/api/foods", params={"sort": "price;DROP TABLE foods"}).status_code
        == 422
    )
    assert (
        client.get("/api/foods", params={"min_price": 30, "max_price": 10}).status_code
        == 422
    )
    body["price"] = "-1"
    assert client.put(f"/api/foods/{fid}", headers=auth, json=body).status_code == 422
    body["price"] = "21.00"
    body["is_available"] = False
    assert client.put(f"/api/foods/{fid}", headers=auth, json=body).status_code == 200
    assert client.delete(f"/api/foods/{fid}", headers=auth).status_code == 204
    assert client.delete(f"/api/categories/{cid}", headers=auth).status_code == 204


def test_disabled_users_and_customer_profile(env):
    client, db, admin, customer, other, food = env
    auth = headers(customer)
    assert (
        client.put(
            "/api/customers/me",
            headers=auth,
            json={
                "name": "Updated name",
                "phone": "0779876543",
                "address": "456 New Street",
            },
        ).status_code
        == 200
    )
    assert client.get("/api/auth/me", headers=auth).json()["name"] == "Updated name"
    assert (
        client.patch(
            f"/api/users/{customer.id}",
            headers=headers(admin),
            json={"is_active": False},
        ).status_code
        == 200
    )
    assert client.get("/api/orders/mine", headers=auth).status_code == 401
    assert (
        client.patch(
            f"/api/users/{admin.id}", headers=headers(admin), json={"is_active": False}
        ).status_code
        == 409
    )
    listing = client.get("/api/users", headers=headers(admin)).json()
    assert all("password_hash" not in user for user in listing["items"])
