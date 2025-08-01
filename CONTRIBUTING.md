# Contributing to PMC (Prompt Management CLI)

Thank you for your interest in contributing to PMC! This document provides guidelines for contributing to the project.

## 🤝 Contributor License Agreement (CLA)

**⚠️ IMPORTANT: By submitting any contribution to this project, you agree to our Contributor License Agreement (CLA).**

### CLA Terms

By contributing to this project, you hereby grant to the project maintainers and the project itself a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable license to:

1. **Use, reproduce, modify, and distribute** your contributions as part of the project
2. **Sublicense** your contributions under the project's license (MIT License)
3. **Create derivative works** based on your contributions
4. **Publicly display and perform** your contributions

You represent that:
- You have the legal right to make the contributions
- Your contributions are your original work or you have obtained all necessary permissions
- Your contributions do not violate any third-party rights
- You understand that your contributions may be incorporated into the project and licensed under the MIT License

**By submitting a pull request, you acknowledge that you have read and agree to these terms.**

## 🚀 Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn
- Git

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/cli.git
   cd cli
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Build the project**:
   ```bash
   npm run build
   ```

5. **Link for local development**:
   ```bash
   npm link
   ```

6. **Test the CLI**:
   ```bash
   pmc --help
   ```

### Development Commands

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## 📋 Contribution Guidelines

### Code Style

We use ESLint and Prettier for code formatting. Please ensure your code follows these standards:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

#### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

#### Examples:
```
feat(search): add regex support for text search
fix(cli): resolve editor detection on Windows
docs(readme): update installation instructions
test(search): add unit tests for metadata filtering
```

### Pull Request Process

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the guidelines above

3. **Add tests** for new functionality

4. **Ensure all tests pass**:
   ```bash
   npm test
   ```

5. **Commit your changes** with conventional commit messages

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

### Pull Request Requirements

- [ ] **CLA Agreement**: Acknowledge CLA terms in your PR description
- [ ] **Clear Description**: Explain what your PR does and why
- [ ] **Tests**: Include tests for new features or bug fixes
- [ ] **Documentation**: Update documentation if needed
- [ ] **No Breaking Changes**: Unless discussed in an issue first
- [ ] **Code Quality**: Pass all linting and formatting checks

### Testing

We maintain high test coverage. Please include tests for:

- New features
- Bug fixes
- Edge cases
- Error conditions

#### Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    // Test implementation
    expect(result).toBe(expected);
  });

  it('should handle error cases', () => {
    // Error case testing
    expect(() => action()).toThrow();
  });
});
```

## 🐛 Bug Reports

When reporting bugs, please include:

1. **PMC version**: `pmc --version`
2. **Operating system**: Linux, macOS, Windows
3. **Node.js version**: `node --version`
4. **Steps to reproduce**: Clear, minimal steps
5. **Expected behavior**: What should happen
6. **Actual behavior**: What actually happens
7. **Error messages**: Full error output if applicable

Use our [Bug Report Template](https://github.com/prompt-management/cli/issues/new?template=bug_report.yml).

## ✨ Feature Requests

We welcome feature requests! Please:

1. **Check existing issues** to avoid duplicates
2. **Use our template**: [Feature Request Template](https://github.com/prompt-management/cli/issues/new?template=feature_request.yml)
3. **Provide context**: Why is this feature needed?
4. **Describe the solution**: How should it work?
5. **Consider alternatives**: Are there other approaches?

## 📖 Documentation

Documentation improvements are always welcome:

- **README updates**: Installation, usage, examples
- **Code comments**: Inline documentation
- **API documentation**: Function and class descriptions
- **Tutorials**: Step-by-step guides
- **Examples**: Real-world use cases

## 🏗️ Project Structure

```
cli/
├── src/                    # Source code
│   ├── cli.ts             # CLI entry point
│   ├── index.ts           # Main exports
│   ├── pmc-manager.ts     # Core functionality
│   └── types.ts           # TypeScript types
├── tests/                 # Test files
├── docs/                  # Documentation
├── .github/               # GitHub templates
└── scripts/               # Build and utility scripts
```

### Key Files

- **`src/cli.ts`**: Command-line interface setup
- **`src/pmc-manager.ts`**: Core prompt management logic
- **`src/types.ts`**: TypeScript type definitions
- **`package.json`**: Project configuration
- **`tsconfig.json`**: TypeScript configuration

## 🔧 Development Tips

### Local Testing

Test your changes with the development build:

```bash
# Build and link locally
npm run build && npm link

# Test CLI commands
pmc create
pmc search --text "test"
pmc list
```

### Debugging

Use Node.js debugging:

```bash
# Debug the CLI
node --inspect-brk ./dist/cli.js --help

# Debug tests
npm run test:debug
```

### Environment Variables

Useful for development:

```bash
# Use different config directory
export PMC_CONFIG_DIR="./test-pmc"

# Force specific editor
export EDITOR="code"

# Debug mode
export DEBUG="pmc:*"
```

## 🤝 Community

### Communication

- **GitHub Discussions**: For questions and ideas
- **GitHub Issues**: For bugs and feature requests
- **Pull Requests**: For code contributions

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please be respectful and inclusive in all interactions.

## 🏷️ Release Process

We follow semantic versioning (SemVer):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

### Release Workflow

1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Create GitHub release
4. Publish to npm registry

## ❓ Questions?

If you have questions about contributing:

1. Check the [FAQ](https://github.com/prompt-management/cli/discussions/categories/q-a)
2. Search [existing discussions](https://github.com/prompt-management/cli/discussions)
3. Create a new [discussion](https://github.com/prompt-management/cli/discussions/new)

## 🙏 Recognition

Contributors are recognized in:

- **README.md**: Contributors section
- **CHANGELOG.md**: Release notes
- **GitHub**: Contributor graphs and statistics

---

**Thank you for contributing to PMC! Your efforts help make prompt management better for everyone.**

*By contributing, you're helping developers worldwide harness the full potential of AI coding assistants.*
