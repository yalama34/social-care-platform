from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from ..common.models import RequestModel, UserModel, RegisterRequest
from fastapi import HTTPException

class ProfileService():
    def __init__(self, session):
        self.session = session

    async def get_profile(self, access_token):
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
