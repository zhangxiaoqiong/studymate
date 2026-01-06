# 快速参考卡片

## 🚀 一分钟启动

```bash
# Windows
cd doc-explorer
start.bat

# macOS/Linux
cd doc-explorer
./start.sh
```

## 📍 访问地址

- **前端**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

## ⚙️ 必要配置

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key
```

## 📁 核心文件位置

| 用途 | 文件 |
|------|------|
| API 服务 | `backend/main.py` |
| 主应用 | `frontend/src/App.jsx` |
| 关键词提取 | `backend/services/keyword_extractor.py` |
| 文本高亮 | `backend/services/highlighter.py` |
| 解释生成 | `backend/services/explainer.py` |
| 组件库 | `frontend/src/components/` |

## 🔌 API 快速查询

### 提取关键词
```bash
curl -X POST http://localhost:8000/extract_keywords \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你的文本",
    "title": "文档标题"
  }'
```

### 生成解释
```bash
curl -X POST http://localhost:8000/explain_keyword \
  -H "Content-Type: application/json" \
  -d '{
    "keyword": "Transformer",
    "context": ""
  }'
```

## 🧪 测试命令

```bash
# 测试后端功能
cd doc-explorer
python test_backend.py

# 检查后端是否在线
curl http://localhost:8000/
```

## 🛠️ 常用命令

```bash
# 后端虚拟环境激活
cd backend

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# 安装/更新依赖
pip install -r requirements.txt

# 启动后端
python main.py

# 前端依赖
cd ../frontend
npm install

# 启动前端
npm run dev

# 打包前端
npm run build
```

## 🎯 核心概念

| 概念 | 说明 |
|------|------|
| **关键词** | AI 从文本中提取的重要术语 |
| **高亮** | 前端中以不同颜色标记的关键词 |
| **Span** | 文本中关键词的位置信息 (start, end) |
| **侧边栏** | 点击关键词时显示的解释面板 |
| **提示词** | 发送给 LLM 的指令文本 |

## 🔑 环境变量

```env
DEEPSEEK_API_KEY=sk_xxxxxxxxxxxxx
API_BASE_URL=https://api.deepseek.com/v1
```

## 📊 文件大小参考

- 后端代码: ~500 行 Python
- 前端代码: ~400 行 React/JSX
- 总项目大小: ~20MB (包括 node_modules 和虚拟环境)

## 🐛 快速诊断

```bash
# 1. 后端是否运行?
curl http://localhost:8000/

# 2. API Key 是否正确?
# 编辑 backend/.env 检查

# 3. 前端是否连接到后端?
# 打开浏览器 F12，Network 标签查看请求

# 4. 是否有 JavaScript 错误?
# 打开浏览器 F12，Console 标签查看日志
```

## 📚 推荐阅读顺序

1. **README.md** - 项目概览
2. **DEPLOYMENT.md** - 部署指南
3. **CHECKLIST.md** - 功能清单
4. **TROUBLESHOOTING.md** - 问题排查
5. **代码注释** - 阅读源代码

## 🎨 自定义要点

- **改变颜色** - 编辑 `frontend/src/index.css` 中的 `.highlight`
- **调整字体** - 在 Tailwind 配置中修改 font-family
- **改变解释风格** - 修改 `backend/services/explainer.py` 中的 prompt
- **添加新功能** - 在 `backend/main.py` 中添加新的路由

## 💡 优化建议

- **关键词数量太多?** 调整提取器中的提示词
- **API 调用费用高?** 使用长文本一次性提取
- **前端渲染慢?** 使用 React DevTools 分析性能

## 🚨 如果卡住了

1. 查看后端日志 (终端输出)
2. 打开浏览器开发者工具 (F12)
3. 尝试重启服务
4. 清除缓存: 浏览器 Ctrl+Shift+Delete
5. 查看 TROUBLESHOOTING.md

## 📞 支持资源

- DeepSeek API: https://deepseek.com
- FastAPI 文档: https://fastapi.tiangolo.com
- React 文档: https://react.dev
- Tailwind CSS: https://tailwindcss.com

## ✨ 你现在拥有

✅ 完整的后端 API (3 个端点)
✅ 漂亮的 React 前端 (4 个组件)
✅ DeepSeek 集成
✅ 完整的文档
✅ 测试脚本
✅ 启动脚本

**现在就去试试吧！** 🎉
