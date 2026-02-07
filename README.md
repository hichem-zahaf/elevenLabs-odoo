<!-- BANNER: Place your project banner image here -->
<p align="center">
  <!-- Replace with your banner URL -->
  <!-- <img src="banner-url.png" alt="ElevenLabs AI Shopping Assistant Banner" width="100%"> -->
</p>

# ElevenLabs AI Shopping Assistant for Odoo

[![License](https://img.shields.io/badge/license-LGPL--3-blue.svg)](LICENSE)
[![Odoo Version](https://img.shields.io/badge/odoo-18.0-green.svg)](https://www.odoo.com)
[![ElevenLabs](https://img.shields.io/badge/elevenlabs-integrated-purple.svg)](https://elevenlabs.io)

A powerful **Odoo 18.0 module** that integrates ElevenLabs conversational AI into your e-commerce website, providing a voice-enabled shopping assistant with intelligent product recommendations, cart management, and seamless checkout capabilities.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Settings Reference](#settings-reference)
- [ElevenLabs Dashboard Setup](#elevenlabs-dashboard-setup)
- [Page Visibility Control](#page-visibility-control)
- [Debug Mode](#debug-mode)
- [Rate Limiting & Best Practices](#rate-limiting--best-practices)
- [Future Roadmap](#future-roadmap)
- [Support This Project](#support-this-project)
- [License](#license)

---

## Features

- **Voice-Enabled Shopping Assistant**: Natural voice conversations with your customers
- **Smart Product Recommendations**: AI-powered product suggestions based on user context
- **Cart Management**: Add items to cart directly through voice commands
- **Advanced Product Search**: Search products with natural language queries
- **Multi-Trigger System**: Activate widget on delay, scroll, time, or exit intent
- **Geographic & Device Targeting**: Show widget based on user location and device type
- **Customer Segmentation**: Target first-time visitors, returning customers, or VIP users
- **Rate Limiting**: Comprehensive usage tracking to prevent abuse
- **Theme Customization**: Match the widget to your brand colors
- **Session Management**: Track conversations and user interactions
- **Product Filtering**: Control which categories and products are recommended

---

## Installation

### Method 1: Odoo App Store

1. Go to **Apps** in your Odoo backend
2. Click **Update Apps List**
3. Search for **"ElevenLabs AI Shopping Assistant"**
4. Click **Install**

### Method 2: Manual Installation

1. Copy the `elevenlabs_agent` folder to your Odoo addons directory
2. Go to **Apps** → **Update Apps List**
3. Search for **"ElevenLabs AI Shopping Assistant"**
4. Click **Install**

### Requirements

- Odoo 18.0 or higher
- `website` module
- `website_sale` module
- `product` module
- An ElevenLabs account with API access

---

## Configuration

After installation, access the settings:

1. Go to **Website** → **Configuration** → **Settings**
2. Scroll to the **"ElevenLabs AI Assistant"** section
3. Configure your settings (see [Settings Reference](#settings-reference))
4. Visit `/ai-assistant` on your website to see the assistant in action

---

## Settings Reference

### Basic Configuration

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Agent ID** | `elevenlabs_agent.agent_id` | Your ElevenLabs Agent ID from the dashboard | Required |
| **Enabled** | `elevenlabs_agent.enabled` | Enable or disable the assistant globally | `true` |

---

### Trigger Options

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Trigger Delay** | `elevenlabs_agent.trigger_delay` | Seconds to wait before showing widget | `0` |
| **Trigger on Scroll** | `elevenlabs_agent.trigger_on_scroll` | Scroll percentage (0-100) to trigger | `0.0` |
| **Trigger on Time** | `elevenlabs_agent.trigger_on_time` | Seconds on page before triggering | `0` |
| **Trigger on Exit Intent** | `elevenlabs_agent.trigger_on_exit_intent` | Show when user shows exit intent | `false` |
| **First-Time Visitors Only** | `elevenlabs_agent.show_first_time_visitors_only` | Only show to new visitors | `false` |

**Exit Intent Detection:**
The widget detects exit intent when the mouse cursor moves towards the top of the browser window or leaves the window entirely.

---

### Integration Controls

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Enable Show Product Card** | `elevenlabs_agent.enable_show_product_card` | Enable product recommendation display | `true` |
| **Enable Add to Cart** | `elevenlabs_agent.enable_add_to_cart` | Enable addToCart tool | `true` |
| **Enable Search Products** | `elevenlabs_agent.enable_search_products` | Enable product search tool | `true` |
| **Cart Integration Method** | `elevenlabs_agent.cart_integration_method` | How to add items: `direct_add` or `redirect` | `direct_add` |

**Cart Integration Methods:**
- `direct_add` - Silently adds items to cart in background
- `redirect` - Redirects user to cart page after adding

---

### Geographic & Device Restrictions

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Geographic Restrictions** | `elevenlabs_agent.geographic_restrictions` | Comma-separated country codes (e.g., US,CA,UK) | Empty |
| **Device Filtering** | `elevenlabs_agent.device_filtering` | Target specific devices | `all` |

**Device Filtering Options:**
- `all` - Show on all devices
- `desktop` - Desktop only
- `mobile` - Mobile devices only

---

### Customer Segmentation

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Customer Segment Targeting** | `elevenlabs_agent.customer_segment_targeting` | Target specific customer segments | `all` |
| **Exclude Public Users** | `elevenlabs_agent.exclude_public_users` | Require user login to use assistant | `false` |

**Segment Targeting Options:**
- `all` - All users
- `first_time` - First-time visitors only
- `returning` - Returning customers only
- `vip` - VIP customers only
- `none` - No specific targeting

---

### Session Controls

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Max Messages Per Session** | `elevenlabs_agent.max_messages_per_session` | Limit messages per conversation | `0` (unlimited) |
| **Conversation History Retention** | `elevenlabs_agent.conversation_history_retention` | Hours to keep conversation history | `24` |
| **Auto-End Inactive Conversations** | `elevenlabs_agent.auto_end_inactive_conversations` | Automatically close inactive sessions | `true` |
| **Save User Info** | `elevenlabs_agent.save_user_info` | Extract and save user data from conversations | `false` |
| **Enable Conversation Logging** | `elevenlabs_agent.enable_conversation_logging` | Log conversations for analytics | `false` |
| **Daily Usage Limit (Per User)** | `elevenlabs_agent.daily_usage_limit` | Max daily messages per user | `0` (unlimited) |
| **Global Usage Limit** | `elevenlabs_agent.global_usage_limit` | Global daily message limit across all users | `0` (unlimited) |
| **Max Messages Per Conversation** | `elevenlabs_agent.max_messages_per_conversation` | Total messages per conversation | `0` (unlimited) |
| **Session Usage Limit** | `elevenlabs_agent.session_usage_limit` | Limit usage per session | `0` (unlimited) |
| **Performance Metrics Dashboard** | `elevenlabs_agent.performance_metrics_dashboard` | URL to external analytics dashboard | Empty |

---

### Product Integration

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Product Categories Include** | `elevenlabs_agent.product_categories_include` | Comma-separated category IDs to include | Empty |
| **Product Categories Exclude** | `elevenlabs_agent.product_categories_exclude` | Comma-separated category IDs to exclude | Empty |
| **Featured Products Priority** | `elevenlabs_agent.featured_products_priority` | Comma-separated product IDs to prioritize | Empty |
| **Out of Stock Handling** | `elevenlabs_agent.out_of_stock_handling` | How to handle unavailable products | `hide` |

**Out of Stock Handling Options:**
- `hide` - Don't show out-of-stock products
- `show_disabled` - Show but disable add to cart
- `show_with_notification` - Show with "out of stock" message

**Finding Category/Product IDs:**
1. Go to your Odoo backend
2. Navigate to **Products** → **Products** or **Categories**
3. Click on a product/category
4. The ID is in the URL (e.g., `/web#model=product.category&id=5`)

---

### Page Visibility Controls

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Pages to Show** | `elevenlabs_agent.pages_to_show` | Comma-separated page types to show widget | Empty (all) |
| **Pages to Hide** | `elevenlabs_agent.pages_to_hide` | Comma-separated page types to hide widget | Empty |

**Page Type Options:**
- `home` - Homepage
- `shop` - Shop/catalog page
- `product` - Product detail pages
- `cart` - Cart page
- `checkout` - Checkout page
- `blog` - Blog pages
- `about` - About us page
- `contact` - Contact page
- `ai-assistant` - AI assistant page

---

### Theme Settings

| Setting | Parameter Name | Description | Default |
|---------|---------------|-------------|---------|
| **Theme Type** | `elevenlabs_agent.theme_type` | Light or dark theme | `light` |
| **Primary Color** | `elevenlabs_agent.primary_color` | Primary widget color (hex) | `#667eea` |
| **Secondary Color** | `elevenlabs_agent.secondary_color` | Secondary widget color (hex) | `#764ba2` |

---

## ElevenLabs Dashboard Setup

### 1. Create an ElevenLabs Account

1. Visit [https://elevenlabs.io](https://elevenlabs.io)
2. Sign up for an account
3. Choose a pricing plan that fits your needs

### 2. Create Your Conversational AI Agent

1. Go to the **ElevenLabs Dashboard**
2. Navigate to **Conversational AI** → **Agents**
3. Click **Create New Agent**
4. Configure your agent (see sections below)
5. Save and copy your **Agent ID**

**Finding Your Agent ID:**
- After creating an agent, the ID is displayed in the agent overview
- Or find it in the URL: `https://elevenlabs.io/app/conv-ai/agents/{YOUR_AGENT_ID}`

### 3. Configure System Prompt

The system prompt defines your AI assistant's personality and behavior.

**To edit:**
1. In your agent settings, go to **System Prompt**
2. Write or paste your custom prompt

**Example Shopping Assistant Prompt:**
```
You are a friendly and helpful shopping assistant for an e-commerce store. Your role is to:

1. Help customers find products that match their needs
2. Provide detailed product information including prices, descriptions, and availability
3. Make personalized recommendations based on customer preferences
4. Assist with adding items to cart
5. Answer questions about shipping, returns, and policies
6. Maintain a conversational, natural tone

Always ask clarifying questions when needed. Be proactive in suggesting related products or accessories. If a product is out of stock, inform the customer and suggest alternatives.

When showing products, use the showProductCard tool to display them visually.
When a customer wants to purchase, use the addToCart tool.
```

### 4. Choose an AI Model

ElevenLabs offers different models with varying capabilities and pricing.

**Model Comparison:**

| Model | Description | Best For | Pricing Tier |
|-------|-------------|----------|--------------|
| **Eleven Turbo v2.5** | Fast, low-latency responses | Real-time conversations | Starter+ |
| **GPT-4 Turbo** | Advanced reasoning | Complex product queries | Growth+ |
| **GPT-4o** | Multimodal capabilities | Image-based products | Enterprise |
| **Claude 3.5 Sonnet** | Balanced performance | General shopping assistant | Growth+ |

**Recommendation:**
- For small stores: **Eleven Turbo v2.5** (cost-effective)
- For medium stores: **GPT-4 Turbo** or **Claude 3.5 Sonnet**
- For large stores: **Claude 3.5 Sonnet** or **GPT-4o**

**Agentic vs. Non-Agentic:**
- **Agentic mode**: AI can use tools and perform actions (recommended for shopping)
- **Non-Agentic**: Conversational only (basic Q&A)

### 5. Configure Voice Settings

1. In your agent settings, go to **Voice**
2. Choose from:
   - **Pre-built voices**: Browse ElevenLabs voice library
   - **Voice Lab**: Create a custom voice clone
   - **Voice Design**: Generate a unique voice

**Popular Voice Options:**
- **Rachel**: Friendly, professional female voice
- **Drew**: Warm, approachable male voice
- **Clyde**: Clear, neutral tone

**Custom Voice Clone:**
1. Go to **Voice Lab**
2. Upload 1-5 minutes of audio samples
3. Train your custom voice
4. Assign to your agent

### 6. Add RAG (Retrieval-Augmented Generation)

RAG allows your AI to reference your product documentation, FAQs, and custom knowledge.

**To set up RAG:**
1. In your agent settings, go to **Knowledge** or **RAG**
2. Click **Add Knowledge Base**
3. Upload documents or add URLs:
   - **PDFs**: Product catalogs, manuals
   - **Text files**: FAQs, policies
   - **Websites**: Your documentation URLs
4. Set relevance scoring and retrieval limits

**Best Practices for RAG:**
- Keep knowledge base focused and relevant
- Regularly update product information
- Use clear headings in documents
- Include common questions and answers

### 7. Customize Widget Style

While the Odoo module handles some styling, you can further customize in ElevenLabs:

1. Go to **Widget Settings** in your agent
2. Configure:
   - **Size**: Small, medium, large
   - **Color theme**: Match your brand
   - **Avatar**: Upload a custom avatar image
   - **Welcome message**: First message users see

### 8. Define Tools

Your agent needs tools to interact with your Odoo store. These must be defined in ElevenLabs.

**Navigate to Tools:**
1. In your agent, go to **Client Tools** or **Functions**
2. Click **Add Tool**

#### Required Tools for This Module:

* Pro-Tip: You can Paste this Json into ElevenLabs to quickly create the tool with params

**1. `showProductCard`**
```json
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
```

**2. `searchProducts`**
```json
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
```

---

## Page Visibility Control

Control where the AI assistant widget appears on your website.

### How to Configure

1. Go to **Website** → **Configuration** → **Settings**
2. Find **Pages to Show** and/or **Pages to Hide**
3. Enter comma-separated page types

### Examples

**Show only on shop pages:**
```
shop, product
```

**Hide on checkout:**
```
checkout
```

**Show on homepage and shop, hide on cart:**
- Pages to Show: `home, shop, product`
- Pages to Hide: `cart, checkout`

### Complete Page Type List

| Page Type | Description |
|-----------|-------------|
| `home` | Website homepage |
| `shop` | Shop/catalog listing |
| `product` | Individual product pages |
| `cart` | Shopping cart page |
| `checkout` | Checkout process pages |
| `blog` | Blog listing and posts |
| `about` | About us page |
| `contact` | Contact page |
| `ai-assistant` | Dedicated AI assistant page |

### Priority Logic

- **Pages to Show**: If specified, widget ONLY shows on these pages
- **Pages to Hide**: If specified, widget is hidden on these pages
- If both are set, "Show" takes priority
- If neither is set, widget shows on all pages

---

## Debug Mode

Enable debug mode to test your AI assistant configuration.

### How to Enable

Add `?debug=1` to your URL:
```
https://yourstore.com/ai-assistant?debug=1
```

### Debug Mode Features

1. **Debug Panel**: Visual panel showing all configuration
2. **Settings Console Log**: All settings logged to browser console
3. **Test Buttons**: Quick testing for:
   - Product card display
   - Product search
   - Add to cart functionality
   - Checkout flow
4. **Network Requests**: All API calls visible in browser DevTools

### Using Debug Panel

1. Open your browser console (F12)
2. Navigate to the AI assistant page with `?debug=1`
3. Click the test buttons to verify each tool works
4. Check console output for any errors

### Common Debug Checks

```javascript
// Check if widget initialized
console.log(odoo.elevenlabsSettings);

// Check registered tools
console.log(odoo.registeredTools);

// Test API endpoint
fetch('/api/elevenlabs/product/sku/YOUR-SKU', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({jsonrpc: '2.0', method: 'call', params: {}, id: 1})
})
```

---

## Rate Limiting & Best Practices

### Rate Limiting Options

Protect your API costs and prevent abuse with comprehensive rate limiting.

#### Per-User Limits

| Setting | Description |
|---------|-------------|
| **Daily Usage Limit** | Max messages per user per day |
| **Session Usage Limit** | Max messages per session |
| **Max Messages Per Conversation** | Total messages per conversation |

#### Global Limits

| Setting | Description |
|---------|-------------|
| **Global Usage Limit** | Total daily messages across all users |

### Recommended Rate Limits

| Store Size | Daily Limit Per User | Global Daily Limit |
|------------|---------------------|-------------------|
| Small (<1000 visitors/day) | 50 | 5,000 |
| Medium (1000-10000) | 30 | 25,000 |
| Large (>10000) | 20 | 100,000 |

### Best Practices

#### 1. Start Conservative
- Begin with lower limits
- Monitor usage patterns
- Adjust based on analytics

#### 2. Track Metrics
- Enable conversation logging
- Use external analytics dashboard
- Monitor costs in ElevenLabs dashboard

#### 4. Device Optimization
- Consider voice limitations on desktop
- Prioritize mobile for voice shopping
- Test on all device types

#### 5. Session Management
- Set reasonable conversation history retention (24-48 hours)
- Auto-end inactive conversations
- Clear old sessions regularly

#### 6. Cost Management
- Use caching for repeated queries
- Optimize system prompt length
- Choose appropriate AI model for your use case

#### 7. User Privacy
- Hash IP addresses for public users
- Allow opt-out for conversation logging
- Comply with GDPR/CCPA

#### 8. Testing Strategy
- Test all tools in debug mode
- Monitor error rates
- Have fallback responses ready

#### 9. Monitor Abuse
- Watch for suspicious usage patterns
- Implement IP-level blocking if needed
- Set alerts for limit breaches

#### 10. Performance
- Minimize widget size
- Use CDN for ElevenLabs script
- Optimize product images

---

## Future Roadmap

We're planning exciting improvements to make this module even more powerful:

### Planned Features

#### Visual Configuration
- **UI-based settings editor** instead of raw configuration
- **Drag-and-drop widget positioning**
- **Live preview of widget styling**
- **Color picker for theme customization**

#### Enhanced Analytics
- **User interaction recording** (with consent)
- **Conversation heatmaps**
- **Conversion tracking**
- **A/B testing for system prompts**
- **Sentiment analysis dashboard**

#### Shopping Tools
- **Smart checkout** with voice-driven form filling
- **Order status checking**
- **Product comparison tool**
- **Wishlist management**
- **Gift finder assistant**
- **Size/product recommendation engine**

#### Rate Limiting Improvements
- **Tiered user limits** (VIP, registered, anonymous)
- **Time-based windows** (peak/off-peak limits)
- **Circuit breaker** for unusual activity
- **Cost alerting system**

#### Integration Enhancements
- **Multi-language support**
- **Multi-currency handling**
- **Integration with loyalty programs**
- **Social commerce features**

---

## Support This Project

If you find this module helpful, please consider supporting its development!

### Why Support?

Your support helps us:
- Develop new features faster
- Provide free updates and bug fixes
- Create more Odoo modules for the community
- Keep the project open source

### Ways to Support

1. **Star the Repository** - Show your support!
2. **Share with others** - Help other Odoo users discover this module
3. **Report Issues** - Help us improve by reporting bugs
4. **Contribute Code** - Pull requests are welcome!
5. **Donate** - If you find value in this work, consider donating

### About the Developer

**Hichem - LLMarifa Co**

We specialize in AI-powered solutions for e-commerce and enterprise systems.

Visit us: [https://www.llmarifa.co](https://www.llmarifa.co)

---

## License

This module is licensed under the **GNU Lesser General Public License v3.0 (LGPL-3.0)**.

See [LICENSE](LICENSE) file for details.

### License Summary

- You can: Use, modify, and distribute this software
- You must: Include the original license and copyright notice
- You must: Release derivative works under LGPL-3.0
- You can: Use in proprietary software (dynamic linking)

---

## Support

- **Website**: [https://www.llmarifa.co](https://www.llmarifa.co)
- **Issues**: Report issues via GitHub Issues
- **Documentation**: This README and inline code comments

---

**Made with ❤️ by [LLMarifa Co](https://www.llmarifa.co)**
