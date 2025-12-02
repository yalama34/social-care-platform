from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from shared.models import RefreshToken, VerificationCode
import random
import os
import httpx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Email configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", SMTP_USER)

class TokenService():
    def __init__(self, session):
        self.session = session
    async def create_refresh_token(self, user_id: int, role: str ="user") -> RefreshToken:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(weeks=2)

        token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
            role=role
        )
        self.session.add(token)
        await self.session.commit()
        return token

    async def validate_refresh_token(self, token: str) -> bool:
            statement = select(RefreshToken).where(
                RefreshToken.token == token,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(),
            )
            result = await self.session.execute(statement)
            db_token = result.scalar_one_or_none()
            return db_token is not None
    async def create_access_token(self, security, user_id: int, role: str = "user"):
        permissions = "TEMPLATE"
        payload = {
            "user_id": user_id,
            "role": role,
            "permissions": await self.get_permissions(role),
            "expires_at": int((datetime.now() + timedelta(days=2)).timestamp()),

        }
        access_token = security.create_access_token(uid=str(user_id), data=payload)
        return access_token

    async def get_permissions(self, role: str) -> str:
        return "TEMPLATE"
    async def update_refresh_token(self, user_id: int) -> None:
        expires_at = datetime.now() + timedelta(weeks=2)
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.user_id == user_id)
        )
        updated_token = result.scalar_one_or_none()
        if updated_token is not None:
            updated_token.expires_at = expires_at
            self.session.add(updated_token)
            await self.session.commit()

class EmailService():
    def __init__(self, session):
        self.session = session

    def generate_code(self) -> str:
        return "".join([str(random.randint(0, 9)) for _ in range(6)])

    async def send_verification_code(self, email: str, code: str) -> bool:
        """Отправка кода верификации на email через SMTP"""
        try:
            if not SMTP_USER or not SMTP_PASSWORD:
                # Если SMTP не настроен, просто логируем (для разработки)
                print(f"[EMAIL] Код верификации для {email}: {code}", flush=True)
                return True
            
            # Создание сообщения
            msg = MIMEMultipart()
            msg['From'] = EMAIL_FROM
            msg['To'] = email
            msg['Subject'] = "Код подтверждения"
            
            body = f"""
            Здравствуйте!
            
            Ваш код подтверждения: {code}
            
            Код действителен в течение 10 минут.
            
            Если вы не запрашивали этот код, проигнорируйте это письмо.
            """
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # Отправка через SMTP
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
            
            print(f"[EMAIL] Код отправлен на {email}", flush=True)
            return True
        except Exception as e:
            print(f"[EMAIL] Ошибка отправки на {email}: {e}", flush=True)
            # В режиме разработки возвращаем True даже при ошибке
            return True

    async def save_verification_code(self, email: str, code: str) -> VerificationCode:
        """Сохранение кода верификации в БД"""
        expires_at = datetime.now() + timedelta(minutes=10)
        verification_code = VerificationCode(
            email=email,
            code=code,
            expires_at=expires_at
        )
        self.session.add(verification_code)
        await self.session.commit()
        await self.session.refresh(verification_code)
        return verification_code

    async def verify_code(self, email: str, code: str) -> bool:
        """Проверка кода верификации"""
        result = await self.session.execute(
            select(VerificationCode).where(
                VerificationCode.email == email,
                VerificationCode.code == code,
                VerificationCode.is_used == False,
                VerificationCode.expires_at > datetime.now()
            ).order_by(VerificationCode.created_at.desc())
        )
        verification = result.scalar_one_or_none()
        
        if verification:
            verification.is_used = True
            self.session.add(verification)
            await self.session.commit()
            return True
        return False





