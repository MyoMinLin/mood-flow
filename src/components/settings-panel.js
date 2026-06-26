import { el } from '../utils/dom.js';

const STORAGE_KEY = 'claude-api-key';

/**
 * Settings panel — manages Claude API key in localStorage.
 * @returns {{ button: HTMLElement, panel: HTMLElement }}
 */
export function SettingsPanel() {
  let open = false;

  // Gear button
  const button = el('button', {
    className: 'btn btn-ghost settings-btn',
    innerHTML: '&#9881;',
    title: 'Settings',
  });

  // Panel
  const panel = el('div', { className: 'settings-panel', style: { display: 'none' } });

  const title = el('h3', { textContent: 'Claude AI Settings' });

  const status = el('p', { className: 'settings-status' });
  updateStatus();

  const input = el('input', {
    type: 'password',
    className: 'settings-input',
    placeholder: 'sk-ant-...',
  });
  input.value = localStorage.getItem(STORAGE_KEY) || '';

  const btnRow = el('div', { className: 'settings-btn-row' });
  const saveBtn = el('button', {
    className: 'btn btn-primary btn-sm',
    textContent: 'Save',
    onClick: () => {
      const key = input.value.trim();
      if (key) {
        localStorage.setItem(STORAGE_KEY, key);
        updateStatus();
      }
    },
  });
  const clearBtn = el('button', {
    className: 'btn btn-danger btn-sm',
    textContent: 'Clear',
    onClick: () => {
      localStorage.removeItem(STORAGE_KEY);
      input.value = '';
      updateStatus();
    },
  });
  btnRow.append(saveBtn, clearBtn);

  panel.append(title, status, input, btnRow);

  function updateStatus() {
    const hasKey = !!localStorage.getItem(STORAGE_KEY);
    status.textContent = hasKey ? 'Claude AI: connected' : 'Claude AI: not configured';
    status.style.color = hasKey ? '#22c55e' : '#888888';
  }

  button.addEventListener('click', () => {
    open = !open;
    panel.style.display = open ? '' : 'none';
    updateStatus();
  });

  return { button, panel };
}
