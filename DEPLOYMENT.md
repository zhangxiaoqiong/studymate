# 部署和使用指南

## 快速启动 (3 分钟)

### Windows 用户
```bash
cd doc-explorer
start.bat
```

### macOS/Linux 用户
```bash
cd doc-explorer
chmod +x start.sh
./start.sh
```

## 手动启动

### 1. 启动后端

```bash
cd backend

# 激活虚拟环境
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# 安装依赖（首次）
pip install -r requirements.txt

# 配置 API Key
cp .env.example .env
# 编辑 .env，填入你的 DeepSeek API Key

# 启动
python main.py
```

访问 http://localhost:8000 查看API文档

### 2. 启动前端

```bash
cd frontend

# 安装依赖（首次）
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173 使用应用

## 测试后端

```bash
# 在项目根目录运行
python test_backend.py
```

## DeepSeek API 配置

### 获取 API Key

1. 访问 [DeepSeek官方网站](https://deepseek.com)
2. 注册并登录账户
3. 进入 API 管理页面
4. 创建新的 API Key

### 配置环境

编辑 `backend/.env`:
```env
DEEPSEEK_API_KEY=sk_xxxxxxxxxxxxx
API_BASE_URL=https://api.deepseek.com/v1
```

## 如何使用

### 基础流程

1. **打开应用** - 在浏览器访问 http://localhost:5173
2. **输入文本** - 粘贴或上传你的文档内容
3. **点击探索** - 应用会自动提取关键词并高亮显示
4. **点击关键词** - 右侧侧边栏会显示该词的详细解释

### 示例文本

可以试试这段文本：

```
深度学习是机器学习的一个分支，它基于人工神经网络。神经网络受到生物神经系统的启发。
在深度学习中，我们使用多层的神经网络来学习数据的表示。卷积神经网络（CNN）在计算机视觉领域表现出色。
循环神经网络（RNN）则在序列处理中表现优异。Transformer模型通过自注意力机制实现了重大进步。
```

## 常见问题

### 问: API 返回错误？

**答:**
- 检查 DeepSeek API Key 是否正确配置
- 检查网络连接
- 查看后端日志了解具体错误信息

### 问: 前端无法连接后端？

**答:**
- 确保后端在 http://localhost:8000 运行
- 检查浏览器控制台的网络错误
- 确认防火墙未阻止连接

### 问: 关键词提取不准确？

**答:**
- 增加文本长度，AI 在更多上下文下表现更好
- 调整后端的提示词（`backend/services/keyword_extractor.py`）
- 试试不同的文档类型

## 生产部署

### Docker 部署 (可选)

创建 `Dockerfile`:
```dockerfile
# 后端
FROM python:3.12-slim
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY backend/ .
CMD ["python", "main.py"]
```

构建和运行：
```bash
docker build -t doc-explorer-backend .
docker run -e DEEPSEEK_API_KEY=your_key -p 8000:8000 doc-explorer-backend
```

## 项目结构回顾

```
doc-explorer/
├── backend/
│   ├── main.py                  # FastAPI 应用
│   ├── requirements.txt
│   ├── .env.example
│   └── services/
│       ├── keyword_extractor.py  # AI 提取关键词
│       ├── highlighter.py        # 生成高亮位置
│       └── explainer.py          # AI 生成解释
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # 主应用
│   │   ├── components/           # React 组件
│   │   └── services/             # API 调用
│   ├── package.json
│   └── index.html
├── README.md
├── test_backend.py               # 后端测试脚本
├── start.sh                      # Linux/macOS 启动脚本
└── start.bat                     # Windows 启动脚本
```

## 性能优化建议

1. **缓存** - 考虑缓存频繁查询的关键词解释
2. **分块处理** - 大文本可以分块提交给 API
3. **前端优化** - 高亮操作在 1000+ 关键词时可能变慢

## 下一步改进

- [ ] PDF/Word 文档支持
- [ ] 向量数据库（RAG）支持
- [ ] 苏格拉底式提问（深度学习模式）
- [ ] 关键词知识图谱
- [ ] 导出为笔记或卡片

---

需要帮助？提交 Issue 或联系支持！
