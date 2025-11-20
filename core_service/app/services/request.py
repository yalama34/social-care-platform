from datetime import datetime, timedelta
import secrets
from sqlalchemy import select
from ..common.models import RequestModel, UserModel, RegisterRequest
from fastapi import HTTPException


class RequestService:
    def __init__(self, session):
        self.session = session

    async def register_request(self, access_token, request: RegisterRequest):
        result = await self.session.execute(
            select(UserModel).where(UserModel.id == access_token.user_id)
        )
        user = result.scalar()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        desired_time_str = request.desired_time
        try:
            desired_time = datetime.fromisoformat(desired_time_str)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid desired_time format. Expected ISO format, got '{desired_time_str}'"
            )
        user_request = RequestModel(
            user_id=user.id,
            full_name=request.full_name,
            service_type=request.service_type,
            address=request.address,
            comment=request.comment,
            desired_time=desired_time,
        )
        self.session.add(user_request)
        await self.session.commit()
        await self.session.refresh(user_request)