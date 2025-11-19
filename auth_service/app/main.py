from fastapi import FastAPI, HTTPException
from routers import router, security
from shared.database import engine, SessionDep
from shared.models import Base, CheckSessionRequest
from shared.models import UserModel, RefreshToken
from contextlib import asynccontextmanager
from service import TokenService
from datetime import datetime
from sqlalchemy import select
from fastapi.middleware.cors import CORSMiddleware




@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Чистит всю БД, ОПАСНО!!!
        await conn.run_sync(Base.metadata.create_all)
    print("✅ БД создана")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")


@app.post("/refresh")
async def check_session(request: CheckSessionRequest, session: SessionDep):
    access_token = security._decode_token(request.access_token)
    print(access_token, flush=True)
    result = await session.execute(
        select(UserModel).where(UserModel.id == access_token.user_id)
    )
    user = result.scalar()
    if not user:
        return {
            "session_active": False,
        }
    if access_token.expires_at < int(datetime.now().timestamp()):
        token = TokenService(session)
        refresh_token = await session.execute(select(RefreshToken).where(RefreshToken.user_id == user.id))
        check_refresh_token = await token.validate_refresh_token(refresh_token.token)
        if not check_refresh_token:
            if not refresh_token.is_revoked:
                return {
                    "session_active": False,
                }
            else:
                return HTTPException(status_code=403, detail="You have been banned")
        new_access_token = await token.create_access_token(user_id=user.id, security=security)
        return {
            "session_active": True,
            "access_token": new_access_token,
        }
    return{
        "session_active": True,
        "access_token": request.access_token,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
