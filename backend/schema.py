"""
schemas.py

Semua Pydantic model yang dipakai sebagai kontrak data antara
frontend ↔ FastAPI ↔ service layer.

Kenapa dipisah ke file sendiri?
- router/generate.py import schemas ini buat validasi request & response
- services juga bisa import kalau perlu type hint
- Kalau schemas di-define di dalam router, nanti circular import saat
  project makin besar. Pisah dari awal lebih aman.

Kenapa Pydantic?
- FastAPI pakai Pydantic secara native: request body otomatis divalidasi
  dan di-parse sebelum masuk ke fungsi handler.
- Kalau field wajib tidak ada atau tipe salah, FastAPI return 422 otomatis
  dengan pesan error yang jelas -- tanpa kita nulis if-else validasi manual.
- Response model (pakai response_model= di decorator) otomatis filter field
  yang tidak perlu sebelum dikirim ke client. Kalau service return field
  ekstra, tidak akan bocor ke frontend.
"""

from pydantic import BaseModel, Field


# ── Request ───────────────────────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    """
    Body dari POST /api/generate.

    Frontend kirim ini saat user submit prompt.
    """

    prompt: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="Teks prompt yang akan dilanjutkan oleh model.",
        examples=["The capital of Indonesia is"],
    )
    max_tokens: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Maksimum token yang digenerate. Lebih tinggi = lebih lama.",
    )
    top_logprobs: int = Field(
        default=20,
        ge=1,
        le=20,
        description=(
            "Jumlah kandidat token per step yang dikembalikan. "
            "DeepSeek max 20 -- nilai ini tidak boleh melebihi itu."
        ),
    )


# ── Sub-models (bagian dari response) ────────────────────────────────────────

class TokenCandidate(BaseModel):
    """
    Satu kandidat token di sebuah step, beserta probabilitasnya.

    Contoh: step ke-3, kandidat teratas bisa jadi
        {"token": "▁Paris", "probability": 0.8712}
    """

    token: str
    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Probabilitas token ini dipilih (sudah di-convert dari log-prob via exp()).",
    )


class GenerationStep(BaseModel):
    """
    Satu langkah autoregressive: model memilih satu token dari sekian kandidat.

    step_index     : urutan step, mulai dari 0
    selected_token : token yang benar-benar dipilih model
    is_stop        : True kalau ini token EOS / stop token
    candidates     : top-k kandidat, sudah diurutkan descending by probability
    """

    step_index: int
    selected_token: str
    is_stop: bool
    candidates: list[TokenCandidate]


class PromptToken(BaseModel):
    """
    Satu token dari prompt awal (hasil tokenisasi teks input user).

    Dipakai di panel kiri (TokenStream) untuk nampilin prompt
    token-by-token sebelum proses generate dimulai.

    token_display: string yang sudah "dibersihkan" (▁ dihilangkan/diganti spasi)
                   untuk ditampilkan ke user.
    token_raw    : representasi internal asli dari tokenizer, berguna buat
                   debugging atau tooltip.
    """

    token_display: str
    token_raw: str
    token_id: int


# ── Response ──────────────────────────────────────────────────────────────────

class GenerateResponse(BaseModel):
    """
    Response dari POST /api/generate.

    Frontend terima ini sekali, lalu Step/Play hanya iterasi
    index di array steps -- tanpa API call tambahan.

    prompt_tokens : token-token dari prompt asli (untuk panel kiri)
    steps         : semua langkah autoregressive (untuk animasi)
    total_steps   : len(steps), dikirim eksplisit supaya frontend
                    tidak perlu hitung sendiri
    generated_text: full teks hasil generate, untuk ditampilkan
                    di header/summary setelah selesai
    """

    prompt_tokens: list[PromptToken]
    steps: list[GenerationStep]
    total_steps: int
    generated_text: str


# ── Error response ────────────────────────────────────────────────────────────

class ErrorDetail(BaseModel):
    """
    Format error yang konsisten dari semua endpoint.

    FastAPI punya default error format sendiri, tapi untuk error
    yang kita raise manual (misal API key salah, prompt terlalu panjang),
    kita pakai ini supaya frontend bisa handle dengan satu error handler.
    """

    error: str
    detail: str | None = None