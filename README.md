# ElevenLabs AI Shopping Assistant for Odoo

A powerful Odoo module that integrates ElevenLabs conversational AI to provide voice-enabled shopping assistance with product recommendations and cart management.

## Features

- 🎤 **Voice Interaction**: Natural conversation with customers through ElevenLabs AI
- 🛍️ **Smart Product Recommendations**: AI-powered suggestions with beautiful card displays
- 🛒 **Animated Cart Management**: Add items to cart with voice commands and visual feedback
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🎨 **Modern UI**: Beautiful animations and gradient designs
- 🔧 **Easy Integration**: Simple installation with Odoo's module system

## Installation

1. **Download the Module**
   - Copy the `elevenlabs_agent` folder to your Odoo custom addons directory

2. **Update Module List**
   - Go to Apps → Update Apps List
   - Search for "ElevenLabs AI Shopping Assistant"

3. **Install the Module**
   - Click Install on the module

4. **Configure Your Agent ID**
   - Get your agent ID from ElevenLabs dashboard
   - Update the agent ID in the controller or via system parameters

## Configuration

### Setting Your Agent ID

#### Method 1: System Parameters
```python
# Go to Settings → Technical → Parameters → System Parameters
# Add a new parameter:
Key: elevenlabs_agent.agent_id
Value: your_agent_id_here
```

#### Method 2: Update in Code
Edit `controllers/main.py` and replace the default agent ID:
```python
'agent_id': request.env['ir.config_parameter'].sudo().get_param(
    'elevenlabs_agent.agent_id', 
    'your_agent_id_here'  # Replace with your agent ID
)
```

### ElevenLabs Agent Setup

1. Create an agent at [ElevenLabs Console](https://elevenlabs.io)
2. Configure two custom tools in your agent:

#### Tool 1: showProductCard
```json
{
  "name": "showProductCard",
  "description": "Display product recommendations to the user",
  "parameters": {
    "type": "object",
    "properties": {
      "Products": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "Name": { "type": "string" },
            "Price": { "type": "string" },
            "Image": { "type": "string" }
          }
        }
      }
    }
  }
}
```

#### Tool 2: addToCart
```json
{
  "name": "addToCart",
  "description": "Add products to the shopping cart",
  "parameters": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "Product": { "type": "string", "description": "Product SKU" },
            "Quantity": { "type": "number" }
          }
        }
      }
    }
  }
}
```

## Usage

1. **Access the AI Assistant**
   - Navigate to `/ai-assistant` on your website
   - Or click "AI Assistant" in the main menu

2. **Voice Commands Examples**
   - "Show me wireless headphones"
   - "I need a laptop under $1500"
   - "Add the Sony headphones to my cart"
   - "Add 2 AirPods to my cart"

3. **Testing (Debug Mode)**
   - Enable debug mode (`?debug=1`)
   - Use test buttons to simulate tool triggers

## Product Catalog Integration

### Using Odoo Products
The module automatically searches for products by SKU/barcode in your Odoo database.

### Static Catalog Fallback
A static catalog is included for demo purposes. Update it in `controllers/main.py`:

```python
def _get_static_catalog(self):
    return {
        'YOUR-SKU': {
            'name': 'Product Name',
            'price': '99.99',
            'image': 'https://example.com/image.jpg',
            'description': 'Product description'
        }
    }
```

## Customization

### Styling
Edit `static/src/css/elevenlabs_agent.css` to customize:
- Colors and gradients
- Animation speeds
- Modal positions
- Responsive breakpoints

### JavaScript Behavior
Edit `static/src/js/elevenlabs_widget.js` to modify:
- Tool handling logic
- Animation sequences
- API endpoints
- Product display logic

### Templates
Edit `views/website_templates.xml` to change:
- Page layout
- Feature cards
- Instructions text
- Menu items

## API Endpoints

- `GET /ai-assistant` - Main AI assistant page
- `POST /api/elevenlabs/product/sku/<sku>` - Get product by SKU
- `POST /api/elevenlabs/cart/add` - Add items to cart
- `POST /api/elevenlabs/products/recommended` - Get recommended products

## Troubleshooting

### Agent Not Loading
- Check browser console for errors
- Verify agent ID is correct
- Ensure ElevenLabs script is loading

### Tools Not Working
- Check tool configuration in ElevenLabs dashboard
- Verify tool names match exactly
- Look for "ElevenLabs tools registered" in console

### Products Not Found
- Verify SKU/barcode in Odoo products
- Check product is published and saleable
- Test with static catalog SKUs

### Styling Issues
- Clear browser cache
- Check for CSS conflicts with theme
- Use browser inspector to debug

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- Odoo 16.0+
- website
- website_sale
- product

## License

LGPL-3

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Verify ElevenLabs agent configuration
4. Contact your system administrator

## Credits

Developed with ElevenLabs Conversational AI technology.