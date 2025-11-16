#!/usr/bin/env python3
"""
MCP Server for NKO (Non-Profit Organizations) endpoint
Provides access to NKO data through Model Context Protocol by calling backend API
"""

import asyncio
import json
import os
from typing import Any, Dict, List, Optional, Sequence
import logging

import httpx
from mcp.server import Server
from mcp.server.models import InitializationOptions
from mcp.server.stdio import stdio_server
from mcp.types import (
    CallToolRequest,
    CallToolResult,
    ListToolsRequest,
    ListToolsResult,
    TextContent,
    Tool,
)
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nko-mcp-server")

# Backend API configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://backend:8000")

# Create MCP server
server = Server("nko-server")

# HTTP client for backend requests
client = httpx.AsyncClient(timeout=30.0)

# Tool definitions
@server.list_tools()
async def handle_list_tools() -> List[Tool]:
    """List available tools"""
    return [
        Tool(
            name="get_nko_list",
            description="Get a list of NKO (Non-Profit Organizations) with optional filtering",
            inputSchema={
                "type": "object",
                "properties": {
                    "jwt_token": {
                        "type": "string",
                        "description": "JWT token for user authentication (required only for favorite filter)"
                    },
                    "city": {
                        "type": "string",
                        "description": "Filter by city name (optional)"
                    },
                    "favorite": {
                        "type": "boolean",
                        "description": "Filter by favorite status (optional, requires jwt_token)"
                    },
                    "category": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Filter by categories (optional, can provide multiple)"
                    },
                    "regex": {
                        "type": "string",
                        "description": "Regular expression to search in name and description (optional)"
                    }
                }
            }
        ),
        Tool(
            name="get_nko_by_id",
            description="Get a specific NKO by its ID",
            inputSchema={
                "type": "object",
                "properties": {
                    "nko_id": {
                        "type": "integer",
                        "description": "The ID of the NKO to retrieve"
                    }
                },
                "required": ["nko_id"]
            }
        ),
        Tool(
            name="get_cities",
            description="Get all available cities with optional regex filter",
            inputSchema={
                "type": "object",
                "properties": {
                    "regex": {
                        "type": "string",
                        "description": "Regular expression to filter city names (optional)"
                    }
                }
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
    """Handle tool calls"""
    try:
        if name == "get_nko_list":
            return await get_nko_list(arguments)
        elif name == "get_nko_by_id":
            return await get_nko_by_id(arguments)
        elif name == "get_cities":
            return await get_cities(arguments)
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
    except Exception as e:
        logger.error(f"Error in tool {name}: {e}")
        return [TextContent(type="text", text=f"Error: {str(e)}")]

async def get_nko_list(args: Dict[str, Any]) -> List[TextContent]:
    """Get list of NKO with filtering"""
    jwt_token = args.get("jwt_token", "")
    city = args.get("city")
    favorite = args.get("favorite")
    categories = args.get("category", [])
    regex = args.get("regex")
    
    try:
        # Build query parameters
        params = {}
        if jwt_token:
            params["jwt_token"] = jwt_token
        if city:
            params["city"] = city
        if favorite is not None:
            params["favorite"] = str(favorite).lower()
        if regex:
            params["regex"] = regex
        
        # Add categories as multiple parameters
        if categories:
            for category in categories:
                params["category"] = categories
        
        # Make request to backend
        response = await client.get(f"{BACKEND_URL}/nko", params=params)
        response.raise_for_status()
        
        nko_list = response.json()
        
        return [TextContent(
            type="text",
            text=json.dumps(nko_list, ensure_ascii=False, indent=2)
        )]
    
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching NKO list: {e}")
        error_text = f"HTTP error {e.response.status_code}: {e.response.text}"
        return [TextContent(type="text", text=error_text)]
    except Exception as e:
        logger.error(f"Error fetching NKO list: {e}")
        return [TextContent(type="text", text=f"Error fetching NKO list: {str(e)}")]

async def get_nko_by_id(args: Dict[str, Any]) -> List[TextContent]:
    """Get specific NKO by ID"""
    nko_id = args.get("nko_id")
    
    if not nko_id:
        return [TextContent(type="text", text="Error: nko_id is required")]
    
    try:
        # Make request to backend
        response = await client.get(f"{BACKEND_URL}/nko/{nko_id}")
        response.raise_for_status()
        
        nko_data = response.json()
        
        return [TextContent(
            type="text",
            text=json.dumps(nko_data, ensure_ascii=False, indent=2)
        )]
    
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching NKO by ID: {e}")
        if e.response.status_code == 404:
            error_text = f"NKO with ID {nko_id} not found"
        else:
            error_text = f"HTTP error {e.response.status_code}: {e.response.text}"
        return [TextContent(type="text", text=error_text)]
    except Exception as e:
        logger.error(f"Error fetching NKO by ID: {e}")
        return [TextContent(type="text", text=f"Error fetching NKO: {str(e)}")]

async def get_cities(args: Dict[str, Any]) -> List[TextContent]:
    """Get all cities with optional regex filter"""
    regex = args.get("regex")
    
    try:
        # Build query parameters
        params = {}
        if regex:
            params["regex"] = regex
        
        # Make request to backend
        response = await client.get(f"{BACKEND_URL}/city", params=params)
        response.raise_for_status()
        
        cities = response.json()
        
        return [TextContent(
            type="text",
            text=json.dumps(cities, ensure_ascii=False, indent=2)
        )]
    
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching cities: {e}")
        error_text = f"HTTP error {e.response.status_code}: {e.response.text}"
        return [TextContent(type="text", text=error_text)]
    except Exception as e:
        logger.error(f"Error fetching cities: {e}")
        return [TextContent(type="text", text=f"Error fetching cities: {str(e)}")]

# Main function to run the server
async def main():
    """Main entry point"""
    # Test backend connection
    try:
        response = await client.get(f"{BACKEND_URL}/ping")
        response.raise_for_status()
        logger.info("Backend connection successful")
    except Exception as e:
        logger.error(f"Backend connection failed: {e}")
        return
    
    # Run the server
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="nko-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=None,
                    experimental_capabilities=None,
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())