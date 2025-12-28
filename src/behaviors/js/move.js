/**
 * Move Behaviors - Reposition elements on page
 * moveup, movedown, moveleft, moveright, moveall
 */

export const moveup = (element, distance = 10) => {
  if (!element) throw new Error('Element is required');
  const currentTop = parseFloat(element.style.top || 0);
  element.style.position = element.style.position || 'relative';
  element.style.top = (currentTop - distance) + 'px';
  element.setAttribute('data-moved', 'true');
};

export const movedown = (element, distance = 10) => {
  if (!element) throw new Error('Element is required');
  const currentTopDown = parseFloat(element.style.top || 0);
  element.style.position = element.style.position || 'relative';
  element.style.top = (currentTopDown + distance) + 'px';
  element.setAttribute('data-moved', 'true');
};

export const moveleft = (element, distance = 10) => {
  if (!element) throw new Error('Element is required');
  const currentLeft = parseFloat(element.style.left || 0);
  element.style.position = element.style.position || 'relative';
  element.style.left = (currentLeft - distance) + 'px';
  element.setAttribute('data-moved', 'true');
};

export const moveright = (element, distance = 10) => {
  if (!element) throw new Error('Element is required');
  const currentLeftRight = parseFloat(element.style.left || 0);
  element.style.position = element.style.position || 'relative';
  element.style.left = (currentLeftRight + distance) + 'px';
  element.setAttribute('data-moved', 'true');
};

export const moveall = (element, x = 0, y = 0) => {
  if (!element) throw new Error('Element is required');
  element.style.position = element.style.position || 'relative';
  const allLeft = parseFloat(element.style.left || 0);
  const allTop = parseFloat(element.style.top || 0);
  element.style.left = (allLeft + x) + 'px';
  element.style.top = (allTop + y) + 'px';
  element.setAttribute('data-moved', 'true');
};

export default { moveup, movedown, moveleft, moveright, moveall };
