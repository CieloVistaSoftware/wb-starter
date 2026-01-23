/**
 * Builder Templates - Component template definitions using WB Components
 * Updated to use native WB custom elements instead of inline HTML/styles
 */

const componentTemplates = {
  hero: {
    name: 'Hero Section',
    icon: '🦸',
    wbComponent: 'wb-cardhero',
    // Phase 3: Output 'heading' attribute (standard), internal data still uses 'title' for backward compat
    getHtml: (data) => `<wb-cardhero 
      heading="${data?.title || data?.heading || 'Welcome to Your Site'}"
      subtitle="${data?.subtitle || 'Your value proposition goes here'}"
      cta="${data?.cta || ''}"
      cta-href="${data?.ctaHref || '#'}"
      variant="${data?.variant || 'gradient'}"
      xalign="${data?.align || 'center'}">
    </wb-cardhero>`
  },
  
  navbar: {
    name: 'Navigation Bar',
    icon: '🔝',
    wbComponent: 'wb-header',
    getHtml: (data) => {
      const links = (data?.links || pages?.slice(0, 4) || []).map(p => ({
        label: p.name || p.label,
        href: p.slug || p.href
      }));
      return `<wb-header 
        icon="${data?.icon || '🏠'}"
        heading="${data?.title || 'Logo'}"
        subtitle="${data?.subtitle || ''}"
        sticky="${data?.sticky || 'false'}"
        links='${JSON.stringify(links)}'>
      </wb-header>`;
    }
  },
  
  'header-logo': {
    name: 'Logo & Title',
    icon: '📍',
    wbComponent: 'wb-header',
    getHtml: (data) => `<wb-header 
      icon="${data?.icon || '▯'}"
      heading="${data?.title || 'Your Brand'}"
      subtitle="${data?.subtitle || 'Tagline goes here'}"
      badge="${data?.badge || ''}"
      logo-href="${data?.logoHref || '/'}">
    </wb-header>`
  },
  
  features: {
    name: 'Features Grid',
    icon: '✨',
    isFeatureGrid: true,
    wbComponent: 'wb-grid',
    getHtml: (data) => {
      const cards = data?.cards || [
        { icon: '✨', title: 'Feature 1', description: 'Description goes here' },
        { icon: '⚡', title: 'Feature 2', description: 'Description goes here' },
        { icon: '🚀', title: 'Feature 3', description: 'Description goes here' }
      ];
      return `<wb-grid columns="3" gap="1.5rem">
        ${cards.map((card, i) => `
          <wb-card 
            heading="${card.title}"
            subtitle="${card.description}"
            variant="bordered"
            class="feature-card-item"
            card-index="${i}">
            <div style="font-size: 2rem; text-align: center; margin-bottom: 0.5rem;">${card.icon}</div>
          </wb-card>
        `).join('')}
      </wb-grid>`;
    }
  },
  
  'feature-card': {
    name: 'Feature Card',
    icon: '✨',
    wbComponent: 'wb-card',
    getHtml: (data) => `<wb-card 
      heading="${data?.title || 'Feature Title'}"
      subtitle="${data?.description || 'Description goes here'}"
      variant="${data?.variant || 'bordered'}">
      <div style="font-size: 2rem; text-align: center; margin-bottom: 0.5rem;">${data?.icon || '✨'}</div>
    </wb-card>`
  },
  
  testimonials: {
    name: 'Testimonials',
    icon: '💬',
    wbComponent: 'wb-cardtestimonial',
    getHtml: (data) => `<wb-cardtestimonial 
      quote="${data?.quote || 'Great service! Highly recommended.'}"
      author="${data?.author || 'John Doe'}"
      role="${data?.role || 'CEO at TechCorp'}"
      avatar="${data?.avatar || ''}"
      rating="${data?.rating || ''}"
      variant="${data?.variant || 'default'}">
    </wb-cardtestimonial>`
  },
  
  pricing: {
    name: 'Pricing Table',
    icon: '💰',
    isPricingGrid: true,
    wbComponent: 'wb-grid',
    getHtml: (data) => {
      const cards = data?.cards || [
        { name: 'Basic', price: '$29', period: '/month', features: ['Feature 1', 'Feature 2'], highlighted: false },
        { name: 'Pro', price: '$99', period: '/month', features: ['All Basic features', 'Feature 3', 'Feature 4'], highlighted: true },
        { name: 'Enterprise', price: 'Custom', period: '', features: ['All Pro features', 'Dedicated support', 'Custom integrations'], highlighted: false }
      ];
      return `<wb-grid columns="3" gap="1.5rem">
        ${cards.map((card, i) => `
          <wb-cardpricing 
            plan="${card.name}"
            price="${card.price}"
            period="${card.period}"
            features="${card.features.join(',')}"
            featured="${card.highlighted}"
            variant="${card.highlighted ? 'elevated' : 'default'}"
            class="pricing-card-item"
            card-index="${i}">
          </wb-cardpricing>
        `).join('')}
      </wb-grid>`;
    }
  },
  
  team: {
    name: 'Team Members',
    icon: '👥',
    wbComponent: 'wb-grid',
    getHtml: (data) => {
      const members = data?.members || [
        { name: 'Sarah Johnson', role: 'CEO & Founder', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', bio: '10+ years in tech leadership' },
        { name: 'Mike Chen', role: 'CTO', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', bio: 'Former Google engineer' },
        { name: 'Emily Davis', role: 'Head of Design', avatar: 'https://randomuser.me/api/portraits/women/68.jpg', bio: 'Award-winning UX designer' }
      ];
      return `<wb-grid columns="3" gap="2rem">
        ${members.map((member, i) => `
          <wb-cardprofile 
            name="${member.name}"
            role="${member.role}"
            avatar="${member.avatar}"
            bio="${member.bio}"
            align="center"
            card-index="${i}">
          </wb-cardprofile>
        `).join('')}
      </wb-grid>`;
    }
  },
  
  gallery: {
    name: 'Image Gallery',
    icon: '🖼️',
    wbComponent: 'wb-grid',
    getHtml: (data) => {
      const images = data?.images || [
        { src: '', alt: 'Image 1', icon: '📷' },
        { src: '', alt: 'Image 2', icon: '🖼️' },
        { src: '', alt: 'Image 3', icon: '🎨' }
      ];
      return `<wb-grid columns="3" gap="1rem">
        ${images.map((img, i) => img.src ? 
          `<wb-cardimage 
            src="${img.src}"
            alt="${img.alt}"
            aspect="1/1"
            variant="bordered"
            card-index="${i}">
          </wb-cardimage>` :
          `<wb-card variant="bordered" card-index="${i}">
            <div style="aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 3rem;">${img.icon}</div>
          </wb-card>`
        ).join('')}
      </wb-grid>`;
    }
  },
  
  faq: {
    name: 'FAQ Section',
    icon: '❓',
    wbComponent: 'wb-stack',
    getHtml: (data) => {
      const items = data?.items || [
        { question: 'What is this?', answer: 'This is an example FAQ item. Click to expand for more details.' },
        { question: 'How do I get started?', answer: 'Instructions for getting started will go here.' }
      ];
      return `<wb-stack gap="1rem" style="max-width: 600px;">
        ${items.map((item, i) => `
          <wb-cardexpandable 
            heading="${item.question}"
            description="${item.answer}"
            expanded="false"
            variant="bordered"
            card-index="${i}">
          </wb-cardexpandable>
        `).join('')}
      </wb-stack>`;
    }
  },
  
  cta: {
    name: 'Call to Action',
    icon: '📞',
    isCTA: true,
    wbComponent: 'wb-cardhero',
    getHtml: (data) => {
      const contactType = data?.contactType || 'phone';
      const phone = data?.phoneNumber || '(555) 123-4567';
      const email = data?.email || 'contact@example.com';
      const ctaText = contactType === 'phone' ? `📞 ${phone}` : `✉️ ${data?.buttonText || 'Send Us an Email'}`;
      const ctaHref = contactType === 'phone' ? `tel:${phone.replace(/[^0-9+]/g, '')}` : `mailto:${email}`;
      
      return `<wb-cardhero 
        heading="${data?.title || 'Ready to get started?'}"
        subtitle="${data?.description || 'Contact us today!'}"
        cta="${ctaText}"
        cta-href="${ctaHref}"
        variant="gradient"
        xalign="center">
      </wb-cardhero>`;
    }
  },
  
  card: {
    name: 'Card',
    icon: '🃏',
    isCard: true,
    cardTypes: {
      basic: {
        name: 'Basic Card',
        wbComponent: 'wb-cardimage',
        getHtml: (data) => `<wb-cardimage 
          src="${data?.image || ''}"
          heading="${data?.title || 'Card Title'}"
          subtitle="${data?.description || 'Card content goes here'}"
          aspect="16/9"
          variant="${data?.variant || 'bordered'}">
          ${!data?.image ? `<div style="aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center; font-size: 3rem; background: var(--bg-secondary);">${data?.icon || '🖼️'}</div>` : ''}
        </wb-cardimage>`
      },
      feature: {
        name: 'Feature Card',
        wbComponent: 'wb-card',
        getHtml: (data) => `<wb-card 
          heading="${data?.title || 'Feature Title'}"
          subtitle="${data?.description || 'Description goes here'}"
          variant="${data?.variant || 'bordered'}">
          <div style="font-size: 2.5rem; text-align: center; margin-bottom: 0.75rem;">${data?.icon || '✨'}</div>
        </wb-card>`
      },
      pricing: {
        name: 'Pricing Card',
        wbComponent: 'wb-cardpricing',
        getHtml: (data) => `<wb-cardpricing 
          plan="${data?.title || 'Plan Name'}"
          price="${data?.price || '$99'}"
          period="${data?.period || '/month'}"
          description="${data?.description || 'Plan description'}"
          features="${data?.features || ''}"
          featured="${data?.highlighted || 'false'}"
          variant="${data?.highlighted ? 'elevated' : 'default'}">
        </wb-cardpricing>`
      },
      team: {
        name: 'Team Member',
        wbComponent: 'wb-cardprofile',
        getHtml: (data) => `<wb-cardprofile 
          name="${data?.title || 'Team Member'}"
          role="${data?.subtitle || 'Role / Position'}"
          avatar="${data?.image || 'https://randomuser.me/api/portraits/lego/1.jpg'}"
          bio="${data?.description || 'Short bio here'}"
          align="center">
        </wb-cardprofile>`
      },
      testimonial: {
        name: 'Testimonial',
        wbComponent: 'wb-cardtestimonial',
        getHtml: (data) => `<wb-cardtestimonial 
          quote="${data?.description || 'Great service! Highly recommended.'}"
          author="${data?.title || 'Customer Name'}"
          role="${data?.subtitle || 'CEO at Company'}"
          avatar="${data?.image || 'https://randomuser.me/api/portraits/lego/2.jpg'}"
          variant="bordered">
        </wb-cardtestimonial>`
      },
      cta: {
        name: 'Call to Action',
        wbComponent: 'wb-cardhero',
        getHtml: (data) => {
          const contactType = data?.contactType || 'phone';
          const phone = data?.phoneNumber || '(555) 123-4567';
          const email = data?.email || 'contact@example.com';
          const ctaText = contactType === 'phone' ? `📞 ${phone}` : `✉️ ${data?.buttonText || 'Send Us an Email'}`;
          const ctaHref = contactType === 'phone' ? `tel:${phone.replace(/[^0-9+]/g, '')}` : `mailto:${email}`;
          
          return `<wb-cardhero 
            heading="${data?.title || 'Ready to get started?'}"
            subtitle="${data?.description || 'Contact us today!'}"
            cta="${ctaText}"
            cta-href="${ctaHref}"
            variant="gradient"
            xalign="center">
          </wb-cardhero>`;
        }
      }
    },
    getHtml: (data) => {
      const cardType = data?.cardType || 'basic';
      const template = componentTemplates.card.cardTypes[cardType];
      return template ? template.getHtml(data) : componentTemplates.card.cardTypes.basic.getHtml(data);
    }
  },
  
  footer: {
    name: 'Footer',
    icon: '🔻',
    wbComponent: 'wb-footer',
    getHtml: (data) => {
      const links = data?.links ? JSON.stringify(data.links) : '[]';
      const social = data?.social ? JSON.stringify(data.social) : '[]';
      return `<wb-footer 
        copyright="${data?.copyright || '© 2025 Your Company. All rights reserved.'}"
        brand="${data?.brand || ''}"
        links='${links}'
        social='${social}'
        sticky="${data?.sticky || 'false'}">
      </wb-footer>`;
    }
  },
  
  newsletter: {
    name: 'Newsletter Signup',
    icon: '📧',
    wbComponent: 'wb-newsletter',
    getHtml: (data) => `<wb-newsletter 
      heading="${data?.title || 'Subscribe to our newsletter'}"
      placeholder="${data?.placeholder || 'your@email.com'}"
      button-text="${data?.buttonText || 'Subscribe'}"
      variant="${data?.variant || 'default'}"
      action="${data?.action || ''}">
    </wb-newsletter>`
  }
};

// Expose to window for tests and external access
window.componentTemplates = componentTemplates;
