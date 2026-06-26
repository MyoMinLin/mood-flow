export function el(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'textContent') {
      element.textContent = value;
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else if (key.startsWith('on')) {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  }
  for (const child of (Array.isArray(children) ? children : [children])) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }
  return element;
}

export function clear(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function showToast(message, type = 'info', duration = 3000) {
  const toast = el('div', { className: `toast toast-${type}`, textContent: message });
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = el('div', { className: 'toast-container' });
    document.body.appendChild(container);
  }
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}
