# Changelog

所有项目的重要变化都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)，
项目遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [Unreleased]

### Added
- MIT 许可证
- 贡献指南 (CONTRIBUTING.md)
- Issue 和 PR 模板
- GitHub Actions CI/CD 工作流
- 社区行为准则 (CODE_OF_CONDUCT.md)
- 项目徽章和开源元数据

### Changed
- 改进 README 文档结构
- 优化项目文件组织

## [1.0.0] - 2026-01-12

### Added
- 核心功能：文本上传和关键词提取
- AI 驱动的关键词解释
- 交互式文本高亮显示
- 支持 PDF 和 Word 文档上传
- 侧边栏实时解释显示
- 流式解释生成支持
- 后续问题回答功能
- 可配置的 LLM 模型支持 (DeepSeek, OpenAI 等)
- Web UI 界面

### Changed
- 优化了关键词提取的性能
- 改进了错误处理和用户反馈

### Fixed
- 关键词去重逻辑
- 高亮位置计算精度

---

## 版本更新指南

### 开发阶段
在开发新功能时，将更改添加到 `[Unreleased]` 部分。

### 发布新版本
1. 将 `[Unreleased]` 部分重命名为新版本号和日期
2. 添加新的空白 `[Unreleased]` 部分
3. 更新版本号
4. 创建 git tag

**示例：**
```markdown
## [1.1.0] - 2026-02-15

### Added
- 新功能 A
- 新功能 B

### Fixed
- Bug X
- Bug Y

## [Unreleased]

### Added

### Changed

### Fixed
```

### 变更类型

- **Added** - 新功能
- **Changed** - 功能更改或增强
- **Deprecated** - 即将移除的功能
- **Removed** - 已移除的功能
- **Fixed** - Bug 修复
- **Security** - 安全性相关修复

---

## 历史版本

### 贡献者
感谢所有为本项目做出贡献的人！

---

最后更新：2026-01-12
