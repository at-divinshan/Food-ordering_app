from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, text

from app.database import Base


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False, default="Pending")
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
