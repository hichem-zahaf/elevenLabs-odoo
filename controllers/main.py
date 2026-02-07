# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
import json
import uuid

class ElevenLabsController(http.Controller):

    # ============================================================
    # USAGE TRACKING AND RATE LIMITING ENDPOINTS
    # ============================================================

    @http.route('/api/elevenlabs/usage/check', type='json', auth='public', methods=['POST'], csrf=False)
    def check_usage_limits(self, **kwargs):
        """
        Check if user can start the widget based on usage limits.
        Checks both daily user limit and global limit.

        Returns: dict with {
            'allowed': bool,
            'reason': str if not allowed,
            'daily_limit': dict,
            'global_limit': dict
        }
        """
        try:
            # Get settings
            daily_limit = int(request.env['ir.config_parameter'].sudo().get_param(
                'elevenlabs_agent.daily_usage_limit', '0'))
            global_limit = int(request.env['ir.config_parameter'].sudo().get_param(
                'elevenlabs_agent.global_usage_limit', '0'))

            # Get current user info
            user = request.env.user
            is_public = user._is_public()

            # Get user identifiers
            if is_public:
                user_id = None
                # Generate public user ID from IP
                ip_address = self._get_client_ip()
                public_user_id = request.env['elevenlabs.agent.usage'].get_or_create_public_user_id(ip_address)
            else:
                user_id = user.id
                public_user_id = None

            # Check daily limit
            daily_check = request.env['elevenlabs.agent.usage'].check_daily_limit(
                user_id=user_id,
                public_user_id=public_user_id,
                daily_limit=daily_limit
            )

            # Check global limit
            global_check = request.env['elevenlabs.agent.usage'].check_global_limit(
                global_limit=global_limit
            )

            # Determine if allowed
            allowed = daily_check['allowed'] and global_check['allowed']

            # Build reason if not allowed
            reason = None
            if not allowed:
                reasons = []
                if not daily_check['allowed']:
                    reasons.append(f"Daily limit of {daily_limit} messages reached.")
                if not global_check['allowed']:
                    reasons.append(f"Global limit of {global_limit} messages reached.")
                reason = " ".join(reasons)

            return {
                'success': True,
                'allowed': allowed,
                'reason': reason,
                'daily_limit': daily_check,
                'global_limit': global_check,
                'is_public': is_public,
                'user_id': user_id,
                'public_user_id': public_user_id
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'allowed': False  # Fail closed for safety
            }

    @http.route('/api/elevenlabs/usage/session/start', type='json', auth='public', methods=['POST'], csrf=False)
    def start_session(self, session_id, user_id=None, public_user_id=None, user_agent=None, referrer=None, **kwargs):
        """
        Record the start of a new conversation session.

        Args:
            session_id: The conversation_id from ElevenLabs
            user_id: The user ID if logged in
            public_user_id: The public user ID if not logged in
            user_agent: Browser user agent string
            referrer: Page referrer

        Returns: dict with session info
        """
        try:
            # Get IP address
            ip_address = self._get_client_ip()

            # Create usage record
            usage_vals = {
                'session_id': session_id,
                'ip_address': ip_address,
                'user_agent': user_agent,
                'referrer': referrer,
            }

            if user_id and user_id != '0' and user_id != 0:
                usage_vals['user_id'] = int(user_id)
            else:
                usage_vals['public_user_id'] = public_user_id

            usage = request.env['elevenlabs.agent.usage'].sudo().create(usage_vals)

            return {
                'success': True,
                'session_id': session_id,
                'message_count': 1,
                'usage_id': usage.id
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/elevenlabs/usage/message', type='json', auth='public', methods=['POST'], csrf=False)
    def record_message(self, session_id, **kwargs):
        """
        Record a message in a session (triggered by agent_response event).
        Also checks if session has exceeded message limit.

        Args:
            session_id: The conversation_id from ElevenLabs

        Returns: dict with {
            'success': bool,
            'message_count': int,
            'limit_exceeded': bool,
            'limit': int
        }
        """
        try:
            # Get session limit
            session_limit = int(request.env['ir.config_parameter'].sudo().get_param(
                'elevenlabs_agent.max_messages_per_conversation', '0'))

            # Increment message count
            new_count = request.env['elevenlabs.agent.usage'].increment_session_messages(session_id)

            if new_count is False:
                return {
                    'success': False,
                    'error': 'Session not found'
                }

            # Check if limit exceeded
            limit_exceeded = session_limit > 0 and new_count > session_limit

            return {
                'success': True,
                'message_count': new_count,
                'limit_exceeded': limit_exceeded,
                'limit': session_limit,
                'remaining': max(0, session_limit - new_count) if session_limit > 0 else -1
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/elevenlabs/usage/session/end', type='json', auth='public', methods=['POST'], csrf=False)
    def end_session(self, session_id, **kwargs):
        """
        Mark a session as ended.

        Args:
            session_id: The conversation_id from ElevenLabs

        Returns: dict with success status
        """
        try:
            success = request.env['elevenlabs.agent.usage'].sudo().end_session(session_id)
            return {
                'success': success
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/elevenlabs/usage/client-ip', type='json', auth='public', methods=['POST'], csrf=False)
    def get_client_info(self, **kwargs):
        """
        Get client IP and generate public user ID.

        Returns: dict with {
            'success': bool,
            'ip_address': str,
            'public_user_id': str
        }
        """
        try:
            ip_address = self._get_client_ip()
            public_user_id = request.env['elevenlabs.agent.usage'].get_or_create_public_user_id(ip_address)

            return {
                'success': True,
                'ip_address': ip_address,
                'public_user_id': public_user_id
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def _get_client_ip(self):
        """
        Get the client's IP address, checking various headers.
        """
        # Check various headers for the real IP (accounting for proxies)
        headers_to_check = [
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'HTTP_CF_CONNECTING_IP',  # Cloudflare
            'HTTP_X_CLIENT_IP',
            'REMOTE_ADDR'
        ]

        for header in headers_to_check:
            ip = request.httprequest.environ.get(header)
            if ip:
                # X_FORWARDED_FOR can contain multiple IPs, get the first one
                if header == 'HTTP_X_FORWARDED_FOR' and ',' in ip:
                    ip = ip.split(',')[0].strip()
                # Validate IP format (basic check)
                if ip and not ip.startswith('192.168.') and not ip.startswith('10.') and not ip.startswith('127.'):
                    return ip

        # Fallback to REMOTE_ADDR
        return request.httprequest.environ.get('REMOTE_ADDR', 'unknown')

    # ============================================================
    # EXISTING PRODUCT AND CART ENDPOINTS
    # ============================================================
    
    @http.route('/ai-assistant', type='http', auth='public', website=True, sitemap=True)
    def ai_assistant_page(self, **kwargs):
        """Render the AI Assistant page"""
        # Get the current user
        current_user = request.env.user

        return request.render('elevenlabs_agent.ai_assistant_page', {
            'agent_id': request.env['ir.config_parameter'].sudo().get_param(
                'elevenlabs_agent.agent_id',
                'agent_3901k2gz2sq2fg9ag068xjp0xc2t'  # Default agent ID
            ),
            'current_user': current_user
        })
    
    @http.route('/api/elevenlabs/product/sku/<string:sku>', type='json', auth='public', methods=['POST'])
    def get_product_by_sku(self, sku, **kwargs):
        """API endpoint to fetch product details by SKU"""
        product = request.env['product.product'].sudo().search([
            '|',
            ('default_code', '=', sku),
            ('barcode', '=', sku)
        ], limit=1)
        
        if product:
            # Get the product image URL
            image_url = None
            if product.image_1920:
                image_url = '/web/image/product.product/%s/image_1920' % product.id
            
            return {
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'price': str(product.list_price),
                    'image': image_url,
                    'description': product.description_sale or '',
                    'in_stock': product.qty_available > 0,
                    'qty_available': product.qty_available
                }
            }
        
        # Fallback to static catalog if product not found in database
        static_catalog = self._get_static_catalog()
        if sku.upper() in static_catalog:
            return {
                'success': True,
                'product': static_catalog[sku.upper()]
            }
        
        return {
            'success': False,
            'error': 'Product not found',
            'product': {
                'name': sku,
                'price': '0.00',
                'image': None,
                'description': 'Product not found'
            }
        }

    @http.route('/api/elevenlabs/cart/add', type='json', auth='public', website=True, methods=['POST'])
    
    @http.route('/api/elevenlabs/product/<int:product_id>', type='json', auth='public', methods=['POST'])
    def get_product_details(self, product_id, **kwargs):
        """Get detailed product information"""
        try:
            product = request.env['product.product'].sudo().browse(product_id)
            if not product.exists():
                return {'success': False, 'error': 'Product not found'}
            
            # Get product images
            images = []
            if product.image_1920:
                images.append(f'/web/image/product.product/{product.id}/image_1920')
            
            # Get product attributes/variants
            variants = []
            if product.product_template_attribute_value_ids:
                for attr_value in product.product_template_attribute_value_ids:
                    variants.append({
                        'attribute': attr_value.attribute_id.name,
                        'value': attr_value.name
                    })
            
            return {
                'success': True,
                'product': {
                    'id': product.id,
                    'name': product.name,
                    'sku': product.default_code or '',
                    'price': product.list_price,
                    'description': product.description_sale or product.description or '',
                    'images': images,
                    'in_stock': product.qty_available > 0,
                    'qty_available': product.qty_available,
                    'variants': variants,
                    'category': product.categ_id.name if product.categ_id else None
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/api/elevenlabs/products/recommended', type='json', auth='public', methods=['POST'])
    def get_recommended_products(self, category_id=None, limit=6, **kwargs):
        """Get recommended products for display"""
        domain = [('sale_ok', '=', True), ('website_published', '=', True)]
        
        if category_id:
            domain.append(('public_categ_ids', 'in', [category_id]))
        
        products = request.env['product.product'].sudo().search(domain, limit=limit)
        
        result = []
        for product in products:
            image_url = None
            if product.image_1920:
                image_url = '/web/image/product.product/%s/image_1920' % product.id
            
            result.append({
                'id': product.id,
                'sku': product.default_code or '',
                'name': product.name,
                'price': str(product.list_price),
                'image': image_url,
                'description': product.description_sale or '',
                'url': '/shop/product/%s' % product.id
            })
        
        return {
            'success': True,
            'products': result
        }
    
    @http.route('/api/elevenlabs/products/search', type='json', auth='public', methods=['POST'])
    def search_products(self, query='', category=None, min_price=None, max_price=None,
                        in_stock_only=False, limit=6, **kwargs):
        """
        Advanced product search with multiple filters

        Args:
            query: Search query for product name, SKU, or description
            category: Optional category name to filter by
            min_price: Optional minimum price filter
            max_price: Optional maximum price filter
            in_stock_only: Only return products in stock
            limit: Maximum number of results (default: 6, max: 20)
        """
        # Enforce max limit to prevent performance issues
        limit = min(int(limit or 6), 20)

        if not query:
            return {
                'success': False,
                'error': 'search_query_required',
                'error_message': 'Please provide a search term to find products.',
                'products': [],
                'total_count': 0
            }

        # Get category include/exclude settings
        categories_include = request.env['ir.config_parameter'].sudo().get_param(
            'elevenlabs_agent.product_categories_include', '')
        categories_exclude = request.env['ir.config_parameter'].sudo().get_param(
            'elevenlabs_agent.product_categories_exclude', '')

        # Parse comma-separated category IDs/names
        include_list = [c.strip() for c in categories_include.split(',') if c.strip()] if categories_include else []
        exclude_list = [c.strip() for c in categories_exclude.split(',') if c.strip()] if categories_exclude else []

        # Import expression module for proper domain building
        from odoo.osv import expression

        # Base domain - only saleable and published products
        domain = [('sale_ok', '=', True), ('website_published', '=', True)]

        # Apply category include filter (if set, only products in these categories will be shown)
        if include_list:
            # Try to find category IDs by name or use directly as IDs
            category_ids = []
            category_names = []
            for cat in include_list:
                # Try to find as ID first
                try:
                    cat_id = int(cat)
                    category_ids.append(cat_id)
                except ValueError:
                    # Not an ID, treat as name
                    category_names.append(cat)

            # Build domain for included categories
            include_domain_parts = []
            if category_ids:
                include_domain_parts.append([('public_categ_ids', 'in', category_ids)])
            if category_names:
                for cat_name in category_names:
                    include_domain_parts.append([('public_categ_ids.name', 'ilike', cat_name)])

            if include_domain_parts:
                # OR logic between all include conditions
                include_domain = expression.OR(include_domain_parts) if len(include_domain_parts) > 1 else include_domain_parts[0]
                domain = expression.AND([domain, include_domain])

        # Apply category exclude filter (products in these categories will be hidden)
        if exclude_list:
            # Try to find category IDs by name or use directly as IDs
            category_ids = []
            category_names = []
            for cat in exclude_list:
                # Try to find as ID first
                try:
                    cat_id = int(cat)
                    category_ids.append(cat_id)
                except ValueError:
                    # Not an ID, treat as name
                    category_names.append(cat)

            # Build domain for excluded categories
            if category_ids:
                domain = expression.AND([domain, [('public_categ_ids', 'not in', category_ids)]])
            if category_names:
                for cat_name in category_names:
                    domain = expression.AND([domain, [('public_categ_ids.name', 'not ilike', cat_name)]])

        # Split query into words for better matching
        # This allows "wireless mouse" to find products with both words anywhere
        words = [w.strip() for w in query.split() if w.strip()]

        # Build search domain using Odoo's expression module
        # For each word, create an OR group of field matches
        # All word groups are ANDed together (all words must match)
        if words:
            word_domains = []
            for word in words:
                # For each word, match ANY field (OR logic within the word)
                word_domain = expression.OR([
                    [('name', 'ilike', word)],
                    [('default_code', 'ilike', word)],
                    [('barcode', 'ilike', word)],
                    [('description_sale', 'ilike', word)]
                ])
                word_domains.append(word_domain)

            # Combine all word domains with AND logic and add to base domain
            search_domain = expression.AND(word_domains)
            domain = expression.AND([domain, search_domain])

        # Category filter
        if category:
            domain = expression.AND([domain, [('public_categ_ids.name', 'ilike', category)]])

        # Price range filter
        if min_price is not None:
            try:
                domain = expression.AND([domain, [('list_price', '>=', float(min_price))]])
            except (ValueError, TypeError):
                pass

        if max_price is not None:
            try:
                domain = expression.AND([domain, [('list_price', '<=', float(max_price))]])
            except (ValueError, TypeError):
                pass

        # Stock filter
        if in_stock_only:
            domain = expression.AND([domain, [('qty_available', '>', 0)]])

        # Search products - order by name for consistent results
        products = request.env['product.product'].sudo().search(domain, limit=limit, order='name ASC')

        # Build enhanced result structure for AI
        result = []
        for product in products:
            image_url = None
            if product.image_1920:
                image_url = '/web/image/product.product/%s/image_1920' % product.id

            # Get short description for AI consumption
            description = product.description_sale or product.description or ''
            short_desc = description[:200] + '...' if len(description) > 200 else description

            # Get category information
            category_name = None
            if product.categ_id:
                category_name = product.categ_id.name

            result.append({
                'id': product.id,
                'sku': product.default_code or '',
                'name': product.name,
                'price': float(product.list_price),
                'price_formatted': '${:.2f}'.format(product.list_price),
                'image': image_url,
                'description': description,
                'short_description': short_desc,
                'category': category_name,
                'in_stock': product.qty_available > 0,
                'stock_quantity': int(product.qty_available),
                'url': '/shop/product/%s' % product.id,
                'variants': self._get_product_variants(product)
            })

        # If no products found in database, search static catalog
        if not result:
            result = self._search_static_catalog(query, category, min_price, max_price, in_stock_only, limit, include_list, exclude_list)

        return {
            'success': True,
            'products': result,
            'total_count': len(result),
            'query': query,
            'filters_applied': {
                'category': category,
                'min_price': min_price,
                'max_price': max_price,
                'in_stock_only': in_stock_only,
                'categories_include': include_list if include_list else None,
                'categories_exclude': exclude_list if exclude_list else None
            }
        }

    def _get_product_variants(self, product):
        """Extract product variant/attribute information"""
        variants = []
        if product.product_template_attribute_value_ids:
            for attr_value in product.product_template_attribute_value_ids:
                variants.append({
                    'attribute': attr_value.attribute_id.name,
                    'value': attr_value.name
                })
        return variants

    def _search_static_catalog(self, query, category=None, min_price=None, max_price=None,
                                in_stock_only=False, limit=6, include_list=None, exclude_list=None):
        """Search the static fallback catalog"""
        static_catalog = self._get_static_catalog()

        # Split query into words for multi-word matching
        words = [w.strip().lower() for w in query.split() if w.strip()]

        result = []
        for sku, product_data in static_catalog.items():
            # Apply text search - all words must match somewhere in name or description
            name_lower = product_data['name'].lower()
            desc_lower = product_data.get('description', '').lower()

            # Check if ALL words match (AND logic between words)
            text_match = all(
                word in name_lower or word in desc_lower
                for word in words
            )

            if not text_match:
                continue

            # Get product category
            product_category = product_data.get('category', '').lower()

            # Apply category include filter (if set, only products in these categories will be shown)
            if include_list:
                # Check if product category matches any of the included categories
                include_match = any(
                    inc.lower() in product_category or product_category in inc.lower()
                    for inc in include_list
                )
                if not include_match:
                    continue

            # Apply category exclude filter (products in these categories will be hidden)
            if exclude_list:
                # Check if product category matches any of the excluded categories
                exclude_match = any(
                    exc.lower() in product_category or product_category in exc.lower()
                    for exc in exclude_list
                )
                if exclude_match:
                    continue

            # Apply category filter if specified (from search parameter)
            if category and category.lower() not in product_category:
                continue

            # Apply price filters
            try:
                price = float(product_data['price'])
                if min_price is not None and price < float(min_price):
                    continue
                if max_price is not None and price > float(max_price):
                    continue
            except (ValueError, TypeError):
                pass

            # Apply stock filter (static catalog items are considered in stock)
            if in_stock_only and not product_data.get('in_stock', True):
                continue

            result.append({
                'id': sku,
                'sku': sku,
                'name': product_data['name'],
                'price': float(product_data['price']),
                'price_formatted': '${:.2f}'.format(float(product_data['price'])),
                'image': product_data['image'],
                'description': product_data.get('description', ''),
                'short_description': (product_data.get('description', '')[:200] + '...' if len(product_data.get('description', '')) > 200 else product_data.get('description', '')),
                'category': product_data.get('category'),
                'in_stock': product_data.get('in_stock', True),
                'stock_quantity': 999,  # Static catalog assumed unlimited
                'url': '#',
                'variants': []
            })

            if len(result) >= limit:
                break

        return result
    
    def _get_static_catalog(self):
        """Static product catalog as fallback"""
        return {
            'WH-1000XM5': {
                'name': 'Conference Chair',
                'price': '33.00',
                'image': 'https://odoo.local/web/image/product.template/19/image_512',
                'description': 'A comfortable ergonomic office chair with adjustable height and lumbar support. Perfect for long working sessions.',
                'category': 'Office Furniture',
                'in_stock': True
            },
            'MACBOOK-AIR-M2': {
                'name': 'Apple MacBook Air 13-inch M2 (2024)',
                'price': '1099.00',
                'image': 'https://www.cnet.com/a/img/resize/1dfe63fa1d9ce83dca78559b8bb6479b15cdbb4e/hub/2013/06/13/3bc35600-053a-11e3-bf02-d4ae52e62bcc/Apple_MacBook_Air_13-inch_35781451_06.jpg?auto=webp&width=768',
                'description': 'Supercharged by M2 chip. Features a 13.6-inch Liquid Retina display, 8-core CPU, 10-core GPU, and up to 18-hour battery life.',
                'category': 'Electronics',
                'in_stock': True
            },
            'S24-ULTRA': {
                'name': 'Samsung Galaxy S24 Ultra',
                'price': '1299.99',
                'image': 'https://images.samsung.com/levant/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-kv.jpg?imbypass=true',
                'description': 'Epic, just like that. Features a 6.8-inch display, 200MP camera, S Pen included, and Galaxy AI for intelligent assistance.',
                'category': 'Electronics',
                'in_stock': True
            },
            'IPHONE-15-PRO': {
                'name': 'iPhone 15 Pro',
                'price': '999.00',
                'image': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-hero',
                'description': 'Titanium. So strong. So light. So Pro. Features A17 Pro chip, 48MP camera system, and Action button.',
                'category': 'Electronics',
                'in_stock': True
            },
            'AF1-WHITE': {
                'name': "Nike Air Force 1 '07",
                'price': '110.00',
                'image': 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/AIR+FORCE+1+%2707.png',
                'description': 'The radiance lives on. Classic white leather basketball sneaker with Air cushioning for all-day comfort.',
                'category': 'Footwear',
                'in_stock': True
            },
            'ADIDAS-ULTRA': {
                'name': 'Adidas Ultraboost 22',
                'price': '190.00',
                'image': 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg',
                'description': 'Incredible energy return. Features Boost midsole, Primeknit upper, and Linear Energy Push system for responsive cushioning.',
                'category': 'Footwear',
                'in_stock': True
            },
            'AIRPODS-PRO-2': {
                'name': 'Apple AirPods Pro (2nd Gen)',
                'price': '249.00',
                'image': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83',
                'description': 'Up to 2x more Active Noise Cancellation. Features H2 chip, USB-C charging case, and up to 30 hours of total listening time.',
                'category': 'Electronics',
                'in_stock': True
            }
        }

    # ============================================================================
    # Usage Tracking Endpoints
    # ============================================================================

    @http.route('/api/elevenlabs/session/init', type='json', auth='public', methods=['GET', 'POST'])
    def session_init(self, **kwargs):
        """
        Initialize a new session or retrieve existing session info.

        Returns:
            - sessionId: Unique session identifier (UUID)
            - userId: User ID if logged in, null for public users
            - userIdentifier: UUID for tracking public users based on IP
            - isNewSession: Boolean indicating if this is a new session
        """
        try:
            # Get current user
            current_user = request.env.user

            # Get IP address
            ip_address = request.httprequest.remote_addr or '0.0.0.0'

            # Get user agent
            user_agent = request.httprequest.user_agent.string if request.httprequest.user_agent else ''

            # Check if user is logged in
            if not current_user._is_public():
                # Logged-in user
                user_id = current_user.id
                user_identifier = None

                # Generate session ID (could also retrieve from session if you want to persist sessions)
                session_id = str(uuid.uuid4())

                return {
                    'success': True,
                    'sessionId': session_id,
                    'userId': user_id,
                    'userIdentifier': user_identifier,
                    'isNewSession': True,
                    'isLoggedIn': True
                }
            else:
                # Public user - generate identifier from IP
                user_id = None
                user_identifier = request.env['elevenlabs.usage'].generate_user_identifier_from_ip(ip_address)
                session_id = str(uuid.uuid4())

                return {
                    'success': True,
                    'sessionId': session_id,
                    'userId': user_id,
                    'userIdentifier': user_identifier,
                    'isNewSession': True,
                    'isLoggedIn': False
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/elevenlabs/session/record', type='json', auth='public', methods=['POST'])
    def session_record(self, sessionId=None, userId=None, userIdentifier=None, **kwargs):
        """
        Record usage for a session.

        Args:
            - sessionId: Unique session identifier
            - userId: User ID (null for public users)
            - userIdentifier: UUID for public users

        Returns:
            - success: Boolean
            - messageCount: Current message count for this session
            - isNewRecord: Boolean indicating if a new record was created
        """
        try:
            if not sessionId:
                return {
                    'success': False,
                    'error': 'sessionId is required'
                }

            # Get IP address
            ip_address = request.httprequest.remote_addr or '0.0.0.0'

            # Get user agent
            user_agent = request.httprequest.user_agent.string if request.httprequest.user_agent else ''

            # Get or create usage record
            usage_record, is_new = request.env['elevenlabs.usage'].get_or_create_usage_record(
                session_id=sessionId,
                user_id=userId,
                user_identifier=userIdentifier,
                ip_address=ip_address,
                user_agent=user_agent
            )

            return {
                'success': True,
                'messageCount': usage_record.message_count,
                'isNewRecord': is_new,
                'sessionId': sessionId
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @http.route('/api/elevenlabs/session/check', type='json', auth='public', methods=['GET', 'POST'])
    def session_check(self, userId=None, userIdentifier=None, sessionId=None, **kwargs):
        """
        Check if user has exceeded any usage limits.

        Args:
            - userId: User ID (null for public users)
            - userIdentifier: UUID for public users
            - sessionId: Optional session ID to check session limits

        Returns:
            - canShowWidget: Boolean indicating if widget should be shown
            - dailyUsage: Current daily message count
            - globalUsage: Current all-time message count
            - sessionUsage: Current session message count
            - dailyLimit: Daily limit setting
            - globalLimit: Global limit setting
            - sessionLimit: Session limit setting
            - reason: Reason if limit exceeded (null if OK)
        """
        try:
            # Get limit settings
            daily_limit = int(request.env['ir.config_parameter'].sudo().get_param(
                'elevenlabs_agent.daily_usage_limit', '50'))
            global_limit = int(request.env['ir.config_parameter'].sudo().get_param(
                'elevenlabs_agent.global_usage_limit', '1000'))
            session_limit = int(request.env['ir.config_parameter'].sudo().get_param(
                'elevenlabs_agent.session_usage_limit', '20'))

            # Check limits
            result = request.env['elevenlabs.usage'].check_user_limits(
                user_id=userId,
                user_identifier=userIdentifier,
                daily_limit=daily_limit,
                global_limit=global_limit,
                session_limit=session_limit,
                session_id=sessionId
            )

            result['success'] = True
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'canShowWidget': False  # Fail safe - don't show widget on error
            }