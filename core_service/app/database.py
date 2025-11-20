import os
from typing import Annotated
from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from dotenv import load_dotenv

load_dotenv()

# SQLite с асинхронным драйвером
DATABASE_URL = "sqlite+aiosqlite:///./requests.db"

engine = create_async_engine(
    url=DATABASE_URL,
    echo=True,
    connect_args={"check_same_thread": False}  # Важно для async работы
)

new_session = async_sessionmaker(engine, expire_on_commit=False)

async def get_session():
    async with new_session() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_session)]