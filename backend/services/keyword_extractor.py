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
        5. 被截断的 JSON（尝试修复）
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
            extracted = text[start : end + 1]
            # 再次验证提取的部分是否是有效 JSON
            try:
                json.loads(extracted)
                return extracted
            except json.JSONDecodeError:
                # 尝试修复被截断的 JSON
                # 如果最后一项不完整，尝试移除它
                if extracted.rstrip()[-1] != "]":
                    # 尝试找到最后一个完整的 }
                    last_close_brace = extracted.rfind("}")
                    if last_close_brace != -1:
                        # 检查最后一个 } 后面是否有逗号或其他内容
                        after_brace = extracted[last_close_brace + 1:].strip()
                        if after_brace.endswith(","):
                            # 移除末尾的逗号和可能的不完整项
                            extracted = extracted[:last_close_brace + 1] + "]"
                            try:
                                json.loads(extracted)
                                print(f"⚠️  JSON 被截断，已尝试修复")
                                return extracted
                            except json.JSONDecodeError:
                                pass

        # 尝试找到第一个 { 和最后一个 }（处理对象格式）
        start = text.find("{")
        end = text.rfind("}")

        if start != -1 and end != -1 and end > start:
            extracted = text[start : end + 1]
            try:
                json.loads(extracted)
                return extracted
            except json.JSONDecodeError:
                pass

        # 如果都失败了，返回原始文本（会在调用处报错）
        return text



    async def extract(self, text: str) -> List[Dict]:
        """
        提取文本中的关键概念和专业术语

        Args:
            text: 要分析的文本内容

        Returns:
            list: 关键词列表，每项包含 keyword 字段
        """
        prompt = f"""请从以下文本中提取最多50个关键词或关键概念。
每个关键词必须是文本中原样出现的词汇，不能改写。

文本：
"{text}"

只返回JSON数组，格式为：
[
  {{"keyword": "关键词1"}},
  {{"keyword": "关键词2"}}
]

要求：
- 优先提取较长的短语或专业术语
- 同一个关键词不要出现多次
- 最多50个关键词
- 只返回JSON，不添加其他文字"""

        content = None
        try:
            print(f"🔍 开始提取关键词...")
            print(f"📍 API 地址: {self.api_base}")
            print(f"🤖 使用模型: {self.model}")
            print(f"📏 文本长度: {len(text)} 字符")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 6000
                    }
                )

                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"].strip()

                # 尝试提取 JSON（处理大模型可能返回的 markdown 代码块）
                extracted_json = self._extract_json(content)

                # 验证 JSON 格式
                try:
                    keywords = json.loads(extracted_json)
                except json.JSONDecodeError as e:
                    print(f"⚠️  JSON 解析失败: {e}")
                    print(f"📝 原始响应: {content[:300]}")
                    print(f"📋 提取的内容: {extracted_json[:300]}")
                    raise

                # 验证返回值是列表
                if not isinstance(keywords, list):
                    print(f"❌ 返回值不是数组，而是 {type(keywords).__name__}")
                    return []

                # 验证每个项目的格式，只需要 keyword 字段
                valid_keywords = []
                for i, kw in enumerate(keywords):
                    if not isinstance(kw, dict):
                        continue
                    if "keyword" not in kw:
                        continue
                    valid_keywords.append({"keyword": kw["keyword"]})

                # 去重：按 keyword 去重，保留第一个出现的
                seen = set()
                unique_keywords = []
                for kw in valid_keywords:
                    if kw["keyword"] not in seen:
                        seen.add(kw["keyword"])
                        unique_keywords.append(kw)

                print(f"✅ 成功提取 {len(unique_keywords)} 个关键词")
                return unique_keywords

        except json.JSONDecodeError as e:
            print(f"❌ JSON 解析错误: {e}")
            if content:
                print(f"原始响应内容: {content[:300]}")
            return []
        except Exception as e:
            error_name = type(e).__name__
            error_msg = str(e)
            print(f"❌ 提取关键词失败: {error_name}: {error_msg}")

            # 针对常见错误提供诊断信息
            if "getaddrinfo failed" in error_msg or "ConnectError" in error_name:
                print(f"⚠️  网络连接失败！")
                print(f"📍 请检查以下内容：")
                print(f"   1. API 地址是否正确: {self.api_base}")
                print(f"   2. 网络连接是否正常")
                print(f"   3. 是否需要配置代理")
            elif "Unauthorized" in error_name or "401" in error_msg:
                print(f"⚠️  API Key 无效或过期")
                print(f"   请检查配置中的 API Key 是否正确")
            elif "Timeout" in error_name:
                print(f"⚠️  API 请求超时")
                print(f"   可能是网络问题或 API 服务响应缓慢")

            import traceback
            traceback.print_exc()
            return []

