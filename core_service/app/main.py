from fastapi import FastAPI
from .routers.request import request_router
from .routers.home import home_router
from fastapi.middleware.cors import CORSMiddleware
from .routers.feed import feed_router
from .routers.profiles import profile_router
from .routers.websocket import ws_router
from .routers.chat import chat_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(request_router)
app.include_router(home_router)
app.include_router(feed_router)
app.include_router(profile_router)
app.include_router(ws_router)
app.include_router(chat_router)
"""
if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=False)
"""