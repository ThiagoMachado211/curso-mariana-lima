"""add enrollments and payments

Revision ID: f7aa3fb4af90
Revises: fd08d339558c
Create Date: 2026-02-28 20:25:28.956079

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f7aa3fb4af90'
down_revision: Union[str, Sequence[str], None] = 'fd08d339558c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "courses",
        sa.Column("is_published", sa.Boolean(), server_default=sa.text("false"), nullable=False),
    )
    op.add_column(
        "courses",
        sa.Column("currency", sa.String(length=3), server_default="BRL", nullable=False),
    )

    op.create_table(
        "enrollments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("status", sa.String(20), server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("user_id", "course_id", name="uq_enrollment_user_course"),
    )

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("provider", sa.String(30), server_default="mercadopago", nullable=False),
        sa.Column("external_reference", sa.String(80), nullable=False),
        sa.Column("mp_preference_id", sa.String(120)),
        sa.Column("mp_payment_id", sa.String(120)),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), server_default="BRL", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.UniqueConstraint("external_reference", name="uq_payment_external_reference"),
        sa.UniqueConstraint("mp_payment_id", name="uq_payment_mp_payment_id"),
    )


def downgrade():
    op.drop_table("payments")
    op.drop_table("enrollments")
    op.drop_column("courses", "currency")
    op.drop_column("courses", "is_published")