import uvicorn
from fastapi import FastAPI
from apps.api.routers import chat

app = FastAPI()

app.include_router(chat.router)


if __name__ == "__main__":
    uvicorn.run(host="0.0.0.0", port=8000, app=app)
