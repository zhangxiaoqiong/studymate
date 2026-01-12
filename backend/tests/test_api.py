"""
测试 API 端点
"""
import pytest
from fastapi.testclient import TestClient


def test_root_endpoint():
    """
    测试根端点
    """
    # 这是一个占位符测试，确保 pytest 能找到并运行测试
    assert True


def test_example():
    """
    基本测试示例
    """
    # 简单的示例测试
    result = 1 + 1
    assert result == 2
