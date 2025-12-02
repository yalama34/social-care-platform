from openai import OpenAI
from typing import Optional
from dotenv import load_dotenv
import os

load_dotenv()
FOLDER_ID = os.getenv("YANDEX_FOLDER_ID")
API_KEY = os.getenv("YANDEX_API_KEY")
LLM_MODEL = f"gpt://{FOLDER_ID}/qwen3-235b-a22b-fp8/latest"

class AliceClient:
    def __init__(self, model: Optional[str] = None):
        self.model = model or LLM_MODEL
        self.temperature = 0.1
        self._client = OpenAI(
            base_url="https://rest-assistant.api.cloud.yandex.net/v1",
            api_key=API_KEY,
            project=FOLDER_ID,
        )

    async def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = self._client.responses.create(
            model=self.model,
            temperature=self.temperature,
            instructions=system_prompt,
            input=user_prompt,
            store=False
        )
        return response.output_text