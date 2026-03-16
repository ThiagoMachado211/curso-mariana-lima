from uuid import UUID
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.course import Course
from app.models.payment import Payment
from app.models.user import User
from app.models.tenant import Tenant

from app.core.deps import get_current_user


router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout/course/{course_id}")
def checkout_course(
    course_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):

    # Buscar curso
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Curso não encontrado")

    if hasattr(course, "is_active") and not course.is_active:
        raise HTTPException(status_code=400, detail="Curso inativo")

    # Buscar tenant do curso
    tenant = db.query(Tenant).filter(Tenant.id == course.tenant_id).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")

    if not tenant.mp_access_token:
        raise HTTPException(
            status_code=400,
            detail="Tenant sem token do Mercado Pago configurado"
        )

    # Criar pagamento
    payment_id = uuid.uuid4()
    external_reference = f"pay_{payment_id}"

    payment = Payment(
        id=payment_id,
        tenant_id=course.tenant_id,
        user_id=user.id,
        course_id=course.id,
        provider="mercadopago",
        external_reference=external_reference,
        status="pending",
        amount_cents=course.price_cents,
        currency="BRL",
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    # Criar preferência no Mercado Pago
    preference_payload = {
        "items": [
            {
                "id": str(course.id),
                "title": course.title,
                "quantity": 1,
                "currency_id": "BRL",
                "unit_price": course.price_cents / 100
            }
        ],
        "external_reference": payment.external_reference,

        "back_urls": {
            "success": "http://localhost:8000/payment/success",
            "failure": "http://localhost:8000/payment/failure",
            "pending": "http://localhost:8000/payment/pending"
        }
    }


    headers = {
        "Authorization": f"Bearer {tenant.mp_access_token}",
        "Content-Type": "application/json"
    }


    response = httpx.post(
        "https://api.mercadopago.com/checkout/preferences",
        json=preference_payload,
        headers=headers,
        timeout=30
    )

    if response.status_code not in (200, 201):
        raise HTTPException(
            status_code=502,
            detail=response.json()
        )

    preference_data = response.json()

    payment.mp_preference_id = preference_data.get("id")

    db.commit()
    db.refresh(payment)

    return {
        "payment_id": str(payment.id),
        "external_reference": payment.external_reference,
        "mp_preference_id": payment.mp_preference_id,
        "init_point": preference_data.get("init_point"),
        "sandbox_init_point": preference_data.get("sandbox_init_point"),
        "status": payment.status
    }