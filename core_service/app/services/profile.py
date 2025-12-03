from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from ..common.models import RequestModel, UserModel, RegisterRequest, RefreshToken
from fastapi import HTTPException

class ProfileService():
    def __init__(self, session):
        self.session = session

    async def get_profile(self, access_token) -> dict:
        data = await self.session.execute(select(UserModel).where(UserModel.id == access_token.user_id))
        user = data.scalar()
        role = access_token.role
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return {
            "role": role,
            "full_name": user.full_name,
            "phone": user.phone,
            "about": user.about
        }

    async def get_profile_by_id(self, user_id: int, access_user_id: int) -> dict:
        data = await self.session.execute(select(UserModel).where(UserModel.id == user_id))
        user = data.scalar()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        token_result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.user_id == user_id)
        )
        token = token_result.scalar_one_or_none()
        role = token.role if token else "user"
        return {
            "id": user.id,
            "access_id": access_user_id,
            "role": role,
            "full_name": user.full_name,
            "phone": user.phone,
            "about": user.about
        }
    async def change_about(self, access_token, about: str) -> None:
        data = await self.session.execute(select(UserModel).where(UserModel.id == access_token.user_id))
        user = data.scalar()
        user.about = about
        self.session.add(user)
        await self.session.commit()
        self.session.refresh(user)
