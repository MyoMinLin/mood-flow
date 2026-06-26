import { describe, it, expect, vi } from 'vitest';
import { on, emit } from '../../../src/utils/events.js';

describe('event bus', () => {
  it('calls subscriber on emit', () => {
    const handler = vi.fn();
    on('test:event', handler);
    emit('test:event', { data: 42 });
    expect(handler).toHaveBeenCalledWith({ data: 42 });
  });

  it('returns unsubscribe function', () => {
    const handler = vi.fn();
    const unsub = on('test:unsub', handler);
    unsub();
    emit('test:unsub', {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    on('test:multi', h1);
    on('test:multi', h2);
    emit('test:multi', 'data');
    expect(h1).toHaveBeenCalledWith('data');
    expect(h2).toHaveBeenCalledWith('data');
  });

  it('does not throw for events with no subscribers', () => {
    expect(() => emit('nonexistent:event', {})).not.toThrow();
  });
});
