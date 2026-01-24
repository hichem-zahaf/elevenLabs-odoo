odoo.define('elevenlabs_agent.agent_widget', ['web.public.widget', 'web.core', 'web.ajax'], function (require) {
    'use strict';
    
    var publicWidget = require('web.public.widget');
    var core = require('web.core');
    var ajax = require('web.ajax');
    var _t = core._t;
    
    publicWidget.registry.ElevenLabsAgent = publicWidget.Widget.extend({
        selector: '.elevenlabs-agent-container',
        
        start: function () {
            var self = this;
            this._super.apply(this, arguments);

            // Initialize state
            this.agentId = this.$el.data('agent-id');
            this.widgetPosition = this.$el.data('widget-position') || 'bottom-right';
            this.enabled = this.$el.data('enabled') !== false;

            // Trigger options
            this.triggerDelay = parseInt(this.$el.data('trigger-delay')) || 0;
            this.triggerOnScroll = parseFloat(this.$el.data('trigger-on-scroll')) || 0;
            this.triggerOnTime = parseInt(this.$el.data('trigger-on-time')) || 0;
            this.triggerOnExitIntent = this.$el.data('trigger-on-exit-intent') !== false;
            this.showFirstTimeVisitorsOnly = this.$el.data('show-first-time-visitors-only') !== false;

            // Widget appearance
            this.widgetSize = this.$el.data('widget-size') || 'medium';
            this.colorScheme = this.$el.data('color-scheme') || null;
            this.customGreeting = this.$el.data('custom-greeting') || null;
            this.defaultState = this.$el.data('default-state') || 'expanded';
            this.zIndex = parseInt(this.$el.data('z-index')) || 9999;

            // Integration controls
            this.enableShowProductCard = this.$el.data('enable-show-product-card') !== false;
            this.enableAddToCart = this.$el.data('enable-add-to-cart') !== false;
            this.enableSearchProducts = this.$el.data('enable-search-products') !== false;
            this.cartIntegrationMethod = this.$el.data('cart-integration-method') || 'direct_add';

            // Targeting controls
            this.geographicRestrictions = this.$el.data('geographic-restrictions') || null;
            this.deviceFiltering = this.$el.data('device-filtering') || 'all';
            this.customerSegmentTargeting = this.$el.data('customer-segment-targeting') || 'all';
            this.excludeLoggedInUsers = this.$el.data('exclude-logged-in-users') !== false;

            // Session controls
            this.maxMessagesPerSession = parseInt(this.$el.data('max-messages-per-session')) || 0;
            this.conversationHistoryRetention = parseInt(this.$el.data('conversation-history-retention')) || 24;
            this.autoEndInactiveConversations = this.$el.data('auto-end-inactive-conversations') !== false;
            this.saveUserInfo = this.$el.data('save-user-info') !== false;
            this.enableConversationLogging = this.$el.data('enable-conversation-logging') !== false;
            this.dailyUsageLimit = parseInt(this.$el.data('daily-usage-limit')) || 0;

            // Product integration
            this.productCategoriesInclude = this.$el.data('product-categories-include') || null;
            this.productCategoriesExclude = this.$el.data('product-categories-exclude') || null;
            this.featuredProductsPriority = this.$el.data('featured-products-priority') || null;
            this.outOfStockHandling = this.$el.data('out-of-stock-handling') || 'hide';

            // Page visibility controls
            this.pagesToShow = this.$el.data('pages-to-show') || null;
            this.pagesToHide = this.$el.data('pages-to-hide') || null;

            // Check if widget should be shown based on page visibility
            if (!this._shouldShowOnCurrentPage()) {
                console.log('ElevenLabs agent is not configured for this page');
                return;
            }

            // Check geographic restrictions
            if (!this._passesGeographicRestrictions()) {
                console.log('ElevenLabs agent is restricted by geographic settings');
                return;
            }

            // Check device filtering
            if (!this._passesDeviceFiltering()) {
                console.log('ElevenLabs agent is restricted by device filtering');
                return;
            }

            // // Check customer segment targeting
            // if (!this._passesCustomerSegmentTargeting()) {
            //     console.log('ElevenLabs agent is restricted by customer segment targeting');
            //     return;
            // }

            // Check if logged-in users should be excluded
            if (this.excludeLoggedInUsers && this._isLoggedIn()) {
                console.log('ElevenLabs agent is excluded for logged-in users');
                return;
            }

            if (!this.enabled) {
                console.log('ElevenLabs agent is disabled');
                return;
            }

            if (!this.agentId) {
                console.error('ElevenLabs Agent ID not configured');
                this.$el.html('<div class="alert alert-warning">ElevenLabs Agent ID not configured. Please configure it in Website Settings.</div>');
                return;
            }

            // Apply trigger delay if set
            if (this.triggerDelay > 0) {
                setTimeout(function() {
                    self._initializeWidget();
                }, this.triggerDelay * 1000);
            } else {
                // Initialize the widget
                this._initializeWidget();
            }

            // Check for debug mode
            var urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === '1') {
                this._showDebugPanel();
            }

            return this._super.apply(this, arguments);
        },
        
        _initializeWidget: function() {
            var self = this;

            // Create the elevenlabs-convai element
            var widgetElement = document.createElement('elevenlabs-convai');
            widgetElement.setAttribute('agent-id', this.agentId);

            // Apply positioning styles
            widgetElement.style.position = 'fixed';
            widgetElement.style.zIndex = this.zIndex.toString();

            // Apply widget size
            this._applyWidgetSize(widgetElement);

            // Apply custom color scheme if set
            if (this.colorScheme) {
                widgetElement.style.setProperty('--primary-color', this.colorScheme);
            }

            // Apply custom greeting if set
            if (this.customGreeting) {
                widgetElement.setAttribute('greeting-message', this.customGreeting);
            }

            // Apply default state
            if (this.defaultState === 'minimized') {
                widgetElement.setAttribute('initial-state', 'minimized');
            }

            switch(this.widgetPosition) {
                case 'bottom-left':
                    widgetElement.style.bottom = '20px';
                    widgetElement.style.left = '20px';
                    break;
                case 'top-right':
                    widgetElement.style.top = '20px';
                    widgetElement.style.right = '20px';
                    break;
                case 'top-left':
                    widgetElement.style.top = '20px';
                    widgetElement.style.left = '20px';
                    break;
                default: // bottom-right
                    widgetElement.style.bottom = '20px';
                    widgetElement.style.right = '20px';
            }

            // Append to body
            document.body.appendChild(widgetElement);

            // Load the ElevenLabs script if not already loaded
            if (!document.querySelector('script[src*="elevenlabs"]')) {
                var script = document.createElement('script');
                script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
                script.async = true;
                script.type = 'text/javascript';

                script.onload = function() {
                    console.log('ElevenLabs script loaded');
                    // Register client tools after script loads
                    setTimeout(function() {
                        self._registerClientTools();
                    }, 500);
                };

                document.head.appendChild(script);
            } else {
                // Script already loaded, register tools
                this._registerClientTools();
            }
        },

        _applyWidgetSize: function(widgetElement) {
            // Apply size based on settings
            switch(this.widgetSize) {
                case 'small':
                    widgetElement.style.width = '300px';
                    widgetElement.style.height = '400px';
                    break;
                case 'large':
                    widgetElement.style.width = '450px';
                    widgetElement.style.height = '600px';
                    break;
                case 'medium':
                default:
                    widgetElement.style.width = '380px';
                    widgetElement.style.height = '500px';
            }
        },

        _shouldShowOnCurrentPage: function() {
            // Check if current page is in the allowed pages list
            if (this.pagesToShow) {
                var allowedPages = this.pagesToShow.split(',').map(page => page.trim());
                var currentPage = this._getCurrentPageType();

                if (allowedPages.length > 0 && !allowedPages.includes(currentPage)) {
                    return false;
                }
            }

            // Check if current page is in the excluded pages list
            if (this.pagesToHide) {
                var excludedPages = this.pagesToHide.split(',').map(page => page.trim());
                var currentPage = this._getCurrentPageType();

                if (excludedPages.includes(currentPage)) {
                    return false;
                }
            }

            return true;
        },

        _getCurrentPageType: function() {
            var pathname = window.location.pathname;

            if (pathname === '/') {
                return 'homepage';
            } else if (pathname.includes('/shop') || pathname.includes('/product')) {
                return 'product';
            } else if (pathname.includes('/cart')) {
                return 'cart';
            } else if (pathname.includes('/checkout')) {
                return 'checkout';
            } else if (pathname.includes('/contactus') || pathname.includes('/contact')) {
                return 'contact';
            } else if (pathname.includes('/aboutus') || pathname.includes('/about')) {
                return 'about';
            } else {
                return 'other';
            }
        },

        _passesGeographicRestrictions: function() {
            // If no geographic restrictions are set, allow everywhere
            if (!this.geographicRestrictions) {
                return true;
            }

            // Note: Actual IP geolocation would require a service
            // For now, we'll return true and assume server-side checks
            return true;
        },

        _passesDeviceFiltering: function() {
            var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            switch(this.deviceFiltering) {
                case 'desktop':
                    return !isMobile;
                case 'mobile':
                    return isMobile;
                case 'all':
                default:
                    return true;
            }
        },

        _passesCustomerSegmentTargeting: function() {
            // Check if we should show only to first-time visitors
            if (this.showFirstTimeVisitorsOnly) {
                var hasVisitedBefore = localStorage.getItem('elevenlabs_has_visited');
                if (hasVisitedBefore) {
                    return false;
                } else {
                    // Mark as visited for future visits
                    localStorage.setItem('elevenlabs_has_visited', 'true');
                }
            }

            // Check customer segment targeting
            switch(this.customerSegmentTargeting) {
                case 'first_time':
                    return !localStorage.getItem('elevenlabs_returning_customer');
                case 'returning':
                    return !!localStorage.getItem('elevenlabs_returning_customer');
                case 'vip':
                    // Would require checking user status from backend
                    return true; // For now, assume all users are eligible
                case 'all':
                default:
                    return true;
            }
        },

        _isLoggedIn: function() {
            // Check if user is logged in - this would typically check for Odoo session
            // For now, we'll check for a common Odoo login indicator
            return $('.o_logged').length > 0 || document.cookie.indexOf('session_id') !== -1;
        },
        
        _registerClientTools: function() {
            var self = this;
            var widget = document.querySelector('elevenlabs-convai');

            if (!widget) {
                console.error('ElevenLabs widget element not found');
                return;
            }

            // Register the event listener for client tools
            widget.addEventListener('elevenlabs-convai:call', function(event) {
                console.log('ElevenLabs tool call received:', event);

                // Register client tools in the event handler
                event.detail.config.clientTools = {};

                // Conditionally register tools based on settings
                if (self.enableShowProductCard) {
                    event.detail.config.clientTools.showProductCard = function(params) {
                        console.log('showProductCard called with:', params);
                        self._handleShowProductCard(params);
                    };
                }

                if (self.enableAddToCart) {
                    event.detail.config.clientTools.addToCart = function(params) {
                        console.log('addToCart called with:', params);
                        self._handleAddToCart(params);
                    };
                }

                if (self.enableSearchProducts) {
                    event.detail.config.clientTools.searchProducts = function(params) {
                        console.log('searchProducts called with:', params);
                        self._handleSearchProducts(params);
                    };
                }
            });

            console.log('oo ElevenLabs client tools registered oo');
        },
        
        _handleShowProductCard: function(params) {
            var self = this;
            
            // Parse parameters - they might come in different formats
            var products = [];
            
            if (params.products && Array.isArray(params.products)) {
                products = params.products;
            } else if (params.Products && Array.isArray(params.Products)) {
                products = params.Products;
            } else if (Array.isArray(params)) {
                products = params;
            }
            
            // Remove any existing product modal
            $('.elevenlabs-product-modal').remove();
            
            // Create product cards HTML
            var html = this._createProductCardsHTML(products);
            
            // Append to body and show
            $('body').append(html);
            
            // Bind events
            this._bindProductCardEvents();
            
            // Auto-hide after 30 seconds
            setTimeout(function() {
                $('.elevenlabs-product-modal').fadeOut(300, function() {
                    $(this).remove();
                });
            }, 30000);
        },
        
        _createProductCardsHTML: function(products) {
            var html = '<div class="elevenlabs-product-modal">';
            html += '<div class="product-modal-container">';
            
            // Header
            html += '<div class="product-modal-header">';
            html += '<h3>Recommended Products</h3>';
            html += '<button class="close-modal-btn">&times;</button>';
            html += '</div>';
            
            // Products grid
            html += '<div class="products-grid">';
            
            products.forEach(function(product, index) {
                var productName = product.name || product.Name || 'Product';
                var productPrice = product.price || product.Price || '0.00';
                var productImage = product.image || product.Image || null;
                var productDescription = product.description || product.Description || '';
                var productSku = product.sku || product.SKU || product.id || 'SKU-' + index;
                
                html += '<div class="product-card" data-sku="' + productSku + '">';
                
                // Product image
                html += '<div class="product-image">';
                if (productImage) {
                    html += '<img src="' + productImage + '" alt="' + productName + '" />';
                } else {
                    html += '<div class="no-image-placeholder">';
                    html += '<i class="fa fa-image fa-3x"></i>';
                    html += '</div>';
                }
                html += '</div>';
                
                // Product info
                html += '<div class="product-info">';
                html += '<h4>' + productName + '</h4>';
                if (productDescription) {
                    html += '<p class="product-description">' + productDescription + '</p>';
                }
                html += '<div class="product-price">$' + productPrice + '</div>';
                html += '<button class="btn btn-primary btn-add-to-cart" data-sku="' + productSku + '">Add to Cart</button>';
                html += '</div>';
                
                html += '</div>';
            });
            
            html += '</div>'; // products-grid
            html += '</div>'; // product-modal-container
            html += '</div>'; // elevenlabs-product-modal
            
            return html;
        },
        
        _bindProductCardEvents: function() {
            var self = this;
            
            // Close button
            $('.elevenlabs-product-modal .close-modal-btn').on('click', function() {
                $('.elevenlabs-product-modal').fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // Add to cart buttons
            $('.elevenlabs-product-modal .btn-add-to-cart').on('click', function() {
                var sku = $(this).data('sku');
                var $button = $(this);
                
                // Show loading state
                $button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Adding...');
                
                // Add to cart via API
                self._addSingleItemToCart(sku, 1, function(success) {
                    if (success) {
                        $button.html('<i class="fa fa-check"></i> Added!').addClass('btn-success').removeClass('btn-primary');
                    } else {
                        $button.html('Failed').addClass('btn-danger').removeClass('btn-primary');
                    }
                    
                    setTimeout(function() {
                        $button.prop('disabled', false)
                               .html('Add to Cart')
                               .removeClass('btn-success btn-danger')
                               .addClass('btn-primary');
                    }, 2000);
                });
            });
        },
        
        _handleAddToCart: function(params) {
            var self = this;
            
            // Parse cart items
            var items = [];
            
            if (params.items && Array.isArray(params.items)) {
                items = params.items;
            } else if (params.Items && Array.isArray(params.Items)) {
                items = params.Items;
            } else if (Array.isArray(params)) {
                items = params;
            } else if (params.product || params.Product) {
                // Single item
                items = [{
                    product: params.product || params.Product,
                    quantity: params.quantity || params.Quantity || 1
                }];
            }
            
            // Show cart animation
            this._showCartAnimation(items);
            
            // Add items to Odoo cart
            this._addItemsToOdooCart(items);
        },
        
        _showCartAnimation: function(items) {
            // Remove any existing cart modal
            $('.elevenlabs-cart-modal').remove();
            
            var html = '<div class="elevenlabs-cart-modal">';
            html += '<div class="cart-modal-container">';
            
            // Header
            html += '<div class="cart-modal-header">';
            html += '<i class="fa fa-shopping-cart"></i> Adding to Cart';
            html += '</div>';
            
            // Items list
            html += '<div class="cart-items-list">';
            items.forEach(function(item) {
                var productName = item.product || item.Product || item.name || 'Product';
                var quantity = item.quantity || item.Quantity || 1;
                
                html += '<div class="cart-item-row">';
                html += '<span class="item-name">' + productName + '</span>';
                html += '<span class="item-quantity">x' + quantity + '</span>';
                html += '<span class="item-status"><i class="fa fa-spinner fa-spin"></i></span>';
                html += '</div>';
            });
            html += '</div>';
            
            // Progress bar
            html += '<div class="cart-progress">';
            html += '<div class="progress-bar"></div>';
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
            
            // Append to body
            $('body').append(html);
            
            // Animate progress
            setTimeout(function() {
                $('.elevenlabs-cart-modal .progress-bar').css('width', '100%');
                $('.elevenlabs-cart-modal .item-status').html('<i class="fa fa-check text-success"></i>');
                
                setTimeout(function() {
                    $('.elevenlabs-cart-modal .cart-modal-header').html('<i class="fa fa-check-circle text-success"></i> Added to Cart!');
                    
                    setTimeout(function() {
                        $('.elevenlabs-cart-modal').fadeOut(300, function() {
                            $(this).remove();
                        });
                    }, 1500);
                }, 500);
            }, 300);
        },
        
        _addItemsToOdooCart: function(items) {
            var self = this;
            
            // Prepare items for API
            var cartItems = items.map(function(item) {
                return {
                    sku: item.product || item.Product || item.sku || item.SKU || 'DEFAULT',
                    quantity: item.quantity || item.Quantity || 1
                };
            });
            
            // Call Odoo cart API
            ajax.jsonRpc('/api/elevenlabs/cart/add', 'call', {
                items: cartItems
            }).then(function(result) {
                if (result.success) {
                    console.log('Items added to cart:', result);
                    
                    // Update cart counter if exists
                    if (result.cart_quantity !== undefined) {
                        $('.my_cart_quantity').text(result.cart_quantity);
                    }
                } else {
                    console.error('Failed to add items to cart:', result);
                }
            }).fail(function(error) {
                console.error('Error adding items to cart:', error);
            });
        },
        
        _addSingleItemToCart: function(sku, quantity, callback) {
            ajax.jsonRpc('/api/elevenlabs/cart/add', 'call', {
                items: [{
                    sku: sku,
                    quantity: quantity
                }]
            }).then(function(result) {
                if (result.success) {
                    // Update cart counter
                    if (result.cart_quantity !== undefined) {
                        $('.my_cart_quantity').text(result.cart_quantity);
                    }
                    callback(true);
                } else {
                    callback(false);
                }
            }).fail(function() {
                callback(false);
            });
        },
        
        _handleSearchProducts: function(params) {
            var self = this;
            var query = params.query || params.Query || params.search || '';
            
            if (!query) {
                console.error('No search query provided');
                return;
            }
            
            // Call search API
            ajax.jsonRpc('/api/elevenlabs/products/search', 'call', {
                query: query,
                limit: 6
            }).then(function(result) {
                if (result.success && result.products) {
                    self._handleShowProductCard({products: result.products});
                }
            }).fail(function(error) {
                console.error('Search failed:', error);
            });
        },
        
        _showDebugPanel: function() {
            var self = this;
            
            var html = '<div class="elevenlabs-debug-panel">';
            html += '<h4>Debug Tools</h4>';
            html += '<button id="debug-show-products" class="btn btn-sm btn-secondary">Test Product Cards</button>';
            html += '<button id="debug-add-cart" class="btn btn-sm btn-primary">Test Add to Cart</button>';
            html += '<button id="debug-search" class="btn btn-sm btn-info">Test Search</button>';
            html += '</div>';
            
            $('body').append(html);
            
            // Bind debug events
            $('#debug-show-products').on('click', function() {
                self._handleShowProductCard({
                    products: [
                        {
                            name: 'Conference Chair',
                            price: '348.00',
                            description: 'A chair that does exist on the database',
                            image: 'https://odoo.local/web/image/product.template/19/image_128',
                            sku: 'Conference-Chair'
                        },
                        {
                            name: 'Three-Seat Sofa',
                            price: '1099.00',
                            description: 'A sofa that does exist on the database',
                            sku: 'Three-Seat-Sofa'
                        },
                        {
                            name: 'Office Lamp',
                            price: '249.00',
                            description: 'Office Lamp',
                            sku: 'Office-Lamp'
                        }
                    ]
                });
            });
            
            $('#debug-add-cart').on('click', function() {
                self._handleAddToCart({
                    items: [
                        {product: 'Conference Chair', quantity: 1},
                        {product: 'Three-Seat Sofa', quantity: 2}
                    ]
                });
            });
            
            $('#debug-search').on('click', function() {
                var query = prompt('Enter search query:');
                if (query) {
                    self._handleSearchProducts({query: query});
                }
            });
        }
    });
    
    return publicWidget.registry.ElevenLabsAgent;
});