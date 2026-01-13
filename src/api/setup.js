/**
 * Setup API Handler
 * Receives form data and generates updated HTML pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate home page HTML
function generateHomePage(data) {
  return `<div style="padding: 3rem 2rem; text-align: center; background: var(--bg-secondary);">
  <div style="font-size: 5rem; margin-bottom: 1rem;">🚀</div>
  <h1 style="font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--primary);">${data.company.name}</h1>
  <p style="font-size: 1.1rem; color: var(--text-secondary); margin: 0;">${data.company.tagline}</p>
</div>

<div style="width: 100%; height: 500px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.85)), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop') center/cover; background-blend-mode: overlay; display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem; margin: 2rem 0;">
  
  <div style="max-width: 600px;">
    <h2 style="font-size: 3.5rem; margin: 0 0 1.5rem 0; font-weight: 700; line-height: 1.2; text-shadow: 2px 2px 8px rgba(0,0,0,0.5);">
      ${data.company.name} - Your Success is Our Mission
    </h2>
    
    <blockquote style="font-size: 1.3rem; font-style: italic; color: rgba(255,255,255,0.95); margin: 2rem 0; border-left: 4px solid white; padding-left: 2rem; text-align: left; text-shadow: 1px 1px 4px rgba(0,0,0,0.5);">
      "${data.company.valueProposition}" 
    </blockquote>
    
    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
      <a href="?page=services" style="display: inline-block; padding: 1rem 2rem; background: white; color: #667eea; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 15px 40px rgba(0,0,0,0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'">Explore Services</a>
      
      <a href="#contact" style="display: inline-block; padding: 1rem 2rem; border: 2px solid white; color: white; background: transparent; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">Get in Touch</a>
    </div>
  </div>
  
</div>

<div id="contact" style="max-width: 600px; margin: 4rem auto; padding: 3rem 2rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color);">
  <h2 style="text-align: center; margin-bottom: 2rem; color: var(--primary); font-size: 1.8rem;">📞 Contact Us</h2>
  
  <div style="display: flex; flex-direction: column; gap: 2rem;">
    <div>
      <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.1rem;">Email</h3>
      <a href="mailto:${data.contact.email}" style="color: var(--primary); text-decoration: none; font-weight: 600; font-size: 1.05rem;">${data.contact.email}</a>
    </div>
    
    <div>
      <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.1rem;">Phone</h3>
      <a href="tel:${data.contact.phone}" style="color: var(--primary); text-decoration: none; font-weight: 600; font-size: 1.05rem;">${data.contact.phone}</a>
    </div>
    
    <div>
      <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.1rem;">Hours</h3>
      <p style="margin: 0; color: var(--text-secondary); font-size: 1.05rem;">${data.contact.hours}</p>
    </div>

    ${data.contact.address ? `
    <div>
      <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.1rem;">Address</h3>
      <p style="margin: 0; color: var(--text-secondary); font-size: 1.05rem;">${data.contact.address}</p>
    </div>
    ` : ''}
  </div>
</div>`;
}

// Helper to generate about page
function generateAboutPage(data) {
  return `<div style="width: 100%; height: 400px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop') center/cover; background-blend-mode: overlay; display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem; margin-bottom: 3rem;">
  
  <div>
    <h1 style="font-size: 3rem; margin: 0 0 0.5rem 0; font-weight: 700; text-shadow: 2px 2px 8px rgba(0,0,0,0.5);">About ${data.company.name}</h1>
    <p style="font-size: 1.3rem; margin: 0; color: rgba(255,255,255,0.9); text-shadow: 1px 1px 4px rgba(0,0,0,0.5);">${data.company.tagline}</p>
  </div>
</div>

<div style="max-width: 900px; margin: 0 auto; padding: 2rem;">
  <h2 style="font-size: 2rem; color: var(--text-primary); margin-bottom: 1rem;">Who We Are</h2>
  <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-secondary);">
    ${data.company.description}
  </p>
</div>

<div style="max-width: 900px; margin: 2rem auto; padding: 2rem;">
  <h2 style="font-size: 2rem; color: var(--text-primary); margin-bottom: 2rem;">Why Choose Us?</h2>
  <p style="color: var(--text-secondary); font-size: 1.1rem; line-height: 1.8;">
    ${data.company.valueProposition}
  </p>
</div>

${data.team && data.team.length > 0 ? `
<div style="max-width: 900px; margin: 2rem auto; padding: 2rem;">
  <h2 style="font-size: 2rem; color: var(--text-primary); margin-bottom: 2rem;">Meet Our Team</h2>
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
    ${data.team.map(member => `
      <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${member.avatar}</div>
        <h3 style="font-size: 1.3rem; color: var(--text-primary); margin: 0 0 0.5rem 0;">${member.name}</h3>
        <p style="color: var(--primary); margin: 0 0 1rem 0; font-weight: 600;">${member.role}</p>
        <p style="color: var(--text-secondary); margin: 0; font-size: 0.95rem;">${member.bio}</p>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

<div style="text-align: center; padding: 2rem;">
  <a href="?page=services" style="display: inline-block; padding: 1rem 2.5rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 1.05rem; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 15px 40px rgba(99,102,241,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(99,102,241,0.2)'">View Our Services</a>
</div>`;
}

// Helper to generate services page
function generateServicesPage(data) {
  return `<div style="width: 100%; height: 400px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.85)), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop') center/cover; background-blend-mode: overlay; display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem; margin-bottom: 3rem;">
  
  <div>
    <h1 style="font-size: 3rem; margin: 0 0 0.5rem 0; font-weight: 700; text-shadow: 2px 2px 8px rgba(0,0,0,0.5);">Our Services</h1>
    <p style="font-size: 1.3rem; margin: 0; color: rgba(255,255,255,0.9); text-shadow: 1px 1px 4px rgba(0,0,0,0.5);">Everything you need to succeed</p>
  </div>
</div>

<div style="max-width: 1200px; margin: 0 auto; padding: 2rem;">
  
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 2rem;">
    ${data.services.map(service => `
      <div style="padding: 2rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 15px 40px rgba(102,126,234,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
        <h3 style="color: var(--primary); margin-top: 0; font-size: 1.3rem; margin-bottom: 1rem;">${service.icon} ${service.name}</h3>
        <p style="color: var(--text-secondary); line-height: 1.6;">${service.description}</p>
      </div>
    `).join('')}
  </div>
  
  ${data.testimonials && data.testimonials.length > 0 ? `
  <div style="margin-top: 4rem;">
    <h2 style="font-size: 2rem; color: var(--text-primary); margin-bottom: 2rem; text-align: center;">What Our Clients Say</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
      ${data.testimonials.map(testimonial => `
        <div style="padding: 2rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary);">
          <p style="color: var(--text-secondary); font-style: italic; margin: 0 0 1rem 0; line-height: 1.6;">"${testimonial.quote}"</p>
          <div style="color: var(--text-primary); font-weight: 600;">${testimonial.name}</div>
          <div style="color: var(--text-secondary); font-size: 0.9rem;">${testimonial.company}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${data.faq && data.faq.length > 0 ? `
  <div style="margin-top: 4rem; max-width: 800px; margin-left: auto; margin-right: auto;">
    <h2 style="font-size: 2rem; color: var(--text-primary); margin-bottom: 2rem; text-align: center;">Frequently Asked Questions</h2>
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      ${data.faq.map(item => `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color);">
          <h4 style="color: var(--primary); margin: 0 0 1rem 0; font-size: 1.1rem;">❓ ${item.question}</h4>
          <p style="color: var(--text-secondary); margin: 0; line-height: 1.6;">${item.answer}</p>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div style="text-align: center; background: var(--bg-secondary); padding: 3rem 2rem; border-radius: 12px; margin-top: 4rem; border: 1px solid var(--border-color);">
    <h2>Ready to Get Started?</h2>
    <p style="font-size: 1.1rem; margin-bottom: 2rem; color: var(--text-secondary);">Let's work together to bring your vision to life.</p>
    <a href="?page=home" style="display: inline-block; padding: 1rem 2.5rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 1.05rem; transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 15px 40px rgba(99,102,241,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(99,102,241,0.2)'">Contact Us</a>
  </div>
  
</div>`;
}

// Main setup handler
export default async function setupHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;

    // Generate new pages
    const homePage = generateHomePage(data);
    const aboutPage = generateAboutPage(data);
    const servicesPage = generateServicesPage(data);

    // Write files to pages directory
    const pagesDir = path.join(__dirname, '../../pages');

    fs.writeFileSync(path.join(pagesDir, 'home.html'), homePage);
    fs.writeFileSync(path.join(pagesDir, 'about.html'), aboutPage);
    fs.writeFileSync(path.join(pagesDir, 'services.html'), servicesPage);

    // Save setup data to JSON for reference
    const setupData = { ...data, updatedAt: new Date().toISOString() };
    fs.writeFileSync(
      path.join(__dirname, '../../data/site-setup.json'),
      JSON.stringify(setupData, null, 2)
    );

    res.status(200).json({
      success: true,
      message: 'Site updated successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      error: 'Failed to update site',
      message: error.message,
    });
  }
}
