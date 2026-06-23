"""
config.py

Load semua konfigurasi dari environment variables / file .env.
Satu tempat untuk semua "angka ajaib" dan secrets -- tidak ada
hardcoded value di file lain.

Kenapa pakai pydantic-settings, bukan os.environ.get() langsung?
- Validasi tipe otomatis: DEEPSEEK_MAX_TOKENS="abc" langsung error
  saat startup, bukan saat request pertama masuk.
- Satu class = satu sumber kebenaran. File lain tinggal import `settings`,
  tidak perlu tahu nama env var-nya.
- Support .env file otomatis -- tidak perlu python-dotenv manual.
- Kalau field wajib (seperti API key) tidak di-set, server langsung
  crash saat startup dengan pesan yang jelas. Lebih baik gagal cepat
  daripada diam-diam kirim request tanpa auth.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Semua konfigurasi aplikasi. Urutan prioritas (tinggi → rendah):
        1. Environment variable (export DEEPSEEK_API_KEY=xxx)
        2. File .env di root backend/
        3. Default value yang di-define di sini

    Field tanpa default = WAJIB diset. Server tidak akan start kalau
    field ini kosong.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        # Kalau ada env var yang tidak dikenal, abaikan saja.
        # Berguna saat deploy di platform yang inject banyak env var otomatis.
        extra="ignore",
    )

    # ── Secrets (wajib, tidak ada default) ───────────────────────────────────

    deepseek_api_key: str = Field(
        ...,
        description="API key DeepSeek. Wajib diset via env atau .env file.",
    )

    # ── DeepSeek API settings ─────────────────────────────────────────────────

    deepseek_api_url: str = Field(
        default="https://api.deepseek.com/beta/completions",
        description="Endpoint FIM DeepSeek. Ganti kalau pakai proxy.",
    )

    deepseek_model: str = Field(
        default="deepseek-v4-flash",
        description="Model ID yang dipakai. Harus support FIM + logprobs.",
    )

    deepseek_default_max_tokens: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Default max_tokens kalau frontend tidak kirim nilai.",
    )

    deepseek_default_top_logprobs: int = Field(
        default=20,
        ge=1,
        le=20,
        description="Jumlah kandidat token per step. Max 20 (limit API DeepSeek).",
    )

    deepseek_timeout_seconds: int = Field(
        default=30,
        ge=5,
        description="Timeout HTTP request ke DeepSeek dalam detik.",
    )

    # ── Tokenizer settings ────────────────────────────────────────────────────

    hf_tokenizer_model_id: str = Field(
        default="deepseek-ai/DeepSeek-V3",
        description=(
            "Model ID HuggingFace untuk tokenizer. "
            "DeepSeek V3 dan V4-Pro pakai tokenizer yang sama."
        ),
    )

    # ── Validasi prompt ───────────────────────────────────────────────────────

    prompt_max_tokens: int = Field(
        default=4096,
        description=(
            "Batas panjang prompt dalam token. Request yang melebihi ini "
            "ditolak dengan 400 sebelum call ke DeepSeek."
        ),
    )

    # ── CORS ──────────────────────────────────────────────────────────────────

    cors_origins: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description=(
            "Origin yang diizinkan. "
            "5173 = Vite dev server default, 3000 = fallback. "
            "Saat production, ganti dengan domain frontend yang sebenarnya."
        ),
    )

    # ── App metadata ──────────────────────────────────────────────────────────

    app_title: str = Field(
        default="Autoregressive Visualizer API",
        description="Judul yang muncul di Swagger UI (/docs).",
    )

    debug: bool = Field(
        default=False,
        description=(
            "Mode debug: aktifkan untuk log yang lebih verbose. "
            "Jangan aktifkan di production."
        ),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Singleton accessor untuk Settings.

    Sama seperti tokenizer_service, pakai @lru_cache supaya .env
    cuma dibaca sekali saat pertama kali dipanggil.

    Cara pakai di file lain:
        from app.config import get_settings
        settings = get_settings()
        api_key = settings.deepseek_api_key

    Cara override saat testing (tanpa .env file):
        from app.config import get_settings
        get_settings.cache_clear()
        get_settings.return_value = Settings(deepseek_api_key="test-key")
    """
    return Settings()