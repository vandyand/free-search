#!/bin/bash

echo "🚀 Web Search Service - Quick Start"
echo "==================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    cp env.example .env
    echo "✅ Created .env file. You can customize it later."
fi

# Create database directory
mkdir -p database

echo ""
echo "🎯 Starting the Web Search Service..."
echo "📍 Service will be available at: http://localhost:3000"
echo "📚 API Documentation: http://localhost:3000/api/docs"
echo "💚 Health Check: http://localhost:3000/health"
echo ""
echo "💡 Quick test commands:"
echo "   curl http://localhost:3000/health"
echo "   curl 'http://localhost:3000/api/search?q=javascript'"
echo "   curl http://localhost:3000/api/search/engines"
echo ""
echo "🛑 Press Ctrl+C to stop the service"
echo ""

# Start the service
npm start 