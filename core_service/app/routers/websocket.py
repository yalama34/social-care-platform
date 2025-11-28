from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Query

from ..common.models import RequestModel
from ..services.ws_manager import manager
from ..services.chat import ChatService
from ..common.database import SessionDep
from authx import AuthXConfig, AuthX
from sqlalchemy import select
from datetime import timedelta

ws_router = APIRouter()

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)

security = AuthX(config=config)

@ws_router.websocket("/ws/{role}/{id}")
async def websocket_endpoint(websocket: WebSocket, role: str, id : int, session: SessionDep, access_token = Query(...)):
    if not access_token:
        await websocket.close(code=1008, reason="Требуется access токен")
        return
    try:
        access_token = security._decode_token(token=access_token)
    except Exception as e:
        await websocket.close(code=1008, reason="Неверный токен")
        return

    result = await session.execute(select(RequestModel).where(RequestModel.id == id))
    request = result.scalar()

    if not request:
        await websocket.close(code=1008, reason="Заявка не найдена")
        return

    if role == "user" and access_token.user_id != request.user_id:
        await websocket.close(code=1008, reason="Недостаточно прав")
        return
    if role == "volunteer" and access_token.user_id != request.volunteer_id:
        await websocket.close(code=1008, reason="Недостаточно прав")
        return

    chat_service = ChatService(session)
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            try:
                await chat_service.save_message(id, role, message)
            except Exception as e:
                await websocket.send_text("Возникла ошибка при сохранении сообщения")
            await manager.broadcast(f'{role}-{message}')
    except WebSocketDisconnect:
        manager.disconnect(websocket)