"""
关键词解释服务

使用大模型为给定的关键词生成详细、易懂的解释，支持：
- 普通解释（非流式）
- 流式解释（实时返回）
- 后续问答（基于已有解释回答用户问题）
"""
import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

class KeywordExplainer:
    """使用大模型生成关键词的详细解释"""

    def __init__(self, config=None):
        """
        初始化关键词解释器

        Args:
            config: 包含 apiKey, apiBase, modelName, temperature, maxTokens 等的配置字典
        """
        api_key = None
        if config:
            api_key = config.get("apiKey")

        # 如果配置中没有 API Key，从环境变量读取
        if not api_key:
            api_key = os.getenv("DEEPSEEK_API_KEY")

        # 获取其他配置参数
        if config:
            api_base = config.get("apiBase", "https://api.deepseek.com/v1")
            self.model = config.get("modelName", "deepseek-chat")
            self.temperature = config.get("temperature", 0.7)
            self.max_tokens = config.get("maxTokens", 1000)
        else:
            api_base = os.getenv("API_BASE_URL", "https://api.deepseek.com/v1")
            self.model = os.getenv("LLM_MODEL", "deepseek-chat")
            self.temperature = float(os.getenv("LLM_TEMPERATURE", "0.7"))
            self.max_tokens = int(os.getenv("LLM_MAX_TOKENS", "1000"))

        if not api_key:
            raise ValueError("API Key not found in config or environment variables")

        self.api_key = api_key
        self.api_base = api_base

    async def explain(self, keyword: str, context: str = "") -> str:
        """
        生成关键词的详细解释（非流式）

        Args:
            keyword: 要解释的关键词
            context: 额外上下文信息（可选）

        Returns:
            str: 详细的解释文本
        """
        context_part = f"\n额外上下文：{context}" if context else ""
        prompt = f"""你是一个耐心的老师。请用通俗易懂的语言解释以下概念，并举一个实际例子。

概念：{keyword}{context_part}

请按以下格式回答：
1. 简单定义（1-2句）
2. 核心要点（2-3个要点）
3. 实际例子（具体应用）
4. 与其他概念的关系（可选，如果有关联）"""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                # 安全地访问 choices
                if "choices" in data and len(data["choices"]) > 0:
                    explanation = data["choices"][0]["message"]["content"].strip()
                    return explanation
                else:
                    return f"API 返回格式错误，无法生成'{keyword}'的解释。"

        except Exception as e:
            print(f"API 调用错误: {type(e).__name__}: {e}")
            return f"无法生成'{keyword}'的解释，请稍后重试。"

    async def explain_stream(self, keyword: str, context: str = ""):
        """
        生成关键词的详细解释（流式）

        Args:
            keyword: 要解释的关键词
            context: 额外上下文信息（可选）

        Yields:
            str: 解释文本的流式块
        """
        context_part = f"\n额外上下文：{context}" if context else ""
        prompt = f"""你是一个耐心的老师。请用通俗易懂的语言解释以下概念，并举一个实际例子。

概念：{keyword}{context_part}

请按以下格式回答：
1. 简单定义（1-2句）
2. 核心要点（2-3个要点）
3. 实际例子（具体应用）
4. 与其他概念的关系（可选，如果有关联）"""

        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": self.temperature,
                        "max_tokens": self.max_tokens,
                        "stream": True
                    },
                    timeout=30.0
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]  # 移除 "data: " 前缀
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                # 安全地访问 choices 列表
                                if chunk and "choices" in chunk and len(chunk["choices"]) > 0:
                                    delta = chunk["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except (json.JSONDecodeError, IndexError, KeyError) as e:
                                # 跳过格式不正确的行
                                continue

        except Exception as e:
            print(f"API 流式调用错误: {type(e).__name__}: {e}")
            yield f"无法生成'{keyword}'的解释，请稍后重试。"

    async def answer_followup(self, keyword: str, explanation: str, question: str) -> str:
        """
        对已有的解释进行后续提问（非流式）

        Args:
            keyword: 原始关键词
            explanation: 之前的详细解释
            question: 用户的后续问题

        Returns:
            str: 回答文本
        """
        prompt = f"""你是一个耐心的老师。用户就之前的解释有一个后续问题。

原始概念：{keyword}

之前的解释：
{explanation}

用户的问题：{question}

请基于之前的解释，直接、清楚地回答用户的问题。如果可能的话，举个具体例子来说明。"""

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 800
                    },
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                # 安全地访问 choices
                if "choices" in data and len(data["choices"]) > 0:
                    answer = data["choices"][0]["message"]["content"].strip()
                    return answer
                else:
                    return "API 返回格式错误，无法生成回答。"

        except Exception as e:
            print(f"API 调用错误: {type(e).__name__}: {e}")
            return f"无法回答你的问题，请稍后重试。"

    async def answer_followup_stream(self, keyword: str, explanation: str, question: str):
        """
        对已有的解释进行后续提问（流式）

        Args:
            keyword: 原始关键词
            explanation: 之前的详细解释
            question: 用户的后续问题

        Yields:
            str: 回答文本的流式块
        """
        prompt = f"""你是一个耐心的老师。用户就之前的解释有一个后续问题。

原始概念：{keyword}

之前的解释：
{explanation}

用户的问题：{question}

请基于之前的解释，直接、清楚地回答用户的问题。如果可能的话，举个具体例子来说明。"""

        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": 800,
                        "stream": True
                    },
                    timeout=30.0
                ) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                # 安全地访问 choices 列表
                                if chunk and "choices" in chunk and len(chunk["choices"]) > 0:
                                    delta = chunk["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except (json.JSONDecodeError, IndexError, KeyError) as e:
                                # 跳过格式不正确的行
                                continue

        except Exception as e:
            print(f"API 流式调用错误: {type(e).__name__}: {e}")
            yield f"无法回答你的问题，请稍后重试。"
