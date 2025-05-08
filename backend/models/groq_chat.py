
# gemma2-9b-it
# llama-3.3-70b-versatile
# deepseek-r1-distill-llama-70b
# qwen-qwq-32b
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))


import os
from groq import AsyncGroq

# gemma2-9b-it , llama-3.3-70b-versatile ,whisper-large-v3 ,distil-whisper-large-v3-en

async def chat_with_groq(user_input: str) -> str:
    api_key = "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"
    client = AsyncGroq(api_key=api_key)

    print(f"User input: {user_input}")

    completion = await client.chat.completions.create(
        model="gemma2-9b-it",
        messages=[
            {"role": "user", "content": user_input}
        ],
        temperature=1,
        max_completion_tokens=1024,
        top_p=1,
        stream=True,
        stop=None,
    )

    response = ""
    async for chunk in completion:
        response += chunk.choices[0].delta.content or ""

    print(f"Response from Groq: {response}")
    return response