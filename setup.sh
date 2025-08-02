#!/bin/bash

# NTLP Backend Setup and Test Script

echo "🚀 NTLP Backend Setup Script"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL."
    exit 1
fi

echo "✅ PostgreSQL is available"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your database credentials"
fi

# Create database (optional - user needs to do this manually)
echo "📊 Database setup:"
echo "   1. Create database: createdb ntlp_conference"
echo "   2. Run schema: npm run db:setup"
echo "   3. Add sample data: npm run db:seed"

echo ""
echo "🎉 Setup complete! Next steps:"
echo "   1. Configure your .env file"
echo "   2. Set up your PostgreSQL database"
echo "   3. Run: npm run dev"
echo ""
echo "📚 API will be available at: http://localhost:5000"
echo "🏥 Health check: http://localhost:5000/health"
