from fastapi import HTTPException
from sqlalchemy import select

from ..common.database import SessionDep
from ..common.models import RefreshToken, UserModel
from ..common.models import ComplaintModel


class PunishService:
    def __init__(self, session):
        self.session = session

    async def ban_user(self, user_id):
        result = await self.session.execute(select(RefreshToken).where(RefreshToken.user_id == user_id))
        token = result.scalar()
        if not token:
            raise HTTPException(status_code=404, detail="User not found")
        token.is_revoked = True
        self.session.add(token)
        await self.session.commit()
        return {"punishment": "ban", "is_given": True}


    async def warn_user(self, user_id):
        result = await self.session.execute(select(UserModel).where(UserModel.id == user_id))
        user = result.scalar()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.warnings += 1
        if user.warnings >= 3:
            punish = await self.ban_user(user_id)
            return punish
        else:
            self.session.add(user)
            await self.session.commit()
            return {"punishment": "warning", "is_given": True}


    async def edit_complaint_status(self, complaint_id, status):
        result = await self.session.execute(
            select(ComplaintModel).where(ComplaintModel.id == complaint_id)
        )
        complaint = result.scalar()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        complaint.status = status
        if status == "onwait":
            complaint.admin_id = -1
        self.session.add(complaint)
        await self.session.commit()
        await self.session.refresh(complaint)


    async def delete_complaint(self, complaint_id):
        result = await self.session.execute(
            select(ComplaintModel).where(ComplaintModel.id == complaint_id)
        )
        complaint = result.scalar()
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        await self.session.delete(complaint)
        await self.session.commit()
