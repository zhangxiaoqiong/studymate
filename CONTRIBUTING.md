# 贡献指南

感谢你对 StudyMate 的关注和支持！本文档将指导你如何参与项目的开发。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [提交指南](#提交指南)
- [Pull Request 流程](#pull-request-流程)
- [编码规范](#编码规范)

---

## 行为准则

我们的社区欢迎所有人的参与，无论其背景如何。请确保你的行为体现以下价值观：

- ✅ 相互尊重和包容
- ✅ 建设性的讨论
- ✅ 对不同观点的开放态度
- ✅ 专注于项目的改进

如果你目睹了不当行为，请通过邮件报告给项目维护者。

---

## 如何贡献

### 1. 报告 Bug

发现问题了？请在 [Issues](../../issues) 中创建新 issue，包括：

- **清晰的标题** - 简洁说明问题
- **问题描述** - 详细的问题描述
- **复现步骤** - 如何重新现问题
- **环境信息** - Python/Node.js 版本、操作系统等
- **错误日志** - 如果有，请附加错误信息

**模板：**
```
## 问题描述
[简洁描述问题]

## 复现步骤
1. ...
2. ...
3. ...

## 预期行为
[应该发生什么]

## 实际行为
[实际上发生了什么]

## 环境
- OS: [e.g. Windows 10]
- Python: [e.g. 3.9.0]
- Node: [e.g. 18.0.0]
```

### 2. 建议功能

有好想法？请在 [Issues](../../issues) 中描述：

- **功能名称** - 清晰的功能名称
- **问题或痛点** - 解决什么问题
- **建议方案** - 如何实现
- **额外信息** - 其他相关内容

**模板：**
```
## 功能描述
[描述新功能]

## 解决的问题
[这个功能解决什么问题]

## 建议实现
[如何实现这个功能]

## 其他信息
[屏幕截图、参考链接等]
```

### 3. 提交代码

#### 前置条件

- Fork 本仓库
- Clone 你的 Fork
- 创建新分支：`git checkout -b feature/your-feature-name`

#### 开发环境设置

请参考项目根目录的 [README.md](README.md#快速开始)

---

## 开发环境设置

### 后端开发

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

# 启动服务
python main.py
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

---

## 提交指南

### 分支命名

请使用描述性的分支名称：

- `feature/add-xxx` - 新功能
- `fix/fix-xxx` - 错误修复
- `docs/update-xxx` - 文档更新
- `refactor/improve-xxx` - 代码重构
- `test/add-xxx` - 测试用例

**示例：**
```bash
git checkout -b feature/add-pdf-support
git checkout -b fix/keyword-extraction-bug
```

### Commit 消息规范

使用清晰、简洁的 Commit 消息：

```
<type>: <subject>

<body>

<footer>
```

**Type（必需）：**
- `feat:` - 新功能
- `fix:` - 错误修复
- `docs:` - 文档修改
- `style:` - 代码风格修改
- `refactor:` - 代码重构
- `test:` - 添加测试
- `chore:` - 其他修改（依赖更新等）

**Subject（必需）：**
- 使用祈使句（"add" 而不是 "added"）
- 不要大写首字母
- 末尾不加句号
- 限制在 50 个字符以内

**Body（可选）：**
- 详细说明更改的原因
- 列出重要改变

**Footer（可选）：**
- 关闭相关 issue：`Closes #123`

**示例：**
```
feat: add PDF document support

- Implement PDF parsing using pdfplumber
- Extract text from multi-page documents
- Add file size validation

Closes #45
```

---

## Pull Request 流程

### 提交前检查清单

在提交 PR 之前，请确保：

- [ ] 代码遵循项目编码规范
- [ ] 所有测试通过
- [ ] 添加或更新了相关文档
- [ ] 提交消息清晰明了
- [ ] 没有引入不必要的依赖
- [ ] 代码中没有 `console.log` 或 `print` 调试语句

### 创建 Pull Request

1. 推送你的分支：
   ```bash
   git push origin feature/your-feature-name
   ```

2. 在 GitHub 上创建 Pull Request

3. 填写 PR 描述（使用提供的模板）

4. 等待代码审查

### PR 模板

```markdown
## 描述
简洁描述这个 PR 的目的

## 类型
- [ ] Bug 修复
- [ ] 新功能
- [ ] 文档更新
- [ ] 代码重构

## 关联的 Issue
Closes #123

## 变更内容
- 点 1
- 点 2
- 点 3

## 测试方法
1. 步骤 1
2. 步骤 2

## 截图（如果适用）
[添加截图]
```

### 代码审查

维护者会：
- 审查代码质量和逻辑
- 检查是否遵循项目标准
- 请求更改或建议改进
- 当 PR 被批准后进行合并

---

## 编码规范

### Python 代码风格

- 遵循 [PEP 8](https://www.python.org/dev/peps/pep-0008/)
- 使用 4 个空格缩进
- 最大行长 100 个字符
- 使用类型提示（Python 3.9+）

```python
def extract_keywords(text: str, max_count: int = 50) -> List[Dict]:
    """提取文本中的关键词。

    Args:
        text: 输入文本
        max_count: 最大关键词数

    Returns:
        包含关键词的字典列表
    """
    # 实现...
```

### JavaScript/React 代码风格

- 使用 ES6+ 语法
- 使用 const/let（避免 var）
- 添加 JSDoc 注释
- 组件采用 Functional Components + Hooks

```javascript
/**
 * 文档上传组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element}
 */
const DocumentUpload = ({ onUpload }) => {
  // 实现...
};
```

### 通用规范

- 添加有意义的注释，解释为什么而不是做什么
- 避免过度注释
- 保持函数简洁和单一职责
- 使用有描述性的变量名

---

## 获取帮助

- 📖 查看 [项目文档](README.md)
- 💬 在 Issue 中提问
- 📧 联系维护者

---

## 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

感谢你的贡献！🎉
