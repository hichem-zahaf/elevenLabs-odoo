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
    def add_to_cart(self, items, **kwargs):
        """Add multiple items to cart"""
        results = []
        
        for item in items:
            sku = item.get('sku', '')
            product_id = item.get('product_id')
            product_name = item.get('product_name', '')
            quantity = int(item.get('quantity', 1))
            
            # Try to find product by multiple methods
            product = None
            
            # First, try by product ID if provided
            if product_id:
                try:
                    product_id_int = int(product_id)
                    product = request.env['product.product'].sudo().browse(product_id_int)
                    if not product.exists():
                        product = None
                except (ValueError, TypeError):
                    pass
            
            # Second, try by SKU or barcode
            if not product and sku:
                product = request.env['product.product'].sudo().search([
                    '|',
                    ('default_code', '=', sku),
                    ('barcode', '=', sku)
                ], limit=1)
            
            # Third, try by product name (case-insensitive)
            if not product and product_name:
                # Try exact match first
                product = request.env['product.product'].sudo().search([
                    ('name', 'ilike', product_name),
                    ('sale_ok', '=', True)
                ], limit=1)
                
                # If no exact match, try partial match
                if not product:
                    # Split name and search for products containing all words
                    words = product_name.split()
                    if words:
                        domain = [('sale_ok', '=', True)]
                        for word in words:
                            domain.append(('name', 'ilike', word))
                        product = request.env['product.product'].sudo().search(domain, limit=1)
            
            if product:
                # Add to cart - get or create order
                try:
                    # Get current user info for debugging
                    user = request.env.user
                    partner = user.partner_id if user else None
                    
                    sale_order = request.website.sale_get_order(force_create=True)
                    if sale_order:
                        sale_order._cart_update(
                            product_id=product.id,
                            add_qty=quantity
                        )
                        results.append({
                            'success': True,
                            'sku': sku,
                            'product_id': product.id,
                            'name': product.name,
                            'quantity': quantity,
                            'matched_by': 'id' if product_id and int(product_id) == product.id else 'sku' if sku == product.default_code or sku == product.barcode else 'name',
                            'order_id': sale_order.id,
                            'user': user.name if user and user.name else 'Public User',
                            'partner_id': partner.id if partner else None
                        })
                    else:
                        results.append({
                            'success': False,
                            'sku': sku,
                            'product_name': product_name,
                            'error': 'Could not create cart'
                        })
                except Exception as e:
                    results.append({
                        'success': False,
                        'sku': sku,
                        'product_name': product_name,
                        'error': str(e)
                    })
            else:
                results.append({
                    'success': False,
                    'sku': sku,
                    'product_name': product_name,
                    'error': 'Product not found'
                })
        
        # Get cart quantity safely
        cart_qty = 0
        try:
            order = request.website.sale_get_order()
            if order:
                cart_qty = order.cart_quantity or 0
        except:
            pass
        
        return {
            'success': True,
            'items': results,
            'cart_quantity': cart_qty
        }
    
    @http.route('/api/elevenlabs/cart/checkout', type='json', auth='public', website=True, methods=['POST'])
    def cart_checkout(self, **kwargs):
        """Initiate checkout process and return checkout URL"""
        try:
            # Get current sale order
            order = request.website.sale_get_order()
            
            if not order or not order.order_line:
                return {
                    'success': False,
                    'error': 'Cart is empty',
                    'checkout_url': None
                }
            
            # Get the checkout URL
            checkout_url = '/shop/checkout'
            
            return {
                'success': True,
                'checkout_url': checkout_url,
                'order_id': order.id,
                'cart_quantity': order.cart_quantity or 0
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'checkout_url': None
            }
    
    @http.route('/api/elevenlabs/checkout/shipping', type='json', auth='public', website=True, methods=['POST'])
    def set_shipping_info(self, **kwargs):
        """Set shipping information for the order"""
        try:
            order = request.website.sale_get_order(force_create=True)
            if not order:
                return {'success': False, 'error': 'No active order'}
            
            # Update partner shipping address
            values = {}
            if kwargs.get('name'):
                values['name'] = kwargs['name']
            if kwargs.get('street'):
                values['street'] = kwargs['street']
            if kwargs.get('street2'):
                values['street2'] = kwargs['street2']
            if kwargs.get('city'):
                values['city'] = kwargs['city']
            if kwargs.get('state'):
                values['state_id'] = request.env['res.country.state'].sudo().search([('name', 'ilike', kwargs['state'])], limit=1).id
            if kwargs.get('zip'):
                values['zip'] = kwargs['zip']
            if kwargs.get('country'):
                values['country_id'] = request.env['res.country'].sudo().search([('name', 'ilike', kwargs['country'])], limit=1).id
            if kwargs.get('phone'):
                values['phone'] = kwargs['phone']
            
            # Store in session for later use
            request.session['checkout_shipping'] = values
            
            return {
                'success': True,
                'message': 'Shipping information saved',
                'data': values
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/api/elevenlabs/checkout/billing', type='json', auth='public', website=True, methods=['POST'])
    def set_billing_info(self, same_as_shipping=False, **kwargs):
        """Set billing information for the order"""
        try:
            if same_as_shipping:
                # Copy shipping info
                shipping_info = request.session.get('checkout_shipping', {})
                request.session['checkout_billing'] = shipping_info
                return {
                    'success': True,
                    'message': 'Billing same as shipping',
                    'data': shipping_info
                }
            
            # Set different billing address
            values = {}
            if kwargs.get('name'):
                values['name'] = kwargs['name']
            if kwargs.get('street'):
                values['street'] = kwargs['street']
            if kwargs.get('street2'):
                values['street2'] = kwargs['street2']
            if kwargs.get('city'):
                values['city'] = kwargs['city']
            if kwargs.get('state'):
                values['state_id'] = request.env['res.country.state'].sudo().search([('name', 'ilike', kwargs['state'])], limit=1).id
            if kwargs.get('zip'):
                values['zip'] = kwargs['zip']
            if kwargs.get('country'):
                values['country_id'] = request.env['res.country'].sudo().search([('name', 'ilike', kwargs['country'])], limit=1).id
            
            request.session['checkout_billing'] = values
            
            return {
                'success': True,
                'message': 'Billing information saved',
                'data': values
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/api/elevenlabs/checkout/shipping-method', type='json', auth='public', website=True, methods=['POST'])
    def set_shipping_method(self, method=None, **kwargs):
        """Set shipping method for the order"""
        try:
            order = request.website.sale_get_order()
            if not order:
                return {'success': False, 'error': 'No active order'}
            
            # Store shipping method in session
            request.session['checkout_shipping_method'] = method
            
            # Calculate shipping cost based on method
            shipping_cost = 0
            if method == 'express':
                shipping_cost = 15.00
            elif method == 'overnight':
                shipping_cost = 35.00
            
            return {
                'success': True,
                'message': f'Shipping method set to {method}',
                'method': method,
                'shipping_cost': shipping_cost
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/api/elevenlabs/checkout/review', type='json', auth='public', website=True, methods=['POST'])
    def review_order(self, **kwargs):
        """Get order summary for review"""
        try:
            order = request.website.sale_get_order()
            if not order:
                return {'success': False, 'error': 'No active order'}
            
            # Get stored checkout info
            shipping_info = request.session.get('checkout_shipping', {})
            billing_info = request.session.get('checkout_billing', {})
            shipping_method = request.session.get('checkout_shipping_method', 'standard')
            
            # Calculate totals
            shipping_cost = 0
            if shipping_method == 'express':
                shipping_cost = 15.00
            elif shipping_method == 'overnight':
                shipping_cost = 35.00
            
            items = []
            for line in order.order_line:
                if line.product_id:
                    items.append({
                        'product': line.product_id.name,
                        'quantity': line.product_uom_qty,
                        'price': line.price_unit,
                        'subtotal': line.price_subtotal
                    })
            
            return {
                'success': True,
                'order_summary': {
                    'items': items,
                    'subtotal': order.amount_untaxed,
                    'tax': order.amount_tax,
                    'shipping': shipping_cost,
                    'total': order.amount_total + shipping_cost,
                    'shipping_address': shipping_info,
                    'billing_address': billing_info,
                    'shipping_method': shipping_method
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/api/elevenlabs/checkout/place-order', type='json', auth='public', website=True, methods=['POST'])
    def place_order(self, confirm=False, notes=None, **kwargs):
        """Confirm and place the order"""
        try:
            if not confirm:
                return {'success': False, 'error': 'Order not confirmed'}
            
            order = request.website.sale_get_order()
            if not order:
                return {'success': False, 'error': 'No active order'}
            
            # Add notes if provided
            if notes:
                order.note = notes
            
            # Mark order as confirmed (simplified - actual implementation would handle payment)
            order.action_confirm()
            
            # Clear session data
            request.session.pop('checkout_shipping', None)
            request.session.pop('checkout_billing', None)
            request.session.pop('checkout_shipping_method', None)
            
            return {
                'success': True,
                'message': 'Order placed successfully',
                'order_id': order.id,
                'order_name': order.name
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
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
    def search_products(self, query='', limit=6, **kwargs):
        """Search products by name or description"""
        if not query:
            return {
                'success': False,
                'error': 'No search query provided',
                'products': []
            }
        
        # Search in product name and description
        domain = [
            ('sale_ok', '=', True),
            ('website_published', '=', True),
            '|',
            ('name', 'ilike', query),
            ('description_sale', 'ilike', query)
        ]
        
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
        
        # If no products found in database, search static catalog
        if not result:
            static_catalog = self._get_static_catalog()
            query_lower = query.lower()
            for sku, product_data in static_catalog.items():
                if query_lower in product_data['name'].lower() or query_lower in product_data.get('description', '').lower():
                    result.append({
                        'id': sku,
                        'sku': sku,
                        'name': product_data['name'],
                        'price': product_data['price'],
                        'image': product_data['image'],
                        'description': product_data.get('description', ''),
                        'url': '#'
                    })
                    if len(result) >= limit:
                        break
        
        return {
            'success': True,
            'products': result
        }
    
    def _get_static_catalog(self):
        """Static product catalog as fallback"""
        return {
            'WH-1000XM5': {
                'name': 'Conference Chair',
                'price': '33.00',
                'image': 'https://odoo.local/web/image/product.template/19/image_512',
                'description': 'A chair that does exist on the database'
            },
            'MACBOOK-AIR-M2': {
                'name': 'Apple MacBook Air 13-inch M2 (2024)',
                'price': '1099.00',
                'image': 'https://www.cnet.com/a/img/resize/1dfe63fa1d9ce83dca78559b8bb6479b15cdbb4e/hub/2013/06/13/3bc35600-053a-11e3-bf02-d4ae52e62bcc/Apple_MacBook_Air_13-inch_35781451_06.jpg?auto=webp&width=768',
                'description': 'Supercharged by M2 chip'
            },
            'S24-ULTRA': {
                'name': 'Samsung Galaxy S24 Ultra',
                'price': '1299.99',
                'image': 'https://images.samsung.com/levant/smartphones/galaxy-s24-ultra/images/galaxy-s24-ultra-highlights-kv.jpg?imbypass=true',
                'description': 'Epic, just like that'
            },
            'IPHONE-15-PRO': {
                'name': 'iPhone 15 Pro',
                'price': '999.00',
                'image': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-hero',
                'description': 'Titanium. So strong. So light. So Pro.'
            },
            'AF1-WHITE': {
                'name': "Nike Air Force 1 '07",
                'price': '110.00',
                'image': 'https://static.nike.com/a/images/t_PDP_1728_v1/f_auto,q_auto:eco/b7d9211c-26e7-431a-ac24-b0540fb3c00f/AIR+FORCE+1+%2707.png',
                'description': 'The radiance lives on'
            },
            'ADIDAS-ULTRA': {
                'name': 'Adidas Ultraboost 22',
                'price': '190.00',
                'image': 'https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a78bc4896a3e9ad7800abcec6_9366/Ultraboost_22_Shoes_Black_GZ0127_01_standard.jpg',
                'description': 'Incredible energy return'
            },
            'AIRPODS-PRO-2': {
                'name': 'Apple AirPods Pro (2nd Gen)',
                'price': '249.00',
                'image': 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/MQD83',
                'description': 'Up to 2x more Active Noise Cancellation'
            }
        }