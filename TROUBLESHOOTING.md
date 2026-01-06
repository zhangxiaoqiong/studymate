# 完整使用指南和故障排查

## 工作流示例

### 示例文本

```
人工智能（AI）是计算机科学的一个分支，致力于研究和开发能够执行通常需要人类智能的任务的计算机系统。

机器学习是人工智能的一个关键子领域。它使计算机能够通过经验学习，而无需被明确编程。神经网络是机器学习中的一种重要模型，受到生物神经系统的启发。

深度学习是机器学习的一个分支，它使用包含多个层次的神经网络来学习数据的高层次表示。卷积神经网络（CNN）在图像识别任务中表现出色。循环神经网络（RNN）在处理序列数据时效果良好。

Transformer 架构是近年来的一个重大突破，它基于自注意力机制。Transformer 在自然语言处理、计算机视觉等多个领域都实现了最先进的性能。自注意力机制允许模型在处理序列时同时关注所有位置。
```

### 期望结果

会提取的关键词示例：
- 人工智能
- 计算机科学
- 机器学习
- 神经网络
- 深度学习
- 卷积神经网络（CNN）
- 循环神经网络（RNN）
- Transformer
- 自注意力机制
- 自然语言处理

---

## 常见问题排查

### ❌ 错误: "DEEPSEEK_API_KEY not found"

**原因**: 环境变量未配置

**解决方案**:
```bash
cd backend
cp .env.example .env
# 使用文本编辑器打开 .env，填入你的 API Key
# 例如:
# DEEPSEEK_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxx
```

### ❌ 错误: "连接超时" 或 "无法连接到后端"

**原因**: 后端未启动或监听端口不同

**解决方案**:
```bash
# 1. 确保后端正在运行
# 2. 检查后端是否在 8000 端口监听
# 3. 检查防火墙设置

# 重新启动后端:
cd backend
python main.py

# 测试后端是否在线:
curl http://localhost:8000/
# 应该返回: {"message":"Doc Explorer API is running"}
```

### ❌ 错误: "JSON 解析错误"

**原因**: DeepSeek API 返回的格式不符合预期

**解决方案**:
```python
# 编辑 backend/services/keyword_extractor.py
# 增加调试日志，查看实际返回的内容

# 或者调整提示词让 API 更稳定地返回 JSON
```

### ❌ 前端显示空白

**原因**: npm 依赖未安装或 Node 版本不兼容

**解决方案**:
```bash
cd frontend

# 清除缓存
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 启动
npm run dev
```

### ❌ 关键词没有被高亮

**原因**: 可能是提取的关键词与文本中的拼写不完全匹配（空格、大小写等）

**解决方案**:
```python
# 改进提取器，规范化关键词:
# 1. 移除多余空格
# 2. 处理大小写
# 3. 移除标点符号

# 编辑 backend/services/keyword_extractor.py
keywords = [
    {
        "keyword": kw["keyword"].strip().lower(),
        "snippet": kw["snippet"],
        "category": kw["category"]
    }
    for kw in keywords
]
```

---

## 性能调优

### 问: 大文本（>5000字）处理很慢？

**答**: 考虑分块处理

```python
# backend/services/keyword_extractor.py
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)

chunks = splitter.split_text(text)
all_keywords = []

for chunk in chunks:
    keywords = await self.extract(chunk)
    all_keywords.extend(keywords)

# 去重
unique_keywords = {kw["keyword"]: kw for kw in all_keywords}.values()
```

### 问: API 调用费用高？

**答**: 优化提示词和模型选择

```python
# 使用更短的提示词
prompt = f"""提取关键词:
"{text}"

返回JSON格式的列表。"""

# 或选择更便宜的模型
# self.model = "deepseek-chat-lite"  # 如果可用
```

### 问: 前端高亮性能差？

**答**: 优化 React 渲染

```jsx
// DocumentViewer.jsx 中使用 memo 和 useMemo
import { memo, useMemo } from 'react'

const DocumentViewer = memo(({ text, spans, onKeywordClick }) => {
  const elements = useMemo(() => {
    // 渲染逻辑
    return renderHighlightedText()
  }, [text, spans])

  return <div>{elements}</div>
})
```

---

## 调试技巧

### 启用详细日志

**后端**:
```python
# backend/main.py
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.post("/extract_keywords")
async def extract_keywords(request):
    logger.debug(f"收到文本: {request.text[:100]}...")
    # ...
```

**前端**:
```jsx
// src/services/api.js
api.interceptors.response.use(
  response => {
    console.log('API Response:', response.data)
    return response
  },
  error => {
    console.error('API Error:', error.response?.data)
    return Promise.reject(error)
  }
)
```

### 使用浏览器开发者工具

1. **F12** 打开开发者工具
2. **Network** 标签查看 API 请求
3. **Console** 标签查看错误信息
4. **Elements** 标签检查 DOM 结构

---

## 浏览器兼容性

支持的浏览器:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

推荐使用最新版本的现代浏览器。

---

## 数据隐私

⚠️ **重要**: 你的文本会被发送到 DeepSeek 服务器进行处理。

- ✅ DeepSeek 不会保存用户文本
- ⚠️ 不要输入敏感信息（个人隐私、商业机密等）
- ✅ 可以本地部署使用开源大模型替代（见下文）

---

## 使用本地大模型（可选）

如果想完全隐私，可以使用本地部署的开源模型：

### 1. 安装 Ollama

https://ollama.ai

### 2. 下载模型

```bash
ollama pull mistral  # 或其他模型
ollama serve
```

### 3. 修改后端配置

```python
# backend/services/keyword_extractor.py
import httpx

class KeywordExtractor:
    def __init__(self):
        self.api_base = "http://localhost:11434/api"
        self.model = "mistral"

    async def extract(self, text):
        # 使用本地模型替代 DeepSeek
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.api_base}/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            )
        # ...
```

---

## 扩展和自定义

### 自定义提示词

编辑提示词来改变行为：

```python
# backend/services/keyword_extractor.py

prompt = f"""你是一个{角色}。{具体任务}

文本: "{text}"

请{要求的格式}"""
```

### 添加新的 API 端点

```python
# backend/main.py

@app.post("/summarize")
async def summarize(request: DocumentUploadRequest):
    """生成文本摘要"""
    from backend.services.summarizer import Summarizer
    summarizer = Summarizer()
    summary = await summarizer.summarize(request.text)
    return {"summary": summary}
```

### 自定义前端样式

```css
/* frontend/src/index.css */

.highlight {
  background-color: #fef3c7;  /* 改为你喜欢的颜色 */
  border-radius: 3px;
  cursor: pointer;
}

.highlight:hover {
  background-color: #fde68a;  /* 悬停颜色 */
}
```

---

## 获得帮助

1. **查看日志** - 检查终端和浏览器控制台
2. **阅读文档** - 查看 README.md 和 DEPLOYMENT.md
3. **测试功能** - 运行 `python test_backend.py`
4. **重启服务** - 有时重启可以解决问题

---

**祝你使用愉快！如有问题，随时反馈。** 🚀
