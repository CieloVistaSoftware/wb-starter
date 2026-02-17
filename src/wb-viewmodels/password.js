// Standalone password behavior extracted from enhancements.js
export function password(element, options = {}) {
  const config = {
    toggle: options.toggle ?? element.getAttribute('toggle') !== 'false',
    strength: options.strength ?? element.hasAttribute('data-strength'),
    ...options
  };
  if (!element.parentNode) {
    console.warn('[x-password] Element not in DOM, skipping');
    return () => {};
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'wb-password';
  wrapper.style.cssText = 'position:relative;display:flex;align-items:stretch;width:100%;';
  element.parentNode.insertBefore(wrapper, element);
  wrapper.appendChild(element);
  element.classList.add('wb-password__input');
  element.style.cssText = `
    flex:1;
    padding-right:2.5rem;
    border:1px solid var(--border-color,#374151);
    border-radius:6px;
    background:var(--bg-secondary,#1f2937);
    color:var(--text-primary,#f9fafb);
    font-size:0.875rem;
    height:2.5rem;
    padding-left:0.75rem;
    width:100%;
  `;
  if (config.toggle) {
    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'wb-password__toggle';
    toggleBtn.style.cssText = `
      position:absolute;
      right:0;
      top:0;
      height:100%;
      width:2.5rem;
      border:none;
      background:transparent;
      cursor:pointer;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:1rem;
      opacity:0.6;
      transition:opacity 0.15s;
    `;
    toggleBtn.textContent = '👁️';
    toggleBtn.title = 'Show password';
    toggleBtn.onclick = () => {
      const isPassword = element.type === 'password';
      element.type = isPassword ? 'text' : 'password';
      toggleBtn.textContent = isPassword ? '🙈' : '👁️';
      toggleBtn.title = isPassword ? 'Hide password' : 'Show password';
    };
    toggleBtn.addEventListener('mouseenter', () => toggleBtn.style.opacity = '1');
    toggleBtn.addEventListener('mouseleave', () => toggleBtn.style.opacity = '0.6');
    wrapper.appendChild(toggleBtn);
  }
  if (config.strength) {
    const meter = document.createElement('div');
    meter.className = 'wb-password__strength';
    meter.style.cssText = `
      position:absolute;
      bottom:-4px;
      left:0;
      right:0;
      height:3px;
      background:var(--bg-tertiary,#374151);
      border-radius:2px;
      overflow:hidden;
    `;
    const bar = document.createElement('div');
    bar.style.cssText = `
      height:100%;
      width:0%;
      transition:width 0.3s, background 0.3s;
      border-radius:2px;
    `;
    meter.appendChild(bar);
    wrapper.appendChild(meter);
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e'];
    element.addEventListener('input', () => {
      const score = getPasswordStrength(element.value);
      bar.style.width = `${score * 25}%`;
      bar.style.background = colors[score - 1] || colors[0];
    });
  }
  return () => {
    wrapper.parentNode.insertBefore(element, wrapper);
    wrapper.remove();
    element.classList.remove('wb-password__input');
    element.style.cssText = '';
  };
}
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
}
