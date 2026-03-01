from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models import Tenant, User
from app.schemas.billing import BillingSettingsUpdate
from app.core.deps import admin_required  # ajuste se seu import for diferente

router = APIRouter(prefix="/admin/billing", tags=["admin-billing"])


@router.put("/settings")
def update_billing_settings(
    payload: BillingSettingsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required),
):
    if payload.mp_env not in ("sandbox", "production"):
        raise HTTPException(status_code=400, detail="mp_env inválido")

    tenant = db.query(Tenant).filter(Tenant.id == admin.tenant_id).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")

    tenant.mp_access_token = payload.mp_access_token.strip()
    tenant.mp_env = payload.mp_env

    db.commit()

    return {
        "mp_env": tenant.mp_env,
        "has_mp_access_token": bool(tenant.mp_access_token),
    }