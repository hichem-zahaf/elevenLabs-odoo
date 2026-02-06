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

    function initializeTriggerSystem(
        agentId,
        triggerDelay,
        triggerOnScroll,
        triggerOnTime,
        triggerOnExitIntent,
        enableShowProductCard,
        enableAddToCart,
        enableSearchProducts
    ) {
        var widgetCreated = false;

        // Function to create the widget and prevent further triggers
        function createWidgetOnce() {
            if (!widgetCreated) {
                widgetCreated = true;
                createWidget(
                    agentId,
                    enableShowProductCard,
                    enableAddToCart,
                    enableSearchProducts
                );

                // Clean up all event listeners after widget is created
                if (typeof handleScroll === 'function') {
                    window.removeEventListener('scroll', handleScroll);
                }
                if (typeof handleMouseMove === 'function') {
                    document.removeEventListener('mousemove', handleMouseMove, true);
                }
                if (typeof handleMouseOut === 'function') {
                    document.removeEventListener('mouseout', handleMouseOut, true);
                }
            }
        }

        // Trigger on delay
        if (triggerDelay > 0) {
            console.log('Starting ElevenLabs agent with delay of ' + triggerDelay + ' seconds');
            setTimeout(createWidgetOnce, triggerDelay * 1000);
        }

        // Trigger on scroll
        if (triggerOnScroll > 0) {
            var handleScroll = function() {
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                var scrollPercent = (scrollTop / docHeight) * 100;

                if (scrollPercent >= triggerOnScroll) {
                    console.log('Triggering widget on scroll: ' + scrollPercent.toFixed(2) + '%');
                    createWidgetOnce();
                }
            };

            window.addEventListener('scroll', handleScroll);
        }

        // Trigger on time
        if (triggerOnTime > 0) {
            var timeSpent = 0;
            var timerInterval = setInterval(function() {
                timeSpent += 1;
                if (timeSpent >= triggerOnTime) {
                    console.log('Triggering widget after ' + triggerOnTime + ' seconds on page');
                    clearInterval(timerInterval);
                    createWidgetOnce();
                }
            }, 1000);

        }

        // Trigger on exit intent
        if (triggerOnExitIntent) {
            var exitIntentTriggered = false;
            var handleMouseOut = function(e) {
                if (exitIntentTriggered || widgetCreated) return;

                e = e ? e : window.event;
                var from = e.relatedTarget || e.toElement;

                // Check if mouse is leaving the browser window
                if (!from || from.nodeName === "HTML") {
                    console.log('Exit intent detected - mouse leaving window');
                    exitIntentTriggered = true;
                    createWidgetOnce();
                }
            };

            var handleMouseMove = function(e) {
                // Check if mouse is moving toward the top of the screen (possible tab closing)
                if (exitIntentTriggered || widgetCreated) return;

                if (e.clientY < 50) {  // Within top 50 pixels
                    console.log('Exit intent detected - mouse near top of screen');
                    exitIntentTriggered = true;
                    createWidgetOnce();
                }
            };

            // Add event listeners for exit intent
            document.addEventListener('mouseout', handleMouseOut, true);
            document.addEventListener('mousemove', handleMouseMove, true);
        }

        // If no triggers are configured, create widget immediately
        if (triggerDelay === 0 && triggerOnScroll === 0 && triggerOnTime === 0 && !triggerOnExitIntent) {
            console.log('No triggers configured, creating widget immediately');
            createWidgetOnce();
        }
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
            logAllSettings(container);  // Log all settings when debug=1
            showDebugPanel();
        }

        // Get configuration from data attributes
        var agentId = container.dataset.agentId;
        var enabled = container.dataset.enabled === 'true';

        // Trigger options
        var triggerDelay = parseInt(container.dataset.triggerDelay) || 0;
        var triggerOnScroll = parseFloat(container.dataset.triggerOnScroll) || 0;
        var triggerOnTime = parseInt(container.dataset.triggerOnTime) || 0;
        var triggerOnExitIntent = container.dataset.triggerOnExitIntent === 'true';
        var showFirstTimeVisitorsOnly = container.dataset.showFirstTimeVisitorsOnly === 'true';

        // Integration controls
        var enableShowProductCard = container.dataset.enableShowProductCard === 'true';
        var enableAddToCart = container.dataset.enableAddToCart === 'true';
        var enableSearchProducts = container.dataset.enableSearchProducts === 'true';
        var cartIntegrationMethod = container.dataset.cartIntegrationMethod || 'direct_add';

        // Targeting controls
        var geographicRestrictions = container.dataset.geographicRestrictions || null;
        var deviceFiltering = container.dataset.deviceFiltering || 'all';
        var customerSegmentTargeting = container.dataset.customerSegmentTargeting || 'all';
        var excludeLoggedInUsers = container.dataset.excludeLoggedInUsers === 'true';

        // Session controls
        var maxMessagesPerSession = parseInt(container.dataset.maxMessagesPerSession) || 0;
        var conversationHistoryRetention = parseInt(container.dataset.conversationHistoryRetention) || 24;
        var autoEndInactiveConversations = container.dataset.autoEndInactiveConversations === 'true';
        var saveUserInfo = container.dataset.saveUserInfo === 'true';
        var enableConversationLogging = container.dataset.enableConversationLogging === 'true';
        var dailyUsageLimit = parseInt(container.dataset.dailyUsageLimit) || 0;

        // Product integration
        var productCategoriesInclude = container.dataset.productCategoriesInclude || null;
        var productCategoriesExclude = container.dataset.productCategoriesExclude || null;
        var featuredProductsPriority = container.dataset.featuredProductsPriority || null;
        var outOfStockHandling = container.dataset.outOfStockHandling || 'hide';

        // Page visibility controls
        var pagesToShow = container.dataset.pagesToShow || null;
        var pagesToHide = container.dataset.pagesToHide || null;

        // Try to get user information from the container data attributes first
        var userId = container.dataset.userId || undefined;
        var userName = container.dataset.userName || undefined;
        var userLogin = container.dataset.userLogin || undefined;
        var userEmail = container.dataset.userEmail || undefined;
        var userIsPublicStr = container.dataset.userIsPublic;
        var userIsAdminStr = container.dataset.userIsAdmin;

        // If user data is not available from the template, try to get it from Odoo session
        if (!userId || userId === '0' || userId === 'undefined') {
            // Check if we can access Odoo session information
            if (typeof odoo !== 'undefined' && odoo.session_info) {
                userId = odoo.session_info.uid || '0';
                userName = odoo.session_info.name || undefined;
                userLogin = odoo.session_info.username || undefined;

                // For email, we might need to make an RPC call to get user details
                userEmail = odoo.session_info.user_email || undefined;
            } else if (window.sessionStorage && sessionStorage.getItem('uid')) {
                // Fallback to session storage if available
                userId = sessionStorage.getItem('uid');
                userName = sessionStorage.getItem('name') || undefined;
                userLogin = sessionStorage.getItem('username') || undefined;
                userEmail = sessionStorage.getItem('user_email') || undefined;
            } else if (window.localStorage && localStorage.getItem('uid')) {
                // Fallback to local storage if available
                userId = localStorage.getItem('uid');
                userName = localStorage.getItem('name') || undefined;
                userLogin = localStorage.getItem('username') || undefined;
                userEmail = localStorage.getItem('user_email') || undefined;
            }
        }

        // Determine if user is public based on user ID or explicit flag
        var userIsPublic = (userIsPublicStr ? userIsPublicStr === 'True' : userId == '0' || userId == 'public' || !userId);
        var userIsAdmin = userIsAdminStr ? userIsAdminStr === 'True' : false;

        // Log user details separately if user is logged in (not public)
        if (!userIsPublic && userId && userId !== '0' && userId !== 'undefined' && userId != null) {
            console.log('=== Logged User Details ===');
            console.log('User ID:', userId);
            console.log('User Name:', userName);
            console.log('User Login:', userLogin);
            console.log('User Email:', userEmail);
            console.log('Is Admin:', userIsAdmin);
            console.log('=========================');
        } else {
            console.log('User is a public visitor');
            console.log('Raw userIsPublic value:', userIsPublicStr);
            console.log('Raw userId value:', userId);
            console.log('Odoo session info available:', typeof odoo !== 'undefined' && odoo.session_info);
        }

        // Check if widget should be shown based on page visibility
        if (!_shouldShowOnCurrentPage(pagesToShow, pagesToHide)) {
            console.log('ElevenLabs agent is not configured for this page');
            return;
        }

        // Check geographic restrictions
        if (!_passesGeographicRestrictions(geographicRestrictions)) {
            console.log('ElevenLabs agent is restricted by geographic settings');
            return;
        }

        // Check device filtering
        if (!_passesDeviceFiltering(deviceFiltering)) {
            console.log('ElevenLabs agent is restricted by device filtering');
            return;
        }

        // Check if logged-in users should be excluded
        if (excludeLoggedInUsers && !userIsPublic && userId && userId !== '0' && userId !== 'undefined' && userId != null) {
            console.log('ElevenLabs agent is excluded for logged-in users');
            return;
        }

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

        // Initialize trigger system
        initializeTriggerSystem(
            agentId,
            triggerDelay,
            triggerOnScroll,
            triggerOnTime,
            triggerOnExitIntent,
            enableShowProductCard,
            enableAddToCart,
            enableSearchProducts
        );
    }

    // Function to log all settings when debug=1 is present in the URL
    function logAllSettings(container) {
        var settings = {
            agentId: container.dataset.agentId || 'Not set',
            enabled: container.dataset.enabled === 'true',
            triggerDelay: parseInt(container.dataset.triggerDelay) || 0,
            triggerOnScroll: parseFloat(container.dataset.triggerOnScroll) || 0,
            triggerOnTime: parseInt(container.dataset.triggerOnTime) || 0,
            triggerOnExitIntent: container.dataset.triggerOnExitIntent === 'true',
            showFirstTimeVisitorsOnly: container.dataset.showFirstTimeVisitorsOnly === 'true',
            enableShowProductCard: container.dataset.enableShowProductCard === 'true',
            enableAddToCart: container.dataset.enableAddToCart === 'true',
            enableSearchProducts: container.dataset.enableSearchProducts === 'true',
            cartIntegrationMethod: container.dataset.cartIntegrationMethod || 'direct_add',
            geographicRestrictions: container.dataset.geographicRestrictions || null,
            deviceFiltering: container.dataset.deviceFiltering || 'all',
            customerSegmentTargeting: container.dataset.customerSegmentTargeting || 'all',
            excludeLoggedInUsers: container.dataset.excludeLoggedInUsers === 'true',
            maxMessagesPerSession: parseInt(container.dataset.maxMessagesPerSession) || 0,
            conversationHistoryRetention: parseInt(container.dataset.conversationHistoryRetention) || 24,
            autoEndInactiveConversations: container.dataset.autoEndInactiveConversations === 'true',
            saveUserInfo: container.dataset.saveUserInfo === 'true',
            enableConversationLogging: container.dataset.enableConversationLogging === 'true',
            dailyUsageLimit: parseInt(container.dataset.dailyUsageLimit) || 0,
            productCategoriesInclude: container.dataset.productCategoriesInclude || null,
            productCategoriesExclude: container.dataset.productCategoriesExclude || null,
            featuredProductsPriority: container.dataset.featuredProductsPriority || null,
            outOfStockHandling: container.dataset.outOfStockHandling || 'hide',
            pagesToShow: container.dataset.pagesToShow || null,
            pagesToHide: container.dataset.pagesToHide || null,
            currentPage: _getCurrentPageType(),
            shouldShowOnCurrentPage: _shouldShowOnCurrentPage(
                container.dataset.pagesToShow || null,
                container.dataset.pagesToHide || null
            ),
            userAgent: navigator.userAgent,
            url: window.location.href,
            // User information
            userId: container.dataset.userId || 'Not set',
            userName: container.dataset.userName || 'Not set',
            userLogin: container.dataset.userLogin || 'Not set',
            userEmail: container.dataset.userEmail || 'Not set',
            userIsPublic: container.dataset.userIsPublic === 'true',
            userIsAdmin: container.dataset.userIsAdmin === 'true',
            rawUserIsPublic: container.dataset.userIsPublic,  // For debugging
            rawUserIsPublicType: typeof container.dataset.userIsPublic,  // For debugging
            rawUserIsAdmin: container.dataset.userIsAdmin,     // For debugging
            rawUserIsAdminType: typeof container.dataset.userIsAdmin     // For debugging
        };

        console.log('=== ElevenLabs Module Settings ===');
        console.table(settings);
        console.log('==================================');
    }

    function createWidget(
        agentId,
        enableShowProductCard,
        enableAddToCart,
        enableSearchProducts
    ) {
        // Create the elevenlabs-convai element
        var widgetElement = document.createElement('elevenlabs-convai');
        widgetElement.setAttribute('agent-id', agentId);

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
                    registerClientTools(enableShowProductCard, enableAddToCart, enableSearchProducts);
                }, 500);
            };

            document.head.appendChild(script);
        } else {
            // Script already loaded, register tools
            registerClientTools(enableShowProductCard, enableAddToCart, enableSearchProducts);
        }
    }
    
    function registerClientTools(enableShowProductCard, enableAddToCart, enableSearchProducts) {
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
                event.detail.config.clientTools = {};

                // Conditionally register tools based on settings
                if (enableShowProductCard) {
                    event.detail.config.clientTools.showProductCard = function(params) {
                        console.log('showProductCard called with:', params);
                        handleShowProductCard(params);
                    };
                }

                if (enableAddToCart) {
                    event.detail.config.clientTools.addToCart = function(params) {
                        console.log('addToCart called with:', params);
                        handleAddToCart(params);
                    };
                }

                if (enableSearchProducts) {
                    event.detail.config.clientTools.searchProducts = function(params) {
                        console.log('searchProducts called with:', params);
                        handleSearchProducts(params);
                    };
                }

                // Product details tool
                event.detail.config.clientTools.displayProductDetails = function(params) {
                    console.log('displayProductDetails called with:', params);
                    handleDisplayProductDetails(params);
                };
            }
        });

        console.log('xx ElevenLabs client tools registered xx');
    }

    function _shouldShowOnCurrentPage(pagesToShow, pagesToHide) {
        var currentPage = _getCurrentPageType();

        // Check if current page is in the excluded pages list
        if (pagesToHide) {
            var excludedPages = pagesToHide.split(',').map(page => page.trim()).filter(page => page !== '');
            if (excludedPages.length > 0 && excludedPages.includes(currentPage)) {
                return false;
            }
        }

        // If no pages to show are set, show on all pages except excluded ones
        if (!pagesToShow || pagesToShow.trim() === '') {
            return true;
        }

        // If pages to show are specified, only show on those pages (unless also in exclude list)
        var allowedPages = pagesToShow.split(',').map(page => page.trim()).filter(page => page !== '');
        if (allowedPages.length > 0 && allowedPages.includes(currentPage)) {
            return true;
        }

        return false;
    }

    function _getCurrentPageType() {
        var pathname = window.location.pathname;

        if (pathname === '/') {
            return 'homepage';
        } else {
            // Extract the first path segment after the domain
            // For example: /shop?debug=1 -> shop, /settings/app/1 -> settings
            var pathSegments = pathname.split('/').filter(segment => segment !== '');
            return pathSegments.length > 0 ? pathSegments[0] : 'other';
        }
    }

    function _passesGeographicRestrictions(geographicRestrictions) {
        // If no geographic restrictions are set, allow everywhere
        if (!geographicRestrictions) {
            return true;
        }

        // Note: Actual IP geolocation would require a service
        // For now, we'll return true and assume server-side checks
        return true;
    }

    function _passesDeviceFiltering(deviceFiltering) {
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        switch(deviceFiltering) {
            case 'desktop':
                return !isMobile;
            case 'mobile':
                return isMobile;
            case 'all':
            default:
                return true;
        }
    }

    function _isLoggedIn() {
        // Check if user is logged in - this would typically check for Odoo session
        // For now, we'll check for a common Odoo login indicator
        return document.querySelector('.o_logged') !== null || document.cookie.indexOf('session_id') !== -1;
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
                    Image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3n6eQDN5Oier0k7awpW0P_LlK6-h5zkV2pA&s'
                },
                {
                    Name: "Nike Air Force 1 '07",
                    Price: '110.00',
                    Image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlwZOIC0KtctPULH2EA8G6dg-qFqw8YhQH0Q&s'
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
        dialog.innerHTML += '<button id="dialog-confirm" style="padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 8px;">OK</button>';
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
        dialog.innerHTML += '<button id="dialog-confirm" style="padding: 8px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; margin-left: 8px;">Confirm</button>';
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