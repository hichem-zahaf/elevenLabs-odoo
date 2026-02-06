# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
import json

class ElevenLabsController(http.Controller):
    
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

        # Import expression module for proper domain building
        from odoo.osv import expression

        # Base domain - only saleable and published products
        domain = [('sale_ok', '=', True), ('website_published', '=', True)]

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
            result = self._search_static_catalog(query, category, min_price, max_price, in_stock_only, limit)

        return {
            'success': True,
            'products': result,
            'total_count': len(result),
            'query': query,
            'filters_applied': {
                'category': category,
                'min_price': min_price,
                'max_price': max_price,
                'in_stock_only': in_stock_only
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
                                in_stock_only=False, limit=6):
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

            # Apply category filter if specified
            if category and category.lower() not in product_data.get('category', '').lower():
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