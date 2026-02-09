# Contributing to git-workflows-plugin

Thank you for your interest in contributing! This document provides guidelines for contributing to the git-workflows-plugin project.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description** of the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs. **actual behavior**
- **Environment details** (OS, Claude Code version, etc.)
- **Screenshots** if applicable

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Clear use case** for the feature
- **Proposed implementation** approach (if you have ideas)
- **Alternative solutions** you've considered

### Submitting Code Changes

1. **Fork the repository** and create a new branch
2. **Write your slash command** following the existing format
3. **Test thoroughly** in your own Claude Code environment
4. **Submit a pull request** with clear description

## Slash Command Format

All slash commands must include:

### Required Frontmatter

```yaml
---
name: your-command-name
description: Brief description of what the command does
argument-hint: "[optional-args]"
allowed-tools:
  - Read
  - Write
  - Edit
  # ... other tools needed
---
```

### Documentation Structure

- Clear description of what the command does
- Usage examples
- Configuration options (if applicable)
- Error handling guidance

## Code Style

- Use clear, descriptive variable names
- Comment complex logic
- Follow existing file structure
- Keep commands focused on a single responsibility

## Testing

Test your commands in various scenarios:
- Different project types
- Edge cases and error conditions
- Interruption and resumption workflows

## Pull Request Guidelines

- **Small, focused PRs** are easier to review
- **Update documentation** for any user-facing changes
- **Add examples** for new features
- **Link related issues** in your PR description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to git-workflows-plugin! 🚀
