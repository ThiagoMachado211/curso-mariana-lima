"""merge heads

Revision ID: f4a98c9e4c11
Revises: 9f2a7c1b4d11, e767d6abcf7c
Create Date: 2026-04-11 10:41:57.299347

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f4a98c9e4c11'
down_revision: Union[str, Sequence[str], None] = ('9f2a7c1b4d11', 'e767d6abcf7c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
