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
        enableSearchProducts,
        userId,
        publicUserId,
        maxMessagesPerConversation,
        dailyUsageLimit,
        globalUsageLimit,
        userIsPublic
    ) {
        var widgetCreated = false;
        var usageCheckInProgress = false;

        // Function to check usage limits before creating widget
        function checkUsageAndCreateWidget() {
            if (widgetCreated || usageCheckInProgress) {
                return;
            }

            usageCheckInProgress = true;

            // Check if limits are configured
            var hasDailyLimit = dailyUsageLimit > 0;
            var hasGlobalLimit = globalUsageLimit > 0;

            // If no limits are set, create widget immediately
            if (!hasDailyLimit && !hasGlobalLimit) {
                console.log('No usage limits configured, creating widget');
                createWidgetOnce();
                usageCheckInProgress = false;
                return;
            }

            console.log('Checking usage limits... daily:', dailyUsageLimit, 'global:', globalUsageLimit);

            // Check usage limits
            checkUsageLimits(userId, publicUserId)
                .then(function(result) {
                    usageCheckInProgress = false;

                    if (!result.success) {
                        console.error('Usage check failed:', result.error);
                        // If check fails, show error and don't create widget
                        showToast(
                            'Unable to Start Session',
                            'We couldn\'t verify your usage limits. Please try again later.',
                            'error'
                        );
                        return;
                    }

                    if (!result.allowed) {
                        console.warn('Usage limits exceeded:', result.reason);
                        showToast(
                            'Usage Limit Reached',
                            result.reason || 'You have reached the maximum number of messages allowed.',
                            'warning'
                        );
                        return;
                    }

                    // Update publicUserId if it was returned by the backend
                    if (result.public_user_id && !publicUserId) {
                        publicUserId = result.public_user_id;
                        console.log('Public user ID from backend:', publicUserId);
                    }

                    console.log('Usage limits check passed. Daily remaining:', result.daily_limit.remaining, 'Global remaining:', result.global_limit.remaining);
                    createWidgetOnce();
                })
                .catch(function(error) {
                    usageCheckInProgress = false;
                    console.error('Usage check error:', error);
                    showToast(
                        'Connection Error',
                        'Unable to connect to the server. Please check your internet connection.',
                        'error'
                    );
                });
        }

        // Function to create the widget and prevent further triggers
        function createWidgetOnce() {
            if (!widgetCreated) {
                widgetCreated = true;
                createWidget(
                    agentId,
                    enableShowProductCard,
                    enableSearchProducts,
                    userId,
                    publicUserId,
                    maxMessagesPerConversation
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
            setTimeout(checkUsageAndCreateWidget, triggerDelay * 1000);
        }

        // Trigger on scroll
        if (triggerOnScroll > 0) {
            var handleScroll = function() {
                var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                var scrollPercent = (scrollTop / docHeight) * 100;

                if (scrollPercent >= triggerOnScroll) {
                    console.log('Triggering widget on scroll: ' + scrollPercent.toFixed(2) + '%');
                    checkUsageAndCreateWidget();
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
                    checkUsageAndCreateWidget();
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
                    checkUsageAndCreateWidget();
                }
            };

            var handleMouseMove = function(e) {
                // Check if mouse is moving toward the top of the screen (possible tab closing)
                if (exitIntentTriggered || widgetCreated) return;

                if (e.clientY < 50) {  // Within top 50 pixels
                    console.log('Exit intent detected - mouse near top of screen');
                    exitIntentTriggered = true;
                    checkUsageAndCreateWidget();
                }
            };

            // Add event listeners for exit intent
            document.addEventListener('mouseout', handleMouseOut, true);
            document.addEventListener('mousemove', handleMouseMove, true);
        }

        // If no triggers are configured, create widget immediately
        if (triggerDelay === 0 && triggerOnScroll === 0 && triggerOnTime === 0 && !triggerOnExitIntent) {
            console.log('No triggers configured, checking usage and creating widget');
            checkUsageAndCreateWidget();
        }
    }

    function applyTheme(themeType, primaryColor, secondaryColor) {
        // Use colors directly, fall back to defaults if not provided
        primaryColor = primaryColor || '#667eea';
        secondaryColor = secondaryColor || '#764ba2';

        console.log('=== ElevenLabs Theme Application ===');
        console.log('Theme Type:', themeType);
        console.log('Primary Color:', primaryColor);
        console.log('Secondary Color:', secondaryColor);

        // Create or update style element for theme variables
        var themeStyleId = 'elevenlabs-theme-vars';
        var themeStyle = document.getElementById(themeStyleId);

        if (!themeStyle) {
            themeStyle = document.createElement('style');
            themeStyle.id = themeStyleId;
            // Append to end of head to ensure it loads AFTER all other CSS
            document.head.appendChild(themeStyle);
        }

        // Define theme CSS variables (no defaults in CSS file, so these will always take effect)
        var cssVars = ':root {\n';
        cssVars += '--el-primary-color: ' + primaryColor + ';\n';
        cssVars += '--el-secondary-color: ' + secondaryColor + ';\n';

        if (themeType === 'dark') {
            cssVars += '--el-bg-color: #1a1a1a;\n';
            cssVars += '--el-card-bg: #2a2a2a;\n';
            cssVars += '--el-text-color: #f0f0f0;\n';
            cssVars += '--el-text-muted: #a0a0a0;\n';
            cssVars += '--el-border-color: #333;\n';
            cssVars += '--el-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);\n';
        } else {
            cssVars += '--el-bg-color: #ffffff;\n';
            cssVars += '--el-card-bg: #ffffff;\n';
            cssVars += '--el-text-color: #2c3e50;\n';
            cssVars += '--el-text-muted: #7f8c8d;\n';
            cssVars += '--el-border-color: #e5e7eb;\n';
            cssVars += '--el-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);\n';
        }

        cssVars += '}';

        themeStyle.textContent = cssVars;

        console.log('CSS Variables set:', cssVars);

        // Apply theme class to body for dark mode
        if (themeType === 'dark') {
            document.body.classList.add('elevenlabs-dark-theme');
            console.log('Dark theme class added to body');
        } else {
            document.body.classList.remove('elevenlabs-dark-theme');
            console.log('Dark theme class removed from body');
        }

        // Wait a tick for CSS to apply, then verify
        setTimeout(function() {
            console.log('Computed --el-primary-color:', getComputedStyle(document.documentElement).getPropertyValue('--el-primary-color'));
            console.log('Computed --el-card-bg:', getComputedStyle(document.documentElement).getPropertyValue('--el-card-bg'));
            console.log('====================================');
        }, 10);
    }

    // ============================================================
    // USAGE TRACKING AND RATE LIMITING FUNCTIONS
    // ============================================================

    // Global variables for usage tracking
    var elevenlabsSessionId = null;
    var elevenlabsUserId = null;
    var elevenlabsPublicUserId = null;
    var elevenlabsMaxMessagesPerConversation = 0;
    var elevenlabsSessionMessageCount = 0;

    /**
     * Check usage limits before creating the widget
     * Returns a promise that resolves with the check result
     */
    function checkUsageLimits(userId, publicUserId) {
        return fetch('/api/elevenlabs/usage/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    user_id: userId,
                    public_user_id: publicUserId
                },
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.result) {
                return data.result;
            }
            return { success: false, allowed: false, error: 'Invalid response' };
        })
        .catch(function(error) {
            console.error('Usage check failed:', error);
            // Fail closed - if check fails, don't allow widget
            return { success: false, allowed: false, error: error.message };
        });
    }

    /**
     * Start a new usage session when conversation is initiated
     */
    function startUsageSession(sessionId, userId, publicUserId) {
        elevenlabsSessionId = sessionId;
        elevenlabsUserId = userId;
        elevenlabsPublicUserId = publicUserId;
        elevenlabsSessionMessageCount = 0;

        return fetch('/api/elevenlabs/usage/session/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    session_id: sessionId,
                    user_id: userId,
                    public_user_id: publicUserId,
                    user_agent: navigator.userAgent,
                    referrer: document.referrer
                },
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.result && data.result.success) {
                console.log('Usage session started:', data.result);
                return data.result;
            }
            console.error('Failed to start usage session:', data);
            return null;
        })
        .catch(function(error) {
            console.error('Session start failed:', error);
            return null;
        });
    }

    /**
     * Record a message in the current session
     */
    function recordMessage(sessionId) {
        return fetch('/api/elevenlabs/usage/message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {
                    session_id: sessionId
                },
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.result && data.result.success) {
                elevenlabsSessionMessageCount = data.result.message_count;

                // Log full response for debugging
                console.log('Message recorded. Count:', data.result.message_count, 'Limit exceeded:', data.result.limit_exceeded, 'Remaining:', data.result.remaining);

                // Check if limit exceeded
                if (data.result.limit_exceeded) {
                    handleSessionLimitExceeded(data.result);
                }

                return data.result;
            }
            return null;
        })
        .catch(function(error) {
            console.error('Message recording failed:', error);
            return null;
        });
    }

    /**
     * Handle session limit exceeded - remove widget and show toast
     */
    function handleSessionLimitExceeded(result) {
        console.warn('Session message limit exceeded:', result);

        // Remove the widget element
        var widget = document.querySelector('elevenlabs-convai');
        if (widget) {
            widget.remove();
            console.log('Widget removed due to session limit exceeded');
        }

        // Show toast notification
        showToast(
            'Message Limit Reached',
            'You have reached the maximum number of messages for this session. Please start a new conversation.',
            'warning'
        );
    }

    /**
     * Get client IP and generate public user ID
     */
    function getClientInfo() {
        return fetch('/api/elevenlabs/usage/client-ip', {
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
            if (data.result && data.result.success) {
                return data.result;
            }
            return null;
        })
        .catch(function(error) {
            console.error('Failed to get client info:', error);
            return null;
        });
    }

    /**
     * Show a toast notification
     */
    function showToast(title, message, type) {
        type = type || 'info';

        // Remove existing toast if any
        var existingToast = document.querySelector('.elevenlabs-toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast element
        var toast = document.createElement('div');
        toast.className = 'elevenlabs-toast-notification';

        var iconClass = 'fa-info-circle';
        if (type === 'warning') iconClass = 'fa-exclamation-triangle';
        if (type === 'error') iconClass = 'fa-times-circle';
        if (type === 'success') iconClass = 'fa-check-circle';

        toast.innerHTML = '' +
            '<div class="toast-content">' +
                '<i class="fa ' + iconClass + ' toast-icon"></i>' +
                '<div class="toast-message">' +
                    '<div class="toast-title">' + title + '</div>' +
                    '<div class="toast-text">' + message + '</div>' +
                '</div>' +
                '<button class="toast-close">&times;</button>' +
            '</div>';

        // Add styles if not already present
        if (!document.getElementById('elevenlabs-toast-styles')) {
            var styles = document.createElement('style');
            styles.id = 'elevenlabs-toast-styles';
            styles.textContent = '' +
                '.elevenlabs-toast-notification {' +
                    'position: fixed !important;' +
                    'bottom: 20px !important;' +
                    'right: 20px !important;' +
                    'z-index: 999999 !important;' +
                    'background: white !important;' +
                    'border-radius: 8px !important;' +
                    'box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;' +
                    'padding: 16px !important;' +
                    'min-width: 300px !important;' +
                    'max-width: 400px !important;' +
                    'animation: slideIn 0.3s ease-out !important;' +
                '}' +
                '.elevenlabs-toast-notification .toast-content {' +
                    'display: flex !important;' +
                    'align-items: flex-start !important;' +
                    'gap: 12px !important;' +
                '}' +
                '.elevenlabs-toast-notification .toast-icon {' +
                    'font-size: 20px !important;' +
                    'color: #667eea !important;' +
                    'flex-shrink: 0 !important;' +
                '}' +
                '.elevenlabs-toast-notification .toast-message {' +
                    'flex: 1 !important;' +
                '}' +
                '.elevenlabs-toast-notification .toast-title {' +
                    'font-weight: 600 !important;' +
                    'margin-bottom: 4px !important;' +
                    'color: #2c3e50 !important;' +
                '}' +
                '.elevenlabs-toast-notification .toast-text {' +
                    'font-size: 14px !important;' +
                    'color: #7f8c8d !important;' +
                    'line-height: 1.4 !important;' +
                '}' +
                '.elevenlabs-toast-notification .toast-close {' +
                    'background: none !important;' +
                    'border: none !important;' +
                    'font-size: 20px !important;' +
                    'color: #95a5a6 !important;' +
                    'cursor: pointer !important;' +
                    'padding: 0 !important;' +
                    'line-height: 1 !important;' +
                    'flex-shrink: 0 !important;' +
                '}' +
                '.elevenlabs-toast-notification .toast-close:hover {' +
                    'color: #2c3e50 !important;' +
                '}' +
                '@keyframes slideIn {' +
                    'from {' +
                        'transform: translateX(100%);' +
                        'opacity: 0;' +
                    '}' +
                    'to {' +
                        'transform: translateX(0);' +
                        'opacity: 1;' +
                    '}' +
                '}';
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(toast);

        // Add close button handler
        var closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                toast.remove();
            });
        }

        // Auto-hide after 5 seconds
        setTimeout(function() {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.3s';
                setTimeout(function() {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Setup ElevenLabs event listeners for usage tracking
     * Uses WebSocket interception to capture events
     */
    function setupElevenLabsEventListeners(userId, publicUserId, maxMessagesPerConversation) {
        elevenlabsMaxMessagesPerConversation = maxMessagesPerConversation;

        // Get the widget element
        var widget = document.querySelector('elevenlabs-convai');
        if (!widget) {
            // Set up a MutationObserver to wait for widget to appear
            setupWidgetObserver(userId, publicUserId, maxMessagesPerConversation);
            return;
        }

        // WebSocket Interception - capture all ElevenLabs events
        setupWebSocketInterception(userId, publicUserId);

        // DOM Events fallback - try various event name formats
        var eventNames = [
            'conversation_initiation_metadata',
            'user_transcript',
            'elevenlabs-convai:conversation_initiation_metadata',
            'elevenlabs-convai:user_transcript',
            'elevenlabs:conversation_initiation_metadata',
            'elevenlabs:user_transcript'
        ];

        eventNames.forEach(function(eventName) {
            widget.addEventListener(eventName, function(event) {
                handleWebSocketEvent(eventName, event, userId, publicUserId);
            });
        });
    }

    /**
     * Intercept WebSocket communication to capture ElevenLabs events
     * This is the most reliable method as it captures all WebSocket traffic
     */
    function setupWebSocketInterception(userId, publicUserId) {
        // Store original WebSocket
        var OriginalWebSocket = window.WebSocket;

        // Override WebSocket constructor
        window.WebSocket = function(url, protocols) {
            // Create the actual WebSocket
            var ws = new OriginalWebSocket(url, protocols);

            // Intercept onmessage to capture incoming events
            var originalOnMessage = ws.onmessage;
            ws.onmessage = function(event) {
                // Call original handler first
                if (originalOnMessage) {
                    originalOnMessage.call(ws, event);
                }

                // Try to parse the message
                try {
                    var data = JSON.parse(event.data);
                    // Handle ElevenLabs events silently
                    handleWebSocketEvent(data.type, data, userId, publicUserId);
                } catch (e) {
                    // Not JSON, ignore
                }
            };

            return ws;
        };

        // Copy all WebSocket properties
        window.WebSocket.prototype = OriginalWebSocket.prototype;
        window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
        window.WebSocket.OPEN = OriginalWebSocket.OPEN;
        window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
        window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
    }

    /**
     * Handle an ElevenLabs event (from WebSocket or DOM)
     * Unified handler for all event sources
     * Only records usage on user_transcript events
     */
    function handleWebSocketEvent(eventType, eventData, userId, publicUserId) {
        // Handle conversation_initiation_metadata - start session
        if (eventType === 'conversation_initiation_metadata') {
            var conversationId = null;

            // Try to extract conversation_id from various locations
            if (eventData.conversation_initiation_metadata_event && eventData.conversation_initiation_metadata_event.conversation_id) {
                conversationId = eventData.conversation_initiation_metadata_event.conversation_id;
            } else if (eventData.detail && eventData.detail.conversation_initiation_metadata_event && eventData.detail.conversation_initiation_metadata_event.conversation_id) {
                conversationId = eventData.detail.conversation_initiation_metadata_event.conversation_id;
            } else if (eventData.conversation_id) {
                conversationId = eventData.conversation_id;
            }

            if (conversationId && conversationId !== elevenlabsSessionId) {
                console.log('[ElevenLabs] Starting session. Max messages per conversation:', elevenlabsMaxMessagesPerConversation);
                startUsageSession(conversationId, userId, publicUserId);
            }
        }

        // Handle user_transcript - user spoke (record usage)
        if (eventType === 'user_transcript' || eventType === 'elevenlabs-convai:user_transcript') {
            if (!elevenlabsSessionId) {
                return;
            }
            recordMessage(elevenlabsSessionId);
        }
    }


    /**
     * Set up a MutationObserver to watch for widget appearance
     */
    function setupWidgetObserver(userId, publicUserId, maxMessagesPerConversation) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeName === 'ELEVENLABS-CONVAI' ||
                        (node.querySelector && node.querySelector('elevenlabs-convai'))) {
                        // Stop observing once widget is found
                        observer.disconnect();
                        setupElevenLabsEventListeners(userId, publicUserId, maxMessagesPerConversation);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Stop observing after 30 seconds (fallback)
        setTimeout(function() {
            observer.disconnect();
        }, 30000);
    }


    // ============================================================
    // END USAGE TRACKING AND RATE LIMITING FUNCTIONS
    // ============================================================

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
        var enableSearchProducts = container.dataset.enableSearchProducts === 'true';

        // Targeting controls
        var geographicRestrictions = container.dataset.geographicRestrictions || null;
        var deviceFiltering = container.dataset.deviceFiltering || 'all';
        var customerSegmentTargeting = container.dataset.customerSegmentTargeting || 'all';
        var excludePublicUsers = container.dataset.excludePublicUsers === 'true';

        // Session controls
        var maxMessagesPerSession = parseInt(container.dataset.maxMessagesPerSession) || 0;
        var maxMessagesPerConversation = parseInt(container.dataset.maxMessagesPerConversation) || 0;

        // Debug: log the raw value from dataset
        console.log('[ElevenLabs] maxMessagesPerConversation raw value:', container.dataset.maxMessagesPerConversation, 'parsed:', maxMessagesPerConversation);

        var conversationHistoryRetention = parseInt(container.dataset.conversationHistoryRetention) || 24;
        var autoEndInactiveConversations = container.dataset.autoEndInactiveConversations === 'true';
        var saveUserInfo = container.dataset.saveUserInfo === 'true';
        var enableConversationLogging = container.dataset.enableConversationLogging === 'true';
        var dailyUsageLimit = parseInt(container.dataset.dailyUsageLimit) || 0;
        var globalUsageLimit = parseInt(container.dataset.globalUsageLimit) || 0;

        // Product integration
        var productCategoriesInclude = container.dataset.productCategoriesInclude || null;
        var productCategoriesExclude = container.dataset.productCategoriesExclude || null;
        var featuredProductsPriority = container.dataset.featuredProductsPriority || null;
        var outOfStockHandling = container.dataset.outOfStockHandling || 'hide';

        // Page visibility controls
        var pagesToShow = container.dataset.pagesToShow || null;
        var pagesToHide = container.dataset.pagesToHide || null;

        // Theme settings - Debug dataset
        console.log('=== Container Dataset Debug ===');
        console.log('Raw dataset.themeType:', container.dataset.themeType);
        console.log('Raw dataset.primaryColor:', container.dataset.primaryColor);
        console.log('Raw dataset.secondaryColor:', container.dataset.secondaryColor);
        console.log('Full dataset:', JSON.parse(JSON.stringify(container.dataset)));

        // Theme settings
        var themeType = container.dataset.themeType || 'light';
        var primaryColor = container.dataset.primaryColor || '#667eea';
        var secondaryColor = container.dataset.secondaryColor || '#764ba2';

        console.log('Final theme values:', { themeType, primaryColor, secondaryColor });

        // Apply theme settings
        applyTheme(themeType, primaryColor, secondaryColor);

        // Try to get user information from the container data attributes first
        var userId = container.dataset.userId || undefined;
        var userName = container.dataset.userName || undefined;
        var userLogin = container.dataset.userLogin || undefined;
        var userEmail = container.dataset.userEmail || undefined;
        var userIsPublicStr = container.dataset.userIsPublic;
        var userIsAdminStr = container.dataset.userIsAdmin;
        var userIsVipStr = container.dataset.userIsVip;

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
        var userIsPublic = (userIsPublicStr ? userIsPublicStr === 'true' : userId == '0' || userId == 'public' || !userId);
        var userIsAdmin = userIsAdminStr ? userIsAdminStr === 'true' : false;
        var userIsVip = userIsVipStr ? userIsVipStr === 'true' : false;

        // Log user details separately if user is logged in (not public)
        if (!userIsPublic && userId && userId !== '0' && userId !== 'undefined' && userId != null) {
            console.log('=== Logged User Details ===');
            console.log('User ID:', userId);
            console.log('User Name:', userName);
            console.log('User Login:', userLogin);
            console.log('User Email:', userEmail);
            console.log('Is Admin:', userIsAdmin);
            console.log('Is VIP:', userIsVip);
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

        // Check customer segment targeting - VIP only
        if (customerSegmentTargeting === 'vip') {
            console.log('VIP-only targeting enabled');
            // User must be logged in AND have VIP status
            if (userIsPublic || !userIsVip) {
                console.log('ElevenLabs agent is restricted to VIP users only. User is VIP:', userIsVip, ', User is public:', userIsPublic);
                return;
            }
            console.log('User is VIP, allowing widget display');
        }

        // Check if public/non-logged-in users should be excluded
        if (excludePublicUsers && userIsPublic) {
            console.log('ElevenLabs agent is excluded for public/non-logged-in users');
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

        // Get public user ID if user is public
        var publicUserId = null;
        if (userIsPublic) {
            // Store in a global variable for later use
            // Will be populated by getClientInfo when needed
            publicUserId = null;  // Will be generated from IP on the backend
        }

        // Initialize trigger system with rate limiting parameters
        initializeTriggerSystem(
            agentId,
            triggerDelay,
            triggerOnScroll,
            triggerOnTime,
            triggerOnExitIntent,
            enableShowProductCard,
            enableSearchProducts,
            userId,
            publicUserId,
            maxMessagesPerConversation,
            dailyUsageLimit,
            globalUsageLimit,
            userIsPublic
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
            enableSearchProducts: container.dataset.enableSearchProducts === 'true',
            cartIntegrationMethod: container.dataset.cartIntegrationMethod || 'direct_add',
            geographicRestrictions: container.dataset.geographicRestrictions || null,
            deviceFiltering: container.dataset.deviceFiltering || 'all',
            customerSegmentTargeting: container.dataset.customerSegmentTargeting || 'all',
            excludePublicUsers: container.dataset.excludePublicUsers === 'true',
            maxMessagesPerSession: parseInt(container.dataset.maxMessagesPerSession) || 0,
            conversationHistoryRetention: parseInt(container.dataset.conversationHistoryRetention) || 24,
            autoEndInactiveConversations: container.dataset.autoEndInactiveConversations === 'true',
            saveUserInfo: container.dataset.saveUserInfo === 'true',
            enableConversationLogging: container.dataset.enableConversationLogging === 'true',
            dailyUsageLimit: parseInt(container.dataset.dailyUsageLimit) || 0,
            globalUsageLimit: parseInt(container.dataset.globalUsageLimit) || 0,
            maxMessagesPerConversation: parseInt(container.dataset.maxMessagesPerConversation) || 0,
            productCategoriesInclude: container.dataset.productCategoriesInclude || null,
            productCategoriesExclude: container.dataset.productCategoriesExclude || null,
            featuredProductsPriority: container.dataset.featuredProductsPriority || null,
            outOfStockHandling: container.dataset.outOfStockHandling || 'hide',
            pagesToShow: container.dataset.pagesToShow || null,
            pagesToHide: container.dataset.pagesToHide || null,
            // Theme settings
            themeType: container.dataset.themeType || 'light',
            primaryColor: container.dataset.primaryColor || '#667eea',
            secondaryColor: container.dataset.secondaryColor || '#764ba2',
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
            userIsVip: container.dataset.userIsVip === 'true',
            rawUserIsPublic: container.dataset.userIsPublic,  // For debugging
            rawUserIsPublicType: typeof container.dataset.userIsPublic,  // For debugging
            rawUserIsAdmin: container.dataset.userIsAdmin,     // For debugging
            rawUserIsAdminType: typeof container.dataset.userIsAdmin,    // For debugging
            rawUserIsVip: container.dataset.userIsVip,         // For debugging
            rawUserIsVipType: typeof container.dataset.userIsVip         // For debugging
        };

        console.log('=== ElevenLabs Module Settings ===');
        console.table(settings);
        console.log('==================================');
    }

    function createWidget(
        agentId,
        enableShowProductCard,
        enableSearchProducts,
        userId,
        publicUserId,
        maxMessagesPerConversation
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
                    registerClientTools(enableShowProductCard, enableSearchProducts);
                    // Setup usage tracking event listeners
                    setupElevenLabsEventListeners(userId, publicUserId, maxMessagesPerConversation);
                }, 500);
            };

            document.head.appendChild(script);
        } else {
            // Script already loaded, register tools
            registerClientTools(enableShowProductCard, enableSearchProducts);
            // Setup usage tracking event listeners
            setupElevenLabsEventListeners(userId, publicUserId, maxMessagesPerConversation);
        }
    }

    function registerClientTools(enableShowProductCard, enableSearchProducts) {
        var widget = document.querySelector('elevenlabs-convai');

        if (!widget) {
            console.error('ElevenLabs widget element not found');
            return;
        }

        // Register the event listener for client tools
        widget.addEventListener('elevenlabs-convai:call', function(event) {
            console.log('=== ElevenLabs Tool Call ===');
            console.log('Event detail:', event.detail);

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

                if (enableSearchProducts) {
                    event.detail.config.clientTools.searchProducts = function(params) {
                        console.log('searchProducts called with:', params);
                        handleSearchProducts(params);
                    };
                }
            }
        });

        console.log('xx ElevenLabs client tools registered xx');
        console.log('Enabled tools:', {
            showProductCard: enableShowProductCard,
            searchProducts: enableSearchProducts
        });
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

        // Re-apply theme FIRST to ensure CSS variables are up to date
        var container = document.querySelector('.elevenlabs-agent-container');
        if (container) {
            var themeType = container.dataset.themeType || 'light';
            var primaryColor = container.dataset.primaryColor || '#667eea';
            var secondaryColor = container.dataset.secondaryColor || '#764ba2';
            applyTheme(themeType, primaryColor, secondaryColor);
            console.log('Theme re-applied BEFORE modal creation:', { themeType, primaryColor, secondaryColor });
        }

        // Create product cards HTML with swiper (AFTER theme is applied)
        var modalHtml = createProductCardsHTML(products);

        // Append directly to body with high-level container
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Apply theme colors directly to modal elements (to override inline styles)
        var modal = document.querySelector('.elevenlabs-product-modal');
        if (modal) {
            var primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--el-primary-color').trim();
            var textColor = getComputedStyle(document.documentElement).getPropertyValue('--el-text-color').trim();
            var textMuted = getComputedStyle(document.documentElement).getPropertyValue('--el-text-muted').trim();
            var cardBg = getComputedStyle(document.documentElement).getPropertyValue('--el-card-bg').trim();

            console.log('Directly applying colors to modal:', { primaryColor, textColor, textMuted, cardBg });

            // Apply to header icon
            var headerIcon = modal.querySelector('.product-modal-header i');
            if (headerIcon) headerIcon.style.color = primaryColor;

            // Apply to header title
            var headerTitle = modal.querySelector('.product-modal-header h3');
            if (headerTitle) headerTitle.style.color = textColor;

            // Apply to close button
            var closeBtn = modal.querySelector('.close-modal-btn');
            if (closeBtn) closeBtn.style.color = textMuted;

            // Apply to all product prices
            var prices = modal.querySelectorAll('.product-price');
            prices.forEach(function(price) {
                price.style.color = primaryColor;
            });

            // Apply to all product names
            var names = modal.querySelectorAll('.product-name');
            names.forEach(function(name) {
                name.style.color = textColor;
            });

            console.log('Colors applied directly to modal elements');
        }

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
        
        // Auto-hide after 30 seconds
        var autoHideTimer = setTimeout(function() {
            closeProductModal();
        }, 30000);

        // Store timer on modal for cleanup if needed
        var modal = document.querySelector('.elevenlabs-product-modal');
        if (modal) {
            modal._autoHideTimer = autoHideTimer;
        }
    }
    
    function createProductCardsHTML(products) {
        console.log('=== createProductCardsHTML called ===');
        console.log('Body has dark theme class:', document.body.classList.contains('elevenlabs-dark-theme'));
        console.log('Current CSS vars:', {
            primary: getComputedStyle(document.documentElement).getPropertyValue('--el-primary-color').trim(),
            cardBg: getComputedStyle(document.documentElement).getPropertyValue('--el-card-bg').trim(),
            textColor: getComputedStyle(document.documentElement).getPropertyValue('--el-text-color').trim(),
            shadow: getComputedStyle(document.documentElement).getPropertyValue('--el-shadow').trim()
        });

        var html = '<div class="elevenlabs-product-modal" style="position: fixed !important; bottom: 100px !important; left: 20px !important; z-index: 999999 !important; opacity: 1 !important; transform: translateY(20px); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">';
        html += '<div class="product-modal-container" style="background: var(--el-card-bg, white); border-radius: 12px; box-shadow: var(--el-shadow, 0 8px 24px rgba(0, 0, 0, 0.12)); padding: 12px; width: 420px; max-width: calc(100vw - 40px);">';

        // Header with title and close button
        html += '<div class="product-modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">';
        html += '<div style="display: flex; align-items: center; gap: 8px;">';
        html += '<i class="fa fa-shopping-bag" style="font-size: 14px; color: var(--el-primary-color, #667eea);"></i>';
        html += '<h3 style="margin: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color, #2c3e50);">Recommended Products</h3>';
        html += '</div>';
        html += '<button class="close-modal-btn" style="background: rgba(0, 0, 0, 0.05); border: none; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: var(--el-text-muted, #666); transition: all 0.2s;">&times;</button>';
        html += '</div>';

        // Swiper container (using proper Swiper classes)
        html += '<div class="swiper eleventlabs-swiper" style="overflow: hidden; padding: 0 4px;">';

        // Swiper wrapper
        html += '<div class="swiper-wrapper">';

        products.forEach(function(product, index) {
            var productName = product.name || product.Name || 'Product';
            var productPrice = product.price || product.Price || '0.00';
            var productImage = product.image || product.Image || null;
            var productSku = product.sku || product.SKU || product.default_code || 'SKU-' + index;
            var productId = product.id || product.product_id || null;

            // Swiper slide
            html += '<div class="swiper-slide" style="width: auto;">';

            // Product card
            html += '<div class="product-card" data-sku="' + productSku + '" data-product-id="' + productId + '" style="background: var(--el-card-bg, white); border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); transition: all 0.3s; display: flex; flex-direction: column; width: 120px;">';

            // Product image
            html += '<div class="product-image" style="width: 100%; height: 100px; display: flex; align-items: center; justify-content: center; background: #f8f9fa; overflow: hidden; flex-shrink: 0;">';
            if (productImage) {
                // Add unique ID for each image to prevent mixing
                var imageId = 'el-prod-img-' + index + '-' + Date.now();
                html += '<img id="' + imageId + '" src="' + productImage + '" alt="' + productName + '" loading="eager" data-src="' + productImage + '" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.onerror=null;this.parentElement.innerHTML=\'<i class=\\\'fa fa-cube\\\' style=\\\'font-size: 24px; color: #cbd5e0;\\\'></i>\';" />';
            } else {
                html += '<div class="no-image-placeholder" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #cbd5e0;">';
                html += '<i class="fa fa-cube" style="font-size: 24px;"></i>';
                html += '</div>';
            }
            html += '</div>';

            // Product info
            html += '<div class="product-info" style="padding: 10px 8px; display: flex; flex-direction: column; flex: 1;">';

            // Product name
            html += '<h4 class="product-name" title="' + productName + '" style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: var(--el-text-color, #2c3e50); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">' + productName + '</h4>';

            // Price
            html += '<div class="product-price" style="font-size: 14px; font-weight: bold; color: var(--el-primary-color, #667eea); margin-bottom: 8px;">$' + productPrice + '</div>';

            html += '</div>'; // product-info
            html += '</div>'; // product-card
            html += '</div>'; // swiper-slide
        });

        html += '</div>'; // swiper-wrapper

        // Pagination dots
        html += '<div class="swiper-pagination" style="margin-top: 12px;"></div>';

        html += '</div>'; // swiper
        html += '</div>'; // product-modal-container
        html += '</div>'; // elevenlabs-product-modal

        return html;
    }
    
    function closeProductModal() {
        var modal = document.querySelector('.elevenlabs-product-modal');
        if (modal) {
            // Clear auto-hide timer if it exists
            if (modal._autoHideTimer) {
                clearTimeout(modal._autoHideTimer);
            }
            // Clean up escape handler if it exists
            if (modal._escapeHandler) {
                document.removeEventListener('keydown', modal._escapeHandler);
            }
            modal.classList.remove('show');
            setTimeout(function() {
                modal.remove();
            }, 300);
        }
    }
    
    function bindProductCardEvents(products) {
        var modal = document.querySelector('.elevenlabs-product-modal');

        // Close button
        var closeBtn = document.querySelector('.elevenlabs-product-modal .close-modal-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeProductModal);
        }

        // Click outside to close
        if (modal) {
            modal.addEventListener('click', function(e) {
                // Close if clicking on the modal background (not the container)
                if (e.target === modal) {
                    closeProductModal();
                }
            });
        }

        // Close on Escape key
        var escapeHandler = function(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                closeProductModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);

        // Store escape handler reference for cleanup
        if (modal) {
            modal._escapeHandler = escapeHandler;
        }

        // Initialize Swiper
        var swiperContainer = document.querySelector('.eleventlabs-swiper');
        if (swiperContainer && typeof Swiper !== 'undefined') {
            var swiper = new Swiper('.eleventlabs-swiper', {
                slidesPerView: 'auto',
                spaceBetween: 8,
                resistanceRatio: 0,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                    renderBullet: function(index, className) {
                        return '<span class="' + className + '" style="width: 8px; height: 8px; border-radius: 4px; background: #e2e8f0; transition: all 0.3s;"></span>';
                    }
                },
                on: {
                    paginationUpdate: function(swiper) {
                        var bullets = swiper.pagination.bullets;
                        bullets.forEach(function(bullet, idx) {
                            if (idx === swiper.activeIndex) {
                                bullet.style.width = '20px';
                                bullet.style.background = '#667eea';
                            } else {
                                bullet.style.width = '8px';
                                bullet.style.background = '#e2e8f0';
                            }
                        });
                    }
                }
            });
        }
    }

    function handleSearchProducts(params) {
        // Extract search parameters with flexible naming
        var query = params.query || params.Query || params.search || '';
        var category = params.category || params.Category || null;
        var minPrice = params.minPrice || params.min_price || null;
        var maxPrice = params.maxPrice || params.max_price || null;
        var inStockOnly = params.inStockOnly || params.in_stock_only || false;
        var limit = params.limit || 6;

        if (!query) {
            console.error('No search query provided');
            return;
        }

        console.log('=== Search Products ===');
        console.log('Query:', query);
        console.log('Filters:', {
            category: category,
            minPrice: minPrice,
            maxPrice: maxPrice,
            inStockOnly: inStockOnly,
            limit: limit
        });

        // Build request params
        var requestParams = {
            query: query,
            limit: limit
        };

        if (category) requestParams.category = category;
        if (minPrice) requestParams.min_price = minPrice;
        if (maxPrice) requestParams.max_price = maxPrice;
        if (inStockOnly) requestParams.in_stock_only = true;

        // Call search API
        fetch('/api/elevenlabs/products/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: requestParams,
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            console.log('Search response:', data);

            if (data.result && data.result.success) {
                var products = data.result.products;
                var totalCount = data.result.total_count || products.length;
                var filtersApplied = data.result.filters_applied || {};

                console.log('Found ' + totalCount + ' products');

                if (products.length === 0) {
                    console.log('No products found for query:', query);
                    // Could trigger "did you mean?" suggestions here
                    return;
                }

                // Display results with summary
                handleShowProductCard({
                    products: products,
                    summary: 'Found ' + totalCount + ' product' + (totalCount !== 1 ? 's' : '') + ' for "' + query + '"'
                });
            } else {
                console.error('Search failed:', data.result?.error || 'Unknown error');
            }
        })
        .catch(function(error) {
            console.error('Search request failed:', error);
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
        html += '<button id="debug-search" class="btn btn-sm btn-secondary" style="display: block; width: 100%; margin-bottom: 4px; padding: 5px 10px; font-size: 11px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;">Search</button>';
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
        var showProductsBtn = document.getElementById('debug-show-products');
        if (showProductsBtn) {
            showProductsBtn.addEventListener('click', function() {
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
        }

        var searchBtn = document.getElementById('debug-search');
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                showInputDialog('Enter search query:', '', function(query) {
                    if (query) {
                        handleSearchProducts({query: query});
                    }
                });
            });
        }
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