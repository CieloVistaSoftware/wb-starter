/**
 * Avatar — user avatar display.
 * Component: <wb-avatar>
 * TODO: Migrate inline styles to avatar.css
 */
export function cc() {}

/**
 * Avatar - User avatars with image or initials
 */
export function avatar(element, options = {}) {
  const config = {
    src: options.src || element.dataset.src || '',
    initials: options.initials || element.dataset.initials || '',
    name: options.name || element.dataset.name || '',
    size: options.size || element.dataset.size || 'md',
    status: options.status || element.dataset.status || '',
    ...options
  };

  const sizes = { sm: '32px', md: '40px', lg: '56px', xl: '80px' };
  const size = sizes[config.size] || sizes.md;
  const initials = config.initials || (config.name ? config.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?');

  element.classList.add('wb-avatar');
  element.style.width = size;
  element.style.height = size;
  element.style.borderRadius = '50%';
  element.style.display = 'inline-flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.background = 'var(--primary, #6366f1)';
  element.style.color = 'white';
  element.style.fontWeight = '600';
  element.style.fontSize = `calc(${size} * 0.4)`;
  element.style.position = 'relative';
  element.style.overflow = 'hidden';

  if (config.src) {
    element.innerHTML = `<img src="${config.src}" alt="${config.name}" style="width:100%;height:100%;object-fit:cover;">`;
  } else {
    element.textContent = initials;
  }

  if (config.status) {
    const statusColors = { online: '#22c55e', offline: '#6b7280', busy: '#ef4444', away: '#f59e0b' };
    element.innerHTML += `<span style="position:absolute;bottom:0;right:0;width:25%;height:25%;background:${statusColors[config.status] || statusColors.offline};border-radius:50%;border:2px solid var(--bg-primary,#1f2937);"></span>`;
  }

  element.dataset.wbReady = 'avatar';
  return () => element.classList.remove('wb-avatar');
}

export default avatar;
