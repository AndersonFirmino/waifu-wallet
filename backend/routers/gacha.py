from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from database import get_db
from models import GachaBanner, GachaBannerImage
from schemas import GachaBannerCreate, GachaBannerImageCreate, GachaBannerImageOut, GachaBannerOut, PullsUpdate

router = APIRouter(prefix="/gacha", tags=["gacha"])


@router.get("/banners", response_model=list[GachaBannerOut])
def list_banners(db: Session = Depends(get_db)) -> list[GachaBanner]:
    return list(
        db.scalars(
            select(GachaBanner)
            .options(joinedload(GachaBanner.images))
            .order_by(GachaBanner.priority)
        ).unique().all()
    )


@router.post("/banners", response_model=GachaBannerOut, status_code=201)
def create_banner(body: GachaBannerCreate, db: Session = Depends(get_db)) -> GachaBanner:
    banner = GachaBanner(**body.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    result = db.scalar(
        select(GachaBanner)
        .options(joinedload(GachaBanner.images))
        .where(GachaBanner.id == banner.id)
    )
    assert result is not None
    return result


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
    result = db.scalar(
        select(GachaBanner)
        .options(joinedload(GachaBanner.images))
        .where(GachaBanner.id == banner_id)
    )
    assert result is not None
    return result


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
    result = db.scalar(
        select(GachaBanner)
        .options(joinedload(GachaBanner.images))
        .where(GachaBanner.id == banner_id)
    )
    assert result is not None
    return result


@router.delete("/banners/{banner_id}", status_code=204)
def delete_banner(banner_id: int, db: Session = Depends(get_db)) -> None:
    banner = db.get(GachaBanner, banner_id)
    if banner is None:
        raise HTTPException(status_code=404, detail="Banner not found")
    db.delete(banner)
    db.commit()


@router.post("/banners/{banner_id}/images", response_model=GachaBannerImageOut, status_code=201)
def add_banner_image(
    banner_id: int,
    body: GachaBannerImageCreate,
    db: Session = Depends(get_db),
) -> GachaBannerImage:
    banner = db.get(GachaBanner, banner_id)
    if banner is None:
        raise HTTPException(status_code=404, detail="Banner not found")
    image = GachaBannerImage(banner_id=banner_id, **body.model_dump())
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.delete("/banners/{banner_id}/images/{image_id}", status_code=204)
def delete_banner_image(
    banner_id: int,
    image_id: int,
    db: Session = Depends(get_db),
) -> None:
    image = db.get(GachaBannerImage, image_id)
    if image is None or image.banner_id != banner_id:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(image)
    db.commit()
