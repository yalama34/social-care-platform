from sqlalchemy import select
from ..common.models import RefreshToken, UserModel
from ..common.database import SessionDep
from fastapi import HTTPException
from datetime import datetime

class PunishService:
    def __init__(self, session):
        self.session = session

    async def ban_user(self, user_id):
        result = await self.session.execute(select(RefreshToken).where(RefreshToken.user_id == user_id))
        token = result.scalar()
        if not token:
            raise ValueError("Токен не найден")
        token.is_revoked = True
        self.session.add(token)
        await self.session.commit()
        return {"punishment": "ban", "is_given": True}

    async def warn_user(self, user_id):
        result = await self.session.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar()
        if not user:
            raise ValueError("Пользователь не найден")
        user.warnings += 1
        if user.warnings >= 3:
            punish = await self.ban_user(user_id)
            return punish
        else:
            self.session.add(user)
            await self.session.commit()
            return {"punishment": "warning", "is_given": True}



