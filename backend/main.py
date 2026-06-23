from fastapi.openapi import docs
from annotated_types import doc
from pygments.util import looks_like_xml
import logging
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers.generate import router as generate_router
from service.tokenizer_service import get_tokenizer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()

    logger.info("")
    logger.info("Model: %s", settings.deepseek_model)
    logger.info("Cors: %s", settings.cors_origins)


    logger.info("Pre-warming tokenizer '%s' ...", settings.hf_tokenizer_model_id)

    try:
        get_tokenizer()
        logger.info("Tokenizer siap")
    except Exception as exc:
        logger.warning("Tokenizer gagal di-load:'%s',", exc)
        logger.warning("Server jalan tapi api/generate mungkin bakalan gagal")

    logger.info("===Server siap===")
    yield

    logger.info("===server mati woilah===")

def create_app() -> FastAPI:

    settings = get_settings()

    app= FastAPI(
        title=settings.app_title,
        description=(
            "Backend untuk Autoregressive Visualizer."
            "Satu POST request -> semuat token steps + logprobs dikembalikan sekaligus"
            "Frontend hanya iterasi array di sisi client"
        ),
        version="1",
        lifespan=lifespan,
        docs_url="/docs"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )

    app.include_router(generate_router)
    
    return app


app = create_app()

@app.get("/", include_in_schema=False)
async def root():
    return {
        "message":"Autoregressive Visualizer API",
        "docs":"/docs",
        "health":"/api/health",
    }

if __name__=="__main__":
    settings = get_settings()
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="info"
    )
    