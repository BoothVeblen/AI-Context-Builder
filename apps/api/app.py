import cProfile
import io
import os
import pstats
import sys
import traceback

import graphsignal
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from loguru import logger
from routers import chat, dataset, model
from starlette.responses import JSONResponse
from utils import GRAPH_SIGNAL_API_KEY, BACKEND_URL

logger.add(sys.stdout, format="{time} {level} {message}", level="INFO", enqueue=True)


load_dotenv()

app = FastAPI(docs_url=None, redoc_url=None)
graphsignal.configure(api_key=GRAPH_SIGNAL_API_KEY, deployment="my-app-prod")

if BACKEND_URL.startswith("http://api-test") and os.getenv("TESTING"):

    @app.middleware("http")
    async def profiler_middleware(request: Request, call_next):
        pr = cProfile.Profile()
        pr.enable()
        response = await call_next(request)
        pr.disable()
        s = io.StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats("cumulative")
        ps.print_stats()
        logger.info(s.getvalue())
        return response


@app.get("/health")
async def health_check():
    return {"status": "ok"}


app.include_router(chat.router)
app.include_router(dataset.router)
app.include_router(model.router)

if __name__ == "__main__":
    uvicorn.run(host="0.0.0.0", port=8000, app=app)
