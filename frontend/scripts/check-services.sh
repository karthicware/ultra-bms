#!/bin/bash
# Pre-test validation script
# Ensures backend and frontend servers are running before executing E2E tests
# Usage: bash scripts/check-services.sh

set -e

echo "🔍 Pre-Test Validation: Checking service health..."
echo ""

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
MAX_RETRIES=3
RETRY_DELAY=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
  local service_name=$1
  local service_url=$2
  local retries=0

  while [ $retries -lt $MAX_RETRIES ]; do
    # Use --max-time to prevent hanging, and -L to follow redirects
    if curl -f -s -o /dev/null --max-time 10 -L "$service_url"; then
      echo -e "${GREEN}✅ $service_name is healthy${NC} ($service_url)"
      return 0
    else
      retries=$((retries + 1))
      if [ $retries -lt $MAX_RETRIES ]; then
        echo -e "${YELLOW}⚠️  $service_name not responding, retrying ($retries/$MAX_RETRIES)...${NC}"
        sleep $RETRY_DELAY
      fi
    fi
  done

  echo -e "${RED}❌ $service_name is not responding after $MAX_RETRIES attempts${NC}"
  echo -e "${RED}   URL: $service_url${NC}"
  return 1
}

# Check backend server
echo "Checking backend server..."
if ! check_service "Backend" "$BACKEND_URL/actuator/health"; then
  echo ""
  echo -e "${RED}ERROR: Backend server is not running!${NC}"
  echo ""
  echo "Please start the backend server first:"
  echo "  cd backend"
  echo "  ./mvnw spring-boot:run"
  echo ""
  exit 1
fi

echo ""

# Check frontend server (Note: Next.js may redirect, so we check port availability instead)
echo "Checking frontend server..."
if curl -s -o /dev/null --max-time 5 --connect-timeout 3 "$FRONTEND_URL" 2>/dev/null || \
   lsof -i :3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Frontend is healthy${NC} ($FRONTEND_URL)"
else
  echo ""
  echo -e "${RED}ERROR: Frontend server is not running!${NC}"
  echo ""
  echo "Please start the frontend server first:"
  echo "  cd frontend"
  echo "  npm run dev"
  echo ""
  exit 1
fi

echo ""
echo -e "${GREEN}✅ All services are ready for testing!${NC}"
echo ""
exit 0
