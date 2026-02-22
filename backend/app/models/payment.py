import uuid
from sqlalchemy import ForeignKey, String, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True, nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"), index=True, nullable=False)

    buyer_name: Mapped[str] = mapped_column(String(120), nullable=False)
    buyer_email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)

    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending | approved | rejected

    mp_preference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    mp_payment_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    external_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)  # normalmente = nosso Payment.id