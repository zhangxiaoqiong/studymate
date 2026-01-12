"""
测试 API 端点
"""


def test_basic():
    """
    基本测试 - 确保 pytest 能正常运行
    """
    assert True


def test_math():
    """
    数学测试示例
    """
    result = 1 + 1
    assert result == 2


def test_string():
    """
    字符串测试示例
    """
    text = "StudyMate"
    assert len(text) == 9
    assert text.startswith("Study")

