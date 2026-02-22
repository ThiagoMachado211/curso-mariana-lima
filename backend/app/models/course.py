import uuid
from sqlalchemy import String, Text, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True, nullable=False)

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(120), index=True, nullable=False)  # ex: matematica-enem
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    price_cents: Mapped[int] = mapped_column(Integer, nullable=False)  # ex: 29700 = R$297,00
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)