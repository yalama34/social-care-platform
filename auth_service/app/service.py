from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from shared.models import RefreshToken
import random
import os
import httpx

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
        updated_token = select(RefreshToken).where(
            RefreshToken.token == token,
        )
        if updated_token is not None:
            updated_token.expires_at = expires_at
            await self.session.commit()

class SmsService():
    def __init__(self, session):
        self.session = session

    def generate_code(self) -> str:
        return "".join([str(random.randint(0, 9)) for _ in range(6)])

    async def send_sms(phone: str, code: str) -> bool:
        url = "https://smspilot.ru/api.php"
        params = {
            "send": phone,
            "message": f"Ваш код подтверждения: {code}",
            "api_key": SMSPILOT_API_KEY,
            "format": "json",
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            data = response.json()
            return data.get("status") == "OK"





