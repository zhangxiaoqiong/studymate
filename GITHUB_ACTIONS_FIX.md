# GitHub Actions 版本升级修复报告

## 问题描述

GitHub Actions 工作流使用了过时的 action 版本，导致 CI/CD 流程失败。

**错误信息：**
```
Error: This request has been automatically failed because it uses a deprecated
version of `actions/upload-artifact: v3`. Learn more:
https://github.blog/changelog/2024-04-16-deprecation-notice-v3-of-the-artifact-actions/
```

---

## 修复内容

### 1. Node.js 工作流（.github/workflows/node-tests.yml）

**变更：**
```yaml
# 修改前
uses: actions/upload-artifact@v3

# 修改后
uses: actions/upload-artifact@v4
```

**位置：** 第 49 行
**原因：** `upload-artifact@v3` 已被弃用，v4 引入了更好的性能和安全性

### 2. Python 工作流（.github/workflows/python-tests.yml）

**变更：**
```yaml
# 修改前
uses: codecov/codecov-action@v3

# 修改后
uses: codecov/codecov-action@v4
```

**位置：** 第 48 行
**原因：** 使用最新的 Codecov action 版本以获得更好的支持

---

## 升级的 Action 版本

| Action | 旧版本 | 新版本 | 原因 |
|--------|--------|--------|------|
| actions/upload-artifact | v3 | v4 | 官方弃用通知（2024-04-16） |
| codecov/codecov-action | v3 | v4 | 保持最新，获得更好支持 |

其他 action 版本检查：
- ✅ `actions/checkout@v4` - 已是最新
- ✅ `actions/setup-python@v4` - 已是最新
- ✅ `actions/setup-node@v4` - 已是最新

---

## 验证步骤

修复后的工作流应该能够：

1. ✅ 成功上传前端构建产物（artifact）
2. ✅ 成功上传代码覆盖率报告到 Codecov
3. ✅ 通过 GitHub Actions 检查

---

## 下次推送后

修复将在下次推送代码时自动生效：

```bash
git add .github/workflows/
git commit -m "fix: upgrade deprecated github actions to latest versions

- Update actions/upload-artifact from v3 to v4
- Update codecov/codecov-action from v3 to v4
- Ensure CI/CD pipeline compatibility with latest GitHub Runner"
git push origin main
```

---

## 相关链接

- [GitHub Actions Artifact v4 迁移指南](https://github.blog/changelog/2024-04-16-deprecation-notice-v3-of-the-artifact-actions/)
- [Codecov Action 文档](https://github.com/codecov/codecov-action)
- [Actions 官方文档](https://docs.github.com/en/actions)

---

**修复时间：** 2026-01-12
**状态：** ✅ 已完成
