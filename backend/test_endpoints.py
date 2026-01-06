#!/usr/bin/env python
"""
测试 API 端点（通过 HTTP 请求）
"""
import requests
import json
import time
import subprocess
import sys

def start_backend():
    """启动后端服务"""
    print("正在启动后端服务...")
    try:
        import os
        if sys.platform == 'win32':
            # Windows 上先杀死占用的进程
            os.system("powershell -Command \"Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue | Stop-Process -Force 2>&1; exit 0\" 2>/dev/null || true")
            time.sleep(1)
    except:
        pass

def test_endpoints():
    BASE_URL = "http://localhost:8001"

    print("=" * 60)
    print("测试 API 端点")
    print("=" * 60)

    # 测试 1: 保存配置
    print("\n1. 测试 POST /llm_config (保存配置)")
    config_data = {
        "configName": "Test DeepSeek",
        "apiBase": "https://api.deepseek.com/v1",
        "apiKey": "sk-test-key-12345",
        "modelName": "deepseek-chat",
        "temperature": 0.7,
        "maxTokens": 1000
    }
    try:
        response = requests.post(f"{BASE_URL}/llm_config", json=config_data, timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        if response.status_code != 200:
            print(f"   Error: {response.text}")
            return False
    except requests.exceptions.ConnectionError:
        print("   Connection Error - Backend not running")
        return False
    except Exception as e:
        print(f"   Error: {e}")
        return False

    # 测试 2: 获取配置
    print("\n2. 测试 GET /llm_config (获取配置)")
    try:
        response = requests.get(f"{BASE_URL}/llm_config", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")

    # 测试 3: 获取所有用户配置
    print("\n3. 测试 GET /user_config")
    try:
        response = requests.get(f"{BASE_URL}/user_config", timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")

    print("\n" + "=" * 60)
    print("测试完成")
    print("=" * 60)
    return True

if __name__ == "__main__":
    try:
        result = test_endpoints()
        sys.exit(0 if result else 1)
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


