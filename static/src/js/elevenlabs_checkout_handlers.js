// Checkout handler functions for ElevenLabs conversational checkout

function handleCollectShippingInfo(params) {
    console.log('Collecting shipping info:', params);
    
    // Create or update checkout modal
    var modal = document.querySelector('.elevenlabs-checkout-modal');
    if (!modal) {
        modal = createCheckoutModal();
    }
    
    // Update modal content with shipping form
    var content = '<div class="checkout-step" data-step="shipping">';
    content += '<h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">Shipping Information</h3>';
    content += '<div class="form-fields" style="display: grid; gap: 10px;">';
    content += '<input type="text" id="ship-name" placeholder="Full Name" value="' + (params.name || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" id="ship-street" placeholder="Street Address" value="' + (params.street || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" id="ship-street2" placeholder="Apt/Suite (optional)" value="' + (params.street2 || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
    content += '<input type="text" id="ship-city" placeholder="City" value="' + (params.city || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" id="ship-state" placeholder="State" value="' + (params.state || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '</div>';
    content += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
    content += '<input type="text" id="ship-zip" placeholder="ZIP Code" value="' + (params.zip || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" id="ship-country" placeholder="Country" value="' + (params.country || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '</div>';
    content += '<input type="tel" id="ship-phone" placeholder="Phone (optional)" value="' + (params.phone || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '</div>';
    content += '</div>';
    
    updateCheckoutModal(modal, content);
    
    // Save shipping info via API
    fetch('/api/elevenlabs/checkout/shipping', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: params,
            id: Math.floor(Math.random() * 1000000)
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.result && data.result.success) {
            showSuccessNotification('Shipping information saved');
        }
    });
}

function handleCollectBillingInfo(params) {
    console.log('Collecting billing info:', params);
    
    var modal = document.querySelector('.elevenlabs-checkout-modal');
    if (!modal) {
        modal = createCheckoutModal();
    }
    
    if (params.same_as_shipping) {
        // Just save and show confirmation
        fetch('/api/elevenlabs/checkout/billing', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: {same_as_shipping: true},
                id: Math.floor(Math.random() * 1000000)
            })
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
            if (data.result && data.result.success) {
                showSuccessNotification('Billing address same as shipping');
            }
        });
        return;
    }
    
    // Show billing form
    var content = '<div class="checkout-step" data-step="billing">';
    content += '<h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">Billing Information</h3>';
    content += '<div class="form-fields" style="display: grid; gap: 10px;">';
    content += '<label style="display: flex; align-items: center; gap: 8px;">';
    content += '<input type="checkbox" id="same-as-shipping" ' + (params.same_as_shipping ? 'checked' : '') + '>';
    content += '<span>Same as shipping address</span>';
    content += '</label>';
    content += '<div id="billing-fields" style="display: ' + (params.same_as_shipping ? 'none' : 'grid') + '; gap: 10px;">';
    content += '<input type="text" placeholder="Full Name" value="' + (params.name || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" placeholder="Street Address" value="' + (params.street || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" placeholder="City" value="' + (params.city || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" placeholder="State" value="' + (params.state || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '<input type="text" placeholder="ZIP Code" value="' + (params.zip || '') + '" style="padding: 8px; border: 1px solid #e5e7eb; border-radius: 6px;">';
    content += '</div>';
    content += '</div>';
    content += '</div>';
    
    updateCheckoutModal(modal, content);
}

function handleSelectShippingMethod(params) {
    console.log('Selecting shipping method:', params);
    
    var modal = document.querySelector('.elevenlabs-checkout-modal');
    if (!modal) {
        modal = createCheckoutModal();
    }
    
    var content = '<div class="checkout-step" data-step="shipping-method">';
    content += '<h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">Shipping Method</h3>';
    content += '<div class="shipping-options" style="display: grid; gap: 10px;">';
    
    var methods = [
        {id: 'standard', name: 'Standard Shipping', time: '5-7 business days', price: 'Free'},
        {id: 'express', name: 'Express Shipping', time: '2-3 business days', price: '$15.00'},
        {id: 'overnight', name: 'Overnight Shipping', time: 'Next business day', price: '$35.00'}
    ];
    
    methods.forEach(function(method) {
        var selected = params.method === method.id;
        content += '<label style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 2px solid ' + (selected ? '#667eea' : '#e5e7eb') + '; border-radius: 8px; cursor: pointer; background: ' + (selected ? '#f3f4f6' : 'white') + ';">';
        content += '<div style="display: flex; align-items: center; gap: 10px;">';
        content += '<input type="radio" name="shipping-method" value="' + method.id + '" ' + (selected ? 'checked' : '') + '>';
        content += '<div>';
        content += '<div style="font-weight: 600;">' + method.name + '</div>';
        content += '<div style="font-size: 12px; color: #6b7280;">' + method.time + '</div>';
        content += '</div>';
        content += '</div>';
        content += '<div style="font-weight: 600; color: ' + (method.price === 'Free' ? '#10b981' : '#1f2937') + ';">' + method.price + '</div>';
        content += '</label>';
    });
    
    content += '</div>';
    content += '</div>';
    
    updateCheckoutModal(modal, content);
    
    // Save shipping method
    fetch('/api/elevenlabs/checkout/shipping-method', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {method: params.method},
            id: Math.floor(Math.random() * 1000000)
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.result && data.result.success) {
            showSuccessNotification('Shipping method selected: ' + params.method);
        }
    });
}

function handleReviewOrder() {
    console.log('Reviewing order...');
    
    var modal = document.querySelector('.elevenlabs-checkout-modal');
    if (!modal) {
        modal = createCheckoutModal();
    }
    
    // Show loading
    updateCheckoutModal(modal, '<div style="text-align: center; padding: 40px;"><i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i><p>Loading order summary...</p></div>');
    
    // Get order review
    fetch('/api/elevenlabs/checkout/review', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {},
            id: Math.floor(Math.random() * 1000000)
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.result && data.result.success) {
            var summary = data.result.order_summary;
            var content = '<div class="checkout-step" data-step="review">';
            content += '<h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1f2937;">Order Summary</h3>';
            
            // Items
            content += '<div style="margin-bottom: 15px;">';
            content += '<h4 style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Items</h4>';
            summary.items.forEach(function(item) {
                content += '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">';
                content += '<div>' + item.product + ' (x' + item.quantity + ')</div>';
                content += '<div>$' + item.subtotal.toFixed(2) + '</div>';
                content += '</div>';
            });
            content += '</div>';
            
            // Totals
            content += '<div style="margin-bottom: 15px;">';
            content += '<div style="display: flex; justify-content: space-between; padding: 5px 0;">';
            content += '<div>Subtotal:</div><div>$' + summary.subtotal.toFixed(2) + '</div>';
            content += '</div>';
            content += '<div style="display: flex; justify-content: space-between; padding: 5px 0;">';
            content += '<div>Tax:</div><div>$' + summary.tax.toFixed(2) + '</div>';
            content += '</div>';
            content += '<div style="display: flex; justify-content: space-between; padding: 5px 0;">';
            content += '<div>Shipping:</div><div>$' + summary.shipping.toFixed(2) + '</div>';
            content += '</div>';
            content += '<div style="display: flex; justify-content: space-between; padding: 8px 0; font-weight: 600; font-size: 16px; border-top: 2px solid #e5e7eb;">';
            content += '<div>Total:</div><div>$' + summary.total.toFixed(2) + '</div>';
            content += '</div>';
            content += '</div>';
            
            // Addresses
            if (summary.shipping_address && summary.shipping_address.name) {
                content += '<div style="margin-bottom: 15px;">';
                content += '<h4 style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">Shipping Address</h4>';
                content += '<div style="font-size: 14px;">';
                content += summary.shipping_address.name + '<br>';
                content += summary.shipping_address.street + '<br>';
                if (summary.shipping_address.street2) {
                    content += summary.shipping_address.street2 + '<br>';
                }
                content += summary.shipping_address.city + ', ' + summary.shipping_address.state + ' ' + summary.shipping_address.zip;
                content += '</div>';
                content += '</div>';
            }
            
            // Payment section (user fills manually)
            content += '<div style="margin-bottom: 15px; padding: 15px; background: #fef3c7; border-radius: 8px;">';
            content += '<h4 style="margin: 0 0 10px 0; font-size: 14px; color: #92400e;">Payment Information</h4>';
            content += '<p style="margin: 0; font-size: 13px; color: #92400e;">Please enter your payment details below (secured by Odoo)</p>';
            content += '</div>';
            
            content += '</div>';
            
            updateCheckoutModal(modal, content);
        }
    });
}

function handlePlaceOrder(params) {
    console.log('Placing order:', params);
    
    if (!params.confirm) {
        showErrorNotification('Order not confirmed');
        return;
    }
    
    // Show loading
    var loadingModal = document.createElement('div');
    loadingModal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 999999;';
    loadingModal.innerHTML = '<div style="text-align: center;"><i class="fa fa-spinner fa-spin" style="font-size: 32px; color: #667eea;"></i><p style="margin-top: 15px; font-size: 16px;">Placing your order...</p></div>';
    document.body.appendChild(loadingModal);
    
    // Place order
    fetch('/api/elevenlabs/checkout/place-order', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: params,
            id: Math.floor(Math.random() * 1000000)
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        // Remove loading
        if (loadingModal.parentNode) {
            loadingModal.parentNode.removeChild(loadingModal);
        }
        
        if (data.result && data.result.success) {
            // Close checkout modal
            closeCheckoutModal();
            
            // Show success message
            var successModal = document.createElement('div');
            successModal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 999999; text-align: center;';
            successModal.innerHTML = '<i class="fa fa-check-circle" style="font-size: 48px; color: #10b981;"></i>';
            successModal.innerHTML += '<h2 style="margin: 15px 0 10px 0;">Order Placed Successfully!</h2>';
            successModal.innerHTML += '<p>Order #' + data.result.order_name + '</p>';
            successModal.innerHTML += '<button onclick="this.parentElement.remove()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Continue Shopping</button>';
            document.body.appendChild(successModal);
        } else {
            showErrorNotification(data.result ? data.result.error : 'Failed to place order');
        }
    })
    .catch(function(error) {
        if (loadingModal.parentNode) {
            loadingModal.parentNode.removeChild(loadingModal);
        }
        showErrorNotification('Error placing order');
    });
}

function handleDisplayProductDetails(params) {
    console.log('Displaying product details:', params);
    
    if (!params.product_id) {
        console.error('No product ID provided');
        return;
    }
    
    // Create product details modal
    var modal = document.createElement('div');
    modal.className = 'elevenlabs-product-details-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999998; display: flex; align-items: center; justify-content: center;';
    
    var modalContent = document.createElement('div');
    modalContent.style.cssText = 'background: white; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; position: relative;';
    modalContent.innerHTML = '<div style="padding: 40px; text-align: center;"><i class="fa fa-spinner fa-spin" style="font-size: 24px; color: #667eea;"></i><p>Loading product details...</p></div>';
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    // Fetch product details
    fetch('/api/elevenlabs/product/' + params.product_id, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {},
            id: Math.floor(Math.random() * 1000000)
        })
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.result && data.result.success) {
            var product = data.result.product;
            var content = '';
            
            // Close button
            content += '<button onclick="this.closest(\'.elevenlabs-product-details-modal\').remove()" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280;">&times;</button>';
            
            // Product content
            content += '<div style="padding: 20px;">';
            
            // Image
            if (product.images && product.images.length > 0) {
                content += '<img src="' + product.images[0] + '" alt="' + product.name + '" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">';
            }
            
            // Title and price
            content += '<h2 style="margin: 0 0 10px 0; font-size: 24px; color: #1f2937;">' + product.name + '</h2>';
            content += '<div style="font-size: 28px; font-weight: bold; color: #667eea; margin-bottom: 15px;">$' + product.price.toFixed(2) + '</div>';
            
            // SKU and stock
            content += '<div style="display: flex; gap: 20px; margin-bottom: 15px; font-size: 14px; color: #6b7280;">';
            if (product.sku) {
                content += '<div>SKU: ' + product.sku + '</div>';
            }
            content += '<div>Stock: ' + (product.in_stock ? '<span style="color: #10b981;">In Stock (' + product.qty_available + ')</span>' : '<span style="color: #ef4444;">Out of Stock</span>') + '</div>';
            content += '</div>';
            
            // Description
            if (product.description) {
                content += '<div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">';
                content += '<h3 style="margin: 0 0 10px 0; font-size: 16px;">Description</h3>';
                content += '<p style="margin: 0; color: #4b5563; line-height: 1.5;">' + product.description + '</p>';
                content += '</div>';
            }
            
            // Variants
            if (product.variants && product.variants.length > 0) {
                content += '<div style="margin: 20px 0;">';
                content += '<h3 style="margin: 0 0 10px 0; font-size: 16px;">Options</h3>';
                product.variants.forEach(function(variant) {
                    content += '<div style="padding: 8px; background: #f3f4f6; border-radius: 4px; margin-bottom: 5px;">';
                    content += variant.attribute + ': ' + variant.value;
                    content += '</div>';
                });
                content += '</div>';
            }
            
            // Add to cart button
            content += '<button onclick="addSingleItemToCart(\'' + product.sku + '\', \'' + product.name + '\', ' + product.id + ', 1, function(success) { if(success) { showSuccessNotification(\'Added to cart\'); } })" style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">Add to Cart</button>';
            
            content += '</div>';
            
            modalContent.innerHTML = content;
        } else {
            modalContent.innerHTML = '<div style="padding: 40px; text-align: center;"><i class="fa fa-exclamation-circle" style="font-size: 48px; color: #ef4444;"></i><p>Product not found</p></div>';
        }
    })
    .catch(function(error) {
        modalContent.innerHTML = '<div style="padding: 40px; text-align: center;"><i class="fa fa-exclamation-circle" style="font-size: 48px; color: #ef4444;"></i><p>Error loading product</p></div>';
    });
}

// Helper functions
function createCheckoutModal() {
    var modal = document.createElement('div');
    modal.className = 'elevenlabs-checkout-modal';
    modal.style.cssText = 'position: fixed; top: 20px; right: 20px; width: 400px; max-width: calc(100vw - 40px); background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 999997; max-height: calc(100vh - 40px); overflow-y: auto;';
    
    var header = document.createElement('div');
    header.style.cssText = 'padding: 15px 20px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;';
    header.innerHTML = '<h3 style="margin: 0; font-size: 16px; color: #1f2937;">Checkout</h3>';
    header.innerHTML += '<button onclick="closeCheckoutModal()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #6b7280;">&times;</button>';
    
    var content = document.createElement('div');
    content.className = 'checkout-modal-content';
    content.style.cssText = 'padding: 20px;';
    
    modal.appendChild(header);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    return modal;
}

function updateCheckoutModal(modal, content) {
    var contentDiv = modal.querySelector('.checkout-modal-content');
    if (contentDiv) {
        contentDiv.innerHTML = content;
    }
}

function closeCheckoutModal() {
    var modal = document.querySelector('.elevenlabs-checkout-modal');
    if (modal) {
        modal.remove();
    }
}

function showSuccessNotification(message) {
    var notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 999999; display: flex; align-items: center; gap: 10px;';
    notification.innerHTML = '<i class="fa fa-check-circle"></i><span>' + message + '</span>';
    document.body.appendChild(notification);
    
    setTimeout(function() {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

function showErrorNotification(message) {
    var notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #ef4444; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 999999; display: flex; align-items: center; gap: 10px;';
    notification.innerHTML = '<i class="fa fa-exclamation-circle"></i><span>' + message + '</span>';
    document.body.appendChild(notification);
    
    setTimeout(function() {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}