---
name: code-in-parallel
description: Orchestrate multiple coding subagents working in parallel with synchronized git worktree merging cycles
argument-hint: "--session-name <name>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TodoWrite
  - AskUserQuestion
---

# Code In Parallel - Multi-Agent Orchestrator

You are the orchestrator for a sophisticated parallel coding system. Your role is to coordinate multiple coding subagents working simultaneously in isolated git worktrees, with synchronized merging cycles.

## Session Handling

The `--session-name` argument is **always required**:
- **New session name**: Creates a fresh parallel coding session
- **Existing session name**: Resumes from the saved state

Session states are stored in: `~/.claude/state/parallel-work/sessions/{session-name}/`

---

## Phase 0: Session Detection

First, check if this is a new or existing session:

```bash
# Check for existing session
SESSION_NAME="{{session-name}}"  # This comes from the argument
SESSION_DIR="$HOME/.claude/state/parallel-work/sessions/$SESSION_NAME"

if [ -d "$SESSION_DIR" ]; then
  # EXISTING SESSION - Resume workflow
  cat "$SESSION_DIR/session.json"
else
  # NEW SESSION - Continue to configuration
fi
```

If resuming, load the session state and present the status to the user:

```
═══════════════════════════════════════════════════════════════
                     RESUMING SESSION: {session-name}
═══════════════════════════════════════════════════════════════
Started: {startTime}
Cycle: {currentCycle}/{estimatedTotal}

AGENT STATUS:
┌──────────────────────────────────────────────────────────┐
│ Agent 1 [HIGH]  🔄 Working  •  Cycle 2, Commit 7/10      │
│ Agent 2 [MED]   ⏸️ Waiting  •  Cycle 2, Complete (8/8)   │
│ Agent 3 [LOW]   ✓ Done     •  All tasks completed       │
└──────────────────────────────────────────────────────────┘

Integration branch: {integrationBranch}
Next merge in: {commitsUntilNextMerge} commits
═══════════════════════════════════════════════════════════════
```

Then continue the workflow from where it left off.

---

## Phase 1: Configuration (New Sessions Only)

For new sessions, gather configuration using `AskUserQuestion`:

### 1.1 Basic Configuration

Ask these questions in order:

**Number of subagents** (multiSelect: false):
- "2" - Two parallel coding agents
- "3" - Three parallel coding agents
- "4" - Four parallel coding agents
- "5" - Five parallel coding agents

**Merging frequency** (multiSelect: false):
- "3" - Merge after every 3 commits per agent
- "5" - Merge after every 5 commits per agent
- "8" - Merge after every 8 commits per agent
- "13" - Merge after every 13 commits per agent

**Merge conflict resolution** (multiSelect: false):
- "automatic" - Merge manager resolves conflicts automatically
- "manual" - Open conflict diffs in VS Code for manual resolution

**Deployment policy** (multiSelect: false):
- "1" - Deploy after every merge cycle
- "2" - Deploy after every 2 merge cycles
- "3" - Deploy after every 3 merge cycles
- "5" - Deploy after every 5 merge cycles
- "8" - Deploy after every 8 merge cycles

**Commit discipline** (multiSelect: false):
- "atomic" - One commit per atomic logical unit of work
- "function" - Commit after each completed function/method
- "file" - Commit after each successfully completed file
- "feature" - Commit after each feature/subtask completion

### 1.2 Per-Agent Prompts

For each agent (1 to N), collect:

**Individual coding goal**: Ask for the specific task this agent should work on.

**Priority level** (multiSelect: false):
- "high" - Must complete, never drop
- "medium" - Retry multiple times, persist through failures
- "low" - Ask user if blocking after retries
- "none" - Drop automatically if blocking other work

Collect these as: Agent 1 prompt → Agent 1 priority → Agent 2 prompt → Agent 2 priority → etc.

### 1.3 Top-Level Context Prompt

Ask for any contextual information:
- Risks or concerns about overlapping work
- Which work areas are most critical
- Any dependencies between agents
- Any files or areas that should be treated as "off-limits"

### 1.4 Final Confirmation

After collecting all prompts, if you have no follow-up questions, **auto-start** the workflow.
If you need clarification, ask your questions first, then auto-start.

---

## Phase 2: Initialization

### 2.1 Environment Setup

```bash
# Verify we're in a git repo
git rev-parse --git-dir 2>/dev/null || {
  echo "Error: Not in a git repository. /code-in-parallel requires git."
  exit 1
}

# Capture current state
TIMESTAMP=$(date +%s)
SESSION_ID="${SESSION_NAME}-${TIMESTAMP}"
INTEGRATION_BRANCH="parallel-integration-${TIMESTAMP}"
WORKTREES_DIR=".git/worktrees/parallel-work-${TIMESTAMP}"

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Create integration branch
git checkout -b "$INTEGRATION_BRANCH"

# Create worktrees directory
mkdir -p "$WORKTREES_DIR"

# Create worktrees for each subagent
for i in $(seq 1 $NUM_AGENTS); do
  git worktree add "$WORKTREES_DIR/agent-${i}" -b "agent-${i}-work"
done
```

### 2.2 State Storage (Multi-Tier)

Create the state directory structure:

```bash
# Primary source of truth
SESSION_STATE_DIR="$HOME/.claude/state/parallel-work/sessions/${SESSION_NAME}"
mkdir -p "$SESSION_STATE_DIR"

# Project context (symlinks)
PROJECT_PLANNING_DIR=".planning/parallel-work/${SESSION_NAME}"
mkdir -p "$PROJECT_PLANNING_DIR"
```

### 2.3 Create Session State

Create `$SESSION_STATE_DIR/session.json`:

```json
{
  "sessionId": "${SESSION_ID}",
  "sessionName": "${SESSION_NAME}",
  "startTime": "${ISO_TIMESTAMP}",
  "projectPath": "${PWD}",
  "currentBranch": "${CURRENT_BRANCH}",
  "integrationBranch": "${INTEGRATION_BRANCH}",
  "worktreesDir": "${WORKTREES_DIR}",
  "config": {
    "numAgents": ${NUM_AGENTS},
    "mergeFrequency": ${MERGE_FREQUENCY},
    "conflictResolution": "${CONFLICT_RESOLUTION}",
    "deployPolicy": ${DEPLOY_POLICY},
    "commitDiscipline": "${COMMIT_DISCIPLINE}"
  },
  "agents": [
    {
      "id": 1,
      "worktree": "${WORKTREES_DIR}/agent-1",
      "branch": "agent-1-work",
      "prompt": "${AGENT1_PROMPT}",
      "priority": "${AGENT1_PRIORITY}",
      "commitsThisCycle": 0,
      "totalCommits": 0,
      "status": "working",
      "todoList": []
    }
  ],
  "currentCycle": 1,
  "deploymentState": {
    "mergesSinceLastDeploy": 0,
    "lastDeployCommit": null,
    "totalDeployments": 0
  }
}
```

### 2.4 Create Orchestrator Todo List

Create `$SESSION_STATE_DIR/orchestrator-todo.md`:

```markdown
# Orchestrator Todo List - Session: ${SESSION_NAME}

## Configuration
- [x] Collect configuration from user
- [x] Initialize git worktrees
- [x] Create session state

## Cycle 1
- [ ] Spawn all subagents
- [ ] Monitor progress to commit threshold
- [ ] Run merge manager
- [ ] Check deployment trigger

## Completion
- [ ] Verify all tasks complete
- [ ] Final merge to integration branch
- [ ] Cleanup worktrees
- [ ] Archive session state
```

### 2.5 Create Per-Agent Todo Lists

For each agent, create `$SESSION_STATE_DIR/agent-{n}-todo.md` with their specific tasks derived from their prompt.

---

## Phase 3: Execution Loop

### 3.1 Spawn Subagents

Launch all coding subagents **in parallel** using multiple `Task` tool calls in a single message:

```
For each agent, spawn with:
- Worktree path
- Agent-specific prompt
- Commit target (mergeFrequency)
- Commit discipline
- Priority level
- Access to their todo list

Example agent prompt:
"""
You are Agent {n} in a parallel coding session.

YOUR WORKTREE: {worktree-path}
YOUR BRANCH: agent-{n}-work
YOUR PRIORITY: {high/medium/low/none}

TASK: {user's prompt for this agent}

COMMIT DISCIPLINE: {atomic/function/file/feature}
COMMIT TARGET: {n} commits before pausing for merge

Commit Format:
Agent {n}: {brief task description}

Context: {optional detail}
Co-Authored-By: Claude Code <noreply@anthropic.com>

When you reach {n} commits, PAUSE and report back with:
- Number of commits made
- Current status (working/waiting/completed/failed)
- Updated todo list
- Any issues encountered

Work in the worktree directory. All paths should be relative to the worktree root.
"""
```

**CRITICAL**: Launch all agents in a **single message** with multiple `Task` calls.

### 3.2 Monitor Progress

Wait for all agents to report back. Track:
- Commits made this cycle per agent
- Agent status (working/waiting/completed/failed)
- Updated todo lists

Update session state after each agent report.

### 3.3 Check for Cycle Completion

A cycle is complete when:
- All agents have reached their commit target, OR
- All agents have completed their tasks, OR
- An agent is blocked and needs intervention

### 3.4 Merge Manager

Once cycle is complete, spawn the **merge manager** agent:

```
You are the Merge Manager for a parallel coding session.

INTEGRATION BRANCH: {branch}
WORKTREES: {list of worktree paths}
CONFLICT POLICY: {automatic/manual}

Your task:
1. For each worktree in order (agent-1, agent-2, ...):
   a. Merge agent-{n}-work into integration branch
   b. Handle conflicts per policy
   c. Report merge result

AUTOMATIC CONFLICT RESOLUTION:
- Use 3-way merge (git merge -X theirs/theirs as appropriate)
- Log all conflict resolutions
- Prefer newer changes over older ones
- If truly ambiguous, flag for manual review

MANUAL CONFLICT RESOLUTION:
- Detect conflicts
- Generate diff file: /tmp/merge-conflict-{agent}-{n}.diff
- Open in VS Code: code --diff /tmp/merge-conflict-{agent}-{n}.diff
- Wait for user to resolve and signal continuation

After all merges:
2. Update each worktree with the integration branch changes
   For each worktree:
   cd {worktree}
   git merge integration-branch --no-edit

Return:
- Number of successful merges
- Conflicts resolved (and how)
- Any worktrees that failed to update
```

### 3.5 Update Session State

After merge manager completes:
- Increment `deploymentState.mergesSinceLastDeploy`
- Update each agent's `commitsThisCycle` to 0
- Update `currentCycle`

### 3.6 Check Deployment Trigger

If `mergesSinceLastDeploy >= deployPolicy`:

**Auto-detect deployment method**:

```bash
DEPLOY_FOUND=false

# Check package.json for deploy script
if [ -f "package.json" ] && grep -q '"deploy"' package.json; then
  echo "Deploying via npm script..."
  npm run deploy
  DEPLOY_FOUND=true
# Check for Vercel
elif [ -f "vercel.json" ] || grep -q vercel package.json 2>/dev/null; then
  echo "Deploying via Vercel..."
  vercel --prod
  DEPLOY_FOUND=true
# Check for deploy.sh
elif [ -f "deploy.sh" ]; then
  echo "Running deploy.sh..."
  ./deploy.sh
  DEPLOY_FOUND=true
# Check for docker-compose
elif [ -f "docker-compose.yml" ]; then
  echo "Deploying via docker-compose..."
  docker-compose up -d --build
  DEPLOY_FOUND=true
# Check for Dockerfile
elif [ -f "Dockerfile" ]; then
  echo "Dockerfile found - manual deployment may be required"
  DEPLOY_FOUND=false
fi

if [ "$DEPLOY_FOUND" = false ]; then
  echo "⚠️  No deployment method detected. Manual deployment required."
fi
```

Update session state:
- Reset `mergesSinceLastDeploy` to 0
- Record `lastDeployCommit` SHA
- Increment `totalDeployments`

### 3.7 Continue or Complete

Check if all agents are "completed":
- **Yes**: Proceed to Phase 4 (Completion)
- **No**: Go back to 3.1 and spawn next cycle

---

## Phase 4: Completion

### 4.1 Verify Completion

All agents should report status = "completed".

For any agents with "failed" status:
- **High priority**: Must be retried until successful
- **Medium priority**: Retry up to 3 times, then ask user
- **Low priority**: Ask user whether to retry or skip
- **No priority**: Skip and drop

### 4.2 Final Report

Display the completion summary:

```
═══════════════════════════════════════════════════════════════
                    CODE-IN-PARALLEL COMPLETE
═══════════════════════════════════════════════════════════════

Session: {sessionName}
Duration: {endTime - startTime}
Integration Branch: {integrationBranch}

SUMMARY BY AGENT:
┌──────────────────────────────────────────────────────────┐
│ Agent 1 [HIGH]  ✓ 15 commits  •  All tasks completed    │
│ Agent 2 [MED]   ✓ 12 commits  •  All tasks completed    │
│ Agent 3 [LOW]   ⚠ 8 commits   •  2 tasks skipped        │
│ Agent 4 [NONE]  ⊘ 3 commits   •  Dropped (blocking)     │
└──────────────────────────────────────────────────────────┘

MERGES: {totalCycles} cycles • {totalCommits} total commits merged
DEPLOYS: {totalDeployments} deployments triggered

INTEGRATION BRANCH: {integrationBranch}
Ready for: git checkout {currentBranch} && git merge {integrationBranch}
═══════════════════════════════════════════════════════════════
```

### 4.3 Cleanup

```bash
# Remove worktrees
for worktree in $WORKTREES_DIR/agent-*; do
  git worktree remove "$worktree"
done

# Remove worktrees directory
rmdir "$WORKTREES_DIR"

# Archive session state
ARCHIVE_DIR="$HOME/.claude/state/parallel-work/archive/${SESSION_NAME}"
mkdir -p "$ARCHIVE_DIR"
mv "$SESSION_STATE_DIR"/* "$ARCHIVE_DIR/"
rmdir "$SESSION_STATE_DIR"
```

### 4.4 Return to Original Branch

```bash
git checkout "$CURRENT_BRANCH"
```

---

## Human Intervention

At any point during execution, the user may:
- Ask questions about the session status
- Request changes to agent priorities
- Add new agents to the session
- Restart a completed agent
- Stop the session entirely

Always respond to user queries and update the session state accordingly.

---

## Error Handling

### Subagent Failure
- Retry with fresh context (up to 3 times)
- If still failing: pause and notify user
- Apply priority logic for next steps

### Merge Conflict (Automatic)
- Attempt 3-way merge with strategies
- Log all resolutions for review
- If unresolvable, flag for manual intervention

### Merge Conflict (Manual)
- Generate diff file
- Open in VS Code
- Wait for user to signal continuation

### Deployment Failure
- Log error details
- Don't block further work
- Flag for manual review

---

## Priority Handling Summary

| Priority | Failure Handling | Blocking Behavior |
|----------|------------------|-------------------|
| High | Retry until success (infinite) | Never drops |
| Medium | Retry 3x, then ask user | Blocks, asks user |
| Low | Retry 1x, then ask user | Can be skipped per user |
| None | Drop immediately | Auto-dropped if blocking |

---

## State Persistence

Session state is persisted after every significant action:
- After each agent completes a cycle
- After each merge
- After each deployment
- After any user intervention

This ensures the session can be resumed if interrupted.
