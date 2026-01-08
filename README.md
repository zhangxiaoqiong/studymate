# StudyMate - 智能学习助手

一个结合 AI 的学习辅助工具，通过智能提取关键概念和生成详细解释，帮助你深度理解任何文档。

## 项目结构

```
studymate/
├── backend/                    # FastAPI后端
│   ├── main.py                # 应用入口
│   ├── requirements.txt        # Python依赖
│   ├── .env.example            # 环境变量模板
│   └── services/               # 业务逻辑
│       ├── keyword_extractor.py  # 知识点提取
│       ├── highlighter.py        # 高亮数据生成
│       └── explainer.py          # 解释生成
│
└── frontend/                   # React前端
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── DocumentUpload.jsx   # 文本上传表单
        │   ├── DocumentViewer.jsx   # 高亮文本显示
        │   └── Sidebar.jsx          # 解释侧边栏
        └── services/
            └── api.js              # API调用

```

## 快速开始

### 1. 环境准备

**要求：**
- Python 3.9+
- Node.js 18+
- DeepSeek API Key

### 2. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key
# DEEPSEEK_API_KEY=your_key_here

# 启动服务
python main.py
```

服务将在 `http://localhost:8000` 运行。

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:5173` 运行。

## API 端点

### POST /extract_keywords
提取文本中的关键词并生成高亮数据

**请求：**
```json
{
  "text": "你的文本内容",
  "title": "文档标题"
}
```

**响应：**
```json
{
  "text": "原始文本",
  "keywords": [
    {"keyword": "Transformer", "snippet": "...", "category": "架构"}
  ],
  "spans": [
    {"keyword": "Transformer", "start": 10, "end": 21}
  ]
}
```

### POST /explain_keyword
生成关键词的详细解释

**请求：**
```json
{
  "keyword": "Transformer",
  "context": ""
}
```

**响应：**
```json
{
  "keyword": "Transformer",
  "explanation": "详细解释文本..."
}
```

## 核心功能

✅ **文本上传** - 支持粘贴或上传文本内容
✅ **关键点提取** - AI自动识别重要概念
✅ **交互式高亮** - 点击关键词获取详细解释
✅ **智能解释** - 基于上下文的通俗易懂的解释
✅ **侧边栏显示** - 无干扰的解释浏览体验

## 工作流程

```
用户输入文本
    ↓
AI提取关键词
    ↓
生成高亮数据
    ↓
前端渲染高亮文本
    ↓
用户点击关键词
    ↓
AI生成详细解释
    ↓
侧边栏展示解释
```

## DeepSeek API 配置

如果你没有 DeepSeek API Key：

1. 访问 [DeepSeek 官网](https://deepseek.com)
2. 注册账户并获取 API Key
3. 在 `backend/.env` 中配置

## 开发建议

- **短文本优先** - MVP 阶段先处理 500-2000 字的文本
- **调整温度参数** - 在 `explainer.py` 中修改 `temperature` 以控制解释的创意程度
- **性能优化** - 长文本可以分块处理

## 下一步改进

- [ ] 支持 PDF 上传
- [ ] 构建向量数据库进行 RAG 检索
- [ ] 添加苏格拉底式提问（深度学习）
- [ ] 支持多语言
- [ ] 关键词去重和嵌套词处理优化

---

🚀 现在就试试吧！
