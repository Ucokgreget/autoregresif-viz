from requests import get
import re
import logging
from functools import lru_cache
from typing import Optional

from transformers import AutoTokenizer, PreTrainedTokenizerBase

SPECIAL_TOKENS = ["<|im_start|>", "<|im_end|>", "<|end_of_sentence|>", "<|begin▁of▁sentence|>"]
_SPECIAL_PATTERN = re.compile('(' + '|'.join(re.escape(st) for st in SPECIAL_TOKENS) + ')')

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


def _get_special_token_id(tok, token_str: str) -> int:
    token_id = tok.convert_tokens_to_ids(token_str)
    if token_id is not None and token_id != getattr(tok, 'unk_token_id', None):
        return token_id
    added_vocab = tok.get_added_vocab()
    if token_str in added_vocab:
        return added_vocab[token_str]
    if hasattr(tok, 'added_tokens_encoder') and token_str in tok.added_tokens_encoder:
        return tok.added_tokens_encoder[token_str]
    return 0


def tokenize_with_ids(text: str) -> list[dict]:
    tok = get_tokenizer()
    parts = _SPECIAL_PATTERN.split(text)
    result = []
    for part in parts:
        if not part:
            continue
        if part in SPECIAL_TOKENS:
            token_id = _get_special_token_id(tok, part)
            result.append({"id": token_id, "token": part})
        else:
            ids = tok.encode(part, add_special_tokens=False)
            tokens = tok.convert_ids_to_tokens(ids)
            for _id, t in zip(ids, tokens):
                result.append({"id": _id, "token": t})
    return result

def count_tokens(text: str) -> int:
    return len(tokenize_with_ids(text))

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
