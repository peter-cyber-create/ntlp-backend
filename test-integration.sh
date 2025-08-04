#!/bin/bash

# NTLP Development Environment Test Script
# Tests the integration between frontend and backend

echo "🧪 Testing NTLP Frontend-Backend Integration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BACKEND_URL="http://localhost:5000"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}📋 Testing Backend Endpoints...${NC}"

# Test backend health
echo -n "🔍 Backend Health Check... "
if curl -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo -e "${YELLOW}Please start the backend with: cd ntlp-backend && npm start${NC}"
    exit 1
fi

# Test contacts endpoint
echo -n "📞 Contacts API... "
CONTACTS_RESPONSE=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/contacts" -o /dev/null)
if [ "$CONTACTS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $CONTACTS_RESPONSE)${NC}"
fi

# Test registrations endpoint
echo -n "📝 Registrations API... "
REGISTRATIONS_RESPONSE=$(curl -s -w "%{http_code}" "$BACKEND_URL/api/registrations" -o /dev/null)
if [ "$REGISTRATIONS_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $REGISTRATIONS_RESPONSE)${NC}"
fi

# Test admin endpoint
echo -n "👤 Admin API... "
ADMIN_RESPONSE=$(curl -s -w "%{http_code}" "$BACKEND_URL/admin" -o /dev/null)
if [ "$ADMIN_RESPONSE" = "200" ] || [ "$ADMIN_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ Working${NC}"
else
    echo -e "${RED}❌ Failed (HTTP $ADMIN_RESPONSE)${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Testing Frontend...${NC}"

# Check if frontend is running
echo -n "🔍 Frontend Health Check... "
if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
    echo -e "${YELLOW}Please start the frontend with: cd ntlp && npm run dev${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔗 Testing API Integration...${NC}"

# Test API connectivity from frontend perspective
echo -n "🔌 API Client Connection... "
# This would normally test the frontend's ability to connect to the backend
# For now, we'll just check if the API client file exists
if [ -f "/home/peter/Desktop/dev/ntlp/lib/ntlp-api-client.js" ]; then
    echo -e "${GREEN}✅ API Client Found${NC}"
else
    echo -e "${RED}❌ API Client Missing${NC}"
fi

echo ""
echo -e "${GREEN}✅ Integration Test Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Application URLs:${NC}"
echo -e "   Frontend: ${FRONTEND_URL}"
echo -e "   Backend API: ${BACKEND_URL}"
echo -e "   Admin Panel: ${BACKEND_URL}/admin"
echo ""
echo -e "${BLUE}🚀 To start both services:${NC}"
echo -e "   Backend: cd /home/peter/Desktop/dev/ntlp-backend && npm start"
echo -e "   Frontend: cd /home/peter/Desktop/dev/ntlp && npm run dev"
echo ""
echo -e "${BLUE}📊 To test the contact form:${NC}"
echo -e "   curl -X POST ${BACKEND_URL}/api/contacts \\"
echo -e "     -H \"Content-Type: application/json\" \\"
echo -e "     -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"subject\":\"Test\",\"message\":\"Test message\"}'"
echo ""
