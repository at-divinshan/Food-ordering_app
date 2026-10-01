import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError

from app.database import engine, settings
from app.routers import auth, categories, customers, dashboard, foods, orders, users

app = FastAPI(title="Foodie API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
for module in (auth, categories, foods, customers, orders, users, dashboard):
    app.include_router(module.router, prefix="/api")


@app.exception_handler(IntegrityError)
async def integrity_error(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={
            "detail": "This record already exists or is referenced by other records. Remove dependencies or mark the food unavailable."
        },
    )


@app.exception_handler(OperationalError)
async def database_unavailable(request: Request, exc: OperationalError):
    logging.getLogger(__name__).error("Database connection or operation failed")
    return JSONResponse(
        status_code=503,
        content={"detail": "Database temporarily unavailable. Please try again."},
    )


@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, exc: SQLAlchemyError):
    logging.getLogger(__name__).exception("Database request failed: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Unable to complete this database request."},
    )


@app.get("/api/health")
def health():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "ok"}
##vanakkam