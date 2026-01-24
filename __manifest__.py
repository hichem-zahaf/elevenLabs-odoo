# -*- coding: utf-8 -*-
{
    'name': 'ElevenLabs AI Shopping Assistant',
    'version': '18.0.2.3.4',
    'category': 'Website/eCommerce',
    'summary': 'AI-powered shopping assistant with voice interaction - Complete rebuild with proper client tools',
    'description': """
ElevenLabs AI Shopping Assistant (v2.0.0)
==========================================

This module integrates ElevenLabs conversational AI into your Odoo website, providing:
- Voice-enabled shopping assistant with proper client tools integration
- Intelligent product recommendations
- Animated cart interactions
- Real-time product search and suggestions
- Configurable settings in Odoo main settings

Features:
---------
* Voice interaction with customers using ElevenLabs Conversational AI
* Product recommendation cards with dynamic display
* Animated cart addition with visual feedback
* SKU-based product catalog integration
* Product search functionality
* Configurable agent ID and widget position via Settings
* Debug mode for testing (add ?debug=1 to URL)
* Responsive design for mobile and desktop

Configuration:
--------------
1. Go to Website → Configuration → Settings
2. Find "ElevenLabs AI Assistant" section
3. Enable the assistant and enter your Agent ID
4. Choose widget position (bottom-right, bottom-left, top-right, top-left)
5. Configure these tools in your ElevenLabs agent:
   - showProductCard: Display product recommendations
   - addToCart: Add items to shopping cart
   - searchProducts: Search for products

v2.0.0 - Complete Rebuild:
--------------------------
* Added proper settings model with configuration in main settings
* Implemented correct ElevenLabs client tools registration according to docs
* Dynamic widget insertion with configurable positioning
* Added product search endpoint and functionality
* Improved error handling and user feedback
* Fixed all JavaScript module loading issues
* Added comprehensive debug panel for testing

Previous Fixes:
--------------
* Fixed Odoo module definition error (added dependencies array)
* Fixed debug mode to properly check for debug=1 parameter
* Test buttons now only show when ?debug=1 is in URL
    """,
    'author': 'Hichem Zahaf - LLMarifa Co',
    'website': 'https://www.llmarifa.co',
    'depends': ['website', 'website_sale', 'product'],
    'data': [
        'views/res_config_settings_views.xml',
        'views/assets.xml',
        'views/website_templates.xml',
        'views/website_layout.xml',
    ],
    'images': [
        'static/description/icon.png',
        'static/description/banner.png',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}