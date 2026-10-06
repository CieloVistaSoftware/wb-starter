/**
 * Setup API Handler
 * Receives form data and generates updated HTML pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * #779: the generated pages used to carry every declaration in a style=""
 * attribute (and their hovers as onmouseover handlers writing this.style).
 * They carry class names now, and each generated page opens with this
 * stylesheet. It travels inside the page because the pages are standalone
 * fragments written into pages/ and must look the same wherever they load.
 * The class names are mechanical (tag + ordinal) because they only have to
 * be unique within these three generated pages.
 */
const SETUP_CSS = `
.setup-div-1 { padding: 3rem 2rem; text-align: center; background: var(--bg-secondary); }
.setup-div-2 { font-size: 5rem; margin-bottom: 1rem; }
.setup-h1-1 { font-size: 2.5rem; margin: 0 0 0.5rem 0; color: var(--primary); }
.setup-p-1 { font-size: 1.1rem; color: var(--text-secondary); margin: 0; }
.setup-div-3 { width: 100%; height: 500px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.85)), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop') center/cover; background-blend-mode: overlay; display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem; margin: 2rem 0; }
.setup-div-4 { max-width: 600px; }
.setup-h2-1 { font-size: 3.5rem; margin: 0 0 1.5rem 0; font-weight: 700; line-height: 1.2; text-shadow: 2px 2px 8px rgba(0,0,0,0.5); }
.setup-blockquote-1 { font-size: 1.3rem; font-style: italic; color: rgba(255,255,255,0.95); margin: 2rem 0; border-left: 4px solid white; padding-left: 2rem; text-align: left; text-shadow: 1px 1px 4px rgba(0,0,0,0.5); }
.setup-div-5 { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem; }
.setup-a-1 { display: inline-block; padding: 1rem 2rem; background: white; color: var(--primary); border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.3s ease; }
.setup-a-2 { display: inline-block; padding: 1rem 2rem; border: 2px solid white; color: white; background: transparent; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; transition: all 0.3s ease; }
.setup-div-6 { max-width: 600px; margin: 4rem auto; padding: 3rem 2rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); }
.setup-h2-2 { text-align: center; margin-bottom: 2rem; color: var(--primary); font-size: 1.8rem; }
.setup-div-7 { display: flex; flex-direction: column; gap: 2rem; }
.setup-h3-1 { margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.1rem; }
.setup-a-3 { color: var(--primary); text-decoration: none; font-weight: 600; font-size: 1.05rem; }
.setup-p-2 { margin: 0; color: var(--text-secondary); font-size: 1.05rem; }
.setup-div-8 { width: 100%; height: 400px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.85)), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop') center/cover; background-blend-mode: overlay; display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem; margin-bottom: 3rem; }
.setup-h1-2 { font-size: 3rem; margin: 0 0 0.5rem 0; font-weight: 700; text-shadow: 2px 2px 8px rgba(0,0,0,0.5); }
.setup-p-3 { font-size: 1.3rem; margin: 0; color: rgba(255,255,255,0.9); text-shadow: 1px 1px 4px rgba(0,0,0,0.5); }
.setup-div-9 { max-width: 900px; margin: 0 auto; padding: 2rem; }
.setup-h2-3 { font-size: 2rem; color: var(--text-primary); margin-bottom: 1rem; }
.setup-p-4 { font-size: 1.1rem; line-height: 1.8; color: var(--text-secondary); }
.setup-div-10 { max-width: 900px; margin: 2rem auto; padding: 2rem; }
.setup-h2-4 { font-size: 2rem; color: var(--text-primary); margin-bottom: 2rem; }
.setup-p-5 { color: var(--text-secondary); font-size: 1.1rem; line-height: 1.8; }
.setup-div-11 { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; }
.setup-div-12 { padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); text-align: center; }
.setup-div-13 { font-size: 3rem; margin-bottom: 1rem; }
.setup-h3-2 { font-size: 1.3rem; color: var(--text-primary); margin: 0 0 0.5rem 0; }
.setup-p-6 { color: var(--primary); margin: 0 0 1rem 0; font-weight: 600; }
.setup-p-7 { color: var(--text-secondary); margin: 0; font-size: 0.95rem; }
.setup-div-14 { text-align: center; padding: 2rem; }
.setup-a-4 { display: inline-block; padding: 1rem 2.5rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; text-decoration: none; font-size: 1.05rem; transition: all 0.3s ease; }
.setup-div-15 { width: 100%; height: 400px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.85), rgba(118, 75, 162, 0.85)), url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop') center/cover; background-blend-mode: overlay; display: flex; align-items: center; justify-content: center; color: white; text-align: center; padding: 2rem; margin-bottom: 3rem; }
.setup-div-16 { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.setup-div-17 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 2rem; }
.setup-div-18 { padding: 2rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); transition: all 0.3s ease; cursor: pointer; }
.setup-h3-3 { color: var(--primary); margin-top: 0; font-size: 1.3rem; margin-bottom: 1rem; }
.setup-p-8 { color: var(--text-secondary); line-height: 1.6; }
.setup-div-19 { margin-top: 4rem; }
.setup-h2-5 { font-size: 2rem; color: var(--text-primary); margin-bottom: 2rem; text-align: center; }
.setup-div-20 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.setup-div-21 { padding: 2rem; background: var(--bg-secondary); border-radius: 12px; border-left: 4px solid var(--primary); }
.setup-p-9 { color: var(--text-secondary); font-style: italic; margin: 0 0 1rem 0; line-height: 1.6; }
.setup-div-22 { color: var(--text-primary); font-weight: 600; }
.setup-div-23 { color: var(--text-secondary); font-size: 0.9rem; }
.setup-div-24 { margin-top: 4rem; max-width: 800px; margin-left: auto; margin-right: auto; }
.setup-div-25 { display: flex; flex-direction: column; gap: 1.5rem; }
.setup-div-26 { padding: 1.5rem; background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--border-color); }
.setup-h4-1 { color: var(--primary); margin: 0 0 1rem 0; font-size: 1.1rem; }
.setup-p-10 { color: var(--text-secondary); margin: 0; line-height: 1.6; }
.setup-div-27 { text-align: center; background: var(--bg-secondary); padding: 3rem 2rem; border-radius: 12px; margin-top: 4rem; border: 1px solid var(--border-color); }
.setup-p-11 { font-size: 1.1rem; margin-bottom: 2rem; color: var(--text-secondary); }
.setup-hover-lift-dark:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(0,0,0,0.3); }
.setup-hover-ghost:hover { background: rgba(255,255,255,0.1); }
.setup-hover-lift-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(99,102,241,0.4); }
.setup-hover-card:hover { transform: translateY(-8px); box-shadow: 0 15px 40px rgba(102,126,234,0.2); }
`;
const SETUP_STYLE = `<style>${SETUP_CSS}</style>
`;

// Helper to generate home page HTML
function generateHomePage(data) {
  return `${SETUP_STYLE}<div class="setup-div-1"
  <div class="setup-div-2"🚀</div>
  <h1 class="setup-h1-1"${data.company.name}</h1>
  <p class="setup-p-1"${data.company.tagline}</p>
</div>

<div class="setup-div-3"
  
  <div class="setup-div-4"
    <h2 class="setup-h2-1"
      ${data.company.name} - Your Success is Our Mission
    </h2>
    
    <blockquote class="setup-blockquote-1"
      "${data.company.valueProposition}" 
    </blockquote>
    
    <div class="setup-div-5"
      <a href="?page=services" class="setup-a-1 setup-hover-lift-dark"Explore Services</a>
      
      <a href="#contact" class="setup-a-2 setup-hover-ghost"Get in Touch</a>
    </div>
  </div>
  
</div>

<div id="contact" class="setup-div-6"
  <h2 class="setup-h2-2"📞 Contact Us</h2>
  
  <div class="setup-div-7"
    <div>
      <h3 class="setup-h3-1"Email</h3>
      <a href="mailto:${data.contact.email}" class="setup-a-3"${data.contact.email}</a>
    </div>
    
    <div>
      <h3 class="setup-h3-1"Phone</h3>
      <a href="tel:${data.contact.phone}" class="setup-a-3"${data.contact.phone}</a>
    </div>
    
    <div>
      <h3 class="setup-h3-1"Hours</h3>
      <p class="setup-p-2"${data.contact.hours}</p>
    </div>

    ${data.contact.address ? `
    <div>
      <h3 class="setup-h3-1"Address</h3>
      <p class="setup-p-2"${data.contact.address}</p>
    </div>
    ` : ''}
  </div>
</div>`;
}

// Helper to generate about page
function generateAboutPage(data) {
  return `${SETUP_STYLE}<div class="setup-div-8"
  
  <div>
    <h1 class="setup-h1-2"About ${data.company.name}</h1>
    <p class="setup-p-3"${data.company.tagline}</p>
  </div>
</div>

<div class="setup-div-9"
  <h2 class="setup-h2-3"Who We Are</h2>
  <p class="setup-p-4"
    ${data.company.description}
  </p>
</div>

<div class="setup-div-10"
  <h2 class="setup-h2-4"Why Choose Us?</h2>
  <p class="setup-p-5"
    ${data.company.valueProposition}
  </p>
</div>

${data.team && data.team.length > 0 ? `
<div class="setup-div-10"
  <h2 class="setup-h2-4"Meet Our Team</h2>
  <div class="setup-div-11"
    ${data.team.map(member => `
      <div class="setup-div-12"
        <div class="setup-div-13"${member.avatar}</div>
        <h3 class="setup-h3-2"${member.name}</h3>
        <p class="setup-p-6"${member.role}</p>
        <p class="setup-p-7"${member.bio}</p>
      </div>
    `).join('')}
  </div>
</div>
` : ''}

<div class="setup-div-14"
  <a href="?page=services" class="setup-a-4 setup-hover-lift-primary"View Our Services</a>
</div>`;
}

// Helper to generate services page
function generateServicesPage(data) {
  return `${SETUP_STYLE}<div class="setup-div-15"
  
  <div>
    <h1 class="setup-h1-2"Our Services</h1>
    <p class="setup-p-3"Everything you need to succeed</p>
  </div>
</div>

<div class="setup-div-16"
  
  <div class="setup-div-17"
    ${data.services.map(service => `
      <div class="setup-div-18 setup-hover-card"
        <h3 class="setup-h3-3"${service.icon} ${service.name}</h3>
        <p class="setup-p-8"${service.description}</p>
      </div>
    `).join('')}
  </div>
  
  ${data.testimonials && data.testimonials.length > 0 ? `
  <div class="setup-div-19"
    <h2 class="setup-h2-5"What Our Clients Say</h2>
    <div class="setup-div-20"
      ${data.testimonials.map(testimonial => `
        <div class="setup-div-21"
          <p class="setup-p-9""${testimonial.quote}"</p>
          <div class="setup-div-22"${testimonial.name}</div>
          <div class="setup-div-23"${testimonial.company}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${data.faq && data.faq.length > 0 ? `
  <div class="setup-div-24"
    <h2 class="setup-h2-5"Frequently Asked Questions</h2>
    <div class="setup-div-25"
      ${data.faq.map(item => `
        <div class="setup-div-26"
          <h4 class="setup-h4-1"❓ ${item.question}</h4>
          <p class="setup-p-10"${item.answer}</p>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div class="setup-div-27"
    <h2>Ready to Get Started?</h2>
    <p class="setup-p-11"Let's work together to bring your vision to life.</p>
    <a href="?page=home" class="setup-a-4 setup-hover-lift-primary"Contact Us</a>
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
