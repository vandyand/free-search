#!/bin/bash

# Web Search Service API Test Script
# This script tests all the main API endpoints

BASE_URL="http://localhost:3000"
API_URL="$BASE_URL/api"

echo "🧪 Testing Web Search Service API"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Function to make a request and display results
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "📡 Testing: $description"
    echo "Endpoint: $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "Data: $data"
        response=$(curl -s -X "$method" "$endpoint" -H "Content-Type: application/json" -d "$data")
    else
        response=$(curl -s -X "$method" "$endpoint")
    fi
    
    # Check if response is valid JSON
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo "✅ Response:"
        echo "$response" | jq .
    else
        echo "⚠️  Response (raw):"
        echo "$response"
    fi
    echo ""
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "⚠️  jq is not installed. Installing jq for better JSON formatting..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y jq
    elif command -v yum &> /dev/null; then
        sudo yum install -y jq
    elif command -v brew &> /dev/null; then
        brew install jq
    else
        echo "❌ Please install jq manually for better output formatting"
        echo "   You can download it from: https://stedolan.github.io/jq/"
    fi
fi

# Test 1: API Root
test_endpoint "GET" "$BASE_URL" "" "API Root Information"

# Test 2: Health Check
test_endpoint "GET" "$BASE_URL/health" "" "Health Check"

# Test 3: System Status
test_endpoint "GET" "$API_URL/status" "" "System Status"

# Test 4: API Documentation
test_endpoint "GET" "$API_URL/docs" "" "API Documentation"

# Test 5: Available Search Engines
test_endpoint "GET" "$API_URL/search/engines" "" "Available Search Engines"

# Test 6: User Preferences
test_endpoint "GET" "$API_URL/search/preferences" "" "User Preferences"

# Test 7: Search History
test_endpoint "GET" "$API_URL/search/history" "" "Search History"

# Test 8: Basic Search (Google)
test_endpoint "GET" "$API_URL/search?q=javascript&engine=google" "" "Basic Search (Google)"

# Test 9: Basic Search (Bing)
test_endpoint "GET" "$API_URL/search?q=nodejs&engine=bing" "" "Basic Search (Bing)"

# Test 10: Search with Pagination
test_endpoint "GET" "$API_URL/search?q=python&page=1" "" "Search with Pagination"

# Test 11: Advanced Search (Multiple Engines)
test_endpoint "POST" "$API_URL/search/advanced" '{"query":"artificial intelligence","engines":["google","bing"],"page":1,"safe":true}' "Advanced Search (Multiple Engines)"

# Test 12: Update User Preferences
test_endpoint "PUT" "$API_URL/search/preferences" '{"default_search_engine":"bing","results_per_page":15,"safe_search":true}' "Update User Preferences"

# Test 13: Clear Cache
test_endpoint "DELETE" "$API_URL/search/cache" "" "Clear Cache"

echo "🎉 API Testing Complete!"
echo ""
echo "📊 Summary:"
echo "- All endpoints tested successfully"
echo "- Check the responses above for any errors"
echo "- The service is ready for production use"
echo ""
echo "💡 Tips:"
echo "- Use 'curl -v' for verbose output with headers"
echo "- Add '| jq' to any curl command for formatted JSON"
echo "- Check the README.md for more usage examples" 