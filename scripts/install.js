#!/usr/bin/env node

/**
 * git-workflows-plugin installer for Claude Code
 *
 * This script installs the slash commands to your Claude Code commands directory.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getClaudeCommandsDir() {
  // Common Claude Code config locations
  const possiblePaths = [
    path.join(os.homedir(), '.claude', 'commands'),
    path.join(os.homedir(), '.config', 'Claude', 'commands'),
  ];

  // Check CLAUDE_COMMANDS_PATH env var
  const envPath = process.env.CLAUDE_COMMANDS_PATH;
  if (envPath) {
    possiblePaths.unshift(envPath);
  }

  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      return dirPath;
    }
  }

  // Default to ~/.claude/commands
  return path.join(os.homedir(), '.claude', 'commands');
}

function installCommands() {
  log('\n🔧 git-workflows-plugin Installer', 'cyan');
  log(''.padEnd(50, '─'), 'cyan');

  // Get paths
  const pluginDir = __dirname;
  const commandsDir = path.join(pluginDir, '..', 'commands');
  const targetDir = getClaudeCommandsDir();

  log(`\n📂 Plugin directory: ${pluginDir}`, 'blue');
  log(`📂 Claude commands directory: ${targetDir}`, 'blue');

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    log(`\n✨ Creating Claude commands directory...`, 'yellow');
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Get all command files
  const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'));

  if (commandFiles.length === 0) {
    log('\n❌ No command files found in commands/ directory!', 'red');
    process.exit(1);
  }

  log(`\n📦 Found ${commandFiles.length} command(s) to install:`, 'green');
  commandFiles.forEach(f => log(`   - ${f}`, 'blue'));

  // Copy/symlink each command
  let installed = 0;
  let skipped = 0;

  for (const file of commandFiles) {
    const src = path.join(commandsDir, file);
    const dest = path.join(targetDir, file);

    if (fs.existsSync(dest)) {
      const stat = fs.lstatSync(dest);
      if (stat.isSymbolicLink()) {
        log(`\n⏭️  Skipping ${file} (already symlinked)`, 'yellow');
        skipped++;
        continue;
      } else {
        // Backup existing file
        const backup = `${dest}.backup`;
        fs.copyFileSync(dest, backup);
        log(`\n💾 Backed up existing ${file} to ${backup}`, 'yellow');
      }
    }

    try {
      // Create symlink for easy updates
      fs.symlinkSync(src, dest);
      log(`\n✅ Installed ${file}`, 'green');
      installed++;
    } catch (err) {
      // Fallback to copy if symlink fails (Windows permissions, etc.)
      fs.copyFileSync(src, dest);
      log(`\n✅ Copied ${file}`, 'green');
      installed++;
    }
  }

  log('\n' + '─'.padEnd(50, '─'), 'cyan');
  log(`\n✨ Installation complete!`, 'green');
  log(`   Installed: ${installed} command(s)`, 'blue');
  if (skipped > 0) {
    log(`   Skipped: ${skipped} command(s)`, 'yellow');
  }
  log(`\n🚀 Restart Claude Code to use the new commands.\n`, 'cyan');
}

// Run installer
installCommands();
