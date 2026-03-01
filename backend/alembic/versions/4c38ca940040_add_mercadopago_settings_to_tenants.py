"""add mercadopago settings to tenants

Revision ID: 4c38ca940040
Revises: f7aa3fb4af90
Create Date: 2026-03-01 08:13:02.955376

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c38ca940040'
down_revision: Union[str, Sequence[str], None] = 'f7aa3fb4af90'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("tenants", sa.Column("mp_access_token", sa.String(255), nullable=True))
    op.add_column("tenants", sa.Column("mp_env", sa.String(20), server_default="sandbox", nullable=False))

def downgrade():
    op.drop_column("tenants", "mp_env")
    op.drop_column("tenants", "mp_access_token")