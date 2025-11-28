from sqlalchemy import select
from ..common.models import ChatModel, RequestModel
from ..common.database import SessionDep
from fastapi import HTTPException
from datetime import datetime

class ChatService:
    def __init__(self, session: SessionDep):
        self.session = session

    async def save_message(self, request_id: int, role: str, message: str):
        chat_message = ChatModel(
            request_id=request_id,
            role=role,
            message=message,
        )
        self.session.add(chat_message)
        await self.session.commit()
        await self.session.refresh(chat_message)
        return chat_message
    async def get_history(self, request_id: int, user_id: int, user_role: str):
        result = await self.session.execute(select(RequestModel).where(RequestModel.id == request_id))
        request = result.scalar()
        if not request:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        if user_role == "user" and request.user_id != user_id:
            raise HTTPException(status_code=403, detail="Недостаточно прав")
        elif user_role == "volunteer" and request.volunteer_id != user_id:
            raise HTTPException(status_code=403, detail="Недостаточно прав")

        messages_result = await self.session.execute(select(ChatModel).where(ChatModel.request_id == request_id).order_by(ChatModel.created_at))
        messages = messages_result.scalars().all()

        return [
            {
                "role": message.role,
                "message": message.message,
            }
            for message in messages
        ]


