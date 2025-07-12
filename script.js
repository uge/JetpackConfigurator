// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const clickBtn = document.getElementById('clickBtn');
    const dynamicText = document.getElementById('dynamicText');
    const cards = document.querySelectorAll('.card');
    
    // Array of messages to cycle through
    const messages = [
        "This text will change when you click the button above.",
        "🎉 Great! You clicked the button!",
        "✨ JavaScript is working perfectly!",
        "🚀 Your static page is interactive!",
        "💡 You can customize this behavior!",
        "🎨 Add your own functionality here!"
    ];
    
    let currentMessageIndex = 0;
    let clickCount = 0;
    
    // Add fade-in animation to cards
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 200);
    });
    
    // Button click handler
    clickBtn.addEventListener('click', function() {
        clickCount++;
        
        // Update button text based on click count
        if (clickCount === 1) {
            clickBtn.textContent = 'Click Again!';
        } else if (clickCount === 5) {
            clickBtn.textContent = 'You\'re on fire! 🔥';
        } else if (clickCount === 10) {
            clickBtn.textContent = 'Amazing! Keep going! ⭐';
        } else if (clickCount > 10) {
            clickBtn.textContent = `${clickCount} clicks! 🎯`;
        }
        
        // Cycle through messages
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;
        
        // Add animation class
        dynamicText.classList.add('changed');
        
        // Change text with a slight delay for smooth animation
        setTimeout(() => {
            dynamicText.textContent = messages[currentMessageIndex];
        }, 100);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            dynamicText.classList.remove('changed');
        }, 500);
        
        // Add button animation
        clickBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            clickBtn.style.transform = 'scale(1)';
        }, 150);
    });
    
    // Add hover effect to cards
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.borderLeftColor = '#764ba2';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.borderLeftColor = '#667eea';
        });
    });
    
    // Add keyboard support
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' || event.key === ' ') {
            if (document.activeElement === clickBtn) {
                clickBtn.click();
            }
        }
    });
    
    // Add a simple console message
    console.log('🎉 Static JavaScript page loaded successfully!');
    console.log('💡 Open the browser console to see this message.');
    console.log('🚀 Ready to build something amazing!');
});

// Utility functions
function showNotification(message, duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        font-family: inherit;
        font-size: 14px;
        transition: all 0.3s ease;
        transform: translateX(100%);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after duration
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, duration);
}

// Example usage (uncomment to test):
// setTimeout(() => showNotification('Welcome to your static page! 🎉'), 2000);
