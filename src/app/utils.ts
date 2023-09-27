import Clipboard from 'clipboard';
import { v4 as uuidFn } from 'uuid';

import { chatConfigStore } from '../app/store';

export function request(url: string, config: RequestInit) {
  const { accessCode } = chatConfigStore.getState();
  return fetch(url, {
    ...config,
    headers: {
      'Content-Type': 'application/json',
      'access-code': accessCode || '',
      ...config.headers,
    },
  });
}

export function uuid(replace = true) {
  if (!replace) return uuidFn();
  return uuidFn().replaceAll('-', '');
}

export function scrollToElement(value: string | HTMLElement, option?: ScrollIntoViewOptions) {
  setTimeout(() => {
    let element;
    if (typeof value === 'string') {
      element = document.getElementById(value);
    } else if (value) {
      element = value;
    }
    if (element && element.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', ...option });
    }
  }, 40);
}

export function getCurrentTime() {
  return new Date().toLocaleString();
}

export function removeLn(content?: string): string {
  let result = content?.trim();
  if (!result) return '';
  while (result.startsWith('\n') || result.endsWith('\n')) {
    if (result.startsWith('\n')) {
      result = result.slice(2);
    }
    if (result.endsWith('\n')) {
      result = result.slice(0, -2);
    }
  }
  return result;
}

export function addCodeCopy() {
  const clipboard = new Clipboard('.markdown-it-code-copy', {
    text: function (trigger) {
      // eslint-disable-next-line unicorn/prefer-dom-node-dataset
      return decodeURIComponent(trigger.getAttribute('data-clipboard-text') || '');
    },
  });
  clipboard.on('success', function (e) {
    const element = e.trigger?.getElementsByClassName('code-copy-content')?.[0];
    if (element) {
      element.innerHTML = 'Copied!';
      setTimeout(() => (element.innerHTML = ''), 1000);
    }
  });
}

export async function readFileAsString(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsText(file, 'utf8');
      reader.addEventListener('load', function (event) {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function isMobile() {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
}
