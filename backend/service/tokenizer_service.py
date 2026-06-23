from requests import get
import logging
from functools import lru_cache
from typing import Optional

from transformers import AutoTokenizer, PreTrainedTokenizerBase

logger = logging.getLogger(__name__)

_MODEL_ID="deepseek-ai/DeepSeek-V3"

@lru_cache(maxsize=1)
def _load_tokenizer() -> PreTrainedTokenizerBase:

    logger.info("Loading tokenizer dari %s HuggingFace", _MODEL_ID)

    tok = AutoTokenizer.from_pretrained(
        _MODEL_ID,
        trust_remote_code=True
    )

    logger.info("Tokenizer selesai di-load. Vocab size %d, model max len %s",
                tok.vocab_size,
                getattr(tok, "model_max_lenght", "unknown")
            )
    return tok

def get_tokenizer():
    return _load_tokenizer()

def tokenize_to_string(text: str) -> list[str]:
    tok = get_tokenizer()
    ids = tok.encode(text, add_special_tokens=False)
    return tok.convert_ids_to_tokens(ids)


def tokenize_with_ids(text: str) -> list[dict]:
    tok = get_tokenizer()
    ids = tok.encode(text, add_special_tokens=False)
    token = tok.convert_ids_to_tokens(ids)
    return [{"id":_id, "token":token} for _id, token in zip(ids, token)]

def count_tokens(text: str) -> int:
    tok = get_tokenizer()
    return len(tok.encode(text, add_special_tokens=False))

def decode_token_string(token_str: str) -> str:
    tok = get_tokenizer()
    return tok.convert_tokens_to_string([token_str])


def get_special_token_ids(text: str) -> dict[str, Optional[int]]:

    tok = get_tokenizer()
    return {
        "bos_token_id":tok.bos_token_id,
        "eos_token_id":tok.eos_token_id,
        "pad_token_id": tok.pad_token_id,
        "im_start_id": tok.convert_tokens_to_ids("<|im_start|>"),
        "im_end_id": tok.convert_tokens_to_ids("<|im_end|>")
    }
