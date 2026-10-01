from sqlalchemy import Boolean, Column, ForeignKey, Integer, Numeric, String

from app.database import Base


class Food(Base):
    __tablename__ = "foods"
    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    description = Column(String(255))
    price = Column(Numeric(10, 2), nullable=False)
    image = Column(String(255))
    is_available = Column(Boolean, default=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
