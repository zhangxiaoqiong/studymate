"""
数据库模型和管理
使用 SQLite 存储 LLM 配置
"""
import sqlite3
import json
from pathlib import Path
from services.crypto import encrypt_api_key, decrypt_api_key

# 数据库文件路径
DB_PATH = Path(__file__).parent.parent / "llm_config.db"


def init_db():
    """初始化数据库"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 创建配置表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS llm_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_name TEXT UNIQUE NOT NULL,
            api_base TEXT NOT NULL,
            api_key_encrypted TEXT NOT NULL,
            model_name TEXT NOT NULL,
            temperature REAL DEFAULT 0.7,
            max_tokens INTEGER DEFAULT 1000,
            is_active INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()


def get_active_config() -> dict:
    """获取当前活跃的配置"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM llm_configs WHERE is_active = 1 LIMIT 1")
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def get_config_by_name(config_name: str) -> dict:
    """按名称获取配置"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM llm_configs WHERE config_name = ?", (config_name,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return dict(row)
    return None


def get_all_configs() -> list:
    """获取所有配置（不含敏感信息）"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT id, config_name, api_base, model_name, temperature, max_tokens, is_active FROM llm_configs")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def save_config(config_name: str, api_base: str, api_key: str,
                model_name: str, temperature: float, max_tokens: int,
                is_active: bool = False) -> bool:
    """保存配置（加密 API Key）"""
    init_db()

    if not api_key:
        raise ValueError("API Key 不能为空")

    encrypted_key = encrypt_api_key(api_key)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 检查是否已存在
        cursor.execute("SELECT id FROM llm_configs WHERE config_name = ?", (config_name,))
        existing = cursor.fetchone()

        if existing:
            # 更新现有配置
            cursor.execute("""
                UPDATE llm_configs
                SET api_base = ?, api_key_encrypted = ?, model_name = ?,
                    temperature = ?, max_tokens = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE config_name = ?
            """, (api_base, encrypted_key, model_name, temperature, max_tokens, 1 if is_active else 0, config_name))
        else:
            # 插入新配置
            cursor.execute("""
                INSERT INTO llm_configs
                (config_name, api_base, api_key_encrypted, model_name, temperature, max_tokens, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (config_name, api_base, encrypted_key, model_name, temperature, max_tokens, 1 if is_active else 0))

        # 如果设为活跃，取消其他配置的活跃状态
        if is_active:
            cursor.execute("UPDATE llm_configs SET is_active = 0 WHERE config_name != ?", (config_name,))

        conn.commit()
        return True
    except Exception as e:
        print(f"保存配置失败: {e}")
        return False
    finally:
        conn.close()


def activate_config(config_name: str) -> bool:
    """激活配置"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE llm_configs SET is_active = 0")
        cursor.execute("UPDATE llm_configs SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE config_name = ?", (config_name,))
        conn.commit()
        return True
    except Exception as e:
        print(f"激活配置失败: {e}")
        return False
    finally:
        conn.close()


def activate_config_by_id(config_id: int) -> bool:
    """按 ID 激活配置（更可靠）"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("UPDATE llm_configs SET is_active = 0")
        cursor.execute("UPDATE llm_configs SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (config_id,))
        conn.commit()
        return True
    except Exception as e:
        print(f"激活配置失败: {e}")
        return False
    finally:
        conn.close()


def delete_config(config_name: str) -> bool:
    """删除配置"""
    init_db()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM llm_configs WHERE config_name = ?", (config_name,))
        conn.commit()
        return True
    except Exception as e:
        print(f"删除配置失败: {e}")
        return False
    finally:
        conn.close()


def get_decrypted_config(config_name: str) -> dict:
    """获取配置并解密 API Key（仅供后端内部使用）"""
    config = get_config_by_name(config_name)
    if not config:
        return None

    config_dict = dict(config)
    # 解密 API Key
    config_dict['api_key'] = decrypt_api_key(config_dict.get('api_key_encrypted', ''))
    # 移除加密的 API Key
    config_dict.pop('api_key_encrypted', None)

    return config_dict
