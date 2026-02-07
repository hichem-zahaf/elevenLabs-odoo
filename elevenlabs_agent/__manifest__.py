# -*- coding: utf-8 -*-
{
    'name': 'ElevenLabs AI Shopping Assistant',
    'version': '18.0',
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
* SKU-based product catalog integration
* Product search functionality
* User rate limiting
* Configurable agent ID and widget position via Settings
* Debug mode for testing (add ?debug=1 to URL)
* Responsive design for mobile and desktop

Configuration:
--------------
1. Go to Website → Configuration → Settings
2. Find "ElevenLabs AI Assistant" section
3. Enable the assistant and enter your Agent ID
4. Configure these tools in your ElevenLabs agent:
   - showProductCard: Display product recommendations
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
    "currency": 'USD',
    "price": '180.00',
    'author': 'Hichem Zahaf - LLMarifa Co',
    'website': 'https://www.llmarifa.co',
    'depends': ['website', 'website_sale', 'product'],
    'data': [
        'security/ir.model.access.csv',
        'security/elevenlabs_agent_security.xml',
        'views/res_config_settings_views.xml',
        'views/assets.xml',
        'views/website_templates.xml',
        'views/website_layout.xml',
    ],
    'images': [
        'static/description/icon.png',
        'static/description/banner.jpg',
        'static/description/theme_screenshot.jpg',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'license': 'LGPL-3',
}