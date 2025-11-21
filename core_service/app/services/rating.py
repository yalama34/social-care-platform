from sqlalchemy import select
from ..common.models import UserRating
from fastapi import HTTPException


class RatingService:
    def __init__(self, session):
        self.session = session

    async def get_rating(self, access_token):
        data = await self.session.execute(select().where(UserRating.user_id == access_token.user_id))
        user_rating = data.scalar()
        if not user_rating:
            raise HTTPException(status_code=404, detail="Rating not found")
        return {
            "rating": user_rating.average_rating,
            "rating_count": user_rating.rating_count,
        }
