(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeElevenLabsWidget();
        
        // Ensure viewport positioning is correct
        ensureFixedPositioning();
    });
    
    function ensureFixedPositioning() {
        // Check and fix positioning every second for first 5 seconds
        var checks = 0;
        var interval = setInterval(function() {
            var elements = document.querySelectorAll('.elevenlabs-debug-panel, .elevenlabs-product-modal, .elevenlabs-cart-modal');
            elements.forEach(function(el) {
                if (el && window.getComputedStyle(el).position !== 'fixed') {
                    el.style.setProperty('position', 'fixed', 'important');
                }
            });
            
            checks++;
            if (checks >= 5) {
                clearInterval(interval);
            }
        }, 1000);
    }
    
    function initializeElevenLabsWidget() {
        // Find the container element
        var container = document.querySelector('.elevenlabs-agent-container');
        if (!container) {
            console.log('ElevenLabs container not found');
            return;
        }
        
        // Check for debug mode first (always show debug panel if debug=1)
        var urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === '1') {
            console.log('Debug mode enabled');
            showDebugPanel();
        }
        
        // Get configuration from data attributes
        var agentId = container.dataset.agentId;
        var enabled = container.dataset.enabled !== 'False';
        var widgetPosition = container.dataset.widgetPosition || 'bottom-right';
        
        if (!enabled) {
            console.log('ElevenLabs agent is disabled');
            return;
        }
        
        if (!agentId) {
            console.error('ElevenLabs Agent ID not configured');
            container.innerHTML = '<div class="alert alert-warning">ElevenLabs Agent ID not configured. Please configure it in Website Settings.</div>';
            // Still allow debug panel even without agent ID
            return;
        }
        
        // Create and insert the widget
        createWidget(agentId, widgetPosition);
    }
    
    function createWidget(agentId, position) {
        // Create the elevenlabs-convai element
        var widgetElement = document.createElement('elevenlabs-convai');
        widgetElement.setAttribute('agent-id', agentId);
        
        // Apply positioning styles
        widgetElement.style.position = 'fixed';
        widgetElement.style.zIndex = '9999';
        
        switch(position) {
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
                    registerClientTools();
                }, 500);
            };
            
            document.head.appendChild(script);
        } else {
            // Script already loaded, register tools
            registerClientTools();
        }
    }
    
    function registerClientTools() {
        var widget = document.querySelector('elevenlabs-convai');
        
        if (!widget) {
            console.error('ElevenLabs widget element not found');
            return;
        }
        
        // Register the event listener for client tools
        widget.addEventListener('elevenlabs-convai:call', function(event) {
            console.log('ElevenLabs tool call received:', event);
            
            // Register client tools in the event handler
            if (event.detail && event.detail.config) {
                event.detail.config.clientTools = {
                    // Tool for showing product recommendations
                    showProductCard: function(params) {
                        console.log('showProductCard called with:', params);
                        handleShowProductCard(params);
                    },
                    
                    // Tool for adding items to cart
                    addToCart: function(params) {
                        console.log('addToCart called with:', params);
                        handleAddToCart(params);
                    },
                    
                    // Tool for searching products
                    searchProducts: function(params) {
                        console.log('searchProducts called with:', params);
                        handleSearchProducts(params);
                    },
                    
                    // Tool for cart checkout
                    cartCheckout: function(params) {
                        console.log('cartCheckout called');
                        handleCartCheckout();
                    },
                    
                    // Conversational checkout tools
                    collectShippingInfo: function(params) {
                        console.log('collectShippingInfo called with:', params);
                        handleCollectShippingInfo(params);
                    },
                    
                    collectBillingInfo: function(params) {
                        console.log('collectBillingInfo called with:', params);
                        handleCollectBillingInfo(params);
                    },
                    
                    selectShippingMethod: function(params) {
                        console.log('selectShippingMethod called with:', params);
                        handleSelectShippingMethod(params);
                    },
                    
                    reviewOrder: function(params) {
                        console.log('reviewOrder called');
                        handleReviewOrder();
                    },
                    
                    placeOrder: function(params) {
                        console.log('placeOrder called with:', params);
                        handlePlaceOrder(params);
                    },
                    
                    // Product details tool
                    displayProductDetails: function(params) {
                        console.log('displayProductDetails called with:', params);
                        handleDisplayProductDetails(params);
                    }
                };
            }
        });
        
        console.log('✓ ElevenLabs client tools registered');
    }
    
    function handleShowProductCard(params) {
        console.log('handleShowProductCard received:', params);
        
        // Parse parameters - handle both array and object formats
        var products = [];
        
        // If params is directly an array of products
        if (Array.isArray(params)) {
            products = params;
        } else if (params && typeof params === 'object') {
            // Check for products property
            if (params.products && Array.isArray(params.products)) {
                products = params.products;
            } else if (params.Products && Array.isArray(params.Products)) {
                products = params.Products;
            }
        }
        
        // Log for debugging
        console.log('Parsed products:', products);
        
        if (products.length === 0) {
            console.error('No products to display');
            return;
        }
        
        // Remove any existing product modal
        var existingModal = document.querySelector('.elevenlabs-product-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create product cards HTML with swiper
        var modalHtml = createProductCardsHTML(products);
        
        // Append directly to body with high-level container
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Force positioning and visibility
        var modal = document.querySelector('.elevenlabs-product-modal');
        if (modal) {
            modal.style.setProperty('position', 'fixed', 'important');
            modal.style.setProperty('bottom', '120px', 'important');
            modal.style.setProperty('left', '20px', 'important');
            modal.style.setProperty('z-index', '999999', 'important');
            modal.style.setProperty('opacity', '1', 'important');
            
            // Add entrance animation
            setTimeout(function() {
                modal.style.setProperty('transform', 'translateY(0)', 'important');
            }, 10);
        }
        
        // Bind events
        bindProductCardEvents(products);
        
        // Auto-hide after 45 seconds
        setTimeout(function() {
            closeProductModal();
        }, 45000);
    }
    
    function createProductCardsHTML(products) {
        var currentIndex = 0;
        var maxDisplay = 3; // Maximum products to display at once
        
        var html = '<div class="elevenlabs-product-modal" style="position: fixed !important; bottom: 100px !important; left: 20px !important; z-index: 999999 !important; opacity: 1 !important; transform: translateY(20px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">';
        html += '<div class="product-modal-container" style="background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12); padding: 12px; width: 420px; max-width: calc(100vw - 40px);">';
        
        // Minimal header with just close button
        html += '<div class="product-modal-header" style="display: flex; justify-content: flex-end; margin-bottom: 10px;">';
        html += '<button class="close-modal-btn" style="background: rgba(0, 0, 0, 0.05); border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: #666;">&times;</button>';
        html += '</div>';
        
        // Products wrapper with swiper
        html += '<div class="products-wrapper" style="position: relative;">';
        
        // Navigation buttons (if more than 3 products)
        if (products.length > maxDisplay) {
            html += '<button class="swiper-btn swiper-prev" data-direction="prev" style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%); background: white; border: none; width: 28px; height: 28px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; z-index: 2; display: flex; align-items: center; justify-content: center;">';
            html += '<i class="fa fa-chevron-left" style="font-size: 12px; color: #666;"></i>';
            html += '</button>';
        }
        
        // Products grid
        html += '<div class="products-grid" data-current-index="0" style="display: flex; gap: 8px; padding: 0 15px; overflow: hidden; position: relative;">';
        
        products.forEach(function(product, index) {
            var productName = product.name || product.Name || 'Product';
            var productPrice = product.price || product.Price || '0.00';
            var productImage = product.image || product.Image || null;
            var productDescription = product.description || product.Description || '';
            var productSku = product.sku || product.SKU || product.default_code || 'SKU-' + index;
            var productId = product.id || product.product_id || null;
            
            // Only show first 3 products initially
            var isVisible = index < maxDisplay;
            
            html += '<div class="product-card" data-index="' + index + '" data-sku="' + productSku + '" data-product-id="' + productId + '"';
            html += ' style="' + (isVisible ? '' : 'display: none;') + ' flex: 0 0 calc(33.333% - 6px); background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); transition: all 0.3s;">';
            
            // Product image
            html += '<div class="product-image" style="width: 100%; height: 100px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; overflow: hidden;">';
            if (productImage) {
                html += '<img src="' + productImage + '" alt="' + productName + '" loading="lazy" style="width: 100%; height: 100%; object-fit: cover;" />';
            } else {
                html += '<div class="no-image-placeholder" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #cbd5e0;">';
                html += '<i class="fa fa-cube" style="font-size: 24px;"></i>';
                html += '</div>';
            }
            html += '</div>';
            
            // Product info
            html += '<div class="product-info" style="padding: 8px; display: flex; flex-direction: column; gap: 6px;">';
            html += '<h4 class="product-name" title="' + productName + '" style="margin: 0; font-size: 11px; font-weight: 600; color: #2c3e50; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; min-height: 24px;">' + productName + '</h4>';
            if (productDescription) {
                html += '<p class="product-description">' + productDescription + '</p>';
            }
            html += '<div class="product-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">';
            html += '<div class="product-price" style="font-size: 13px; font-weight: bold; color: #667eea;">$' + productPrice + '</div>';
            html += '<button class="btn-add-to-cart" data-sku="' + productSku + '" style="background: #667eea; color: white; border: none; padding: 5px 10px; border-radius: 14px; font-size: 10px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 3px;">';
            html += '<i class="fa fa-plus" style="font-size: 9px;"></i>';
            html += '<span>Add</span>';
            html += '</button>';
            html += '</div>';
            html += '</div>';
            
            html += '</div>';
        });
        
        html += '</div>'; // products-grid
        
        // Navigation buttons (if more than 3 products)
        if (products.length > maxDisplay) {
            html += '<button class="swiper-btn swiper-next" data-direction="next" style="position: absolute; right: -10px; top: 50%; transform: translateY(-50%); background: white; border: none; width: 28px; height: 28px; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; z-index: 2; display: flex; align-items: center; justify-content: center;">';
            html += '<i class="fa fa-chevron-right" style="font-size: 12px; color: #666;"></i>';
            html += '</button>';
        }
        
        html += '</div>'; // products-wrapper
        
        // Page indicators
        if (products.length > maxDisplay) {
            var totalPages = Math.ceil(products.length / maxDisplay);
            html += '<div class="page-indicators" style="display: flex; justify-content: center; gap: 4px; margin-top: 10px;">';
            for (var i = 0; i < totalPages; i++) {
                var isActive = i === 0;
                html += '<span class="indicator' + (isActive ? ' active' : '') + '" data-page="' + i + '" style="width: ' + (isActive ? '16px' : '6px') + '; height: 6px; border-radius: 3px; background: ' + (isActive ? '#667eea' : '#e2e8f0') + '; cursor: pointer; transition: all 0.3s;"></span>';
            }
            html += '</div>';
        }
        
        html += '</div>'; // product-modal-container
        html += '</div>'; // elevenlabs-product-modal
        
        return html;
    }
    
    function closeProductModal() {
        var modal = document.querySelector('.elevenlabs-product-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(function() {
                modal.remove();
            }, 300);
        }
    }
    
    function bindProductCardEvents(products) {
        var maxDisplay = 3;
        var currentIndex = 0;
        
        // Close button
        var closeBtn = document.querySelector('.elevenlabs-product-modal .close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeProductModal);
        }
        
        // Swiper navigation
        var prevBtn = document.querySelector('.swiper-prev');
        var nextBtn = document.querySelector('.swiper-next');
        var indicators = document.querySelectorAll('.page-indicators .indicator');
        
        function updateDisplay() {
            var cards = document.querySelectorAll('.elevenlabs-product-modal .product-card');
            
            // Hide all cards
            cards.forEach(function(card) {
                card.style.display = 'none';
                card.classList.remove('slide-in-left', 'slide-in-right');
            });
            
            // Show current set of cards
            for (var i = currentIndex; i < Math.min(currentIndex + maxDisplay, products.length); i++) {
                var card = cards[i];
                if (card) {
                    card.style.display = '';
                    card.classList.add('slide-in-right');
                }
            }
            
            // Update indicators
            var currentPage = Math.floor(currentIndex / maxDisplay);
            indicators.forEach(function(indicator, idx) {
                var isActive = idx === currentPage;
                indicator.classList.toggle('active', isActive);
                indicator.style.width = isActive ? '16px' : '6px';
                indicator.style.background = isActive ? '#667eea' : '#e2e8f0';
            });
            
            // Update button states
            if (prevBtn) prevBtn.disabled = currentIndex === 0;
            if (nextBtn) nextBtn.disabled = currentIndex + maxDisplay >= products.length;
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (currentIndex > 0) {
                    currentIndex = Math.max(0, currentIndex - maxDisplay);
                    updateDisplay();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (currentIndex + maxDisplay < products.length) {
                    currentIndex = Math.min(products.length - maxDisplay, currentIndex + maxDisplay);
                    updateDisplay();
                }
            });
        }
        
        // Page indicators click
        indicators.forEach(function(indicator) {
            indicator.addEventListener('click', function() {
                var page = parseInt(this.dataset.page);
                currentIndex = page * maxDisplay;
                updateDisplay();
            });
        });
        
        // Add to cart buttons
        var addToCartBtns = document.querySelectorAll('.elevenlabs-product-modal .btn-add-to-cart');
        addToCartBtns.forEach(function(button) {
            button.addEventListener('click', function() {
                var sku = this.dataset.sku;
                var btn = this;
                var originalContent = btn.innerHTML;
                
                // Show loading state
                btn.disabled = true;
                btn.classList.add('loading');
                btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
                
                // Get product card to extract more info
                var productCard = btn.closest('.product-card');
                var productName = productCard ? productCard.querySelector('.product-name').textContent : '';
                var productId = productCard ? productCard.dataset.productId : null;
                
                // Add to cart via API
                addSingleItemToCart(sku, productName, productId, 1, function(success) {
                    btn.classList.remove('loading');
                    if (success) {
                        btn.classList.add('success');
                        btn.innerHTML = '<i class="fa fa-check"></i>';
                    } else {
                        btn.classList.add('error');
                        btn.innerHTML = '<i class="fa fa-times"></i>';
                    }
                    
                    setTimeout(function() {
                        btn.disabled = false;
                        btn.innerHTML = originalContent;
                        btn.classList.remove('success', 'error');
                    }, 2000);
                });
            });
        });
    }
    
    function handleAddToCart(params) {
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
        showCartAnimation(items);
        
        // Add items to Odoo cart
        addItemsToOdooCart(items);
    }
    
    function showCartAnimation(items) {
        console.log('Showing cart animation for items:', items);
        
        // Remove any existing cart modal
        var existingModal = document.querySelector('.elevenlabs-cart-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        var html = '<div class="elevenlabs-cart-modal" style="position: fixed !important; bottom: 120px !important; right: 20px !important; z-index: 999999 !important; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12); width: 360px; max-width: calc(100vw - 40px);">';
        html += '<div class="cart-modal-container" style="padding: 16px; background: white; border-radius: 12px;">';
        
        // Header
        html += '<div class="cart-modal-header">';
        html += '<i class="fa fa-shopping-cart"></i>';
        html += '<span>Adding to Cart</span>';
        html += '</div>';
        
        // Items list
        html += '<div class="cart-items-list">';
        items.forEach(function(item, index) {
            var productName = item.product || item.Product || item.name || 'Product';
            var quantity = item.quantity || item.Quantity || 1;
            
            html += '<div class="cart-item-row" data-index="' + index + '">';
            html += '<span class="item-name">' + productName + '</span>';
            html += '<span class="item-quantity">×' + quantity + '</span>';
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
        
        // Append directly to body
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Force positioning
        var cartModal = document.querySelector('.elevenlabs-cart-modal');
        if (cartModal) {
            cartModal.style.position = 'fixed';
            cartModal.style.bottom = '120px';
            cartModal.style.right = '20px';
            cartModal.style.zIndex = '999999';
        }
        
        // Animate items one by one
        setTimeout(function() {
            var items = document.querySelectorAll('.elevenlabs-cart-modal .cart-item-row');
            var progressBar = document.querySelector('.elevenlabs-cart-modal .progress-bar');
            var totalItems = items.length;
            var currentItem = 0;
            
            function animateNextItem() {
                if (currentItem < totalItems) {
                    var item = items[currentItem];
                    item.classList.add('processing');
                    
                    // Update progress
                    var progress = ((currentItem + 1) / totalItems) * 100;
                    if (progressBar) {
                        progressBar.style.width = progress + '%';
                    }
                    
                    setTimeout(function() {
                        item.classList.remove('processing');
                        item.classList.add('completed');
                        var statusIcon = item.querySelector('.item-status');
                        if (statusIcon) {
                            statusIcon.innerHTML = '<i class="fa fa-check"></i>';
                        }
                        
                        currentItem++;
                        
                        if (currentItem < totalItems) {
                            setTimeout(animateNextItem, 400);
                        } else {
                            // All items processed
                            setTimeout(function() {
                                var header = document.querySelector('.elevenlabs-cart-modal .cart-modal-header span');
                                if (header) {
                                    header.textContent = 'Added to Cart!';
                                }
                                var headerIcon = document.querySelector('.elevenlabs-cart-modal .cart-modal-header i');
                                if (headerIcon) {
                                    headerIcon.className = 'fa fa-check-circle';
                                }
                                
                                setTimeout(function() {
                                    var modal = document.querySelector('.elevenlabs-cart-modal');
                                    if (modal) {
                                        modal.style.opacity = '0';
                                        setTimeout(function() {
                                            modal.remove();
                                        }, 300);
                                    }
                                }, 2000);
                            }, 300);
                        }
                    }, 600);
                }
            }
            
            animateNextItem();
        }, 300);
    }
    
    function addItemsToOdooCart(items) {
        // Prepare items for API
        var cartItems = items.map(function(item) {
            return {
                sku: item.sku || item.SKU || item.product || item.Product || 'DEFAULT',
                product_id: item.id || item.product_id || null,
                product_name: item.product || item.Product || item.name || '',
                quantity: item.quantity || item.Quantity || 1
            };
        });
        
        // Call Odoo cart API
        fetch('/api/elevenlabs/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    items: cartItems
                },
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.result && data.result.success) {
                console.log('Items added to cart:', data.result);
                
                // Update cart counter if exists
                if (data.result.cart_quantity !== undefined) {
                    var cartCounter = document.querySelector('.my_cart_quantity');
                    if (cartCounter) {
                        cartCounter.textContent = data.result.cart_quantity;
                    }
                }
            } else {
                console.error('Failed to add items to cart:', data);
            }
        })
        .catch(function(error) {
            console.error('Error adding items to cart:', error);
        });
    }
    
    function addSingleItemToCart(sku, productName, productId, quantity, callback) {
        fetch('/api/elevenlabs/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    items: [{
                        sku: sku,
                        product_id: productId,
                        product_name: productName,
                        quantity: quantity
                    }]
                },
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.result && data.result.success) {
                // Update cart counter
                if (data.result.cart_quantity !== undefined) {
                    var cartCounter = document.querySelector('.my_cart_quantity');
                    if (cartCounter) {
                        cartCounter.textContent = data.result.cart_quantity;
                    }
                }
                callback(true);
            } else {
                callback(false);
            }
        })
        .catch(function() {
            callback(false);
        });
    }
    
    function handleSearchProducts(params) {
        var query = params.query || params.Query || params.search || '';
        
        if (!query) {
            console.error('No search query provided');
            return;
        }
        
        // Call search API
        fetch('/api/elevenlabs/products/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    query: query,
                    limit: 6
                },
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.result && data.result.success && data.result.products) {
                handleShowProductCard({products: data.result.products});
            }
        })
        .catch(function(error) {
            console.error('Search failed:', error);
        });
    }
    
    function handleCartCheckout() {
        console.log('Initiating cart checkout...');
        
        // Show loading indicator
        var loadingModal = document.createElement('div');
        loadingModal.className = 'elevenlabs-checkout-loading';
        loadingModal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 999999;';
        loadingModal.innerHTML = '<div style="text-align: center;"><i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i><p style="margin-top: 10px;">Proceeding to checkout...</p></div>';
        document.body.appendChild(loadingModal);
        
        // Call the checkout API
        fetch('/api/elevenlabs/cart/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {},
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // Remove loading modal
            if (loadingModal && loadingModal.parentNode) {
                loadingModal.parentNode.removeChild(loadingModal);
            }
            
            if (data.result && data.result.success && data.result.checkout_url) {
                console.log('Redirecting to checkout:', data.result.checkout_url);
                // Redirect to checkout page
                window.location.href = data.result.checkout_url;
            } else {
                // Show error message
                var errorMsg = data.result ? data.result.error : 'Failed to initiate checkout';
                console.error('Checkout failed:', errorMsg);
                
                // Show error modal
                var errorModal = document.createElement('div');
                errorModal.className = 'elevenlabs-checkout-error';
                errorModal.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #ef4444; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 999999;';
                errorModal.innerHTML = '<div style="display: flex; align-items: center; gap: 10px;"><i class="fa fa-exclamation-circle"></i><span>' + errorMsg + '</span></div>';
                document.body.appendChild(errorModal);
                
                // Auto-remove error after 5 seconds
                setTimeout(function() {
                    if (errorModal && errorModal.parentNode) {
                        errorModal.parentNode.removeChild(errorModal);
                    }
                }, 5000);
            }
        })
        .catch(function(error) {
            // Remove loading modal
            if (loadingModal && loadingModal.parentNode) {
                loadingModal.parentNode.removeChild(loadingModal);
            }
            
            console.error('Checkout error:', error);
            // Show error notification
            var errorModal = document.createElement('div');
            errorModal.className = 'elevenlabs-checkout-error';
            errorModal.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #ef4444; color: white; padding: 15px 20px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); z-index: 999999;';
            errorModal.innerHTML = '<div style="display: flex; align-items: center; gap: 10px;"><i class="fa fa-exclamation-circle"></i><span>Failed to connect to checkout</span></div>';
            document.body.appendChild(errorModal);
            
            setTimeout(function() {
                if (errorModal && errorModal.parentNode) {
                    errorModal.parentNode.removeChild(errorModal);
                }
            }, 5000);
        });
    }
    
    function showDebugPanel() {
        console.log('Creating debug panel...');
        
        // Check if panel already exists
        if (document.querySelector('.elevenlabs-debug-panel')) {
            console.log('Debug panel already exists');
            return;
        }
        
        var html = '<div class="elevenlabs-debug-panel" style="position: fixed !important; width: 150px;bottom: 20px !important; right: 20px !important; z-index: 999998 !important; background: white !important; border: 1px solid #e5e7eb !important; border-radius: 12px !important; padding: 12px !important; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important; max-height: 80vh; overflow-y: auto;">';
        html += '<h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #1f2937;">🔧 Debug</h4>';
        
        // Shopping tools
        html += '<div style="margin-bottom: 10px;">';
        html += '<h5 style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280;">Shopping</h5>';
        html += '<button id="debug-show-products" class="btn btn-sm btn-secondary" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">Products</button>';
        html += '<button id="debug-add-cart" class="btn btn-sm btn-primary" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Cart</button>';
        html += '<button id="debug-search" class="btn btn-sm btn-info" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #06b6d4; color: white; border: none; border-radius: 4px; cursor: pointer;">Search</button>';
        html += '<button id="debug-product-details" class="btn btn-sm" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer;">Product Details</button>';
        html += '</div>';
        
        // Checkout tools
        html += '<div style="margin-bottom: 10px;">';
        html += '<h5 style="margin: 0 0 5px 0; font-size: 11px; color: #6b7280;">Checkout</h5>';
        html += '<button id="debug-shipping" class="btn btn-sm" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #f59e0b; color: white; border: none; border-radius: 4px; cursor: pointer;">Shipping Info</button>';
        html += '<button id="debug-billing" class="btn btn-sm" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #ec4899; color: white; border: none; border-radius: 4px; cursor: pointer;">Billing Info</button>';
        html += '<button id="debug-shipping-method" class="btn btn-sm" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #14b8a6; color: white; border: none; border-radius: 4px; cursor: pointer;">Ship Method</button>';
        html += '<button id="debug-review" class="btn btn-sm" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #84cc16; color: white; border: none; border-radius: 4px; cursor: pointer;">Review Order</button>';
        html += '<button id="debug-place-order" class="btn btn-sm" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Place Order</button>';
        html += '<button id="debug-checkout" class="btn btn-sm btn-success" style="display: block; width: 100%; padding: 5px 10px; font-size: 11px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">Quick Checkout</button>';
        html += '</div>';
        
        html += '</div>';
        
        document.body.insertAdjacentHTML('beforeend', html);
        console.log('Debug panel created');
        
        // Force positioning
        var debugPanel = document.querySelector('.elevenlabs-debug-panel');
        if (debugPanel) {
            debugPanel.style.position = 'fixed';
            debugPanel.style.bottom = '20px';
            debugPanel.style.right = '20px';
            debugPanel.style.zIndex = '999998';
        }
        
        // Bind debug events - Test with the exact format the agent sends (array directly)
        document.getElementById('debug-show-products').addEventListener('click', function() {
            console.log('Test Product Cards clicked');
            // Simulate the exact format from the agent (array directly)
            handleShowProductCard([
                {
                    Name: 'Conference Chair',
                    Price: '33.00',
                    Image: 'https://odoo.local/web/image/product.template/19/image_128'
                },
                {
                    Name: 'Apple MacBook Air 13-inch M2 (2024)',
                    Price: '1099.00',
                    Image: 'https://istorm.com.cy/cdn/shop/files/IMG-12445963_8be2ff74-e27d-4dd4-86ee-b760eea37f4a.jpg?v=1739301624'
                },
                {
                    Name: 'Samsung Galaxy S24 Ultra',
                    Price: '1299.99',
                    Image: 'https://images.samsung.com/is/image/samsung/assets/us/smartphones/07172025/Galaxy_A_Series_Hub-FT12-1-A56_5g-pc.jpg'
                },
                {
                    Name: "Nike Air Force 1 '07",
                    Price: '110.00',
                    Image: 'https://static.nike.com/a/images/t_default/cd7b9860-0e91-4a4a-a3cf-e3b3d22f4988/air-force-1-07-shoes-WrLlWX.png'
                }
            ]);
        });
        
        document.getElementById('debug-add-cart').addEventListener('click', function() {
            console.log('Test Add to Cart clicked');
            // Test with more realistic product names
            handleAddToCart([
                {Product: 'Conference Chair', Quantity: 1},
                {Product: 'Three-Seat Sofa', Quantity: 2},
                {Product: 'Samsung Galaxy Buds', Quantity: 1}
            ]);
        });
        
        document.getElementById('debug-search').addEventListener('click', function() {
            showInputDialog('Enter search query:', '', function(query) {
                if (query) {
                    handleSearchProducts({query: query});
                }
            });
        });
        
        document.getElementById('debug-checkout').addEventListener('click', function() {
            console.log('Test Checkout clicked');
            handleCartCheckout();
        });
        
        // New debug buttons
        document.getElementById('debug-shipping').addEventListener('click', function() {
            console.log('Test Shipping Info clicked');
            handleCollectShippingInfo({
                name: 'John Doe',
                street: '123 Main Street',
                street2: 'Apt 4B',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'United States',
                phone: '555-1234'
            });
        });
        
        document.getElementById('debug-billing').addEventListener('click', function() {
            console.log('Test Billing Info clicked');
            handleCollectBillingInfo({same_as_shipping: true});
        });
        
        document.getElementById('debug-shipping-method').addEventListener('click', function() {
            console.log('Test Shipping Method clicked');
            handleSelectShippingMethod({method: 'express'});
        });
        
        document.getElementById('debug-review').addEventListener('click', function() {
            console.log('Test Review Order clicked');
            handleReviewOrder();
        });
        
        document.getElementById('debug-place-order').addEventListener('click', function() {
            console.log('Test Place Order clicked');
            showConfirmDialog('Place Order', 'Are you sure you want to place this test order?', function() {
                handlePlaceOrder({confirm: true, notes: 'Test order from debug panel'});
            });
        });
        
        document.getElementById('debug-product-details').addEventListener('click', function() {
            console.log('Test Product Details clicked');
            showInputDialog('Enter product ID:', '1', function(productId) {
                if (productId) {
                    handleDisplayProductDetails({product_id: parseInt(productId)});
                }
            });
        });
    }
    
    // HTML Dialog Helper Functions
    window.showInputDialog = function(title, defaultValue, callback) {
        var modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999999; display: flex; align-items: center; justify-content: center;';
        
        var dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; padding: 24px; min-width: 300px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);';
        
        dialog.innerHTML = '<h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">' + title + '</h3>';
        dialog.innerHTML += '<input type="text" id="dialog-input" value="' + (defaultValue || '') + '" style="width: 100%; padding: 10px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; box-sizing: border-box;">';
        dialog.innerHTML += '<div style="display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end;">';
        dialog.innerHTML += '<button onclick="this.closest(\'div\').parentElement.parentElement.remove()" style="padding: 8px 16px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>';
        dialog.innerHTML += '<button id="dialog-confirm" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">OK</button>';
        dialog.innerHTML += '</div>';
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Focus input and select text
        var input = document.getElementById('dialog-input');
        input.focus();
        input.select();
        
        // Handle enter key
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                var value = input.value;
                modal.remove();
                if (callback) callback(value);
            }
        });
        
        // Handle OK button
        document.getElementById('dialog-confirm').addEventListener('click', function() {
            var value = document.getElementById('dialog-input').value;
            modal.remove();
            if (callback) callback(value);
        });
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };
    
    window.showConfirmDialog = function(title, message, onConfirm, onCancel) {
        var modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999999; display: flex; align-items: center; justify-content: center;';
        
        var dialog = document.createElement('div');
        dialog.style.cssText = 'background: white; border-radius: 12px; padding: 24px; max-width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);';
        
        dialog.innerHTML = '<h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">' + title + '</h3>';
        dialog.innerHTML += '<p style="margin: 0 0 20px 0; color: #4b5563; line-height: 1.5;">' + message + '</p>';
        dialog.innerHTML += '<div style="display: flex; gap: 10px; justify-content: flex-end;">';
        dialog.innerHTML += '<button id="dialog-cancel" style="padding: 8px 20px; background: #e5e7eb; color: #374151; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancel</button>';
        dialog.innerHTML += '<button id="dialog-confirm" style="padding: 8px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Confirm</button>';
        dialog.innerHTML += '</div>';
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Handle confirm button
        document.getElementById('dialog-confirm').addEventListener('click', function() {
            modal.remove();
            if (onConfirm) onConfirm();
        });
        
        // Handle cancel button
        document.getElementById('dialog-cancel').addEventListener('click', function() {
            modal.remove();
            if (onCancel) onCancel();
        });
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
                if (onCancel) onCancel();
            }
        });
    };
})();