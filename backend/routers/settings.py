from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import AppSettings
from schemas import AppSettingsOut, AppSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_or_create_settings(db: Session) -> AppSettings:
    settings = db.scalars(select(AppSettings)).first()
    if settings is None:
        settings = AppSettings(manual_balance=0.0)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/", response_model=AppSettingsOut)
def get_settings(db: Session = Depends(get_db)) -> AppSettings:
    return _get_or_create_settings(db)


@router.patch("/", response_model=AppSettingsOut)
def update_settings(
    body: AppSettingsUpdate, db: Session = Depends(get_db)
) -> AppSettings:
    settings = _get_or_create_settings(db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(settings, field, value)
    db.commit()
    db.refresh(settings)
    return settings
