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
  if (!replace) {
    return uuidFn();
  }
  return uuidFn().replaceAll('-', '');
}

export function scrollToElement(value: string | HTMLElement, option?: ScrollIntoViewOptions) {
  setTimeout(() => {
    let element;
    if (typeof value === 'string') {
      element = document.getElementById(value);
    }
    else if (value) {
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
  if (!result) {
    return '';
  }
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
    text(trigger) {
      return decodeURIComponent(trigger.getAttribute('data-clipboard-text') || '');
    },
  });
  clipboard.on('success', (e) => {
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
      reader.addEventListener('load', (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        }
        else {
          reject(new Error('error'));
        }
      });
    }
    catch (error) {
      reject(error);
    }
  });
}

export function isMobile() {
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent);
}

export function moveCursorToEnd(element: HTMLTextAreaElement) {
  setTimeout(() => {
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  }, 0);
}

export function isWindows() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /windows|win32/i.test(navigator.userAgent);
}

export function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export async function speakText(content: string, callback: (playing: boolean) => void) {
  if (!window.speechSynthesis) {
    return;
  }
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
    callback(false);
  }

  await sleep(300);

  const msg = new SpeechSynthesisUtterance(content);
  msg.lang = 'zh';
  msg.rate = 1;
  msg.addEventListener('end', () => {
    callback(false);
  });
  msg.addEventListener('error', () => {
    callback(false);
  });
  callback(true);
  speechSynthesis.speak(msg);
}
