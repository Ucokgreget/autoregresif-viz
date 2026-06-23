from pydantic import HttpUrl
from fastapi import status
from service import tokenizer_service
import logging

from fastapi import APIRouter, Depends, HTTPException

from config import Settings, get_settings
from schema import(
    ErrorDetail,
    GenerateRequest,
    GenerateResponse,
    GenerationStep,
    PromptToken,
    TokenCandidate
)

from service import deepseek_service, tokenize_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api', tags=['generation'])

def _build_prompt_token(prompt: str) -> list[PromptToken]:
    raw_tokens = tokenizer_service.tokenize_with_ids(prompt)
    result = []
    for item in raw_tokens:
        display = tokenize_service.decode_token_string(item["token"])
        result.append(
            PromptToken(
                token_display=display,
                token_raw=item["token"],
                token_id = item['id']
            )
        )

def _build_steps(raw_step: list[dict]) -> list[GenerationStep]:
    steps = []
    for raw in raw_step:
        candidates = [
            TokenCandidate(token=c["token"], probability=c["probability"])
            for c in raw["candidates"]
        ]

    steps.append(
        GenerationStep(
            step_index=raw["step_index"],
            selected_token=raw["selected_token"],
            is_stop=raw["is_stop"],
            candidates=candidates
        )
    )

    return steps

router.post(
    "/generate",
    response_model=GenerateResponse,
    responses={
        400:{"model": ErrorDetail, "description":"Prompt terlalu panjang"},
        502: {"model":ErrorDetail, "description":"DeepSeek error"}
    },
    summary="Generate token dari prompt",

)
async def generate(
    body: GenerateRequest,
    settings: Settings = Depends(get_settings),
) -> GenerateResponse:
    try:
        token_count = tokenize_service.count_tokens(body.prompt)
    except Exception as exc:
        logger.error("Tokenizer errror: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prompt gagal"
        )
    if token_count > settings.prompt_max_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Prompt terlalu panjang: {token_count} token"
                f"(maksimum {settings.prompt_max_tokens})"
            )
        )
    
    try:
        prompt_token = _build_prompt_token(body.prompt)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal tokenisasi prompt"
        )
    
    logger.info(
        "Calling deepseek: prompt_len=%d tokens, max_tokens=%d, top_logprobs=%d",
        token_count,
        body.max_tokens,
        body.top_logprobs
    )

    try:
        raw_step = deepseek_service.generate_with_steps(
            prompt=body.prompt,
            max_tokens=body.max_tokens,
            top_logprobs=body.top_logprobs
        )
    except RuntimeError as exc:
        logger.error("Deepseek config error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )

    steps = _build_steps(raw_step)

    generated_text = "".join(
        tokenize_service.decode_token_string(s.selected_token)
        for s in steps
        if not s.is_stop
    )

    logger.info(
        "Done: %d steps generated, text=%s",
        len(steps),
        generated_text[:50]
    )

    return GenerateResponse(
        prompt_token=prompt_token,
        steps=steps,
        total_steps=len(steps),
        generated_text=generated_text
    )

@router.get("/health", summary="Health Check")
async def health() -> dict:
    return {"status":"ok"}


