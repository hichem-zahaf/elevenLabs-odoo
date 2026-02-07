{
  "type": "client",
  "name": "searchProducts",
  "description": "Search for products in the store catalog. Supports flexible text search with optional filters for category, price range, and stock availability. Returns detailed product information.",
  "disable_interruptions": false,
  "force_pre_tool_speech": "auto",
  "tool_call_sound": null,
  "tool_call_sound_behavior": "auto",
  "tool_error_handling_mode": "auto",
  "execution_mode": "immediate",
  "assignments": [],
  "expects_response": false,
  "response_timeout_secs": 1,
  "parameters": [
    {
      "id": "query",
      "type": "string",
      "value_type": "llm_prompt",
      "description": "The search query - product name, keyword, SKU, or description (e.g., 'wireless headphones', 'laptop', 'iPhone')",
      "dynamic_variable": "",
      "constant_value": "",
      "enum": null,
      "is_system_provided": false,
      "required": true
    },
    {
      "id": "category",
      "type": "string",
      "value_type": "llm_prompt",
      "description": "Optional: Filter by category name (e.g., 'Electronics', 'Office Furniture', 'Footwear')",
      "dynamic_variable": "",
      "constant_value": "",
      "enum": null,
      "is_system_provided": false,
      "required": false
    },
    {
      "id": "minPrice",
      "type": "number",
      "value_type": "llm_prompt",
      "description": "Optional: Minimum price filter (e.g., 50 for products $50 and above)",
      "dynamic_variable": "",
      "constant_value": "",
      "enum": null,
      "is_system_provided": false,
      "required": false
    },
    {
      "id": "maxPrice",
      "type": "number",
      "value_type": "llm_prompt",
      "description": "Optional: Maximum price filter (e.g., 200 for products under $200)",
      "dynamic_variable": "",
      "constant_value": "",
      "enum": null,
      "is_system_provided": false,
      "required": false
    },
    {
      "id": "inStockOnly",
      "type": "boolean",
      "value_type": "llm_prompt",
      "description": "Optional: Only show products currently in stock (default: false)",
      "dynamic_variable": "",
      "constant_value": "",
      "enum": null,
      "is_system_provided": false,
      "required": false
    },
    {
      "id": "limit",
      "type": "integer",
      "value_type": "llm_prompt",
      "description": "Optional: Maximum number of results to return (default: 6, max: 20)",
      "dynamic_variable": "",
      "constant_value": "",
      "enum": null,
      "is_system_provided": false,
      "required": false
    }
  ],
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}