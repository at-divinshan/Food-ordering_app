"""Create the requested admin once. Never alter schema or reset an existing account."""

import os

from sqlalchemy import select

from app.database import SessionLocal
from app.dependencies import hash_password
from app.models import User


def main():
    email = "admin@foodorder.com"
    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            if existing.role != "admin":
                raise RuntimeError(
                    "Email exists with a non-admin role; no changes made"
                )
            print("Administrator already exists; password unchanged.")
            return
        password = os.environ.get("ADMIN_PASSWORD")
        if not password or len(password) < 8:
            raise RuntimeError("Set ADMIN_PASSWORD with at least 8 characters")
        db.add(
            User(
                name="Admin",
                email=email,
                password_hash=hash_password(password),
                role="admin",
                is_active=True,
            )
        )
        db.commit()
        print("Administrator created with an Argon2 password hash.")


if __name__ == "__main__":
    main()
