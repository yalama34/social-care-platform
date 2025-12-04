from ..common.database import SessionDep
from ..services.rating import RatingService
from ..common.models import UserRating
from fastapi import APIRouter, HTTPException, Header, Query
from datetime import timedelta
from sqlalchemy import select
from authx import AuthX, AuthXConfig

config = AuthXConfig(
    JWT_SECRET_KEY="secret-key",
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=2),
)
security = AuthX(config=config)
rating_router = APIRouter(tags=["rating"])



@rating_router.get("/rating/{user_id}")
async def get_user_rating_by_id(user_id: int, session: SessionDep, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    rating_service = RatingService(session)
    rating_info = await rating_service.get_rating_by_user_id(user_id)

    return rating_info


@rating_router.post("/set-rating")
async def accept_request(session: SessionDep, add_rating: int = Query(...), user_id: int = Query(...), authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token is not given")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")

    access_token = authorization.split()[1]
    access_token = security._decode_token(token=access_token)

    if access_token.user_id == user_id:
        raise HTTPException(status_code=400, detail="Нельзя оценить самого себя")

    try:
        data = await session.execute(select(UserRating).where(UserRating.user_id == user_id))
        user_rating = data.scalar()

        if not user_rating:
            user_rating = UserRating(user_id=user_id)
            session.add(user_rating)
            await session.flush()
        print("!!!!! РЕЙТИНГ ПОЛЬЗОВАТЕЛЯ !!!!", user_rating.average_rating)
        user_rating.update_rating(add_rating)


        await session.commit()
        await session.refresh(user_rating)

        return {
            "success": True,
            "rating": user_rating.average_rating,
            "count": user_rating.rating_count,
        }

    except HTTPException:
        raise

    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating rating: {str(e)}")
