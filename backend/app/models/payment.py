import uuid
from sqlalchemy import ForeignKey, String, Integer, DateTime, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.lesson_progress import LessonProgress

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        UniqueConstraint("external_reference", name="uq_payment_external_reference"),
        UniqueConstraint("mp_payment_id", name="uq_payment_mp_payment_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True, nullable=False)
    course_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("courses.id"), index=True, nullable=False)

    provider: Mapped[str] = mapped_column(String(30), default="mercadopago", nullable=False)

    external_reference: Mapped[str] = mapped_column(String(80), nullable=False)
    mp_preference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    mp_payment_id: Mapped[str | None] = mapped_column(String(120), nullable=True)

    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="BRL", nullable=False)

    created_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[object] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)