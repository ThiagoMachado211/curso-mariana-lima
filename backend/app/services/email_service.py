# Testing Resend

import resend
from app.core.config import settings

if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY


def send_reset_password_email(to_email: str, reset_token: str) -> dict:
    if not settings.RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY não configurada.")

    if not settings.MAIL_FROM:
        raise RuntimeError("MAIL_FROM não configurado.")

    reset_link = f"{settings.FRONTEND_URL}/reset-password.html?token={reset_token}"

    html = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
        <h2>Redefinição de senha</h2>
        <p>Recebemos uma solicitação para redefinir sua senha na plataforma <strong>Matemática Essencial</strong>.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <p>
            <a href="{reset_link}"
               style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;">
               Redefinir senha
            </a>
        </p>
        <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
        <p>Ou copie e cole este link no navegador:</p>
        <p>{reset_link}</p>
    </div>
    """

    params = {
        "from": settings.MAIL_FROM,
        "to": [to_email],
        "subject": "Redefinição de senha - Matemática Essencial",
        "html": html,
    }

    return resend.Emails.send(params)