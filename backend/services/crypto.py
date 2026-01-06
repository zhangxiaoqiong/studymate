"""
API Key 加密/解密模块
使用 Fernet（AES 加密）确保 API Key 安全存储
"""
import os
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# 获取或生成加密密钥
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")

if not ENCRYPTION_KEY:
    # 如果没有设置加密密钥，生成一个新的
    ENCRYPTION_KEY = Fernet.generate_key().decode()
    print(f"⚠️ 警告：未设置 ENCRYPTION_KEY，已生成新密钥:")
    print(f"请在 .env 中设置: ENCRYPTION_KEY={ENCRYPTION_KEY}")

cipher = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)


def encrypt_api_key(api_key: str) -> str:
    """加密 API Key"""
    if not api_key:
        return ""
    encrypted = cipher.encrypt(api_key.encode())
    return encrypted.decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """解密 API Key"""
    if not encrypted_key:
        return ""
    try:
        decrypted = cipher.decrypt(encrypted_key.encode())
        return decrypted.decode()
    except Exception as e:
        print(f"解密失败: {e}")
        return ""


def mask_api_key(api_key: str, show_chars: int = 4) -> str:
    """将 API Key 部分掩码显示，仅显示最后 N 个字符"""
    if not api_key or len(api_key) <= show_chars:
        return "***"
    return f"***{api_key[-show_chars:]}"
