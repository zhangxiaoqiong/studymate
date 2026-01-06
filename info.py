#!/usr/bin/env python3
"""
Doc Explorer 项目信息脚本
用法: python info.py
"""

import os
from datetime import datetime

def print_header(text):
    """打印格式化的标题"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")

def print_section(title, items):
    """打印分组的信息"""
    print(f"📌 {title}:")
    for item in items:
        if isinstance(item, tuple):
            print(f"   {item[0]:<30} → {item[1]}")
        else:
            print(f"   • {item}")
    print()

def main():
    print("\n")
    print_header("🎉 Doc Explorer 项目信息")

    # 项目基本信息
    print_section("项目概览", [
        ("项目名称", "Doc Explorer"),
        ("类型", "AI 驱动的文档探索系统"),
        ("创建日期", "2026-01-04"),
        ("状态", "✅ MVP 完成"),
    ])

    # 目录结构
    print_section("项目结构", [
        "backend/          - FastAPI 后端应用",
        "frontend/         - React 前端应用",
        "*.md              - 完整的文档",
        "test_backend.py   - 后端测试脚本",
        "start.bat/.sh     - 启动脚本",
    ])

    # 快速启动
    print_section("🚀 快速启动", [
        ("Windows", "start.bat"),
        ("macOS/Linux", "chmod +x start.sh && ./start.sh"),
        ("前端地址", "http://localhost:5173"),
        ("后端地址", "http://localhost:8000"),
        ("API 文档", "http://localhost:8000/docs"),
    ])

    # 必要配置
    print_section("⚙️ 必要配置", [
        "1. 获取 DeepSeek API Key (https://deepseek.com)",
        "2. cd backend && cp .env.example .env",
        "3. 编辑 .env，填入你的 API Key",
        "4. 保存并启动应用",
    ])

    # 核心功能
    print_section("✨ 核心功能", [
        "• 文本上传和输入",
        "• AI 自动提取关键词",
        "• 交互式文本高亮",
        "• 点击获取详细解释",
        "• 侧边栏解释展示",
        "• 完整的 REST API",
    ])

    # 文档导航
    print_section("📚 文档导航", [
        ("快速参考", "QUICKREF.md"),
        ("项目简介", "README.md"),
        ("部署指南", "DEPLOYMENT.md"),
        ("功能清单", "CHECKLIST.md"),
        ("故障排查", "TROUBLESHOOTING.md"),
        ("项目总结", "PROJECT_SUMMARY.md"),
        ("文档索引", "INDEX.md"),
    ])

    # 测试和验证
    print_section("🧪 测试和验证", [
        ("后端测试", "python test_backend.py"),
        ("API 文档", "http://localhost:8000/docs"),
        ("示例文本", "见 TROUBLESHOOTING.md"),
    ])

    # 技术栈
    print_section("🛠️ 技术栈", [
        ("后端", "FastAPI + DeepSeek API + asyncio"),
        ("前端", "React 18 + Vite + Tailwind CSS"),
        ("数据库", "无（可选扩展）"),
        ("部署", "本地 / Docker / 云服务"),
    ])

    # 下一步
    print_section("📖 下一步", [
        "1. 阅读 QUICKREF.md 快速参考",
        "2. 运行 start.bat 或 start.sh",
        "3. 在浏览器中使用应用",
        "4. 查看 DEPLOYMENT.md 了解部署",
        "5. 阅读 TROUBLESHOOTING.md 解决问题",
    ])

    # 文件统计
    print_section("📊 项目统计", [
        ("Python 文件数", "5 (后端应用)"),
        ("React 文件数", "6 (前端应用)"),
        ("配置文件数", "5 (构建和部署)"),
        ("文档文件数", "7 (详细文档)"),
        ("启动脚本数", "2 (跨平台)"),
        ("测试脚本数", "1 (后端测试)"),
    ])

    # 快捷命令
    print_section("⚡ 快捷命令", [
        ("后端依赖", "pip install -r backend/requirements.txt"),
        ("前端依赖", "cd frontend && npm install"),
        ("启动后端", "cd backend && python main.py"),
        ("启动前端", "cd frontend && npm run dev"),
        ("运行测试", "python test_backend.py"),
        ("构建前端", "cd frontend && npm run build"),
    ])

    # 环境要求
    print_section("💻 环境要求", [
        ("Python", "3.9 或更高"),
        ("Node.js", "18 或更高"),
        ("npm", "自动与 Node.js 安装"),
        ("RAM", "2GB+ (推荐 4GB+)"),
        ("网络", "需要连接 DeepSeek API"),
    ])

    # 支持的功能
    print_section("✅ 支持的功能", [
        "✓ 关键词提取",
        "✓ 文本高亮",
        "✓ 解释生成",
        "✓ API 调用",
        "✓ 错误处理",
        "✓ 异步处理",
        "✓ CORS 支持",
        "✓ 响应式设计",
    ])

    # 许可证和注意
    print_section("⚠️ 重要提示", [
        "• 仅供学习和研究使用",
        "• 注意 API 调用费用",
        "• 不要上传敏感信息",
        "• 遵守 DeepSeek 使用协议",
        "• 确保安全使用 API Key",
    ])

    # 获得帮助
    print_section("🆘 获得帮助", [
        "• 查看 INDEX.md 找到合适的文档",
        "• 阅读 TROUBLESHOOTING.md 解决问题",
        "• 查看代码注释学习实现细节",
        "• 参考官方文档 (FastAPI, React, Tailwind)",
    ])

    # 完成
    print_header("🎊 准备好了吗？")
    print("现在就运行应用吧：\n")
    print("   Windows:        start.bat")
    print("   macOS/Linux:    ./start.sh")
    print("\n访问: http://localhost:5173\n")
    print("=" * 70)
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    main()
