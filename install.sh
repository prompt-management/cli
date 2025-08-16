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
PMC_DATA_DIR="$HOME/.pmc"
BACKUP_DIR="$PMC_DATA_DIR/backup-$(date +%Y%m%d-%H%M%S)"

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

# Check if PMC is already installed
check_existing_installation() {
    if [ -d "$INSTALL_DIR" ] || command -v pmc &> /dev/null; then
        return 0  # Exists
    else
        return 1  # Does not exist
    fi
}

# Get current PMC version
get_current_version() {
    if command -v pmc &> /dev/null; then
        pmc --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || echo "unknown"
    else
        echo "none"
    fi
}

# Backup user data
backup_user_data() {
    if [ -d "$PMC_DATA_DIR" ]; then
        log "Creating backup of user data..."
        mkdir -p "$BACKUP_DIR"
        
        # Backup important files
        for file in "prompts.md" "pmc-config.yml" "prompts-system-meta.jsonl"; do
            if [ -f "$PMC_DATA_DIR/$file" ]; then
                cp "$PMC_DATA_DIR/$file" "$BACKUP_DIR/"
                log "Backed up $file"
            fi
        done
        
        # Backup .git directory if it exists
        if [ -d "$PMC_DATA_DIR/.git" ]; then
            cp -r "$PMC_DATA_DIR/.git" "$BACKUP_DIR/"
            log "Backed up Git repository"
        fi
        
        success "Backup created at $BACKUP_DIR"
        return 0
    else
        log "No existing data directory found, skipping backup"
        return 1
    fi
}

# Restore user data from backup if installation fails
restore_backup() {
    if [ -d "$BACKUP_DIR" ]; then
        warning "Installation failed, restoring backup..."
        
        for file in "prompts.md" "pmc-config.yml" "prompts-system-meta.jsonl"; do
            if [ -f "$BACKUP_DIR/$file" ]; then
                cp "$BACKUP_DIR/$file" "$PMC_DATA_DIR/"
            fi
        done
        
        if [ -d "$BACKUP_DIR/.git" ]; then
            cp -r "$BACKUP_DIR/.git" "$PMC_DATA_DIR/"
        fi
        
        success "Backup restored"
    fi
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
        warning "git is recommended for version control features. Install git for full functionality"
    else
        success "Git found - version control features will be available"
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
    local is_upgrade=$1
    
    if [ "$is_upgrade" = "true" ]; then
        log "Upgrading PMC repository..."
    else
        log "Cloning PMC repository..."
    fi
    
    # Remove old installation directory
    if [ -d "$INSTALL_DIR" ]; then
        rm -rf "$INSTALL_DIR"
    fi
    
    # Clone fresh copy
    if ! git clone "$REPO_URL" "$INSTALL_DIR" --quiet; then
        error "Failed to clone repository. Please check your internet connection."
    fi
    
    cd "$INSTALL_DIR"
    
    log "Installing dependencies..."
    if ! npm install --silent --no-fund; then
        error "Failed to install dependencies"
    fi
    
    log "Building PMC..."
    if ! npm run build --silent; then
        error "Failed to build PMC"
    fi
    
    log "Running tests to verify installation..."
    npm test --silent || warning "Some tests failed, but installation continues"
    
    if [ "$is_upgrade" = "true" ]; then
        success "PMC upgraded successfully"
    else
        success "PMC installed successfully"
    fi
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
    local is_upgrade=false
    local current_version="none"
    local backup_created=false
    
    # Check if this is an upgrade
    if check_existing_installation; then
        is_upgrade=true
        current_version=$(get_current_version)
        
        echo ""
        log "🔄 PMC upgrade detected!"
        log "Current version: $current_version"
        echo ""
        
        # Create backup of user data
        if backup_user_data; then
            backup_created=true
        fi
    else
        log "Starting fresh PMC installation..."
    fi
    
    # Set up error handling for upgrades
    if [ "$backup_created" = "true" ]; then
        trap 'restore_backup' ERR
    fi
    
    check_requirements
    create_directories
    install_pmc "$is_upgrade"
    create_symlink
    update_path
    verify_installation
    
    # Clear the error trap
    trap - ERR
    
    echo ""
    if [ "$is_upgrade" = "true" ]; then
        success "🎉 PMC upgrade complete!"
        log "Upgraded from version $current_version"
        if [ "$backup_created" = "true" ]; then
            log "Backup saved at: $BACKUP_DIR"
        fi
    else
        success "🎉 PMC installation complete!"
    fi
    
    echo ""
    log "Quick start:"
    echo "  pmc --help                         # Show help"
    echo "  pmc generate --sample              # Generate sample prompts"
    echo "  pmc                                # Create a new prompt"
    echo "  pmc search --text 'docker'         # Search prompts"
    echo "  pmc watch --verbose                # Watch for changes"
    echo "  pmc history                        # View version history"
    echo "  pmc --prompts-file ./my.md list    # Use custom file"
    echo ""
    log "Configuration: ~/.pmc/pmc-config.yml"
    log "Git repository: ~/.pmc/.git (for version control)"
    log "Prompts file: ~/.pmc/prompts.md"
    
    if [ "$is_upgrade" = "true" ] && [ "$backup_created" = "true" ]; then
        echo ""
        log "Your prompts and settings have been preserved during the upgrade."
        log "If you encounter any issues, restore from backup:"
        echo "  cp $BACKUP_DIR/* ~/.pmc/"
    fi
}

# Run installation
main "$@"