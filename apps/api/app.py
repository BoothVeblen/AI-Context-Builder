import os

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from routers import chat, dataset, model
from starlette.responses import JSONResponse
import traceback
import graphsignal
from loguru import logger
import sys
from utils import GRAPH_SIGNAL_API_KEY

logger.add(sys.stdout, format="{time} {level} {message}", level="INFO", enqueue=True)


load_dotenv()

app = FastAPI(docs_url=None, redoc_url=None)
graphsignal.configure(api_key=GRAPH_SIGNAL_API_KEY, deployment="my-app-prod")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(chat.router)
app.include_router(dataset.router)
app.include_router(model.router)

if __name__ == "__main__":
    uvicorn.run(host="0.0.0.0", port=8000, app=app)
