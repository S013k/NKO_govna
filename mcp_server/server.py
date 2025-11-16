#!/usr/bin/env python3
"""
HTTP Server for NKO (Non-Profit Organizations) with OpenRouter integration
Provides HTTP API for processing user queries
"""

import asyncio
import json
import os
from typing import Any, Dict, List, Optional
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nko-server")

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

# Initialize OpenRouter client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
)

# HTTP client for backend requests
http_client = httpx.AsyncClient(timeout=30.0)

# Create FastAPI app
app = FastAPI(
    title="NKO OpenRouter API",
    description="API for processing NKO queries with OpenRouter integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class QueryRequest(BaseModel):
    query: str
    jwt_token: Optional[str] = None

class QueryResponse(BaseModel):
    response: str
    city: Optional[str] = None
    categories: List[str] = []

# Helper functions
async def get_nko_list(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get list of NKO with filtering"""
    try:
        response = await http_client.get(f"{BACKEND_URL}/nko", params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching NKO list: {e}")
        return []

def extract_city_from_query(query: str) -> Optional[str]:
    """Extract city name from user query using OpenRouter"""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b:free",
            messages=[
                {
                    "role": "system",
                    "content": "Extract the city name from the user's query. Return only the city name in Russian, or 'null' if no city is mentioned."
                },
                {
                    "role": "user",
                    "content": query
                }
            ]
        )
        
        city = response.choices[0].message.content.strip()
        return city if city.lower() != "null" else None
    except Exception as e:
        logger.error(f"Error extracting city from query: {e}")
        return None

def extract_categories_from_query(query: str) -> List[str]:
    """Extract categories from user query using OpenRouter"""
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b:free",
            messages=[
                {
                    "role": "system",
                    "content": "Extract NKO categories from the user's query. Return a JSON array of category names in Russian, or an empty array if no categories are mentioned."
                },
                {
                    "role": "user",
                    "content": query
                }
            ]
        )
        
        categories_str = response.choices[0].message.content.strip()
        try:
            return json.loads(categories_str)
        except json.JSONDecodeError:
            # If not valid JSON, try to parse as comma-separated list
            return [cat.strip() for cat in categories_str.split(",") if cat.strip()]
    except Exception as e:
        logger.error(f"Error extracting categories from query: {e}")
        return []

async def process_user_query(query: str, jwt_token: Optional[str] = None) -> Dict[str, Any]:
    """Process user query using OpenRouter with MCP data"""
    try:
        # Extract city and categories from query
        city = extract_city_from_query(query)
        categories = extract_categories_from_query(query)
        
        # Get NKO data based on extracted parameters
        nko_params = {}
        if jwt_token:
            nko_params["jwt_token"] = jwt_token
        if city:
            nko_params["city"] = city
        if categories:
            nko_params["category"] = categories
        
        nko_list = await get_nko_list(nko_params)
        
        # If no NKO found, try with just city
        if not nko_list and city:
            nko_list = await get_nko_list({"city": city})
        
        # If still no NKO, try without filters
        if not nko_list:
            nko_list = await get_nko_list({})
        
        # Prepare context for OpenRouter
        context = {
            "user_query": query,
            "extracted_city": city,
            "extracted_categories": categories,
            "nko_count": len(nko_list),
            "nko_data": nko_list[:5]  # Limit to first 5 NKO to avoid token limits
        }
        
        # Generate response using OpenRouter with reasoning
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b:free",
            messages=[
                {
                    "role": "system",
                    "content": f"""You are a helpful assistant for finding non-profit organizations (NKO) in Russia.
                    
Based on the user's query and the NKO data provided, give a personalized recommendation.
The data includes:
- User's original query
- Extracted city and categories
- Available NKO organizations with their details

Provide a helpful, friendly response that:
1. Acknowledges what the user is looking for
2. Recommends relevant NKO organizations from the data
3. Provides brief descriptions of each recommended organization
4. Suggests how the user can get more information or contact these organizations

Context data:
{json.dumps(context, ensure_ascii=False, indent=2)}"""
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            extra_body={"reasoning": {"enabled": True}}
        )
        
        return {
            "response": response.choices[0].message.content,
            "city": city,
            "categories": categories
        }
        
    except Exception as e:
        logger.error(f"Error processing user query: {e}")
        return {
            "response": f"Извините, произошла ошибка при обработке вашего запроса: {str(e)}",
            "city": None,
            "categories": []
        }

# API endpoints
@app.post("/query", response_model=QueryResponse)
async def query_nko(request: QueryRequest):
    """Process user query and return NKO recommendations"""
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    
    result = await process_user_query(request.query, request.jwt_token)
    return QueryResponse(**result)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    if not OPENROUTER_API_KEY:
        logger.warning("OPENROUTER_API_KEY not configured")
    else:
        logger.info("OpenRouter API configured")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    await http_client.aclose()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)