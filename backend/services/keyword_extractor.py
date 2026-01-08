"""
关键词提取服务

使用大模型智能提取文本中的关键词、专业术语和核心知识点。
"""
import json
import os
import re
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

    def _extract_json(self, text: str) -> str:
        """
        从文本中提取 JSON 内容
        处理以下情况：
        1. 纯 JSON
        2. markdown 代码块：```json ... ```
        3. markdown 代码块：```...```
        4. 带有前缀/后缀的 JSON
        """
        text = text.strip()

        # 尝试处理 markdown 代码块
        if "```" in text:
            # 查找 ```json 或 ```
            # 匹配 ```json ... ``` 或 ``` ... ```
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
            if match:
                text = match.group(1).strip()

        # 尝试直接解析
        try:
            json.loads(text)
            return text
        except json.JSONDecodeError:
            pass

        # 尝试找到第一个 [ 和最后一个 ]
        start = text.find("[")
        end = text.rfind("]")

        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]

        return text

    async def extract(self, text: str) -> List[Dict]:
        """
        提取文本中的关键概念和专业术语

        Args:
            text: 要分析的文本内容

        Returns:
            list: 关键词列表，每项包含 keyword、snippet、category 字段
        """
        prompt = f"""你是一个专业的知识提取助手。请仔细阅读以下文本，提取出其中所有的专业术语、关键概念或核心知识点。

【重要要求】
- keyword 必须是文本中原样出现的词汇（不能改写或缩写）
- snippet 必须是文本中包含该关键词的完整句子或短语（从文本中直接摘抄，不能改写）
- 优先提取较长的关键词和短语，避免过于简单的单字或重复概念

文本内容：
"{text}"

请以JSON格式返回一个列表，每个元素包含：
- keyword: 关键词本身（必须是文本中原样出现的词汇）
- snippet: 包含该关键词的完整句子（必须从文本中直接摘抄，用于前端定位和高亮）
- category: 类别，如：定义、工具、人名、理论、方法、概念、架构、机制等

返回格式例子（这些词必须从文本中原样摘抄，不能改写）：
[
  {{"keyword": "深度学习", "snippet": "深度学习是机器学习的一个重要分支。", "category": "定义"}},
  {{"keyword": "神经网络", "snippet": "它使用多层神经网络来学习数据的表示。", "category": "架构"}}
]

【重要提醒】
1. 不要改写、缩写或改变 keyword 和 snippet
2. snippet 必须是文本中存在的完整句子
3. 同一个关键词不要出现多次
4. 只返回JSON数组，不要添加其他文字或解释"""

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

                # 尝试提取 JSON（处理大模型可能返回的 markdown 代码块）
                content = self._extract_json(content)

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
            print(f"❌ JSON 解析错误: {e}")
            print(f"原始内容: {content if 'content' in locals() else 'N/A'}")
            print(f"提取后内容: {text if 'text' in locals() else 'N/A'}")
            return []
        except Exception as e:
            print(f"❌ API 调用错误: {type(e).__name__}: {e}")
            import traceback
            traceback.print_exc()
            return []
