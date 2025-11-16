#!/usr/bin/env python3
"""
Main application that uses OpenRouter API with MCP to process user queries
"""

import asyncio
import json
import os
from typing import Any, Dict, List, Optional
import logging

from openai import OpenAI
import httpx
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nko-main")

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

async def get_nko_list(params: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Get list of NKO with filtering"""
    try:
        response = await http_client.get(f"{BACKEND_URL}/nko", params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching NKO list: {e}")
        return []

async def get_nko_by_id(nko_id: int) -> Optional[Dict[str, Any]]:
    """Get specific NKO by ID"""
    try:
        response = await http_client.get(f"{BACKEND_URL}/nko/{nko_id}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching NKO by ID: {e}")
        return None

async def get_cities(regex: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all cities with optional regex filter"""
    try:
        params = {}
        if regex:
            params["regex"] = regex
        
        response = await http_client.get(f"{BACKEND_URL}/city", params=params)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Error fetching cities: {e}")
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

async def process_user_query(query: str) -> str:
    """Process user query using OpenRouter with MCP data"""
    try:
        # Extract city and categories from query
        city = extract_city_from_query(query)
        categories = extract_categories_from_query(query)
        
        # Get NKO data based on extracted parameters
        nko_params = {}
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
        
        return response.choices[0].message.content
        
    except Exception as e:
        logger.error(f"Error processing user query: {e}")
        return f"Извините, произошла ошибка при обработке вашего запроса: {str(e)}"

async def main():
    """Main function to run the application"""
    if not OPENROUTER_API_KEY:
        logger.error("OPENROUTER_API_KEY environment variable is required")
        return
    
    # Test backend connection
    try:
        response = await http_client.get(f"{BACKEND_URL}/ping")
        response.raise_for_status()
        logger.info("Backend connection successful")
    except Exception as e:
        logger.error(f"Backend connection failed: {e}")
        return
    
    # Example usage
    while True:
        try:
            query = input("\nВведите ваш запрос (или 'выход' для завершения): ")
            if query.lower() in ['выход', 'exit', 'quit']:
                break
            
            print("\nОбрабатываю ваш запрос...")
            response = await process_user_query(query)
            print(f"\nОтвет:\n{response}")
            
        except KeyboardInterrupt:
            print("\nДо свидания!")
            break
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            print(f"Произошла ошибка: {e}")
    
    # Close HTTP client
    await http_client.aclose()

if __name__ == "__main__":
    asyncio.run(main())