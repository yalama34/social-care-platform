from ..common.database import SessionDep
from ..common.models import RegisterRequest, RequestModel, UserModel, CheckSessionRequest
from fastapi import APIRouter, HTTPException, Header, Query
from datetime import timedelta, datetime
from sqlalchemy import select
from ..services.request import RequestService
from ..services.chat import ChatService
from authx import AuthX, AuthXConfig

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
home_router = APIRouter(prefix="/home", tags=["home"])


@home_router.post("/{role}")
async def user_home(session : SessionDep, role: str, authorization: str = Header(None)):
    '''Домашняя страница пользователя'''
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    if role == "user":
        request_data = await session.execute(select(RequestModel).where(RequestModel.user_id == access_token.user_id))
    else:
        request_data = await session.execute(select(RequestModel).where(RequestModel.volunteer_id == access_token.user_id))
    all_requests = request_data.scalars().all()

    active_requests = {}
    completed_requests = {}
    request_service = RequestService(session)

    for req in all_requests:
        request_dict = {
            "user_id": req.user_id,
            "id": req.id,
            "full_name": req.full_name,
            "service_type": req.service_type,
            "address": req.address,
            "destination_address": req.destination_address,
            "list_products": req.list_products,
            "comment": req.comment,
            "desired_time": req.desired_time.isoformat() if hasattr(req.desired_time, 'isoformat') else str(
                req.desired_time),
            "status": req.status,
            "volunteer_id": req.volunteer_id,
            "volunteer_name": await request_service.get_volunteer_name(req.volunteer_id),
        }
        
        if req.status != "completed" and req.status != "cancelled" and req.status != "deleted":
            active_requests[str(req.id)] = request_dict

        elif req.status == "completed" or req.status == "cancelled":
            completed_requests[str(req.id)] = request_dict

    if not all_requests:
        return {"message": "No Requests found"}

    latest_active = dict(sorted(active_requests.items(), key=lambda x: int(x[0]), reverse=True)[:3])
    latest_completed = dict(sorted(completed_requests.items(), key=lambda x: int(x[0]), reverse=True)[:3]) # тут отсекаем последние 3 в обеих категориях(не забыть добавить request_history)


    return {
        "active_requests": latest_active,
        "completed_requests": latest_completed,
    }

@home_router.post("/{option}/{request_id}")
async def edit_request(
    session: SessionDep, 
    option: str, 
    request_id: int, 
    by_id: str = Query(None, alias="by_id"),
    by_volunteer_id: str = Query(None, alias="by_volunteer_id"),
    authorization: str = Header(None)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)
    status_decipher = {
        "cancel": "onwait",
        "complete": "completed",
    }
    user_id = access_token.user_id
    user_role = access_token.role
    request_service = RequestService(session=session)
    chat_service = ChatService(session)
    
    # Парсим булевые параметры из query string
    by_id_bool = by_id and by_id.lower() in ("true", "1")
    by_volunteer_id_bool = by_volunteer_id and by_volunteer_id.lower() in ("true", "1")
    
    if option == "delete":
        if by_id_bool:
            deleted_request_ids = await request_service.delete_all_requests_by_user_id(request_id)
            for req_id in deleted_request_ids:
                try:
                    await chat_service.delete_history(req_id)
                except HTTPException:
                    pass
            return {"deleted_requests": deleted_request_ids, "count": len(deleted_request_ids)}
        else:
            if access_token.role == "volunteer":
                raise HTTPException(status_code=403, detail="Forbidden")
            await request_service.delete_request(request_id)
            return {"success": True}
    elif option in ["cancel", "complete"]:
        if option == "cancel":
            if by_volunteer_id_bool:
                returned_request_ids = await request_service.return_volunteer_requests_to_feed(request_id)
                for req_id in returned_request_ids:
                    try:
                        await chat_service.delete_history(req_id)
                    except HTTPException:
                        pass
                return {"returned_requests": returned_request_ids, "count": len(returned_request_ids)}
            else:
                await chat_service.delete_history(request_id)
        await request_service.edit_request_status(request_id, status_decipher[option])
        return {"success": True}

