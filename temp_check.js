
    import WB from "/src/core/wb.js";
    window.WB = WB;
    
    // Expose WBServices as alias to WB.behaviors for test compatibility
    // Tests expect window.WBServices.behaviors
    window.WBServices = {
      behaviors: WB.behaviors
    };
    
    WB.init();

    // Demo interactions
    document.addEventListener("DOMContentLoaded", () => {
      // Clickable card interaction
      const clickableCard = document.getElementById("card-clickable");
      if (clickableCard) {
        clickableCard.addEventListener("click", () => {
          const toast = document.createElement("div");
          toast.textContent = "Card clicked! This is a toast notification.";
          toast.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:1rem 2rem;border-radius:50px;box-shadow:0 5px 15px rgba(0,0,0,0.3);animation:fadeInOut 3s forwards;z-index:9999;";
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        });
      }
      
      // Card Button Interaction (Floating Message)
      const cardIds = [
        'card-action', 'card-download', 'card-subscribe',
        'pricing-basic', 'pricing-pro', 'pricing-enterprise',
        'pricing-ocean', 'pricing-sunset', 'pricing-forest',
        'pricing-success', 'pricing-warning', 'pricing-danger'
      ];

      cardIds.forEach(id => {
        const card = document.getElementById(id);
        if (card) {
          card.addEventListener('click', (e) => {
             if (e.target.matches(".wb-card__btn") || e.target.closest(".wb-card__btn") || e.target.matches(".wb-card__cta")) {
                e.preventDefault();
          
          let type = 'info';
          let message = '';
          const text = e.target.textContent.trim();

          if (text === 'No Thanks') {
            message = "Thank You for considering this offer!";
          } else if (text === 'Download Now') {
            message = "Your download link was sent to your email, thank you!";
          } else if (text === 'Cancel') {
            message = "Cancel was received, Thank you!";
          } else if (text === 'Learn More') {
            message = "A link have been sent to your email to Learn More...";
          } else if (text === 'Subscribe') {
            message = "Thank You, you are now subscribed";
          } else if (text === 'Start Now') {
            message = "We have sent a link on getting started to your email...";
          } else if (text === 'Select Plan') {
            message = "Thank You for selecting this plan, an email has been sent for getting started.";
          } else if (text === 'Contact Sales') {
            message = "Our Sales Team will call you back ASAP";
          } else {
            const types = ['success', 'info'];
            type = types[Math.floor(Math.random() * types.length)];
            const msgs = {
              success: "We received your order! ✅",
              info: "Your subscription is active! ℹ️"
            };
            message = msgs[type];
          }

          // Create floating message
          const toast = document.createElement("div");
          toast.textContent = message;
          
          const colors = {
            success: "#22c55e",
            warning: "#f59e0b",
            error: "#ef4444",
            info: "#3b82f6"
          };

          toast.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type]};color:white;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.2);animation:fadeInOut 3s forwards;z-index:9999;font-weight:500;`;
          document.body.appendChild(toast);
          
          // Remove after animation
          setTimeout(() => toast.remove(), 3000);
        }
      });
    }
  });

      // Simulate double-click to edit for demo purposes
      document.addEventListener("dblclick", (e) => {
        const target = e.target;
        
        // Try to find a specific editable part first
        let editableTarget = target.closest(".wb-card__content, .wb-card__title, .wb-card__subtitle, p, .wb-card__main");
        
        // If not found, but we clicked inside a card
        if (!editableTarget) {
            const card = target.closest("[data-wb^=\"card\"]");
            if (card) {
                // Try to find the main content area
                editableTarget = card.querySelector(".wb-card__main");
                
                // If still not found (e.g. empty card), we might need to create it or use the card itself if it"s a simple container
                if (!editableTarget) {
                    // Check if card has any content
                    if (card.children.length === 0) {
                        // It"s empty, let"s add a paragraph
                        const p = document.createElement("p");
                        p.textContent = "New content";
                        card.appendChild(p);
                        editableTarget = p;
                    }
                }
            }
        }

        if (editableTarget) {
          e.preventDefault();
          e.stopPropagation();
          
          if (!editableTarget.isContentEditable) {
            editableTarget.contentEditable = true;
            editableTarget.focus();
            
            // Visual feedback
            const originalBg = editableTarget.style.backgroundColor;
            const originalOutline = editableTarget.style.outline;
            
            editableTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
            editableTarget.style.outline = "2px solid var(--primary)";
            
            const blurHandler = () => {
              editableTarget.contentEditable = false;
              editableTarget.style.backgroundColor = originalBg;
              editableTarget.style.outline = originalOutline;
              editableTarget.removeEventListener("blur", blurHandler);
            };
            
            editableTarget.addEventListener("blur", blurHandler);
          }
        }
      });
    });
