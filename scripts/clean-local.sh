#!/bin/bash

echo "🧹 Starting deep clean of the monorepo..."

# Function to safely remove directories
safe_remove() {
    if [ -d "$1" ]; then
        echo "Removing: $1"
        rm -rf "$1"
    fi
}

# Function to safely remove files
safe_remove_file() {
    if [ -f "$1" ]; then
        echo "Removing: $1"
        rm -f "$1"
    fi
}

# Remove all node_modules directories
echo "🗂️  Removing node_modules directories..."
find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove all dist directories
echo "📦 Removing dist directories..."
find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove all build directories
# echo "🔨 Removing build directories..."
# find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove Next.js cache directories
echo "⚡ Removing .next directories..."
find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove Turbo cache directories
echo "🚀 Removing .turbo directories..."
find . -name ".turbo" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove coverage directories
echo "📊 Removing coverage directories..."
find . -name "coverage" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove .nyc_output directories
echo "🧪 Removing .nyc_output directories..."
find . -name ".nyc_output" -type d -prune -exec rm -rf {} + 2>/dev/null || true

# Remove TypeScript build info files
echo "📝 Removing TypeScript build info files..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# Remove lock files
# echo "🔒 Removing lock files..."
# safe_remove_file "pnpm-lock.yaml"
# safe_remove_file "package-lock.json"
# safe_remove_file "yarn.lock"

# Remove other common cache/temp directories
echo "🗄️  Removing other cache directories..."
safe_remove ".cache"
safe_remove "tmp"
safe_remove "temp"

# Remove Electron specific directories
echo "⚛️  Removing Electron build artifacts..."
find . -name "out" -type d -prune -exec rm -rf {} + 2>/dev/null || true

echo "✅ Deep clean completed!"
echo "💡 Run 'pnpm install' to reinstall dependencies."
