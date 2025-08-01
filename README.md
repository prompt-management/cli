# Prompt Management CLI (PMC)

A CLI tool for managing AI prompts with search and organization capabilities. PMC provides a personal, secure prompt library that allows you to store, search, and manage prompts for various AI coding agents and tools.

## Philosophy

Many AI coding agent tools (Claude Code, Gemini CLI, Kiro, Cursor, GitHub Copilot Agent, etc.) are CLI-based. PMC eliminates the manual overhead of thinking up, remembering, or copy-pasting prompts by providing AI agents with meta-programmatic understanding of your prompt library.

## Features

- **Personal & Secure**: Local storage in `~/.pmc/pmc.yml`
- **CLI-based**: Seamless integration with your terminal workflow
- **Search & Filter**: Powerful search by directory, text content, and metadata
- **Editor Integration**: Uses your preferred text editor (nano, vi, etc.)
- **Human-readable Storage**: YAML format for easy manual editing
- **UUID-based Indexing**: Unique identification for each prompt

## Installation

### Quick Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/prompt-management/cli/main/install.sh | bash
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/prompt-management/cli.git
cd cli

# Install dependencies
npm install

# Build the project
npm run build

# Install globally
npm install -g .
```

### Development Installation

```bash
# Clone the repository
git clone https://github.com/prompt-management/cli.git
cd cli

# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Uninstallation

To completely remove PMC from your system:

```bash
# Interactive uninstall (with confirmation prompt)
pmc uninstall

# Uninstall without confirmation
pmc uninstall --confirm
```

This will remove:
- Installation directory (`~/.pmc-cli/`)
- Binary symlink (`~/.local/bin/pmc`)
- Configuration and all stored prompts (`~/.pmc/`)
- PATH modifications from shell configuration files

## Usage

### Help

```bash
$ pmc --help
Usage: pmc [options] [command]

Prompt Management CLI - A tool for managing AI prompts

Options:
  -V, --version         output the version number
  -h, --help            display help for command

Commands:
  create                Create a new prompt (opens text editor)
  search|s [options]    Search prompts
  edit|e [options]      Edit an existing prompt
  list|ls               List all prompts
  generate|g [options]  Generate sample prompts
  uninstall [options]   Uninstall PMC from the system
  help [command]        display help for command
```

### Create a New Prompt

```bash
# Opens your default text editor to create a new prompt
pmc

# Or explicitly use the create command
pmc create
```

### Search Prompts

```bash
# Basic search by text content
pmc search --text "docker"
pmc s --text "kubernetes"

# Search by directory
pmc search --dir "/home/user/projects"

# Search with metadata
pmc search --meta "type=deployment"

# Combine filters
pmc search --text "api" --dir "/projects" --meta "env=production"

# Use regex (default) or disable it
pmc search --text "^deploy.*" 
pmc search --text "deploy" --text-regex-off

# Invert search results
pmc search --text "docker" --text-inverse
```

### Edit Prompts

```bash
# Edit by ID
pmc edit --id 12345678-1234-1234-1234-123456789abc

# Edit by searching for text
pmc edit --text "docker"

# Short aliases
pmc e --id 12345678
pmc e --text "kubernetes"
```

### List All Prompts

```bash
# Show all stored prompts
pmc list
pmc ls
```

### Help

```bash
pmc --help
pmc -h
```

## Configuration

PMC stores all data in `~/.pmc/pmc.yml`. The file structure includes:

```yaml
data:
  - id: "12345678-1234-1234-1234-123456789abc"
    timestamp: "2024-01-15T10:30:00.000Z"
    cwd: "/home/user/projects/my-app"
    prompt: |
      Create a Docker configuration for a Node.js application
      with the following requirements:
      - Use Alpine Linux base image
      - Install dependencies securely
      - Configure proper non-root user
    config:
      type: "deployment"
      env: "production"

settings:
  colorEnabled: true
  defaultEditor: "nano"
  fallbackEditor: "vi"
```

### Environment Variables

- `EDITOR`: Override the default text editor

## Command Reference

| Command | Aliases | Description |
|---------|---------|-------------|
| `pmc` | | Create new prompt (opens editor) |
| `pmc create` | | Create new prompt (explicit) |
| `pmc search` | `s` | Search prompts with filters |
| `pmc edit` | `e` | Edit existing prompt |
| `pmc list` | `ls` | List all prompts |
| `pmc generate` | `g` | Generate sample prompts |
| `pmc uninstall` | | Uninstall PMC from system |
| `pmc --help` | `-h` | Show help information |

### Search Options

| Option | Description |
|--------|-------------|
| `--dir <directory>` | Filter by directory path |
| `--text <text>` | Search prompt content |
| `--text-regex-off` | Disable regex for text search |
| `--text-inverse` | Invert text search results |
| `--meta <key=value>` | Filter by metadata |
| `--meta-inverse` | Invert metadata search results |

### Edit Options

| Option | Description |
|--------|-------------|
| `--id <id>` | Edit prompt by UUID |
| `--text <text>` | Find prompt by text content |

## Data Structure

Each prompt entry contains:

- **id**: Unique UUID identifier
- **timestamp**: ISO 8601 timestamp (human-readable)
- **cwd**: Current working directory when prompt was created
- **prompt**: The actual prompt content (supports multi-line)
- **config**: Key-value metadata (comma-separated ini format)

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run tests
npm run test
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.