#!/usr/bin/env bash
set -euo pipefail

# Ultrathink Blockchain — Claude Code Skill Installer
# https://github.com/YOUR_USERNAME/ultrathink-blockchain

SKILL_NAME="ultrathink-blockchain"
CLAUDE_DIR="${HOME}/.claude"
SKILLS_DIR="${CLAUDE_DIR}/skills"
INSTALL_DIR="${SKILLS_DIR}/${SKILL_NAME}"

# Colors
GREEN='\033[0;32m'
PURPLE='\033[0;35m'
DIM='\033[0;90m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${PURPLE}${BOLD}  ULTRATHINK × BLOCKCHAIN${RESET}"
echo -e "${DIM}  Claude Code Skill Installer${RESET}"
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "Error: git is required but not installed."
    exit 1
fi

# Create skills directory if needed
if [ ! -d "${SKILLS_DIR}" ]; then
    echo -e "${DIM}  Creating skills directory...${RESET}"
    mkdir -p "${SKILLS_DIR}"
fi

# Remove existing installation if present
if [ -d "${INSTALL_DIR}" ]; then
    echo -e "${DIM}  Removing existing installation...${RESET}"
    rm -rf "${INSTALL_DIR}"
fi

# Clone and extract skill
echo -e "${DIM}  Downloading skill...${RESET}"
TEMP_DIR=$(mktemp -d)
trap "rm -rf ${TEMP_DIR}" EXIT

git clone --quiet --depth 1 https://github.com/YOUR_USERNAME/ultrathink-blockchain.git "${TEMP_DIR}/repo"

# Copy skill directory
echo -e "${DIM}  Installing to ${INSTALL_DIR}...${RESET}"
cp -r "${TEMP_DIR}/repo/skill" "${INSTALL_DIR}"

echo ""
echo -e "${GREEN}${BOLD}  Installed successfully.${RESET}"
echo ""
echo -e "${DIM}  Skill location: ${INSTALL_DIR}${RESET}"
echo -e "${DIM}  Start a new Claude Code session to activate.${RESET}"
echo ""
echo -e "${PURPLE}  ultrathink. build on-chain. ship to mainnet.${RESET}"
echo ""
