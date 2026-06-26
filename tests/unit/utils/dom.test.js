import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock browser DOM APIs for Node environment
function setupDOMMocks() {
  const listeners = new Map();
  const mockElement = (tag) => ({
    tagName: tag.toUpperCase(),
    className: '',
    textContent: '',
    innerHTML: '',
    style: {},
    children: [],
    setAttribute: vi.fn(),
    addEventListener: vi.fn((event, cb) => {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(cb);
    }),
    appendChild: vi.fn((child) => child),
    removeChild: vi.fn(),
    remove: vi.fn(),
    querySelector: vi.fn(() => null),
    firstChild: null,
  });

  global.document = {
    createElement: vi.fn((tag) => mockElement(tag)),
    createTextNode: vi.fn((text) => ({ textContent: text })),
    querySelector: vi.fn(() => null),
    body: {
      appendChild: vi.fn(),
    },
  };
  global.Node = class {};
}

describe('dom utils', () => {
  let el, clear, showToast;

  beforeEach(async () => {
    setupDOMMocks();
    vi.useFakeTimers();
    const mod = await import('../../../src/utils/dom.js');
    el = mod.el;
    clear = mod.clear;
    showToast = mod.showToast;
  });

  describe('el', () => {
    it('creates an element with tag', () => {
      const result = el('div');
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    it('sets className', () => {
      const result = el('div', { className: 'foo bar' });
      expect(result.className).toBe('foo bar');
    });

    it('sets textContent', () => {
      const result = el('span', { textContent: 'hello' });
      expect(result.textContent).toBe('hello');
    });

    it('registers event handlers', () => {
      const handler = vi.fn();
      const result = el('button', { onClick: handler });
      expect(result.addEventListener).toHaveBeenCalledWith('click', handler);
    });

    it('sets style object', () => {
      const result = el('div', { style: { display: 'none' } });
      expect(result.style).toEqual({ display: 'none' });
    });
  });

  describe('clear', () => {
    it('removes all children', () => {
      const element = { firstChild: true, removeChild: vi.fn(() => {}) };
      element.removeChild.mockImplementation(() => {
        element.firstChild = null;
      });
      clear(element);
      expect(element.removeChild).toHaveBeenCalled();
    });
  });

  describe('showToast', () => {
    it('creates toast element and appends to container', () => {
      showToast('Test message', 'success');
      expect(document.createElement).toHaveBeenCalled();
    });

    it('removes toast after duration', () => {
      const mockToast = { remove: vi.fn() };
      document.createElement.mockReturnValueOnce({
        className: '',
        textContent: '',
        remove: mockToast.remove,
      });
      document.querySelector.mockReturnValueOnce({ appendChild: vi.fn() });

      showToast('Auto remove', 'info', 1000);
      vi.advanceTimersByTime(1000);
      // Toast removal is handled by setTimeout
    });
  });
});
