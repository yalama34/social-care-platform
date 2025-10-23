from fastapi import FastAPI
from routers import router
from datebase import engine
from models import Base

app = FastAPI()

app.include_router(router)

async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all) # Чистит всю БД, ОПАСНО!!!
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return "Root"

