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

from service import deepseek_service, tokenizer_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix='/api', tags=['generation'])

def _build_prompt_token(prompt: str) -> list[PromptToken]:
    raw_tokens = tokenizer_service.tokenize_with_ids(prompt)
    result = []
    for item in raw_tokens:
        display = tokenizer_service.decode_token_string(item["token"])
        result.append(
            PromptToken(
                token_display=display,
                token_raw=item["token"],
                token_id = item['id']
            )
        )
    return result

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

    # Merge consecutive tokens that reconstruct special tokens
    special_tokens = ["<|im_start|>", "<|im_end|>", "<|end_of_sentence|>", "<|begin_of_sentence|>"]
    merged = []
    i = 0
    n = len(steps)
    while i < n:
        matched_token = None
        matched_len = 0
        for sp in special_tokens:
            temp_str = ""
            for k in range(i, n):
                temp_str += steps[k].selected_token
                if temp_str == sp:
                    matched_token = sp
                    matched_len = k - i + 1
                    break
                elif len(temp_str) > len(sp):
                    break
            if matched_token:
                break

        if matched_token:
            first_step = steps[i]
            prob = first_step.candidates[0].probability if first_step.candidates else 1.0
            merged_candidates = [TokenCandidate(token=matched_token, probability=prob)]

            merged_step = GenerationStep(
                step_index=len(merged),
                selected_token=matched_token,
                is_stop=True if matched_token in ["<|im_end|>", "<|end_of_sentence|>"] else first_step.is_stop,
                candidates=merged_candidates
            )
            merged.append(merged_step)
            i += matched_len
        else:
            step = steps[i]
            step.step_index = len(merged)
            merged.append(step)
            i += 1

    return merged

@router.post(
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
        token_count = tokenizer_service.count_tokens(body.prompt)
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
        prompt_tokens = _build_prompt_token(body.prompt)
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
        tokenizer_service.decode_token_string(s.selected_token)
        for s in steps
        if not s.is_stop
    )

    logger.info(
        "Done: %d steps generated, text=%s",
        len(steps),
        generated_text[:50]
    )

    return GenerateResponse(
        prompt_tokens=prompt_tokens,
        steps=steps,
        total_steps=len(steps),
        generated_text=generated_text
    )

@router.get("/health", summary="Health Check")
async def health() -> dict:
    return {"status":"ok"}

from pydantic import BaseModel

class TokenizeRequest(BaseModel):
    prompt: str

@router.post("/tokenize", response_model=list[PromptToken], summary="Tokenize prompt text")
async def tokenize_prompt(body: TokenizeRequest) -> list[PromptToken]:
    try:
        return _build_prompt_token(body.prompt)
    except Exception as exc:
        logger.error("Tokenize error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gagal tokenisasi: {str(exc)}"
        )


