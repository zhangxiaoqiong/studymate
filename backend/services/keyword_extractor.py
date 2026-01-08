"""
关键词提取服务

使用大模型智能提取文本中的关键词、专业术语和核心知识点。
"""
import json
import os
from typing import List, Dict
import httpx
from dotenv import load_dotenv

load_dotenv()

class KeywordExtractor:
    """使用大模型提取关键词"""

    def __init__(self, config=None):
        """
        初始化关键词提取器

        Args:
            config: 包含 apiKey, apiBase, modelName 等的配置字典
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
        else:
            api_base = os.getenv("API_BASE_URL", "https://api.deepseek.com/v1")
            self.model = os.getenv("LLM_MODEL", "deepseek-chat")

        if not api_key:
            raise ValueError("API Key not found in config or environment variables")

        self.api_key = api_key
        self.api_base = api_base

    async def extract(self, text: str) -> List[Dict]:
        """
        提取文本中的关键概念和专业术语

        Args:
            text: 要分析的文本内容

        Returns:
            list: 关键词列表，每项包含 keyword、snippet、category 字段
        """
        prompt = f"""你是一个专业的助教。请阅读以下文本，提取出其中所有的专业术语、关键概念或核心知识点。

文本内容：
"{text}"

请以JSON格式返回一个列表，每个元素包含：
- keyword: 关键词本身（字符串）
- snippet: 关键词所在的句子或上下文片段（字符串，用于后续定位）
- category: 类别，如：定义、工具、人名、理论、方法等（字符串）

返回格式例子：
[
  {{"keyword": "Transformer", "snippet": "Transformer架构在自然语言处理中...", "category": "架构"}},
  {{"keyword": "注意力机制", "snippet": "注意力机制是...", "category": "机制"}}
]

只返回JSON数组，不要添加其他文字。"""

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
                        "temperature": 0.5,
                        "max_tokens": 2000
                    },
                    timeout=30.0
                )

                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                keywords = json.loads(content)

                # 去重：按 keyword 去重，保留第一个出现的
                seen = set()
                unique_keywords = []
                for kw in keywords:
                    if kw["keyword"] not in seen:
                        seen.add(kw["keyword"])
                        unique_keywords.append(kw)

                return unique_keywords

        except json.JSONDecodeError as e:
            print(f"JSON 解析错误: {e}")
            print(f"API 返回内容: {content if 'content' in locals() else 'N/A'}")
            return []
        except Exception as e:
            print(f"API 调用错误: {e}")
            return []
