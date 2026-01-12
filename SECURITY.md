# 安全政策

## 报告安全漏洞

如果你发现了一个安全漏洞，**请不要在公开的 Issue 中报告**。

### 报告方式

请通过以下方式私密地报告安全问题：

1. **发邮件到项目维护者** - 联系方式：[请填写联系邮箱]
2. **GitHub Security Advisory** - 在仓库 Settings 中使用私密 Advisory 功能

在你的报告中请包含：

- 漏洞描述
- 影响的版本
- 复现步骤
- 建议的修复方案（如有）

### 期望

- 我们承诺在 48 小时内回复你的报告
- 我们会尽快修复已确认的漏洞
- 我们会在修复发布前给你时间来测试

## 安全最佳实践

### 使用 StudyMate 时

1. **保护你的 API Key**
   - 不要在代码或 Git 中提交 `.env` 文件
   - 使用环境变量或安全的密钥管理工具
   - 定期轮换你的 API Key

2. **验证依赖**
   ```bash
   # 检查已知的漏洞
   pip install safety
   safety check

   npm audit
   ```

3. **最小权限原则**
   - 仅使用必要的 API 权限
   - 限制谁可以访问 StudyMate

### 开发时

1. **依赖管理**
   - 定期更新依赖
   - 使用 `pip-audit` 和 `npm audit` 检查漏洞
   - 避免使用已知有漏洞的库

2. **代码审查**
   - 所有代码变更都需要审查
   - 注意常见漏洞（SQL 注入、XSS 等）
   - 使用静态分析工具

3. **敏感数据**
   - 不要在代码中硬编码密钥
   - 使用环境变量
   - 从 git 历史中完全移除泄露的密钥：
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/secret_file' \
     --prune-empty --tag-name-filter cat -- --all
   ```

## 已知问题

| 问题 | 状态 | 备注 |
|------|------|------|
| 无已知严重安全问题 | ✅ | 最后审计：2026-01-12 |

## 依赖安全

我们使用以下工具来监控依赖的安全性：

- **Python**: `pip-audit`, `bandit`
- **JavaScript**: `npm audit`, Dependabot

## 更新日志

- **2026-01-12** - 项目初始安全政策发布

---

感谢你对项目安全的关注！🔒
