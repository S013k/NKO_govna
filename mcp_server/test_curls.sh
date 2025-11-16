#!/bin/bash

# Test curls for NKO API /query endpoint through nginx

echo "Testing NKO API /query endpoint..."
echo "================================="

# Test query endpoint without JWT token
echo -e "\n1. Testing query endpoint (Москва):"
curl -s -X POST http://localhost/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Хочу сходить куда-нибудь в Москве"}' | jq '.response' | head -c 300

echo -e "\n..."

# Test query endpoint with children category
echo -e "\n2. Testing query endpoint (помощь детям):"
curl -s -X POST http://localhost/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Ищу благотворительную организацию для помощи детям"}' | jq '.response' | head -c 300

echo -e "\n..."

# Test query endpoint with education category
echo -e "\n3. Testing query endpoint (образование):"
curl -s -X POST http://localhost/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Посоветуй НКО в Санкт-Петербурге, занимающиеся образованием"}' | jq '.response' | head -c 300

echo -e "\n..."

# Test query endpoint with JWT token
echo -e "\n4. Testing query endpoint with JWT token:"
curl -s -X POST http://localhost/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Посоветуй НКО для помощи животным", "jwt_token": "your_jwt_token_here"}' | jq '.response' | head -c 300

echo -e "\n..."

# Test query endpoint with extracted city and categories
echo -e "\n5. Testing query endpoint (show extracted data):"
curl -s -X POST http://localhost/ai/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Хочу найти организацию для помощи пожилым в Екатеринбурге"}' | jq '{city: .city, categories: .categories}'

echo -e "\n================================="
echo "Testing completed!"