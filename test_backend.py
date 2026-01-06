"""
测试脚本 - 验证后端API功能
"""

import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_extraction():
    """测试关键词提取"""
    print("=" * 60)
    print("测试 1: 关键词提取")
    print("=" * 60)

    from backend.services.keyword_extractor import KeywordExtractor

    text = """
    Transformer是一个基于自注意力机制的深度学习模型架构。它在自然语言处理领域取得了突破性的成功。
    Transformer使用位置编码来处理序列中的位置信息。多头注意力机制允许模型同时关注不同位置的多种表示。
    """

    extractor = KeywordExtractor()
    keywords = await extractor.extract(text)

    print(f"\n提取的关键词数量: {len(keywords)}")
    for i, kw in enumerate(keywords[:5], 1):
        print(f"\n{i}. {kw['keyword']}")
        print(f"   类别: {kw['category']}")
        print(f"   片段: {kw['snippet'][:50]}...")

async def test_highlighting():
    """测试高亮生成"""
    print("\n" + "=" * 60)
    print("测试 2: 高亮数据生成")
    print("=" * 60)

    from backend.services.highlighter import KeywordHighlighter

    text = "Transformer是一个模型。模型很重要。"
    keywords = [
        {"keyword": "Transformer", "snippet": "", "category": ""},
        {"keyword": "模型", "snippet": "", "category": ""}
    ]

    highlighter = KeywordHighlighter()
    spans = highlighter.generate_spans(text, keywords)

    print(f"\n原文: {text}")
    print(f"\n生成的高亮信息: {len(spans)} 个")
    for span in spans:
        highlight_text = text[span['start']:span['end']]
        print(f"  - '{highlight_text}' (位置: {span['start']}-{span['end']})")

async def test_explanation():
    """测试解释生成"""
    print("\n" + "=" * 60)
    print("测试 3: 解释生成")
    print("=" * 60)

    from backend.services.explainer import KeywordExplainer

    explainer = KeywordExplainer()
    explanation = await explainer.explain("Transformer", "深度学习模型")

    print(f"\n关键词: Transformer")
    print(f"上下文: 深度学习模型")
    print(f"\n生成的解释 (前200字):\n{explanation[:200]}...")

async def main():
    """运行所有测试"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " " * 10 + "Doc Explorer 后端功能测试" + " " * 24 + "║")
    print("╚" + "=" * 58 + "╝")

    # 检查API Key
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("\n❌ 错误: 未配置 DEEPSEEK_API_KEY")
        print("   请在 backend/.env 中设置你的 DeepSeek API Key")
        return

    try:
        await test_extraction()
        await test_highlighting()
        await test_explanation()

        print("\n" + "=" * 60)
        print("✅ 所有测试完成！")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ 测试失败: {e}")

if __name__ == "__main__":
    asyncio.run(main())
