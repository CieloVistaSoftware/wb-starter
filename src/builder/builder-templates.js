/**
 * WB Builder Templates
 * Page templates and section templates for quick starts
 */

// =============================================================================
// SECTION TEMPLATES (Building blocks)
// =============================================================================
export const SECTION_TEMPLATES = [
  // HERO SECTIONS
  {
    id: 'hero-simple',
    name: 'Hero',
    icon: '🦸',
    desc: 'Eye-catching headline with CTA',
    category: 'hero',
    components: [
      { n: 'Hero', i: '🌌', b: 'hero', t: 'section', d: {
        variant: 'default',
        title: 'Welcome to Our Platform',
        subtitle: 'Build amazing experiences with our powerful tools',
        cta: 'Get Started',
        ctaHref: '#features',
        height: '500px',
        align: 'center',
        overlay: true
      }}
    ]
  },
  {
    id: 'hero-split',
    name: 'Hero Split',
    icon: '🦸',
    desc: 'Two-column hero with image',
    category: 'hero',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: {
        direction: 'row',
        gap: '2rem',
        align: 'center',
        padding: '4rem 2rem'
      }, container: true, children: [
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '1.5rem' }, container: true, children: [
          { n: 'Heading 1', t: 'h1', d: { text: 'Build Something Amazing' }},
          { n: 'Paragraph', t: 'p', d: { text: 'Create stunning websites without writing code. Our drag-and-drop builder makes it easy.' }},
          { n: 'Button', t: 'button', d: { text: 'Start Building', class: 'btn btn-primary btn-lg' }}
        ]},
        { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/500/400', alt: 'Hero image' }}
      ]}
    ]
  },
  {
    id: 'hero-video',
    name: 'Hero Video',
    icon: '🎬',
    desc: 'Hero with background video',
    category: 'hero',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: {
        direction: 'column',
        gap: '1.5rem',
        align: 'center',
        padding: '6rem 2rem'
      }, container: true, children: [
        { n: 'Heading 1', t: 'h1', d: { text: 'Experience the Future' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Immersive experiences await' }},
        { n: 'Button', t: 'button', d: { text: 'Watch Demo', class: 'btn btn-primary btn-lg' }}
      ]}
    ]
  },

  // FEATURE SECTIONS
  {
    id: 'features-grid',
    name: 'Features',
    icon: '✨',
    desc: '3-column feature cards',
    category: 'features',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Why Choose Us' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3' }, container: true, gridChildren: [
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '⚡ Lightning Fast', subtitle: 'Optimized for speed and performance' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '🎨 Beautiful Design', subtitle: 'Stunning templates and components' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '🔒 Secure', subtitle: 'Built with security in mind' }}
        ]}
      ]}
    ]
  },
  {
    id: 'features-list',
    name: 'Features List',
    icon: '📋',
    desc: 'Vertical feature list with icons',
    category: 'features',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '1.5rem', padding: '4rem 2rem' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Everything You Need' }},
        { n: 'List', b: 'list', t: 'ul', d: { items: '✓ Easy drag-and-drop interface,✓ 100+ pre-built components,✓ Responsive design out of the box,✓ Export clean HTML/CSS,✓ No coding required' }}
      ]}
    ]
  },

  // PRICING SECTIONS
  {
    id: 'pricing-table',
    name: 'Pricing',
    icon: '💰',
    desc: '3-tier pricing comparison',
    category: 'pricing',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Simple Pricing' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Choose the plan that works for you' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3' }, container: true, gridChildren: [
          { n: 'Card Pricing', i: '💰', b: 'cardpricing', t: 'article', d: { plan: 'Starter', price: '$9', period: '/mo', features: '5 Projects,Basic Support,1GB Storage', cta: 'Get Started' }},
          { n: 'Card Pricing', i: '💰', b: 'cardpricing', t: 'article', d: { plan: 'Pro', price: '$29', period: '/mo', features: 'Unlimited Projects,Priority Support,10GB Storage,API Access', cta: 'Go Pro', featured: 'true' }},
          { n: 'Card Pricing', i: '💰', b: 'cardpricing', t: 'article', d: { plan: 'Enterprise', price: '$99', period: '/mo', features: 'Everything in Pro,Dedicated Support,Unlimited Storage,Custom Integrations,SLA', cta: 'Contact Sales' }}
        ]}
      ]}
    ]
  },

  // TEAM SECTIONS
  {
    id: 'team-section',
    name: 'Team',
    icon: '👥',
    desc: 'Team member profiles',
    category: 'team',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Meet Our Team' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '4' }, container: true, gridChildren: [
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Alex Johnson', role: 'CEO & Founder', avatar: 'https://i.pravatar.cc/150?img=1' }},
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Sarah Chen', role: 'CTO', avatar: 'https://i.pravatar.cc/150?img=5' }},
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Mike Roberts', role: 'Lead Designer', avatar: 'https://i.pravatar.cc/150?img=3' }},
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Emily Davis', role: 'Developer', avatar: 'https://i.pravatar.cc/150?img=9' }}
        ]}
      ]}
    ]
  },

  // TESTIMONIAL SECTIONS
  {
    id: 'testimonials',
    name: 'Testimonials',
    icon: '💬',
    desc: 'Customer testimonials',
    category: 'social-proof',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'What Our Customers Say' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3' }, container: true, gridChildren: [
          { n: 'Card Testimonial', i: '💬', b: 'cardtestimonial', t: 'blockquote', d: { quote: 'This product transformed our workflow. Highly recommended!', author: 'Sarah J.', role: 'CEO, TechCorp', rating: '5' }},
          { n: 'Card Testimonial', i: '💬', b: 'cardtestimonial', t: 'blockquote', d: { quote: 'Incredible support and amazing features. 5 stars!', author: 'Mike R.', role: 'Designer', rating: '5' }},
          { n: 'Card Testimonial', i: '💬', b: 'cardtestimonial', t: 'blockquote', d: { quote: 'Best investment we made this year. Period.', author: 'Lisa M.', role: 'Founder', rating: '5' }}
        ]}
      ]}
    ]
  },

  // STATS SECTIONS
  {
    id: 'stats-section',
    name: 'Stats',
    icon: '📊',
    desc: 'Key metrics display',
    category: 'social-proof',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '4' }, container: true, gridChildren: [
          { n: 'Card Stats', i: '📈', b: 'cardstats', t: 'article', d: { value: '10,000+', label: 'Happy Users', icon: '👥', trend: 'up', trendValue: '+12%' }},
          { n: 'Card Stats', i: '📈', b: 'cardstats', t: 'article', d: { value: '$2.5M', label: 'Revenue', icon: '💰', trend: 'up', trendValue: '+18%' }},
          { n: 'Card Stats', i: '📈', b: 'cardstats', t: 'article', d: { value: '500+', label: 'Projects', icon: '📁', trend: 'up', trendValue: '+25%' }},
          { n: 'Card Stats', i: '📈', b: 'cardstats', t: 'article', d: { value: '99.9%', label: 'Uptime', icon: '⚡' }}
        ]}
      ]}
    ]
  },

  // FAQ SECTIONS
  {
    id: 'faq-section',
    name: 'FAQ',
    icon: '❓',
    desc: 'Frequently asked questions',
    category: 'faq',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '1.5rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Frequently Asked Questions' }},
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'What is this product?' }, children: [{ t: 'p', text: 'This is an amazing product that helps you build websites quickly and easily.' }]},
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'How do I get started?' }, children: [{ t: 'p', text: 'Simply sign up for an account and follow our quick start guide.' }]},
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'Is there a free trial?' }, children: [{ t: 'p', text: 'Yes! We offer a 14-day free trial with all features included.' }]},
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'How do I contact support?' }, children: [{ t: 'p', text: 'You can reach our support team via email or live chat 24/7.' }]}
        ]}
      ]}
    ]
  },

  // CONTACT SECTIONS
  {
    id: 'contact-section',
    name: 'Contact',
    icon: '📧',
    desc: 'Contact form section',
    category: 'contact',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Get In Touch' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Have questions? We\'d love to hear from you.' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '2' }, container: true, gridChildren: [
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📍 Address', subtitle: '123 Main Street, City, State 12345' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📞 Phone', subtitle: '(555) 123-4567' }}
        ]}
      ]}
    ]
  },

  // CTA SECTIONS
  {
    id: 'cta-section',
    name: 'CTA',
    icon: '🎯',
    desc: 'Call to action banner',
    category: 'cta',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '1.5rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Ready to Get Started?' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Join thousands of happy customers today.' }},
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'row', gap: '1rem', justify: 'center' }, container: true, children: [
          { n: 'Button', t: 'button', d: { text: 'Start Free Trial', class: 'btn btn-primary btn-lg' }},
          { n: 'Button', t: 'button', d: { text: 'Learn More', class: 'btn btn-outline btn-lg' }}
        ]}
      ]}
    ]
  },

  // FOOTER SECTIONS
  {
    id: 'footer-simple',
    name: 'Footer',
    icon: '📋',
    desc: 'Simple footer with links',
    category: 'footer',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'footer', d: { direction: 'row', gap: '2rem', padding: '2rem', justify: 'space-between', align: 'center' }, container: true, children: [
        { n: 'Paragraph', t: 'p', d: { text: '© 2025 Your Company. All rights reserved.' }},
        { n: 'Container', b: 'container', t: 'nav', d: { direction: 'row', gap: '1.5rem' }, container: true, children: [
          { n: 'Link', t: 'a', d: { text: 'Privacy', href: '#privacy' }},
          { n: 'Link', t: 'a', d: { text: 'Terms', href: '#terms' }},
          { n: 'Link', t: 'a', d: { text: 'Contact', href: '#contact' }}
        ]}
      ]}
    ]
  },
  {
    id: 'footer-columns',
    name: 'Footer Columns',
    icon: '📋',
    desc: 'Multi-column footer',
    category: 'footer',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'footer', d: { direction: 'column', gap: '2rem', padding: '3rem 2rem' }, container: true, children: [
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '4' }, container: true, gridChildren: [
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Company' }},
            { n: 'Link', t: 'a', d: { text: 'About', href: '#about' }},
            { n: 'Link', t: 'a', d: { text: 'Careers', href: '#careers' }},
            { n: 'Link', t: 'a', d: { text: 'Press', href: '#press' }}
          ]},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Product' }},
            { n: 'Link', t: 'a', d: { text: 'Features', href: '#features' }},
            { n: 'Link', t: 'a', d: { text: 'Pricing', href: '#pricing' }},
            { n: 'Link', t: 'a', d: { text: 'FAQ', href: '#faq' }}
          ]},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Support' }},
            { n: 'Link', t: 'a', d: { text: 'Help Center', href: '#help' }},
            { n: 'Link', t: 'a', d: { text: 'Contact', href: '#contact' }},
            { n: 'Link', t: 'a', d: { text: 'Status', href: '#status' }}
          ]},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Legal' }},
            { n: 'Link', t: 'a', d: { text: 'Privacy', href: '#privacy' }},
            { n: 'Link', t: 'a', d: { text: 'Terms', href: '#terms' }},
            { n: 'Link', t: 'a', d: { text: 'Cookies', href: '#cookies' }}
          ]}
        ]},
        { n: 'Paragraph', t: 'p', d: { text: '© 2025 Your Company. All rights reserved.' }}
      ]}
    ]
  },

  // GALLERY SECTIONS
  {
    id: 'gallery-grid',
    name: 'Gallery',
    icon: '🖼️',
    desc: 'Image gallery grid',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Our Work' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3' }, container: true, gridChildren: [
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?1', alt: 'Project 1' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?2', alt: 'Project 2' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?3', alt: 'Project 3' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?4', alt: 'Project 4' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?5', alt: 'Project 5' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?6', alt: 'Project 6' }}
        ]}
      ]}
    ]
  },

  // BLOG SECTIONS
  {
    id: 'blog-grid',
    name: 'Blog Posts',
    icon: '📝',
    desc: 'Blog post cards',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Latest Posts' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3' }, container: true, gridChildren: [
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'Getting Started', subtitle: 'Learn the basics in 5 minutes', image: 'https://picsum.photos/400/250?10' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'Advanced Tips', subtitle: 'Level up your workflow', image: 'https://picsum.photos/400/250?11' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'Case Study', subtitle: 'How Company X grew 300%', image: 'https://picsum.photos/400/250?12' }}
        ]}
      ]}
    ]
  },

  // NEWSLETTER SECTION
  {
    id: 'newsletter',
    name: 'Newsletter',
    icon: '📬',
    desc: 'Email signup form',
    category: 'cta',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '1.5rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Stay Updated' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Get the latest news and updates delivered to your inbox.' }},
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'row', gap: '0.5rem', justify: 'center' }, container: true, children: [
          { n: 'Input', i: '⌨️', t: 'input', d: { type: 'email', placeholder: 'Enter your email' }},
          { n: 'Button', t: 'button', d: { text: 'Subscribe', class: 'btn btn-primary' }}
        ]}
      ]}
    ]
  }
];

// =============================================================================
// PAGE TEMPLATES (Full pages) - Organized by Category
// =============================================================================
export const PAGE_TEMPLATES = [
  // LANDING PAGES
  {
    id: 'landing-saas',
    name: 'SaaS Landing',
    icon: '🚀',
    desc: 'Perfect for software products',
    category: 'landing',
    preview: 'Hero → Features → Pricing → Testimonials → CTA → Footer',
    sections: ['hero-simple', 'features-grid', 'stats-section', 'pricing-table', 'testimonials', 'cta-section', 'footer-simple']
  },
  {
    id: 'landing-agency',
    name: 'Agency',
    icon: '🏢',
    desc: 'Creative agency showcase',
    category: 'landing',
    preview: 'Hero → Stats → Team → Testimonials → Contact → Footer',
    sections: ['hero-split', 'stats-section', 'team-section', 'testimonials', 'contact-section', 'footer-simple']
  },
  {
    id: 'landing-app',
    name: 'App Launch',
    icon: '📱',
    desc: 'Mobile app landing page',
    category: 'landing',
    preview: 'Hero → Features → Stats → Testimonials → CTA → Footer',
    sections: ['hero-simple', 'features-grid', 'stats-section', 'testimonials', 'cta-section', 'footer-simple']
  },
  {
    id: 'landing-startup',
    name: 'Startup',
    icon: '💡',
    desc: 'Early-stage startup page',
    category: 'landing',
    preview: 'Hero → Features → Team → CTA → Footer',
    sections: ['hero-split', 'features-grid', 'team-section', 'cta-section', 'footer-simple']
  },
  {
    id: 'landing-coming-soon',
    name: 'Coming Soon',
    icon: '⏳',
    desc: 'Pre-launch teaser page',
    category: 'landing',
    preview: 'Hero → Stats → Newsletter → Footer',
    sections: ['hero-simple', 'stats-section', 'newsletter', 'footer-simple']
  },

  // PRODUCT PAGES
  {
    id: 'product-single',
    name: 'Product Page',
    icon: '🛍️',
    desc: 'Single product showcase',
    category: 'product',
    preview: 'Hero → Features → Pricing → FAQ → Footer',
    sections: ['hero-split', 'features-grid', 'pricing-table', 'faq-section', 'footer-simple']
  },
  {
    id: 'product-comparison',
    name: 'Comparison',
    icon: '⚖️',
    desc: 'Product comparison page',
    category: 'product',
    preview: 'Hero → Features → Pricing → Testimonials → Footer',
    sections: ['hero-simple', 'features-list', 'pricing-table', 'testimonials', 'footer-simple']
  },

  // PORTFOLIO PAGES
  {
    id: 'portfolio-creative',
    name: 'Portfolio',
    icon: '🎨',
    desc: 'Creative portfolio',
    category: 'portfolio',
    preview: 'Hero → Gallery → Stats → Contact → Footer',
    sections: ['hero-simple', 'gallery-grid', 'stats-section', 'contact-section', 'footer-simple']
  },
  {
    id: 'portfolio-developer',
    name: 'Developer',
    icon: '💻',
    desc: 'Developer portfolio',
    category: 'portfolio',
    preview: 'Hero → Stats → Features → Contact → Footer',
    sections: ['hero-split', 'stats-section', 'features-grid', 'contact-section', 'footer-columns']
  },

  // BLOG PAGES
  {
    id: 'blog-home',
    name: 'Blog Home',
    icon: '📝',
    desc: 'Blog listing page',
    category: 'blog',
    preview: 'Hero → Blog Posts → Newsletter → Footer',
    sections: ['hero-simple', 'blog-grid', 'newsletter', 'footer-simple']
  },

  // COMPANY PAGES
  {
    id: 'full-company-site',
    name: 'Full Company Site',
    icon: '🏢',
    desc: 'Complete corporate website',
    category: 'company',
    preview: 'Hero → Features → Stats → Team → Pricing → Testimonials → Contact → Footer',
    sections: ['hero-video', 'features-grid', 'stats-section', 'team-section', 'pricing-table', 'testimonials', 'contact-section', 'footer-columns']
  },
  {
    id: 'about-company',
    name: 'About Us',
    icon: '👋',
    desc: 'Company about page',
    category: 'company',
    preview: 'Hero → Stats → Team → Testimonials → Footer',
    sections: ['hero-split', 'stats-section', 'team-section', 'testimonials', 'footer-columns']
  },
  {
    id: 'pricing-page',
    name: 'Pricing',
    icon: '💳',
    desc: 'Dedicated pricing page',
    category: 'company',
    preview: 'Hero → Pricing → FAQ → CTA → Footer',
    sections: ['hero-simple', 'pricing-table', 'faq-section', 'cta-section', 'footer-simple']
  },
  {
    id: 'contact-page',
    name: 'Contact',
    icon: '📞',
    desc: 'Contact page',
    category: 'company',
    preview: 'Hero → Contact → FAQ → Footer',
    sections: ['hero-simple', 'contact-section', 'faq-section', 'footer-simple']
  },

  // DASHBOARD PAGES
  {
    id: 'dashboard-analytics',
    name: 'Analytics',
    icon: '📊',
    desc: 'Analytics dashboard layout',
    category: 'dashboard',
    preview: 'Stats → Features → Gallery',
    sections: ['stats-section', 'features-grid', 'gallery-grid']
  },
  {
    id: 'dashboard-admin',
    name: 'Admin Panel',
    icon: '⚙️',
    desc: 'Admin dashboard layout',
    category: 'dashboard',
    preview: 'Stats → Features → Team',
    sections: ['stats-section', 'features-grid', 'team-section']
  },

  // MINIMAL PAGES
  {
    id: 'minimal-one-page',
    name: 'One Page',
    icon: '📄',
    desc: 'Simple one-page site',
    category: 'minimal',
    preview: 'Hero → Features → CTA → Footer',
    sections: ['hero-simple', 'features-grid', 'cta-section', 'footer-simple']
  },
  {
    id: 'minimal-profile',
    name: 'Profile',
    icon: '👤',
    desc: 'Personal profile page',
    category: 'minimal',
    preview: 'Hero → Stats → Contact → Footer',
    sections: ['hero-split', 'stats-section', 'contact-section', 'footer-simple']
  }
];

// =============================================================================
// TEMPLATE CATEGORIES (for UI grouping)
// =============================================================================
export const PAGE_CATEGORIES = [
  { id: 'landing', name: 'Landing Pages', icon: '🚀', desc: 'Marketing & conversion focused' },
  { id: 'product', name: 'Product', icon: '🛍️', desc: 'Product showcases & comparisons' },
  { id: 'portfolio', name: 'Portfolio', icon: '🎨', desc: 'Creative & developer portfolios' },
  { id: 'blog', name: 'Blog', icon: '📝', desc: 'Content & article pages' },
  { id: 'company', name: 'Company', icon: '🏢', desc: 'About, pricing & contact' },
  { id: 'dashboard', name: 'Dashboard', icon: '📊', desc: 'Analytics & admin layouts' },
  { id: 'minimal', name: 'Minimal', icon: '📄', desc: 'Simple & clean designs' }
];

export const SECTION_CATEGORIES = [
  { id: 'hero', name: 'Hero', icon: '🦸' },
  { id: 'features', name: 'Features', icon: '✨' },
  { id: 'pricing', name: 'Pricing', icon: '💰' },
  { id: 'team', name: 'Team', icon: '👥' },
  { id: 'social-proof', name: 'Social Proof', icon: '💬' },
  { id: 'faq', name: 'FAQ', icon: '❓' },
  { id: 'contact', name: 'Contact', icon: '📧' },
  { id: 'cta', name: 'CTA', icon: '🎯' },
  { id: 'footer', name: 'Footer', icon: '📋' },
  { id: 'content', name: 'Content', icon: '📝' }
];

// =============================================================================
// TEMPLATE HELPERS
// =============================================================================

/**
 * Get section template by ID
 */
export function getSectionTemplate(id) {
  return SECTION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get page template by ID
 */
export function getPageTemplate(id) {
  return PAGE_TEMPLATES.find(t => t.id === id);
}

/**
 * Expand page template to full component list
 */
export function expandPageTemplate(pageTemplate) {
  const components = [];
  for (const sectionId of pageTemplate.sections) {
    const section = getSectionTemplate(sectionId);
    if (section) {
      components.push(...section.components);
    }
  }
  return components;
}

/**
 * Get templates by category
 */
export function getPageTemplatesByCategory(categoryId) {
  return PAGE_TEMPLATES.filter(t => t.category === categoryId);
}

/**
 * Get section templates by category
 */
export function getSectionTemplatesByCategory(categoryId) {
  return SECTION_TEMPLATES.filter(t => t.category === categoryId);
}

/**
 * Get unique categories from section templates
 */
export function getSectionCategories() {
  const categories = new Set();
  SECTION_TEMPLATES.forEach(t => categories.add(t.category));
  return Array.from(categories);
}

/**
 * Get unique categories from page templates
 */
export function getPageCategories() {
  const categories = new Set();
  PAGE_TEMPLATES.forEach(t => categories.add(t.category));
  return Array.from(categories);
}
