from requests import get
import logging
from functools import lru_cache
from typing import Optional

from transformers import AutoTokenizer, PreTrainedTokenizerBase

logger = logging.getLogger(__name__)

_MODEL_ID="deepsek-ai/DeepSeek-V4"

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

def 