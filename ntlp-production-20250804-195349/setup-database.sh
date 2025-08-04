#!/bin/bash
# Database setup script for NTLP

echo "🗄️ Setting up NTLP Database"

# Create database if it doesn't exist
sudo -u postgres createdb ntlp_conference 2>/dev/null || echo "Database already exists"

# Run schema
echo "📋 Creating database schema..."
sudo -u postgres psql -d ntlp_conference -f backend/database/schema.sql

# Run migration
echo "🔄 Running migrations..."
sudo -u postgres psql -d ntlp_conference -f backend/database/migrate_registrations_schema.sql

# Verify setup
echo "✅ Verifying database setup..."
sudo -u postgres psql -d ntlp_conference -c "\dt"

echo "✅ Database setup completed!"
