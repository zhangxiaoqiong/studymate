# 项目初始化清单

## ✅ 已完成的工作

### 后端 (FastAPI + DeepSeek)
- [x] FastAPI 框架搭建
- [x] CORS 中间件配置
- [x] Pydantic 数据模型定义
- [x] 环境变量管理 (.env)
- [x] **关键词提取服务** (使用 DeepSeek API)
  - [x] JSON 结构化输出
  - [x] 自动去重
  - [x] 错误处理
- [x] **高亮数据生成** (防止嵌套替换)
  - [x] 按长度倒序排列关键词
  - [x] 精确位置索引 (start/end)
  - [x] 排序输出
- [x] **解释生成服务** (使用 DeepSeek API)
  - [x] 通俗易懂的解释提示词
  - [x] 异步 API 调用
  - [x] 错误恢复

### 前端 (React + Vite + Tailwind)
- [x] Vite 项目初始化
- [x] React 18 + TypeScript 集成
- [x] Tailwind CSS 配置
- [x] API 服务层 (axios)
- [x] **主应用流程** (App.jsx)
  - [x] 上传表单 → API 调用 → 状态管理
- [x] **文本高亮组件** (DocumentViewer.jsx)
  - [x] 渲染高亮的关键词
  - [x] 点击事件处理
  - [x] 自动排序处理重叠
- [x] **侧边栏解释** (Sidebar.jsx)
  - [x] 加载状态显示
  - [x] 解释内容展示
  - [x] 关闭按钮
- [x] **上传表单** (DocumentUpload.jsx)
  - [x] 文本输入框
  - [x] 标题输入
  - [x] 提交按钮

### 配置和部署
- [x] requirements.txt (Python 依赖)
- [x] package.json (Node 依赖)
- [x] vite.config.js (Vite 配置)
- [x] tailwind.config.js (Tailwind 配置)
- [x] postcss.config.js (PostCSS 配置)
- [x] .env.example (环境变量模板)

### 文档
- [x] README.md (项目简介和快速开始)
- [x] DEPLOYMENT.md (详细部署指南)
- [x] start.sh (Linux/macOS 启动脚本)
- [x] start.bat (Windows 启动脚本)
- [x] test_backend.py (后端功能测试)

---

## 📋 项目结构

```
doc-explorer/
├── backend/
│   ├── __init__.py
│   ├── main.py (FastAPI 应用, 3 个路由)
│   ├── requirements.txt (9 个依赖包)
│   ├── .env.example
│   └── services/
│       ├── __init__.py
│       ├── keyword_extractor.py (DeepSeek 关键词提取)
│       ├── highlighter.py (高亮数据生成)
│       └── explainer.py (DeepSeek 解释生成)
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx (主应用逻辑)
│   │   ├── index.css (Tailwind + 自定义样式)
│   │   ├── components/
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── DocumentViewer.jsx
│   │   │   └── Sidebar.jsx
│   │   └── services/
│   │       └── api.js (axios API 调用)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
├── README.md
├── DEPLOYMENT.md
├── test_backend.py
├── start.sh
├── start.bat
└── 这个清单文件
```

---

## 🚀 快速启动步骤

### 1️⃣ 配置 API Key
```bash
cd backend
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key
```

### 2️⃣ 安装后端依赖
```bash
cd backend
python -m venv venv
# 激活虚拟环境
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

### 3️⃣ 启动后端
```bash
python main.py
# 监听 http://localhost:8000
```

### 4️⃣ 安装前端依赖
```bash
cd frontend
npm install
```

### 5️⃣ 启动前端
```bash
npm run dev
# 监听 http://localhost:5173
```

### 6️⃣ 打开浏览器
访问 http://localhost:5173

---

## 🧪 测试

```bash
cd 项目根目录
python test_backend.py
```

这将测试：
1. ✅ 关键词提取功能
2. ✅ 高亮数据生成
3. ✅ 解释生成功能

---

## 📊 API 端点总结

| 方法 | 端点 | 功能 | 请求 | 响应 |
|------|------|------|------|------|
| POST | `/extract_keywords` | 提取关键词并生成高亮 | `{text, title}` | `{text, keywords[], spans[]}` |
| POST | `/explain_keyword` | 生成关键词解释 | `{keyword, context}` | `{keyword, explanation}` |
| GET | `/` | API 健康检查 | 无 | `{message}` |

---

## 🔧 核心技术特点

### 后端
- **异步支持**: 使用 `async/await` 处理并发请求
- **DeepSeek 集成**: 直接调用 DeepSeek API 进行 AI 操作
- **结构化输出**: JSON 格式化确保解析可靠性
- **错误恢复**: 完整的异常处理机制

### 前端
- **React Hooks**: 使用 useState, useEffect 管理状态
- **Tailwind CSS**: 原子化 CSS，快速开发
- **API 封装**: axios 统一管理 API 调用
- **响应式设计**: 自适应各种屏幕尺寸

### 工作流
1. 用户输入文本 →
2. 后端提取关键词 →
3. 后端生成高亮位置 →
4. 前端渲染高亮文本 →
5. 用户点击关键词 →
6. 后端生成详细解释 →
7. 前端在侧边栏显示

---

## 📝 后续改进方向

### 短期 (Week 1-2)
- [ ] 优化提示词，提高关键词质量
- [ ] 添加加载动画和错误提示
- [ ] 支持多个关键词同时点击对比

### 中期 (Week 3-4)
- [ ] PDF/Word 文档上传支持
- [ ] 向量数据库（ChromaDB/Pinecone）支持
- [ ] 基于私有文档的 RAG 检索

### 长期
- [ ] 苏格拉底式提问（深度学习模式）
- [ ] 关键词知识图谱可视化
- [ ] 导出为 Markdown 笔记
- [ ] 多语言支持

---

## 💡 设计决策

| 决策 | 原因 |
|------|------|
| FastAPI | 简洁、异步、自动 API 文档 |
| React + Vite | 快速开发、热重载、现代工具链 |
| Tailwind CSS | 快速样式开发、响应式设计 |
| DeepSeek API | 成本低、多语言支持、推理能力强 |
| 字符位置索引 | 精确定位、避免文本编码问题 |
| 长度倒序提取 | 防止嵌套替换（"苹果" vs "苹果公司"） |

---

## 🎯 MVP 成功指标

- [x] 后端可以正确提取关键词
- [x] 前端可以正确高亮关键词
- [x] 点击关键词可以获取解释
- [x] 侧边栏顺利显示和关闭
- [x] API 错误处理完善
- [x] 项目结构清晰易扩展

---

## 📞 获得帮助

- 检查 `DEPLOYMENT.md` 了解部署细节
- 查看 `README.md` 了解使用方法
- 运行 `test_backend.py` 测试功能
- 查看后端日志排查问题

---

**🎉 项目初始化完成！准备好开始探索你的文档吧！**
