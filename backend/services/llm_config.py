import os
from dotenv import load_dotenv

load_dotenv()

class LLMConfig:
    """大模型配置管理"""

    @staticmethod
    def get_api_base():
        """获取 API Base URL"""
        return os.getenv("API_BASE_URL", "https://api.deepseek.com/v1")

    @staticmethod
    def get_api_key():
        """获取 API Key"""
        return os.getenv("DEEPSEEK_API_KEY")

    @staticmethod
    def get_model():
        """获取模型名称"""
        return os.getenv("LLM_MODEL", "deepseek-chat")

    @staticmethod
    def get_temperature():
        """获取温度参数"""
        try:
            return float(os.getenv("LLM_TEMPERATURE", "0.7"))
        except ValueError:
            return 0.7

    @staticmethod
    def get_max_tokens():
        """获取最大 tokens"""
        try:
            return int(os.getenv("LLM_MAX_TOKENS", "1000"))
        except ValueError:
            return 1000
