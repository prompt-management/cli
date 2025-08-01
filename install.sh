#!/bin/bash

# PMC (Prompt Management CLI) - One-liner Installation Script
# Usage: curl -fsSL https://raw.githubusercontent.com/prompt-management/cli/main/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/prompt-management/cli"
INSTALL_DIR="$HOME/.pmc-cli"
BIN_DIR="$HOME/.local/bin"

# Functions
log() {
    echo -e "${BLUE}[PMC Installer]${NC} $1"
}

success() {
    echo -e "${GREEN}[PMC Installer]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[PMC Installer]${NC} $1"
}

error() {
    echo -e "${RED}[PMC Installer]${NC} $1"
    exit 1
}

# Check requirements
check_requirements() {
    log "Checking requirements..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed. Please install Node.js >= 16.0.0"
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is required but not installed. Please install npm"
    fi
    
    if ! command -v git &> /dev/null; then
        error "git is required but not installed. Please install git"
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | sed 's/v//')
    REQUIRED_VERSION="16.0.0"
    
    if ! node -pe "require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION')" 2>/dev/null; then
        # Fallback version check if semver is not available
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d. -f1)
        if [ "$MAJOR_VERSION" -lt 16 ]; then
            error "Node.js version $NODE_VERSION is not supported. Please install Node.js >= 16.0.0"
        fi
    fi
    
    success "Requirements check passed"
}

# Create directories
create_directories() {
    log "Creating installation directories..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$BIN_DIR"
    success "Directories created"
}

# Clone and install
install_pmc() {
    log "Cloning PMC repository..."
    
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
    fi
    
    git clone "$REPO_URL" "$INSTALL_DIR" --quiet
    
    log "Installing dependencies..."
    cd "$INSTALL_DIR"
    npm install --silent --no-fund
    
    log "Building PMC..."
    npm run build --silent
    
    success "PMC installed successfully"
}

# Create symlink
create_symlink() {
    log "Creating symlink..."
    
    # Remove existing symlink if it exists
    if [ -L "$BIN_DIR/pmc" ]; then
        rm "$BIN_DIR/pmc"
    fi
    
    # Create new symlink
    ln -s "$INSTALL_DIR/dist/cli.js" "$BIN_DIR/pmc"
    chmod +x "$INSTALL_DIR/dist/cli.js"
    
    success "Symlink created at $BIN_DIR/pmc"
}

# Update PATH
update_path() {
    # Check if BIN_DIR is already in PATH
    if [[ ":$PATH:" == *":$BIN_DIR:"* ]]; then
        log "PATH already includes $BIN_DIR"
        return
    fi
    
    log "Adding $BIN_DIR to PATH..."
    
    # Add to various shell config files
    for config_file in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
        if [ -f "$config_file" ]; then
            if ! grep -q "$BIN_DIR" "$config_file"; then
                echo "" >> "$config_file"
                echo "# Added by PMC installer" >> "$config_file"
                echo "export PATH=\"\$PATH:$BIN_DIR\"" >> "$config_file"
                success "Updated $config_file"
            fi
        fi
    done
    
    # Export for current session
    export PATH="$PATH:$BIN_DIR"
}

# Verify installation
verify_installation() {
    log "Verifying installation..."
    
    if command -v pmc &> /dev/null; then
        PMC_VERSION=$(pmc --version 2>/dev/null || echo "unknown")
        success "PMC installed successfully! Version: $PMC_VERSION"
        success "Try: pmc --help"
    else
        warning "PMC installed but not found in PATH. Please restart your terminal or run:"
        echo "  export PATH=\"\$PATH:$BIN_DIR\""
    fi
}

# Main installation process
main() {
    log "Starting PMC installation..."
    
    check_requirements
    create_directories
    install_pmc
    create_symlink
    update_path
    verify_installation
    
    echo ""
    success "🎉 PMC installation complete!"
    echo ""
    log "Quick start:"
    echo "  pmc --help                    # Show help"
    echo "  pmc generate --sample         # Generate sample prompts"
    echo "  pmc                           # Create a new prompt"
    echo "  pmc search --text 'docker'    # Search prompts"
    echo ""
    log "Configuration file: ~/.pmc/pmc.yml"
}

# Run installation
main "$@"