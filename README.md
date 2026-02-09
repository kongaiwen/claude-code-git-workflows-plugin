# claude-code-git-workflows-plugin

> Advanced multi-agent Git workflow automation for Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-compatible-orange)](https://claude.ai/claude-code)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/kongaiwen/claude-code-git-workflows-plugin)

A collection of sophisticated slash commands for Claude Code that enable advanced Git workflows, including parallel multi-agent development with synchronized merging cycles.

## Features

### `/code-in-parallel`

Orchestrate multiple coding subagents working simultaneously in isolated git worktrees, with automatic synchronization and deployment.

**Key capabilities:**
- 2-5 parallel coding agents working simultaneously
- Git worktree isolation for safe concurrent development
- Configurable merge cycles (every 3, 5, 8, or 13 commits)
- Automatic or manual merge conflict resolution
- Automated deployment triggering (npm, Vercel, Docker, etc.)
- Session resumption after interruptions
- Priority-based task handling (High, Medium, Low, None)

## Installation

### Option 1: Clone to Claude Commands Directory

```bash
# Clone the repository
git clone https://github.com/kongaiwen/claude-code-git-workflows-plugin.git ~/.claude/plugins/claude-code-git-workflows

# Symlink commands to your Claude commands directory
ln -s ~/.claude/plugins/claude-code-git-workflows/commands/* ~/.claude/commands/
```

### Option 2: Copy Individual Commands

```bash
# Copy specific commands
cp commands/code-in-parallel.md ~/.claude/commands/
```

### Option 3: Package Manager (Coming Soon)

```bash
npm install -g claude-code-git-workflows-plugin
```

## Usage

### Starting a Parallel Coding Session

```bash
/code-in-parallel --session-name feature-auth
```

You'll be prompted to configure:
- Number of subagents (2-5)
- Merge frequency
- Conflict resolution policy
- Deployment policy
- Per-agent tasks and priorities

### Resuming a Session

```bash
/code-in-parallel --session-name feature-auth
```

If the session exists, it will resume from the last checkpoint.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR (You)                          │
│  - Maintains top-level todo list                                │
│  - Spawns and monitors subagents                                │
│  - Manages pause/merge cycles                                   │
│  - Handles deployment triggers                                  │
└─────────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │ Agent 1  │         │ Agent 2  │         │ Agent 3  │
    │ Worktree │         │ Worktree │         │ Worktree │
    └──────────┘         └──────────┘         └──────────┘
           │                    │                    │
           └────────────────────┴────────────────────┘
                                │
                                ▼
                         ┌─────────────┐
                         │   MERGE     │
                         │   MANAGER   │
                         │   (Agent)   │
                         └─────────────┘
```

## Configuration

### Priority Levels

| Priority | Description |
|----------|-------------|
| **High** | Must complete, never drops, infinite retries |
| **Medium** | Retry 3x, persists through failures |
| **Low** | Ask user if blocking other work |
| **None** | Auto-drop if blocking (for optional features) |

### Deployment Detection

The plugin auto-detects deployment methods in this order:
1. `npm run deploy` script
2. Vercel (`vercel.json` or vercel in package.json)
3. `./deploy.sh` script
4. Docker Compose
5. Dockerfile (manual deployment)

## Examples

### Example 1: Feature with 3 Parallel Tasks

```
Session: user-authentication
Agents: 3
Merge frequency: 5 commits
Deployment: Every 3 merges

Agent 1 [HIGH]: Implement JWT authentication
Agent 2 [HIGH]: Build login/register UI
Agent 3 [MEDIUM]: Add password reset flow
```

### Example 2: Large Refactor

```
Session: api-refactor
Agents: 5
Merge frequency: 8 commits
Deployment: Every 5 merges

Agent 1 [HIGH]: Refactor user routes
Agent 2 [HIGH]: Refactor product routes
Agent 3 [MEDIUM]: Update database layer
Agent 4 [LOW]: Add request logging
Agent 5 [NONE]: Add metrics (optional, can drop)
```

## Session State

Sessions are stored in:
- **Primary**: `~/.claude/state/parallel-work/sessions/{name}/`
- **Project**: `{project}/.planning/parallel-work/{name}/`
- **Worktree**: `{worktree}/.parallel-session.json`

## Roadmap

- [ ] `/code-review-parallel` - Multi-agent code review
- [ ] `/git-ops` - Automated Git operations workflow
- [ ] `/release-manager` - Automated release management
- [ ] `/hotfix-pipeline` - Hotfix deployment workflow

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Author

Created by **Evie Marie Kolb**

[![GitHub](https://img.shields.io/badge/GitHub-evie--marie-white)](https://github.com/evie-marie)

## Show Your Support

Give this repo a ⭐️ if you find it useful!

---

**Built with ❤️ for the Claude Code community**
