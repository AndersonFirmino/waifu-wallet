from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from models import GachaBanner
from schemas import GachaBannerCreate, GachaBannerOut, PullsUpdate

router = APIRouter(prefix="/gacha", tags=["gacha"])


@router.get("/banners", response_model=list[GachaBannerOut])
def list_banners(db: Session = Depends(get_db)) -> list[GachaBanner]:
    return list(db.scalars(select(GachaBanner).order_by(GachaBanner.priority)).all())


@router.post("/banners", response_model=GachaBannerOut, status_code=201)
def create_banner(body: GachaBannerCreate, db: Session = Depends(get_db)) -> GachaBanner:
    banner = GachaBanner(**body.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


@router.put("/banners/{banner_id}", response_model=GachaBannerOut)
def update_banner(
    banner_id: int,
    body: GachaBannerCreate,
    db: Session = Depends(get_db),
) -> GachaBanner:
    banner = db.get(GachaBanner, banner_id)
    if banner is None:
        raise HTTPException(status_code=404, detail="Banner not found")
    for field, value in body.model_dump().items():
        setattr(banner, field, value)
    db.commit()
    db.refresh(banner)
    return banner


@router.patch("/banners/{banner_id}/pulls", response_model=GachaBannerOut)
def update_pulls(
    banner_id: int,
    body: PullsUpdate,
    db: Session = Depends(get_db),
) -> GachaBanner:
    banner = db.get(GachaBanner, banner_id)
    if banner is None:
        raise HTTPException(status_code=404, detail="Banner not found")
    banner.pulls = body.pulls
    db.commit()
    db.refresh(banner)
    return banner


@router.delete("/banners/{banner_id}", status_code=204)
def delete_banner(banner_id: int, db: Session = Depends(get_db)) -> None:
    banner = db.get(GachaBanner, banner_id)
    if banner is None:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(banner)
    db.commit()
