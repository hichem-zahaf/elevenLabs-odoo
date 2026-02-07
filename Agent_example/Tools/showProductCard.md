{
  "type": "client",
  "name": "showProductCard",
  "description": "Display product recommendations to the user in a visual card format. Use this tool when you want to present product options, recommendations, or search results.",
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
      "id": "Products",
      "type": "array",
      "description": "An array of products to display to the user",
      "items": {
        "id": "Products_item",
        "type": "object",
        "description": "A product containing name, price, image, and description",
        "properties": [
          {
            "id": "name",
            "type": "string",
            "value_type": "llm_prompt",
            "description": "Name of the product",
            "dynamic_variable": "",
            "constant_value": "",
            "enum": null,
            "is_system_provided": false,
            "required": true
          },
          {
            "id": "price",
            "type": "string",
            "value_type": "llm_prompt",
            "description": "Price of the product as a string (e.g., '99.99')",
            "dynamic_variable": "",
            "constant_value": "",
            "enum": null,
            "is_system_provided": false,
            "required": true
          },
          {
            "id": "image",
            "type": "string",
            "value_type": "llm_prompt",
            "description": "URL of the product image",
            "dynamic_variable": "",
            "constant_value": "",
            "enum": null,
            "is_system_provided": false,
            "required": false
          },
          {
            "id": "description",
            "type": "string",
            "value_type": "llm_prompt",
            "description": "Product description or sales text",
            "dynamic_variable": "",
            "constant_value": "",
            "enum": null,
            "is_system_provided": false,
            "required": false
          },
          {
            "id": "id",
            "type": "string",
            "value_type": "llm_prompt",
            "description": "Product ID or SKU",
            "dynamic_variable": "",
            "constant_value": "",
            "enum": null,
            "is_system_provided": false,
            "required": false
          }
        ],
        "required": false,
        "value_type": "llm_prompt"
      },
      "required": true,
      "value_type": "llm_prompt"
    }
  ],
  "dynamic_variables": {
    "dynamic_variable_placeholders": {}
  }
}