from requests import request
import requests
import os
import math

DEEPSEEK_API_URL="https://api.deepseek.com/beta/completions"

def call_deepseek_fim(prompt: str, max_tokens: int = 20, top_logprobs: int = 20) -> dict:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        raise RuntimeError("Deepseek API Key belum di-set di environment")
    
    response = requests.post(
        DEEPSEEK_API_URL,
        headers={
            "Authorization":f"Bearer {api_key}",
            "Content-Type":"application/json"
        },
        json={
            "model":"deepseek-v4-flash",
            "prompt":prompt,
            "max_tokens":max_tokens,
            "logprobs":top_logprobs,
            "temperature":0
        },
        timeout=30
    )

    response.raise_for_status()
    return response.json()

def parse_fim_response(raw_response: dict) -> dict:

    choices = raw_response["choices"][0]
    logprob = choices["logprobs"]

    selected_tokens = logprob["tokens"]
    candidate_per_step = logprob["top_logprobs"]

    step = []
    for step_index, (selected_token, candidates) in enumerate(
        zip(selected_tokens, candidate_per_step)
    ):
        ranked_candidates = sorted(
            [(token, math.exp(logprob)) for token, logprob in candidates.items()],
            key=lambda pair:pair[1],
            reverse=True
        )

        is_stop = "end_of_sentence" in selected_token or "im_end" in selected_token

        step.append({
            "step_index":step_index,
            "selected_token":selected_token,
            "is_stop":is_stop,
            "candidates":[
                {"token":token, "probability":round(prob, 4) }
                for token, prob in ranked_candidates
            ]
        })
        return step

def generate_with_steps(prompt:str, max_tokens: int =20, top_logprobs:int=20) -> list[dict]:
    raw_response = call_deepseek_fim(prompt, max_tokens=max_tokens, top_logprobs=top_logprobs)
    return parse_fim_response(raw_response)

    