import Clipboard from 'clipboard';
import { v4 as uuidFn } from 'uuid';

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
      result = result.substring(2);
    }
    if (result.endsWith('\n')) {
      result = result.substring(0, result.length - 2);
    }
  }
  return result;
}

export function addCodeCopy() {
  const clipboard = new Clipboard('.markdown-it-code-copy');
  clipboard.on('success', function (e) {
    const element = e.trigger?.getElementsByClassName('code-copy-content')?.[0];
    if (element) {
      element.innerHTML = 'Copied!';
      setTimeout(() => (element.innerHTML = ''), 1000);
    }
  });
}
