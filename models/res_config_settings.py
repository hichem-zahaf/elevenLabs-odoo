# -*- coding: utf-8 -*-

from odoo import models, fields, api


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    # Basic Configuration
    elevenlabs_agent_id = fields.Char(
        string='ElevenLabs Agent ID',
        config_parameter='elevenlabs_agent.agent_id',
        help='The Agent ID from your ElevenLabs dashboard. '
             'You can find this in the agent settings.'
    )

    elevenlabs_enabled = fields.Boolean(
        string='Enable ElevenLabs Assistant',
        config_parameter='elevenlabs_agent.enabled',
        default=True,
        help='Enable or disable the ElevenLabs AI shopping assistant on your website.'
    )

    elevenlabs_widget_position = fields.Selection([
        ('bottom-right', 'Bottom Right'),
        ('bottom-left', 'Bottom Left'),
        ('top-right', 'Top Right'),
        ('top-left', 'Top Left'),
    ], string='Widget Position',
        config_parameter='elevenlabs_agent.widget_position',
        default='bottom-right',
        required=True,
        help='Position of the ElevenLabs widget on the page.'
    )

    # Trigger Options
    elevenlabs_trigger_delay = fields.Integer(
        string='Trigger Delay (seconds)',
        config_parameter='elevenlabs_agent.trigger_delay',
        default=0,
        help='Adds a delay on widget creation, Set to 0 for immediate display.'
    )

    elevenlabs_trigger_on_scroll = fields.Float(
        string='Scroll Percentage (%)',
        config_parameter='elevenlabs_agent.trigger_on_scroll',
        default=0.0,
        help='Show widget when user scrolls to this percentage of the page. Set to 0 to disable scroll trigger.'
    )

    elevenlabs_trigger_on_time = fields.Integer(
        string='Time on Page (seconds)',
        config_parameter='elevenlabs_agent.trigger_on_time',
        default=0,
        help='Show widget after user spends this many seconds on the page, add it to show the widget for customers that need assistance. Set to 0 to disable time trigger.'
    )

    elevenlabs_trigger_on_exit_intent = fields.Boolean(
        string='Exit Intent detection',
        config_parameter='elevenlabs_agent.trigger_on_exit_intent',
        default=False,
        help='Show widget when user shows exit intent (moving mouse to close tab or navigate away).'
    )

    elevenlabs_show_first_time_visitors_only = fields.Boolean(
        string='Show Only for First-Time Visitors',
        config_parameter='elevenlabs_agent.show_first_time_visitors_only',
        default=False,
        help='show widget only for first-time visitors.'
    )


    # Integration Controls
    elevenlabs_enable_show_product_card = fields.Boolean(
        string='Enable Show Product Card Tool',
        config_parameter='elevenlabs_agent.enable_show_product_card',
        default=True,
        help='Enable the showProductCard tool in the agent.'
    )

    elevenlabs_enable_add_to_cart = fields.Boolean(
        string='Enable Add to Cart Tool',
        config_parameter='elevenlabs_agent.enable_add_to_cart',
        default=True,
        help='Enable the addToCart tool in the agent.'
    )

    elevenlabs_enable_search_products = fields.Boolean(
        string='Enable Search Products Tool',
        config_parameter='elevenlabs_agent.enable_search_products',
        default=True,
        help='Enable the searchProducts tool in the agent.'
    )

    elevenlabs_cart_integration_method = fields.Selection([
        ('direct_add', 'Direct Add to Cart'),
        ('redirect', 'Redirect to Product Page'),
    ], string='Cart Integration Method',
        config_parameter='elevenlabs_agent.cart_integration_method',
        default='direct_add',
        required=True,
        help='How the agent adds items to cart.'
    )

    # Geographic Restrictions
    elevenlabs_geographic_restrictions = fields.Char(
        string='Geographic Restrictions',
        config_parameter='elevenlabs_agent.geographic_restrictions',
        help='Comma-separated list of country codes to restrict the widget (e.g., US,CA,UK).'
    )

    # Device Type Filtering
    elevenlabs_device_filtering = fields.Selection([
        ('all', 'All Devices'),
        ('desktop', 'Desktop Only'),
        ('mobile', 'Mobile Only'),
    ], string='Device Type Filtering',
        config_parameter='elevenlabs_agent.device_filtering',
        default='all',
        required=True,
        help='Which devices to show the widget on.'
    )

    # Customer Segment Targeting
    elevenlabs_customer_segment_targeting = fields.Selection([
        ('all', 'All Customers'),
        ('first_time', 'First-Time Visitors'),
        ('returning', 'Returning Customers'),
        ('vip', 'VIP Customers Only'),
        ('none', 'None (No Restriction)'),
    ], string='Customer Segment Targeting',
        config_parameter='elevenlabs_agent.customer_segment_targeting',
        default='all',
        required=True,
        help='Which customer segments to target with the widget.'
    )

    elevenlabs_exclude_public_users = fields.Boolean(
        string='Require Login (Exclude Public Users)',
        config_parameter='elevenlabs_agent.exclude_public_users',
        default=False,
        help='Hide widget for public/non-logged-in users. Only logged-in users will see the widget.'
    )

    # Session Controls
    elevenlabs_max_messages_per_session = fields.Integer(
        string='Max Messages Per Session',
        config_parameter='elevenlabs_agent.max_messages_per_session',
        default=0,
        help='Maximum number of messages allowed per session (0 for unlimited).'
    )

    elevenlabs_conversation_history_retention = fields.Integer(
        string='Conversation History Retention (hours)',
        config_parameter='elevenlabs_agent.conversation_history_retention',
        default=24,
        help='How long to retain conversation history in hours.'
    )

    elevenlabs_auto_end_inactive_conversations = fields.Boolean(
        string='Auto-End Inactive Conversations',
        config_parameter='elevenlabs_agent.auto_end_inactive_conversations',
        default=True,
        help='Automatically end conversations after period of inactivity.'
    )

    elevenlabs_save_user_info = fields.Boolean(
        string='Save User Info',
        config_parameter='elevenlabs_agent.save_user_info',
        default=False,
        help='Save user information from conversations.'
    )

    elevenlabs_enable_conversation_logging = fields.Boolean(
        string='Enable Conversation Logging',
        config_parameter='elevenlabs_agent.enable_conversation_logging',
        default=False,
        help='Log all conversations for analytics.'
    )

    elevenlabs_daily_usage_limit = fields.Integer(
        string='Daily Usage Limit',
        config_parameter='elevenlabs_agent.daily_usage_limit',
        default=0,
        help='Daily usage limit for the widget (0 for unlimited).'
    )

    elevenlabs_performance_metrics_dashboard = fields.Char(
        string='Performance Metrics Dashboard Link',
        config_parameter='elevenlabs_agent.performance_metrics_dashboard',
        help='Link to the performance metrics dashboard.'
    )

    # Product Integration
    elevenlabs_product_categories_include = fields.Char(
        string='Include Product Categories',
        config_parameter='elevenlabs_agent.product_categories_include',
        help='Comma-separated list of product category IDs to include.'
    )

    elevenlabs_product_categories_exclude = fields.Char(
        string='Exclude Product Categories',
        config_parameter='elevenlabs_agent.product_categories_exclude',
        help='Comma-separated list of product category IDs to exclude.'
    )

    elevenlabs_featured_products_priority = fields.Char(
        string='Featured Products Priority',
        config_parameter='elevenlabs_agent.featured_products_priority',
        help='Comma-separated list of product IDs to prioritize in recommendations.'
    )

    elevenlabs_out_of_stock_handling = fields.Selection([
        ('hide', 'Hide Out-of-Stock Items'),
        ('show_disabled', 'Show as Disabled'),
        ('show_with_notification', 'Show with Notification'),
    ], string='Out-of-Stock Item Handling',
        config_parameter='elevenlabs_agent.out_of_stock_handling',
        default='hide',
        required=True,
        help='How to handle out-of-stock items in recommendations.'
    )

    # Page Visibility Controls
    elevenlabs_pages_to_show = fields.Char(
        string='Pages to Show Widget',
        config_parameter='elevenlabs_agent.pages_to_show',
        help='Comma-separated list of page types to show widget on (e.g., homepage,product,cart,checkout).'
    )

    elevenlabs_pages_to_hide = fields.Char(
        string='Pages to Hide Widget',
        config_parameter='elevenlabs_agent.pages_to_hide',
        help='Comma-separated list of page types to hide widget on (e.g., homepage,product,cart,checkout).'
    )

    # Theme Settings
    elevenlabs_theme_type = fields.Selection([
        ('light', 'Light Theme'),
        ('dark', 'Dark Theme'),
    ], string='Theme Type',
        config_parameter='elevenlabs_agent.theme_type',
        default='light',
        required=True,
        help='Choose the theme type for the widget.'
    )

    elevenlabs_primary_color = fields.Char(
        string='Primary Color',
        config_parameter='elevenlabs_agent.primary_color',
        default='#667eea',
        help='Primary color for the widget (hex color, e.g., #667eea).'
    )

    elevenlabs_secondary_color = fields.Char(
        string='Secondary Color',
        config_parameter='elevenlabs_agent.secondary_color',
        default='#764ba2',
        help='Secondary/accent color for the widget (hex color, e.g., #764ba2).'
    )