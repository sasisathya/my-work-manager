#!/bin/bash

echo "🚀 My Work Manager - Starting..."
echo ""

# Check if config.json exists
if [ ! -f "config.json" ]; then
    echo "❌ config.json not found!"
    echo "📝 Please copy config.example.json to config.json and add your credentials"
    echo ""
    echo "Run: cp config.example.json config.json"
    echo "Then edit config.json with your Jira and OpenAI credentials"
    exit 1
fi

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected. Starting with Docker Compose..."
    docker-compose up --build
else
    echo "📦 Docker not found. Starting with npm..."

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing dependencies..."
        npm install
    fi

    echo "🏃 Starting development server on port 2999..."
    npm run dev
fi
