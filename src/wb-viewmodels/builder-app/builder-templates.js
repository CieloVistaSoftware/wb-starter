/**
 * WB Builder Templates Registry
 * -----------------------------------------------------------------------------
 * This file contains the definitions for all Page and Section templates used
 * in the Website Builder.
 *
 * HOW TO USE:
 * 1. To add a new Section Template:
 *    - Add an entry to the SECTION_TEMPLATES array.
 *    - Ensure it has a unique 'id'.
 *    - Assign it to a 'category' (see SECTION_CATEGORIES).
 *    - Define the 'components' array using the WB shorthand:
 *      n: name, i: icon, b: behavior, t: tag, d: data attributes
 *
 * 2. To add a new Page Template:
 *    - Add an entry to the PAGE_TEMPLATES array.
 *    - Define the 'sections' array with IDs of sections to include.
 *    - Provide a 'preview' string describing the flow.
 *
 * 3. To add a new Category:
 *    - Add to PAGE_CATEGORIES or SECTION_CATEGORIES arrays.
 *
 * 4. Theming:
 *    - Templates automatically inherit the active theme.
 *    - Use standard components (Card, Hero, Section) for best results.
 * -----------------------------------------------------------------------------
 */

// =============================================================================
// SECTION TEMPLATES (Building blocks)
// =============================================================================

// ABBREVIATION KEY (Used in components arrays):
// n: name (Display name in builder)
// i: icon (Emoji for UI)
// b: behavior (WB behavior ID)
// t: tag (HTML tag name)
// d: data (Properties/Attributes)

export const SECTION_TEMPLATES = [
  // ==========================================================================
  // SPA SECTIONS - Single Page App with anchor IDs for header navigation
  // ==========================================================================
  
  // SPA HEADER with working navigation links
  {
    id: 'spa-header',
    name: 'SPA Header',
    icon: '🔝',
    desc: 'Navigation header with anchor links',
    category: 'header',
    components: [
      { n: 'Header', i: '🔝', b: 'header', t: 'header', d: {
        logo: 'YourBrand',
        sticky: 'true'
      }, container: true, children: [
        { n: 'Nav', t: 'nav', d: { class: 'header-nav' }, container: true, children: [
          { n: 'Link', t: 'a', d: { text: 'Home', href: '#home', class: 'nav-link' }},
          { n: 'Link', t: 'a', d: { text: 'About', href: '#about', class: 'nav-link' }},
          { n: 'Link', t: 'a', d: { text: 'Services', href: '#services', class: 'nav-link' }},
          { n: 'Link', t: 'a', d: { text: 'Portfolio', href: '#portfolio', class: 'nav-link' }},
          { n: 'Link', t: 'a', d: { text: 'Team', href: '#team', class: 'nav-link' }},
          { n: 'Link', t: 'a', d: { text: 'Pricing', href: '#pricing', class: 'nav-link' }},
          { n: 'Link', t: 'a', d: { text: 'Contact', href: '#contact', class: 'nav-link' }}
        ]}
      ]}
    ]
  },

  // SPA HOME Section
  {
    id: 'spa-home',
    name: 'Home',
    icon: '🏠',
    desc: 'Hero section with id="home"',
    category: 'spa',
    components: [
      { n: 'Hero', i: '🌌', b: 'hero', t: 'section', d: {
        id: 'home',
        variant: 'default',
        title: 'Welcome to Our Platform',
        subtitle: 'Build amazing experiences with our powerful tools and expert team',
        cta: 'Get Started',
        ctaHref: '#contact',
        height: '100vh',
        align: 'center',
        overlay: true
      }}
    ]
  },

  // SPA ABOUT Section
  {
    id: 'spa-about',
    name: 'About',
    icon: 'ℹ️',
    desc: 'About section with id="about"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'about',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center',
        maxWidth: '1000px',
        margin: '0 auto'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'About Us' }},
        { n: 'Paragraph', t: 'p', d: { text: 'We are a passionate team dedicated to delivering exceptional results. With years of experience and a commitment to excellence, we help businesses grow and succeed in the digital age.' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '🎯 Our Mission', subtitle: 'To empower businesses with innovative solutions that drive growth and success.' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '👁️ Our Vision', subtitle: 'To be the leading provider of digital solutions that transform industries.' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '💎 Our Values', subtitle: 'Integrity, innovation, and customer success guide everything we do.' }}
        ]}
      ]}
    ]
  },

  // SPA SERVICES Section
  {
    id: 'spa-services',
    name: 'Services',
    icon: '🛠️',
    desc: 'Services section with id="services"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'services',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Our Services' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Comprehensive solutions tailored to your needs' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '💻 Web Development', subtitle: 'Custom websites and web applications built with modern technologies.' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📱 Mobile Apps', subtitle: 'Native and cross-platform mobile applications for iOS and Android.' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '☁️ Cloud Solutions', subtitle: 'Scalable cloud infrastructure and deployment services.' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '🎨 UI/UX Design', subtitle: 'Beautiful, intuitive designs that delight users.' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📊 Analytics', subtitle: 'Data-driven insights to optimize your business.' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '🔒 Security', subtitle: 'Enterprise-grade security for your digital assets.' }}
        ]}
      ]}
    ]
  },

  // SPA PORTFOLIO Section
  {
    id: 'spa-portfolio',
    name: 'Portfolio',
    icon: '🖼️',
    desc: 'Portfolio section with id="portfolio"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'portfolio',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Our Work' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Check out some of our recent projects' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3', gap: '1.5rem' }, container: true, gridChildren: [
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'E-Commerce Platform', subtitle: 'Full-stack online store', image: 'https://picsum.photos/400/300?1' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'Mobile Banking App', subtitle: 'Secure fintech solution', image: 'https://picsum.photos/400/300?2' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'Healthcare Portal', subtitle: 'Patient management system', image: 'https://picsum.photos/400/300?3' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'SaaS Dashboard', subtitle: 'Analytics platform', image: 'https://picsum.photos/400/300?4' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'Social Network', subtitle: 'Community platform', image: 'https://picsum.photos/400/300?5' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'AI Assistant', subtitle: 'Machine learning app', image: 'https://picsum.photos/400/300?6' }}
        ]}
      ]}
    ]
  },

  // SPA TEAM Section
  {
    id: 'spa-team',
    name: 'Team',
    icon: '👥',
    desc: 'Team section with id="team"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'team',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Meet Our Team' }},
        { n: 'Paragraph', t: 'p', d: { text: 'The talented people behind our success' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '4', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Alex Johnson', role: 'CEO & Founder', avatar: 'https://i.pravatar.cc/150?img=1' }},
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Sarah Chen', role: 'CTO', avatar: 'https://i.pravatar.cc/150?img=5' }},
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Mike Roberts', role: 'Lead Designer', avatar: 'https://i.pravatar.cc/150?img=3' }},
          { n: 'Card Profile', i: '👨', b: 'cardprofile', t: 'article', d: { name: 'Emily Davis', role: 'Lead Developer', avatar: 'https://i.pravatar.cc/150?img=9' }}
        ]}
      ]}
    ]
  },

  // SPA TESTIMONIALS Section
  {
    id: 'spa-testimonials',
    name: 'Testimonials',
    icon: '💬',
    desc: 'Testimonials section with id="testimonials"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'testimonials',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'What Our Clients Say' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card Testimonial', i: '💬', b: 'cardtestimonial', t: 'blockquote', d: { quote: 'Working with this team transformed our business. Highly recommended!', author: 'Sarah J.', role: 'CEO, TechCorp', rating: '5' }},
          { n: 'Card Testimonial', i: '💬', b: 'cardtestimonial', t: 'blockquote', d: { quote: 'Incredible support and amazing results. They exceeded all expectations.', author: 'Mike R.', role: 'CTO, StartupXYZ', rating: '5' }},
          { n: 'Card Testimonial', i: '💬', b: 'cardtestimonial', t: 'blockquote', d: { quote: 'Best investment we made this year. Our revenue increased 200%.', author: 'Lisa M.', role: 'Founder, GrowthCo', rating: '5' }}
        ]}
      ]}
    ]
  },

  // SPA PRICING Section
  {
    id: 'spa-pricing',
    name: 'Pricing',
    icon: '💰',
    desc: 'Pricing section with id="pricing"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'pricing',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Simple Pricing' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Choose the plan that works best for you' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card Pricing', i: '💰', b: 'cardpricing', t: 'article', d: { plan: 'Starter', price: '$29', period: '/mo', features: '5 Projects,Basic Support,1GB Storage,Email Support', cta: 'Get Started' }},
          { n: 'Card Pricing', i: '💰', b: 'cardpricing', t: 'article', d: { plan: 'Professional', price: '$79', period: '/mo', features: 'Unlimited Projects,Priority Support,25GB Storage,Phone & Email,API Access', cta: 'Go Pro', featured: 'true' }},
          { n: 'Card Pricing', i: '💰', b: 'cardpricing', t: 'article', d: { plan: 'Enterprise', price: '$199', period: '/mo', features: 'Everything in Pro,Dedicated Manager,Unlimited Storage,Custom Integrations,SLA,White Label', cta: 'Contact Sales' }}
        ]}
      ]}
    ]
  },

  // SPA FAQ Section
  {
    id: 'spa-faq',
    name: 'FAQ',
    icon: '❓',
    desc: 'FAQ section with id="faq"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'faq',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center',
        maxWidth: '800px',
        margin: '0 auto'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Frequently Asked Questions' }},
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem', width: '100%' }, container: true, children: [
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'How do I get started?' }, children: [{ t: 'p', text: 'Simply sign up for an account and follow our quick start guide. You can be up and running in minutes.' }]},
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'What payment methods do you accept?' }, children: [{ t: 'p', text: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.' }]},
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'Can I cancel anytime?' }, children: [{ t: 'p', text: 'Yes! You can cancel your subscription at any time with no questions asked.' }]},
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'Do you offer refunds?' }, children: [{ t: 'p', text: 'We offer a 30-day money-back guarantee on all plans.' }]},
          { n: 'Details', b: 'details', t: 'details', d: { summary: 'How do I contact support?' }, children: [{ t: 'p', text: 'You can reach our support team via email, live chat, or phone 24/7.' }]}
        ]}
      ]}
    ]
  },

  // SPA CONTACT Section
  {
    id: 'spa-contact',
    name: 'Contact',
    icon: '📧',
    desc: 'Contact section with id="contact"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'contact',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Get In Touch' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Have questions? We\'d love to hear from you.' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '2', gap: '3rem', maxWidth: '1000px' }, container: true, gridChildren: [
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '1.5rem' }, container: true, children: [
            { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📍 Address', subtitle: '123 Main Street\nSan Francisco, CA 94102' }},
            { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📞 Phone', subtitle: '(555) 123-4567' }},
            { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📧 Email', subtitle: 'hello@example.com' }},
            { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '🕒 Hours', subtitle: 'Mon-Fri: 9am-6pm\nSat-Sun: Closed' }}
          ]},
          { n: 'Card', b: 'card', t: 'div', d: { title: 'Send a Message' }, container: true, children: [
            { n: 'Input', t: 'input', d: { type: 'text', placeholder: 'Your Name' }},
            { n: 'Input', t: 'input', d: { type: 'email', placeholder: 'Your Email' }},
            { n: 'Textarea', t: 'textarea', d: { placeholder: 'Your Message', rows: '4' }},
            { n: 'Button', t: 'button', d: { text: 'Send Message', class: 'btn btn-primary btn-block' }}
          ]}
        ]}
      ]}
    ]
  },

  // SPA BLOG Section
  {
    id: 'spa-blog',
    name: 'Blog',
    icon: '📝',
    desc: 'Blog section with id="blog"',
    category: 'spa',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { 
        id: 'blog',
        direction: 'column', 
        gap: '2rem', 
        padding: '5rem 2rem', 
        align: 'center'
      }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Latest News' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Stay updated with our latest insights' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: '10 Tips for Better Design', subtitle: 'March 15, 2025', image: 'https://picsum.photos/400/250?10' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'The Future of AI', subtitle: 'March 10, 2025', image: 'https://picsum.photos/400/250?11' }},
          { n: 'Card Overlay', i: '🎨', b: 'cardoverlay', t: 'article', d: { title: 'Remote Work Best Practices', subtitle: 'March 5, 2025', image: 'https://picsum.photos/400/250?12' }}
        ]}
      ]}
    ]
  },

  // SPA FOOTER Section
  {
    id: 'spa-footer',
    name: 'SPA Footer',
    icon: '📋',
    desc: 'Footer with nav links matching header',
    category: 'footer',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'footer', d: { direction: 'column', gap: '2rem', padding: '3rem 2rem' }, container: true, children: [
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '4' }, container: true, gridChildren: [
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Company' }},
            { n: 'Link', t: 'a', d: { text: 'Home', href: '#home' }},
            { n: 'Link', t: 'a', d: { text: 'About', href: '#about' }},
            { n: 'Link', t: 'a', d: { text: 'Team', href: '#team' }}
          ]},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Services' }},
            { n: 'Link', t: 'a', d: { text: 'Services', href: '#services' }},
            { n: 'Link', t: 'a', d: { text: 'Pricing', href: '#pricing' }},
            { n: 'Link', t: 'a', d: { text: 'Portfolio', href: '#portfolio' }}
          ]},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Support' }},
            { n: 'Link', t: 'a', d: { text: 'FAQ', href: '#faq' }},
            { n: 'Link', t: 'a', d: { text: 'Contact', href: '#contact' }},
            { n: 'Link', t: 'a', d: { text: 'Blog', href: '#blog' }}
          ]},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '0.5rem' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Connect' }},
            { n: 'Link', t: 'a', d: { text: 'Twitter', href: '#' }},
            { n: 'Link', t: 'a', d: { text: 'LinkedIn', href: '#' }},
            { n: 'Link', t: 'a', d: { text: 'GitHub', href: '#' }}
          ]}
        ]},
        { n: 'Paragraph', t: 'p', d: { text: '© 2025 YourBrand. All rights reserved.', style: 'text-align: center; opacity: 0.7;' }}
      ]}
    ]
  },

  // CIELO VISTA SECTIONS
  {
    id: 'cv-hero',
    name: 'Cielo Hero',
    icon: '🚀',
    desc: 'Cielo Vista Software Hero',
    category: 'hero',
    components: [
      { n: 'Hero', i: '🌌', b: 'hero', t: 'section', d: {
        variant: 'default',
        title: 'Expert Software & Consulting Solutions',
        subtitle: 'Cielo Vista Software delivers cutting-edge software solutions and expert consulting services from the heart of Rochester.',
        cta: 'View Services',
        ctaHref: '#services',
        height: '600px',
        align: 'center',
        overlay: true
      }}
    ]
  },
  {
    id: 'cv-services',
    name: 'Cielo Services',
    icon: '🛠️',
    desc: 'Cielo Vista Services Grid',
    category: 'features',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Innovative Solutions' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3' }, container: true, gridChildren: [
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: 'Custom Software Development', subtitle: 'Tailored development for your needs' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: 'Consulting Services', subtitle: 'Expert advice and strategy' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: 'Subscription-Based Software', subtitle: 'Scalable software products' }}
        ]}
      ]}
    ]
  },
  {
    id: 'cv-about',
    name: 'Cielo About',
    icon: 'ℹ️',
    desc: 'Cielo Vista About Section',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '1.5rem', padding: '4rem 2rem', align: 'center', maxWidth: '800px', margin: '0 auto' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'About Us' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Our team is dedicated to helping businesses thrive by leveraging technology to enhance efficiency and drive growth. With a focus on innovation and client satisfaction, we partner with you to create tailored solutions that meet your unique needs.' }}
      ]}
    ]
  },
  {
    id: 'cv-contact',
    name: 'Cielo Contact',
    icon: '📧',
    desc: 'Cielo Vista Contact Info',
    category: 'contact',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Get In Touch' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '3' }, container: true, gridChildren: [
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📍 Location', subtitle: 'Rochester, MN US' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '📧 Email', subtitle: 'jwpminnesota@gmail.com' }},
          { n: 'Card', i: '🃏', b: 'card', t: 'article', d: { title: '🕒 Hours', subtitle: 'Mon-Fri: 9am-10pm\nSat: 9am-6pm\nSun: 9am-12pm' }}
        ]}
      ]}
    ]
  },

  // HERO SECTIONS
  {
    id: 'hero-simple',
    name: 'Hero Center',
    icon: '🦸',
    desc: 'Centered headline with CTA',
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
    icon: '🌓',
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
  {
    id: 'hero-form',
    name: 'Hero Form',
    icon: '📝',
    desc: 'Hero with signup form',
    category: 'hero',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'row', gap: '4rem', padding: '4rem 2rem', align: 'center', justify: 'center' }, container: true, children: [
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '1.5rem', width: '50%' }, container: true, children: [
          { n: 'Heading 1', t: 'h1', d: { text: 'Join the Revolution' }},
          { n: 'Paragraph', t: 'p', d: { text: 'Sign up today and get exclusive access to our premium features.' }}
        ]},
        { n: 'Card', b: 'card', t: 'div', d: { title: 'Sign Up Now', subtitle: 'Free 14-day trial' }, container: true, children: [
           { n: 'Input', t: 'input', d: { type: 'email', placeholder: 'Email Address' }},
           { n: 'Input', t: 'input', d: { type: 'password', placeholder: 'Password' }},
           { n: 'Button', t: 'button', d: { text: 'Create Account', class: 'btn btn-primary btn-block' }}
        ]}
      ]}
    ]
  },

  // FEATURE SECTIONS
  {
    id: 'features-grid',
    name: 'Features Grid',
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
    desc: 'Vertical feature list',
    category: 'features',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '1.5rem', padding: '4rem 2rem' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Everything You Need' }},
        { n: 'List', b: 'list', t: 'ul', d: { items: '✓ Easy drag-and-drop interface,✓ 100+ pre-built components,✓ Responsive design out of the box,✓ Export clean HTML/CSS,✓ No coding required' }}
      ]}
    ]
  },
  {
    id: 'features-alternating',
    name: 'Features Alt',
    icon: '⇄',
    desc: 'Alternating text and image',
    category: 'features',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '4rem', padding: '4rem 2rem' }, container: true, children: [
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'row', gap: '2rem', align: 'center' }, container: true, children: [
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '1rem', width: '50%' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Feature One' }},
            { n: 'Paragraph', t: 'p', d: { text: 'Detailed description of the first feature goes here.' }}
          ]},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?1', alt: 'Feature 1' }}
        ]},
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'row-reverse', gap: '2rem', align: 'center' }, container: true, children: [
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '1rem', width: '50%' }, container: true, children: [
            { n: 'Heading 3', t: 'h3', d: { text: 'Feature Two' }},
            { n: 'Paragraph', t: 'p', d: { text: 'Detailed description of the second feature goes here.' }}
          ]},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?2', alt: 'Feature 2' }}
        ]}
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
  {
    id: 'cta-app',
    name: 'App Download',
    icon: '📱',
    desc: 'Mobile app download CTA',
    category: 'cta',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'row', gap: '4rem', padding: '4rem 2rem', align: 'center', justify: 'center', background: '#f8f9fa' }, container: true, children: [
        { n: 'Container', b: 'container', t: 'div', d: { direction: 'column', gap: '1.5rem', width: '50%' }, container: true, children: [
          { n: 'Heading 2', t: 'h2', d: { text: 'Get the App' }},
          { n: 'Paragraph', t: 'p', d: { text: 'Experience the full power of our platform on the go. Available for iOS and Android.' }},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'row', gap: '1rem' }, container: true, children: [
            { n: 'Button', t: 'button', d: { text: ' App Store', class: 'btn btn-dark btn-lg' }},
            { n: 'Button', t: 'button', d: { text: '▶ Google Play', class: 'btn btn-outline-dark btn-lg' }}
          ]}
        ]},
        { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/300/600', alt: 'App Screenshot', style: 'border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);' }}
      ]}
    ]
  },

  // RESTAURANT SECTIONS
  {
    id: 'hero-restaurant',
    name: 'Restaurant Hero',
    icon: '🍽️',
    desc: 'Elegant restaurant hero',
    category: 'hero',
    components: [
      { n: 'Hero', i: '🌌', b: 'hero', t: 'section', d: {
        variant: 'centered',
        title: 'Taste the Extraordinary',
        subtitle: 'Experience culinary perfection in the heart of the city',
        cta: 'Book a Table',
        ctaHref: '#reservations',
        height: '700px',
        align: 'center',
        overlay: true,
        backgroundImage: 'https://picsum.photos/1920/1080?food'
      }}
    ]
  },
  {
    id: 'menu-grid',
    name: 'Menu Grid',
    icon: '📜',
    desc: 'Restaurant menu items',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '3rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'Our Signature Dishes' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '2', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Truffle Risotto', description: 'Arborio rice, black truffle, parmesan crisp', price: '$28', image: 'https://picsum.photos/300/200?food=1', cta: 'Order Now' }},
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Pan-Seared Salmon', description: 'Wild caught salmon, asparagus, lemon butter', price: '$32', image: 'https://picsum.photos/300/200?food=2', cta: 'Order Now' }},
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Wagyu Burger', description: 'A5 Wagyu, brioche bun, truffle mayo', price: '$24', image: 'https://picsum.photos/300/200?food=3', cta: 'Order Now' }},
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Chocolate Soufflé', description: 'Dark chocolate, vanilla bean ice cream', price: '$14', image: 'https://picsum.photos/300/200?food=4', cta: 'Order Now' }}
        ]}
      ]}
    ]
  },

  // PORTFOLIO SECTIONS
  {
    id: 'hero-portfolio',
    name: 'Portfolio Hero',
    icon: '🎨',
    desc: 'Minimalist portfolio hero',
    category: 'hero',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '8rem 2rem', align: 'flex-start' }, container: true, children: [
        { n: 'Heading 1', t: 'h1', d: { text: 'Hello, I\'m Alex.', style: 'font-size: 5rem; line-height: 1.1;' }},
        { n: 'Heading 2', t: 'h2', d: { text: 'Digital Designer & Developer', style: 'font-weight: 300; color: #666;' }},
        { n: 'Button', t: 'button', d: { text: 'View My Work', class: 'btn btn-dark btn-lg' }}
      ]}
    ]
  },
  {
    id: 'gallery-masonry',
    name: 'Masonry Gallery',
    icon: '🧱',
    desc: 'Masonry layout for images',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem' }, container: true, children: [
        { n: 'Masonry', i: '🧱', b: 'masonry', t: 'div', d: { columns: 3, gap: '1rem' }, container: true, children: [
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/600?1', alt: 'Project 1' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/300?2', alt: 'Project 2' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/500?3', alt: 'Project 3' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/400?4', alt: 'Project 4' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/350?5', alt: 'Project 5' }},
          { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/400/550?6', alt: 'Project 6' }}
        ]}
      ]}
    ]
  },

  // E-COMMERCE SECTIONS
  {
    id: 'hero-shop',
    name: 'Shop Hero',
    icon: '🛍️',
    desc: 'E-commerce hero banner',
    category: 'hero',
    components: [
      { n: 'Hero', i: '🌌', b: 'hero', t: 'section', d: {
        variant: 'split',
        title: 'Summer Collection 2025',
        subtitle: 'Discover the hottest trends of the season. Up to 50% off.',
        cta: 'Shop Now',
        ctaHref: '#shop',
        height: '600px',
        align: 'left',
        overlay: false,
        backgroundImage: 'https://picsum.photos/1920/1080?fashion'
      }}
    ]
  },
  {
    id: 'product-grid',
    name: 'Product Grid',
    icon: '👠',
    desc: 'Grid of product cards',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '4rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 2', t: 'h2', d: { text: 'New Arrivals' }},
        { n: 'Grid', i: '▦', b: 'grid', t: 'div', d: { columns: '4', gap: '2rem' }, container: true, gridChildren: [
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Classic Tee', price: '$29', image: 'https://picsum.photos/300/400?fashion=1', badge: 'New' }},
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Denim Jacket', price: '$89', image: 'https://picsum.photos/300/400?fashion=2' }},
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Summer Dress', price: '$59', image: 'https://picsum.photos/300/400?fashion=3', badge: 'Sale' }},
          { n: 'Card Product', i: '📦', b: 'cardproduct', t: 'article', d: { title: 'Leather Boots', price: '$129', image: 'https://picsum.photos/300/400?fashion=4' }}
        ]}
      ]}
    ]
  },

  // UTILITY SECTIONS
  {
    id: '404-content',
    name: '404 Content',
    icon: '🚫',
    desc: 'Page not found content',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '8rem 2rem', align: 'center' }, container: true, children: [
        { n: 'Heading 1', t: 'h1', d: { text: '404', style: 'font-size: 8rem; color: #ddd;' }},
        { n: 'Heading 2', t: 'h2', d: { text: 'Page Not Found' }},
        { n: 'Paragraph', t: 'p', d: { text: 'The page you are looking for might have been removed or is temporarily unavailable.' }},
        { n: 'Button', t: 'button', d: { text: 'Go Back Home', class: 'btn btn-primary' }}
      ]}
    ]
  },
  {
    id: 'login-form',
    name: 'Login Form',
    icon: '🔐',
    desc: 'Centered login form',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'section', d: { direction: 'column', gap: '2rem', padding: '6rem 2rem', align: 'center', minHeight: '80vh', justify: 'center' }, container: true, children: [
        { n: 'Card', b: 'card', t: 'div', d: { title: 'Welcome Back', subtitle: 'Please sign in to continue', style: 'width: 100%; max-width: 400px;' }, container: true, children: [
          { n: 'Input', t: 'input', d: { type: 'email', placeholder: 'Email Address' }},
          { n: 'Input', t: 'input', d: { type: 'password', placeholder: 'Password' }},
          { n: 'Container', b: 'container', t: 'div', d: { direction: 'row', justify: 'space-between', width: '100%' }, container: true, children: [
            { n: 'Checkbox', t: 'input', d: { type: 'checkbox', label: 'Remember me' }},
            { n: 'Link', t: 'a', d: { text: 'Forgot Password?', href: '#' }}
          ]},
          { n: 'Button', t: 'button', d: { text: 'Sign In', class: 'btn btn-primary btn-block' }}
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
  {
    id: 'content-article',
    name: 'Article',
    icon: '📄',
    desc: 'Standard article layout',
    category: 'content',
    components: [
      { n: 'Container', i: '📦', b: 'container', t: 'article', d: { direction: 'column', gap: '1.5rem', padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto' }, container: true, children: [
        { n: 'Heading 1', t: 'h1', d: { text: 'Article Title' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }},
        { n: 'Image', b: 'image', t: 'img', d: { src: 'https://picsum.photos/800/400', alt: 'Article Image' }},
        { n: 'Heading 2', t: 'h2', d: { text: 'Subheading' }},
        { n: 'Paragraph', t: 'p', d: { text: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' }}
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
  // ==========================================================================
  // SPA - Single Page Applications with anchor navigation
  // ==========================================================================
  {
    id: 'spa-complete',
    name: 'Complete SPA',
    icon: '📱',
    desc: 'Full single-page app with all sections',
    category: 'spa',
    preview: 'Header → Home → About → Services → Portfolio → Team → Testimonials → Pricing → FAQ → Contact → Footer',
    sections: ['spa-header', 'spa-home', 'spa-about', 'spa-services', 'spa-portfolio', 'spa-team', 'spa-testimonials', 'spa-pricing', 'spa-faq', 'spa-contact', 'spa-footer']
  },
  {
    id: 'spa-business',
    name: 'Business SPA',
    icon: '🏢',
    desc: 'Professional business single-page site',
    category: 'spa',
    preview: 'Header → Home → About → Services → Team → Contact → Footer',
    sections: ['spa-header', 'spa-home', 'spa-about', 'spa-services', 'spa-team', 'spa-contact', 'spa-footer']
  },
  {
    id: 'spa-startup',
    name: 'Startup SPA',
    icon: '🚀',
    desc: 'Startup landing with pricing focus',
    category: 'spa',
    preview: 'Header → Home → Services → Pricing → Testimonials → FAQ → Contact → Footer',
    sections: ['spa-header', 'spa-home', 'spa-services', 'spa-pricing', 'spa-testimonials', 'spa-faq', 'spa-contact', 'spa-footer']
  },
  {
    id: 'spa-portfolio',
    name: 'Portfolio SPA',
    icon: '🎨',
    desc: 'Creative portfolio single-page site',
    category: 'spa',
    preview: 'Header → Home → About → Portfolio → Testimonials → Contact → Footer',
    sections: ['spa-header', 'spa-home', 'spa-about', 'spa-portfolio', 'spa-testimonials', 'spa-contact', 'spa-footer']
  },
  {
    id: 'spa-agency',
    name: 'Agency SPA',
    icon: '🏢',
    desc: 'Digital agency single-page site',
    category: 'spa',
    preview: 'Header → Home → Services → Portfolio → Team → Testimonials → Contact → Footer',
    sections: ['spa-header', 'spa-home', 'spa-services', 'spa-portfolio', 'spa-team', 'spa-testimonials', 'spa-contact', 'spa-footer']
  },
  {
    id: 'spa-minimal',
    name: 'Minimal SPA',
    icon: '✨',
    desc: 'Clean minimal single-page site',
    category: 'spa',
    preview: 'Header → Home → About → Services → Contact → Footer',
    sections: ['spa-header', 'spa-home', 'spa-about', 'spa-services', 'spa-contact', 'spa-footer']
  },

  // NOVICE TEMPLATES
  {
    id: 'novice-business-starter',
    name: 'Business Starter',
    icon: '🚀',
    desc: 'Complete business website in one click',
    category: 'landing',
    preview: 'Header → Home → Services → Contact → Footer',
    sections: ['spa-header', 'spa-home', 'spa-services', 'spa-contact', 'spa-footer']
  },

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
  },

  // BUSINESS PAGES
  {
    id: 'cielo-vista-home',
    name: 'Cielo Vista Home',
    icon: '🏢',
    desc: 'Software consulting firm',
    category: 'business',
    preview: 'Hero → Services → About → Contact → Footer',
    sections: ['cv-hero', 'cv-services', 'cv-about', 'cv-contact', 'footer-simple']
  },
  {
    id: 'business-restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    desc: 'Restaurant landing page',
    category: 'business',
    preview: 'Hero → Gallery → Testimonials → Contact → Footer',
    sections: ['hero-video', 'gallery-grid', 'testimonials', 'contact-section', 'footer-simple']
  },
  {
    id: 'business-gym',
    name: 'Gym / Fitness',
    icon: '💪',
    desc: 'Fitness center page',
    category: 'business',
    preview: 'Hero → Features → Team → Pricing → Footer',
    sections: ['hero-form', 'features-grid', 'team-section', 'pricing-table', 'footer-simple']
  },
  {
    id: 'event-conference',
    name: 'Conference',
    icon: '🎤',
    desc: 'Event landing page',
    category: 'business',
    preview: 'Hero → Features → Team → Pricing → FAQ → Footer',
    sections: ['hero-video', 'features-list', 'team-section', 'pricing-table', 'faq-section', 'footer-columns']
  },

  // NEW TEMPLATES (EXPANSION)
  // ---------------------------------------------------------------------------

  // SAAS & TECH
  {
    id: 'saas-modern',
    name: 'SaaS Modern',
    icon: '🚀',
    desc: 'Modern SaaS landing page',
    category: 'landing',
    preview: 'Hero → Stats → Features → CTA → Footer',
    sections: ['hero-simple', 'stats-section', 'features-alternating', 'cta-section', 'footer-columns']
  },
  {
    id: 'saas-dark',
    name: 'SaaS Dark Mode',
    icon: '🌙',
    desc: 'Dark themed SaaS page',
    category: 'landing',
    preview: 'Hero Video → Features → Testimonials → Pricing → Footer',
    sections: ['hero-video', 'features-grid', 'testimonials', 'pricing-table', 'footer-simple']
  },
  {
    id: 'saas-enterprise',
    name: 'Enterprise SaaS',
    icon: '🏢',
    desc: 'Corporate software solution',
    category: 'landing',
    preview: 'Hero Split → Stats → Features → Team → CTA → Footer',
    sections: ['hero-split', 'stats-section', 'features-list', 'team-section', 'cta-section', 'footer-columns']
  },
  {
    id: 'app-landing-v2',
    name: 'Mobile App V2',
    icon: '📱',
    desc: 'App showcase with download',
    category: 'landing',
    preview: 'Hero Split → Features → App Download → Footer',
    sections: ['hero-split', 'features-grid', 'cta-app', 'footer-simple']
  },

  // RESTAURANT & FOOD
  {
    id: 'restaurant-fine',
    name: 'Fine Dining',
    icon: '🍷',
    desc: 'Upscale restaurant template',
    category: 'business',
    preview: 'Hero → Menu → Testimonials → Contact → Footer',
    sections: ['hero-restaurant', 'menu-grid', 'testimonials', 'contact-section', 'footer-simple']
  },
  {
    id: 'restaurant-cafe',
    name: 'Urban Cafe',
    icon: '☕',
    desc: 'Cozy coffee shop template',
    category: 'business',
    preview: 'Hero → Menu → Gallery → Contact → Footer',
    sections: ['hero-simple', 'menu-grid', 'gallery-grid', 'contact-section', 'footer-simple']
  },
  {
    id: 'restaurant-bistro',
    name: 'Modern Bistro',
    icon: '🍽️',
    desc: 'Casual dining template',
    category: 'business',
    preview: 'Hero Split → Menu → Testimonials → Footer',
    sections: ['hero-split', 'menu-grid', 'testimonials', 'footer-simple']
  },

  // HEALTH & WELLNESS
  {
    id: 'gym-crossfit',
    name: 'CrossFit Gym',
    icon: '🏋️',
    desc: 'High intensity gym template',
    category: 'business',
    preview: 'Hero Video → Features → Pricing → Contact → Footer',
    sections: ['hero-video', 'features-grid', 'pricing-table', 'contact-section', 'footer-simple']
  },
  {
    id: 'gym-yoga',
    name: 'Yoga Studio',
    icon: '🧘',
    desc: 'Calm yoga studio template',
    category: 'business',
    preview: 'Hero → Features → Testimonials → Pricing → Footer',
    sections: ['hero-simple', 'features-alternating', 'testimonials', 'pricing-table', 'footer-simple']
  },
  {
    id: 'spa-wellness',
    name: 'Luxury Spa',
    icon: '🧖',
    desc: 'Relaxing spa template',
    category: 'business',
    preview: 'Hero → Features → Gallery → Contact → Footer',
    sections: ['hero-simple', 'features-grid', 'gallery-grid', 'contact-section', 'footer-simple']
  },
  {
    id: 'salon-beauty',
    name: 'Beauty Salon',
    icon: '💇',
    desc: 'Hair and beauty salon',
    category: 'business',
    preview: 'Hero Split → Services → Gallery → Contact → Footer',
    sections: ['hero-split', 'features-list', 'gallery-masonry', 'contact-section', 'footer-simple']
  },

  // PROFESSIONAL SERVICES
  {
    id: 'law-corporate',
    name: 'Corporate Law',
    icon: '⚖️',
    desc: 'Professional law firm',
    category: 'business',
    preview: 'Hero → Practice Areas → Team → Contact → Footer',
    sections: ['hero-simple', 'features-grid', 'team-section', 'contact-section', 'footer-columns']
  },
  {
    id: 'law-boutique',
    name: 'Boutique Firm',
    icon: '📜',
    desc: 'Specialized legal services',
    category: 'business',
    preview: 'Hero Split → Features → Testimonials → Contact → Footer',
    sections: ['hero-split', 'features-alternating', 'testimonials', 'contact-section', 'footer-simple']
  },
  {
    id: 'agency-digital',
    name: 'Digital Agency',
    icon: '💻',
    desc: 'Full service digital agency',
    category: 'business',
    preview: 'Hero Video → Stats → Gallery → Team → Footer',
    sections: ['hero-video', 'stats-section', 'gallery-masonry', 'team-section', 'footer-columns']
  },
  {
    id: 'agency-creative',
    name: 'Creative Studio',
    icon: '🎨',
    desc: 'Design and branding studio',
    category: 'business',
    preview: 'Hero Portfolio → Gallery → Testimonials → Contact → Footer',
    sections: ['hero-portfolio', 'gallery-masonry', 'testimonials', 'contact-section', 'footer-simple']
  },
  {
    id: 'consulting-finance',
    name: 'Financial Consult',
    icon: '📈',
    desc: 'Finance and accounting',
    category: 'business',
    preview: 'Hero → Stats → Services → CTA → Footer',
    sections: ['hero-simple', 'stats-section', 'features-list', 'cta-section', 'footer-columns']
  },
  {
    id: 'consulting-tech',
    name: 'Tech Consulting',
    icon: '🔧',
    desc: 'IT and tech solutions',
    category: 'business',
    preview: 'Hero Split → Features → Pricing → Contact → Footer',
    sections: ['hero-split', 'features-grid', 'pricing-table', 'contact-section', 'footer-columns']
  },

  // PORTFOLIOS
  {
    id: 'portfolio-photo',
    name: 'Photographer',
    icon: '📷',
    desc: 'Photography portfolio',
    category: 'portfolio',
    preview: 'Hero → Masonry Gallery → Contact → Footer',
    sections: ['hero-portfolio', 'gallery-masonry', 'contact-section', 'footer-simple']
  },
  {
    id: 'portfolio-design-min',
    name: 'Minimal Designer',
    icon: '✏️',
    desc: 'Clean design portfolio',
    category: 'portfolio',
    preview: 'Hero → Gallery → Stats → Contact → Footer',
    sections: ['hero-simple', 'gallery-grid', 'stats-section', 'contact-section', 'footer-simple']
  },
  {
    id: 'portfolio-dev-dark',
    name: 'Dark Developer',
    icon: '👨‍💻',
    desc: 'Dark themed dev portfolio',
    category: 'portfolio',
    preview: 'Hero Split → Features → Stats → Contact → Footer',
    sections: ['hero-split', 'features-grid', 'stats-section', 'contact-section', 'footer-simple']
  },
  {
    id: 'portfolio-artist',
    name: 'Artist Gallery',
    icon: '🖌️',
    desc: 'Visual artist showcase',
    category: 'portfolio',
    preview: 'Hero → Masonry Gallery → Testimonials → Footer',
    sections: ['hero-portfolio', 'gallery-masonry', 'testimonials', 'footer-simple']
  },

  // EVENTS
  {
    id: 'event-conf-tech',
    name: 'Tech Conference',
    icon: '🎤',
    desc: 'Technology summit page',
    category: 'landing',
    preview: 'Hero Video → Features → Team → Pricing → Footer',
    sections: ['hero-video', 'features-grid', 'team-section', 'pricing-table', 'footer-columns']
  },
  {
    id: 'event-wedding',
    name: 'Wedding',
    icon: '💍',
    desc: 'Wedding announcement',
    category: 'minimal',
    preview: 'Hero → Gallery → Details → Contact → Footer',
    sections: ['hero-simple', 'gallery-grid', 'features-list', 'contact-section', 'footer-simple']
  },
  {
    id: 'event-meetup',
    name: 'Local Meetup',
    icon: '🤝',
    desc: 'Community gathering page',
    category: 'landing',
    preview: 'Hero Split → Features → CTA → Footer',
    sections: ['hero-split', 'features-grid', 'cta-section', 'footer-simple']
  },
  {
    id: 'event-webinar',
    name: 'Webinar Reg',
    icon: '📹',
    desc: 'Webinar registration page',
    category: 'landing',
    preview: 'Hero Form → Agenda → Speakers → Footer',
    sections: ['hero-form', 'features-list', 'team-section', 'footer-simple']
  },

  // BLOG & CONTENT
  {
    id: 'blog-magazine',
    name: 'Magazine',
    icon: '📰',
    desc: 'Online magazine layout',
    category: 'blog',
    preview: 'Hero → Articles → Newsletter → Footer',
    sections: ['hero-simple', 'blog-grid', 'newsletter', 'footer-columns']
  },
  {
    id: 'blog-personal',
    name: 'Personal Blog',
    icon: '✍️',
    desc: 'Personal writing space',
    category: 'blog',
    preview: 'Hero Split → Articles → Contact → Footer',
    sections: ['hero-split', 'blog-grid', 'contact-section', 'footer-simple']
  },
  {
    id: 'blog-tech',
    name: 'Tech Blog',
    icon: '💾',
    desc: 'Technology news blog',
    category: 'blog',
    preview: 'Hero Video → Articles → CTA → Footer',
    sections: ['hero-video', 'blog-grid', 'cta-section', 'footer-columns']
  },

  // E-COMMERCE
  {
    id: 'shop-storefront',
    name: 'Storefront',
    icon: '🏪',
    desc: 'Main store landing page',
    category: 'product',
    preview: 'Hero Shop → Products → Features → Newsletter → Footer',
    sections: ['hero-shop', 'product-grid', 'features-grid', 'newsletter', 'footer-columns']
  },
  {
    id: 'shop-launch',
    name: 'Product Launch',
    icon: '🚀',
    desc: 'New product announcement',
    category: 'product',
    preview: 'Hero Shop → Features → Products → CTA → Footer',
    sections: ['hero-shop', 'features-alternating', 'product-grid', 'cta-section', 'footer-simple']
  },
  {
    id: 'shop-collection',
    name: 'Collection',
    icon: '👗',
    desc: 'Seasonal collection page',
    category: 'product',
    preview: 'Hero → Products → Gallery → Footer',
    sections: ['hero-simple', 'product-grid', 'gallery-grid', 'footer-simple']
  },

  // UTILITY
  {
    id: 'util-404',
    name: '404 Error',
    icon: '🚫',
    desc: 'Page not found template',
    category: 'minimal',
    preview: '404 Content → Footer',
    sections: ['404-content', 'footer-simple']
  },
  {
    id: 'util-login',
    name: 'Login Page',
    icon: '🔐',
    desc: 'User authentication page',
    category: 'minimal',
    preview: 'Login Form → Footer',
    sections: ['login-form', 'footer-simple']
  },
  {
    id: 'util-signup',
    name: 'Signup Page',
    icon: '📝',
    desc: 'User registration page',
    category: 'minimal',
    preview: 'Hero Form → Footer',
    sections: ['hero-form', 'footer-simple']
  },
  {
    id: 'util-maintenance',
    name: 'Maintenance',
    icon: '🛠️',
    desc: 'Site under maintenance',
    category: 'minimal',
    preview: 'Hero → Newsletter → Footer',
    sections: ['hero-simple', 'newsletter', 'footer-simple']
  }
];

// =============================================================================
// TEMPLATE CATEGORIES (for UI grouping)
// =============================================================================
export const PAGE_CATEGORIES = [
  { id: 'spa', name: 'Single Page App', icon: '📱', desc: 'SPA with anchor navigation' },
  { id: 'landing', name: 'Landing Pages', icon: '🚀', desc: 'Marketing & conversion focused' },
  { id: 'product', name: 'Product', icon: '🛍️', desc: 'Product showcases & comparisons' },
  { id: 'portfolio', name: 'Portfolio', icon: '🎨', desc: 'Creative & developer portfolios' },
  { id: 'blog', name: 'Blog', icon: '📝', desc: 'Content & article pages' },
  { id: 'company', name: 'Company', icon: '🏢', desc: 'About, pricing & contact' },
  { id: 'dashboard', name: 'Dashboard', icon: '📊', desc: 'Analytics & admin layouts' },
  { id: 'minimal', name: 'Minimal', icon: '📄', desc: 'Simple & clean designs' },
  { id: 'business', name: 'Business', icon: '💼', desc: 'Small business templates' }
];

export const SECTION_CATEGORIES = [
  { id: 'spa', name: 'SPA Sections', icon: '📱' },
  { id: 'header', name: 'Header', icon: '🔝' },
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
