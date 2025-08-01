# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of PMC (Prompt Management CLI)
- Personal, secure prompt storage in `~/.pmc/pmc.yml`
- CLI-based interface for seamless terminal integration
- Powerful search capabilities:
  - Text content search with regex support
  - Directory-based filtering
  - Metadata search and filtering
  - Combined search options
- Editor integration with automatic detection
- UUID-based prompt indexing for reliable referencing
- Rich metadata support with custom tags and attributes
- Usage tracking with automatic timestamp recording
- Sample prompt generation for quick setup
- Cross-platform support (Linux, macOS, Windows)
- Human-readable YAML storage format
- Command aliases for improved workflow

### Features
- **Core Commands**:
  - `pmc` / `pmc create` - Create new prompts
  - `pmc search` / `pmc s` - Search existing prompts
  - `pmc edit` / `pmc e` - Edit prompts by ID or search
  - `pmc list` / `pmc ls` - List all prompts
  - `pmc generate` - Generate sample prompts
  - `pmc uninstall` - Clean uninstall

- **Search Options**:
  - `--text` - Search prompt content
  - `--dir` - Filter by directory path
  - `--meta` - Filter by metadata key=value pairs
  - `--text-regex-off` - Disable regex for exact matching
  - `--text-inverse` - Invert text search results
  - `--meta-inverse` - Invert metadata search results

- **Editor Integration**:
  - Automatic editor detection from `$EDITOR` environment variable
  - Fallback to common editors (nano, vi, vim, code)
  - Support for any text editor

- **Data Storage**:
  - Local storage in `~/.pmc/pmc.yml`
  - YAML format for human readability
  - Automatic backup and version control friendly
  - UUID-based unique identification

### Security
- Complete local storage - no external dependencies
- No network communication required
- User data never leaves the local machine
- Configurable data directory location

### Performance
- Fast search with optimized algorithms
- Minimal memory footprint
- Instant command execution
- Efficient YAML parsing and writing

### Documentation
- Comprehensive README with usage examples
- Detailed CLI help system
- Contributing guidelines with CLA
- GitHub issue and PR templates
- Community discussion setup

## [1.0.0] - TBD

### Added
- Initial stable release
- All core functionality implemented
- Documentation complete
- Testing suite established
- CI/CD pipeline configured

---

## Release Notes

### Version 1.0.0

PMC 1.0.0 represents the first stable release of the Prompt Management CLI. This version includes all core functionality needed for effective prompt management in AI-driven development workflows.

**Key Highlights:**
- 🔒 **Personal & Secure**: Complete local storage ensures your prompts never leave your machine
- ⚡ **CLI-native**: Designed for developers who live in the terminal
- 🔍 **Powerful Search**: Multiple search methods with regex support and filtering
- 📝 **Editor Integration**: Works with any text editor through environment variables
- 🏷️ **Rich Metadata**: Organize prompts with custom tags and attributes
- 📊 **Usage Tracking**: Automatic context recording for better organization

**Perfect for:**
- Individual developers managing personal prompt libraries
- Teams standardizing AI coding practices
- AI prompt engineers optimizing and versioning prompts
- Anyone building domain-specific prompt collections

**Installation:**
```bash
curl -fsSL https://raw.githubusercontent.com/prompt-management/cli/main/install.sh | bash
```

**Quick Start:**
```bash
# Create your first prompt
pmc

# Generate samples to explore features
pmc generate --sample

# Search for prompts
pmc search --text "react"
```

This release establishes PMC as a foundational tool for prompt management in the era of AI-assisted development.

---

## Development Changelog

### Development Milestones

#### Phase 1: Core Architecture (Completed)
- [x] TypeScript project setup
- [x] CLI framework implementation
- [x] YAML data storage design
- [x] Basic CRUD operations
- [x] UUID-based indexing

#### Phase 2: Search & Filtering (Completed)
- [x] Text content search
- [x] Directory-based filtering
- [x] Metadata search functionality
- [x] Regex pattern support
- [x] Inverse search options
- [x] Combined search capabilities

#### Phase 3: User Experience (Completed)
- [x] Editor integration
- [x] Command aliases
- [x] Sample prompt generation
- [x] Error handling and validation
- [x] Cross-platform compatibility
- [x] Installation scripts

#### Phase 4: Documentation & Community (Completed)
- [x] Comprehensive README
- [x] API documentation
- [x] Contributing guidelines
- [x] GitHub issue templates
- [x] Community discussion setup
- [x] License and legal framework

#### Phase 5: Quality Assurance (In Progress)
- [ ] Comprehensive test suite
- [ ] CI/CD pipeline setup
- [ ] Performance optimization
- [ ] Security audit
- [ ] Cross-platform testing

#### Phase 6: Release Preparation (Planned)
- [ ] Version tagging
- [ ] NPM package publishing
- [ ] Documentation website
- [ ] Demo and examples
- [ ] Community outreach

### Future Roadmap

#### Version 1.1.0 - Enhanced Features
- [ ] Plugin system for editors
- [ ] Advanced prompt templates
- [ ] Import/export functionality
- [ ] Prompt sharing capabilities
- [ ] Analytics and insights

#### Version 1.2.0 - Team Features
- [ ] Team prompt libraries
- [ ] Collaboration tools
- [ ] Permission management
- [ ] Sync capabilities
- [ ] Audit logging

#### Version 2.0.0 - Advanced Integration
- [ ] AI model integration
- [ ] Prompt optimization suggestions
- [ ] Performance analytics
- [ ] Machine learning insights
- [ ] Cloud sync options

---

*For detailed technical changes, see the [commit history](https://github.com/prompt-management/cli/commits/main).*
