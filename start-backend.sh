#!/bin/bash
# 启动后端服务

cd "$(dirname "$0")/backend"

echo "=================================================="
echo "启动 Doc Explorer 后端服务"
echo "=================================================="
echo ""
echo "环境检查："
echo "  - Python 版本: $(python --version)"
echo "  - FastAPI 已安装: $(python -c 'import fastapi; print(fastapi.__version__)' 2>/dev/null || echo '未安装')"
echo ""

# 杀死端口 8001 上的所有进程
echo "清理端口 8001 上的旧进程..."
lsof -ti:8001 | xargs kill -9 2>/dev/null || echo "  - 没有找到占用端口的进程"

sleep 1

# 保留数据库，避免每次启动都清除数据
echo "数据库已保留"

echo "启动后端服务..."
echo "访问地址: http://localhost:8001"
echo "API 文档: http://localhost:8001/docs"
echo ""
echo "按 Ctrl+C 停止服务"
echo ""

python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
