from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

_OLD_DB_PATH = "./meucaixa.db"
_DB_PATH = "./waifu_wallet.db"


def _migrate_old_db() -> None:
    """Migrate old meucaixa.db → waifu_wallet.db.

    Handles three scenarios:
    1. Old exists, new doesn't → rename
    2. Old exists, new exists but empty → remove empty, rename
    3. Old exists, new has data → skip (already migrated)
    """
    if not os.path.exists(_OLD_DB_PATH):
        return

    if not os.path.exists(_DB_PATH):
        try:
            os.rename(_OLD_DB_PATH, _DB_PATH)
        except OSError:
            pass
        return

    # Both files exist — check if new DB is empty (only schema, no user data)
    old_size = os.path.getsize(_OLD_DB_PATH)
    new_size = os.path.getsize(_DB_PATH)
    if old_size > new_size:
        # New DB is likely just schema; replace with old one that has data
        try:
            os.remove(_DB_PATH)
            os.rename(_OLD_DB_PATH, _DB_PATH)
        except OSError:
            pass


_migrate_old_db()

DATABASE_URL = f"sqlite:///{_DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
