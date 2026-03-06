from fastapi import APIRouter, Request
import httpx

from app.db.session import SessionLocal
from app.models.payment import Payment
from app.models.tenant import Tenant
from app.models.enrollment import Enrollment

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/mercadopago")
async def mercadopago_webhook(request: Request):

    try:
        payload = await request.json()
    except:
        payload = {}

    print("Webhook recebido:", payload)

    if "data" not in payload:
        return {"status": "ignored"}

    mp_payment_id = payload["data"]["id"]

    db = SessionLocal()

    try:
        tenant = db.query(Tenant).first()

        if not tenant or not tenant.mp_access_token:
            return {"status": "tenant_without_token"}

        headers = {
            "Authorization": f"Bearer {tenant.mp_access_token}"
        }

        response = httpx.get(
            f"https://api.mercadopago.com/v1/payments/{mp_payment_id}",
            headers=headers,
            timeout=30
        )

        payment_data = response.json()

        external_reference = payment_data.get("external_reference")
        status = payment_data.get("status")

        payment = db.query(Payment).filter(
            Payment.external_reference == external_reference
        ).first()

        
        if payment:
            payment.status = status
            payment.mp_payment_id = str(mp_payment_id)
            db.commit()

            if status == "approved":

                existing = db.query(Enrollment).filter(
                    Enrollment.user_id == payment.user_id,
                    Enrollment.course_id == payment.course_id
                ).first()

                if not existing:
                    enrollment = Enrollment(
                        tenant_id=payment.tenant_id,
                        user_id=payment.user_id,
                        course_id=payment.course_id,
                        status="active"
                    )

                    db.add(enrollment)
                    db.commit()


    finally:
        db.close()

    return {"status": "processed"}



@router.post("/mercadopago/test-approve/{payment_id}")
def test_approve_payment(payment_id: str):

    db = SessionLocal()

    try:
        payment = db.query(Payment).filter(Payment.id == payment_id).first()

        if not payment:
            return {"status": "payment_not_found"}

        payment.status = "approved"

        existing = db.query(Enrollment).filter(
            Enrollment.user_id == payment.user_id,
            Enrollment.course_id == payment.course_id
        ).first()

        if not existing:
            enrollment = Enrollment(
                tenant_id=payment.tenant_id,
                user_id=payment.user_id,
                course_id=payment.course_id,
                status="active"
            )

            db.add(enrollment)

        db.commit()

        return {
            "status": "approved",
            "payment_id": str(payment.id),
            "course_id": str(payment.course_id),
            "user_id": str(payment.user_id)
        }

    finally:
        db.close()