from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Header
from ..services.ws_manager import manager
from ..services.chat import ChatService
from fastapi import HTTPException
from ..common.database import SessionDep
from authx import AuthX, AuthXConfig
from datetime import timedelta

chat_router = APIRouter(prefix="/chat", tags=["chat"])
config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)

@chat_router.get("/history/{request_id}")
async def get_chat_history(request_id: int, session: SessionDep, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    chat_service = ChatService(session)
    messages = await chat_service.get_history(
        request_id=request_id,
        user_id=access_token.user_id,
        user_role=access_token.role
    )
    return {"messages": messages}

