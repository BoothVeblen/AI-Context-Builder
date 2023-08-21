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

logger.add(sys.stdout, format="{time} {level} {message}", level="INFO", enqueue=True)


load_dotenv()

app = FastAPI()
graphsignal.configure(
    api_key="9b243ea3f6775da54a7a5ae0127dfe79", deployment="my-app-prod"
)


@app.exception_handler(Exception)
async def validation_exception_handler(request: Request, exc: Exception):
    logger.error(f"unexcepted error: {exc} \nwith request: {request}")
    stack_trace = "".join(
        traceback.TracebackException.from_exception(exc).format()
    )  # <-- get the actual error stack trace
    logger.error(stack_trace)
    return JSONResponse(
        status_code=500,
        content={"message": f"unexcepted error: {exc}"},
    )


app.include_router(chat.router)
app.include_router(dataset.router)
app.include_router(model.router)

if __name__ == "__main__":
    uvicorn.run(host="0.0.0.0", port=8000, app=app)
