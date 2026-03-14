from __future__ import annotations

import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

_OLD_DB_PATH = "./meucaixa.db"
_DB_PATH = "./waifu_wallet.db"

# Auto-migrate old database file if it exists
if os.path.exists(_OLD_DB_PATH) and not os.path.exists(_DB_PATH):
    try:
        os.rename(_OLD_DB_PATH, _DB_PATH)
    except OSError:
        pass  # File locked by another process; migration will succeed on next startup

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
