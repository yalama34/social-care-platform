from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from models import RefreshToken, UserModel

class TokenService():
    def __init__(self, session):
        self.session = session
    async def create_refresh_token(self, user_id, role="user"):
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

    async def validate_refresh_token(self, token):
            statement = select(RefreshToken).where(
                RefreshToken.token == token,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.now(),
            )
            result = await self.session.execute(statement)
            db_token = result.scalar_one_or_none()
            return db_token is not None
    async def create_access_token(self, security, user_id, role="user"):
        permissions = "TEMPLATE"
        payload = {
            "user_id": user_id,
            "permissions": await self.get_permissions(role),
            "expires_at": int((datetime.now() + timedelta(days=2)).timestamp()),

        }
        access_token = security.create_access_token(uid=str(user_id), data=payload)
        return access_token
    """async def get_phone(self, user_id: int):
        statement = select(UserModel).where(UserModel.id == user_id)
        result = await self.session.execute(statement).first()
        if result is None:
            return "Not Found" #template
        return result.phone"""
    async def get_permissions(self, role):
        return "TEMPLATE"
    async def update_refresh_token(self, token) -> None:
        expires_at = datetime.now() + timedelta(weeks=2)
        updated_token = select(RefreshToken).where(
            RefreshToken.token == token,
        )
        if updated_token:
            updated_token.expires_at = expires_at
            await self.session.commit()





