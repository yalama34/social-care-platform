from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from shared.models import RefreshToken
import random
import os
import httpx
import boto3
from botocore.config import Config
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMSPILOT_API_KEY = os.getenv("SMSPILOT_API_KEY")

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
    async def update_refresh_token(self, token: str) -> None:
        expires_at = datetime.now() + timedelta(weeks=2)
        result = await self.session.execute(select(RefreshToken).where(
            RefreshToken.token == token,
        ))
        updated_token = result.scalar()
        if updated_token:
            updated_token.expires_at = expires_at
            await self.session.commit()

class EmailService:
    def __init__(self, email):
        self.email = email
        self.ses_client = boto3.client(
            service_name='sesv2',
            endpoint_url='https://postbox.cloud.yandex.net',
            region_name='ru-central1',
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            config=Config(signature_version="v4")
        )
        self.from_email = os.getenv("SES_FROM_EMAIL")

    def generate_code(self):
        import random
        return str(random.randint(100000, 999999))

    async def send_verification_code(self, code: str) -> bool:
        charset = "utf-8"

        msg = MIMEMultipart('mixed')
        msg['Subject'] = "Код верификации"
        msg['From'] = self.from_email
        msg_body = MIMEMultipart('alternative')

        text_part = MIMEText(f"Ваш код: {code}", 'plain', charset)
        html_part = MIMEText(f"""
        <html><body>
        <h2>Код верификации</h2>
        <p><strong>{code}</strong></p>
        </body></html>
        """, 'html', charset)

        msg_body.attach(text_part)
        msg_body.attach(html_part)
        msg.attach(msg_body)

        try:
            self.ses_client.send_email(
                FromEmailAddress=self.from_email,
                Destination={
                    'ToAddresses': [self.email]
                },
                Content={
                    'Raw': {
                        'Data': msg.as_string(),
                    }
                }
            )
            return True
        except Exception as e:
            print("err:", e)
            return False