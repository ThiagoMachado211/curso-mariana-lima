from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from dotenv import load_dotenv

# carrega backend/.env
load_dotenv()

config = context.config

database_url = os.getenv("DATABASE_URL")
if not database_url:
    raise RuntimeError("DATABASE_URL não encontrada. Confira backend/.env")

config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

from app.db.base_class import Base  # noqa: E402

# Importa models para registrar no metadata
from app.models.tenant import Tenant  # noqa: F401,E402
from app.models.user import User  # noqa: F401,E402
from app.models.course import Course  # noqa: F401,E402
from app.models.module import Module  # noqa: F401,E402
from app.models.lesson import Lesson  # noqa: F401,E402
from app.models.lesson_pdf import LessonPdf  # noqa: F401,E402
from app.models.enrollment import Enrollment  # noqa: F401,E402
from app.models.payment import Payment  # noqa: F401,E402
from app.models.password_reset_token import PasswordResetToken  # noqa: F401,E402
from app.models.lesson_progress import LessonProgress  # noqa: F401,E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()