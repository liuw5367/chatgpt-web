import Clipboard from "clipboard";
import { v4 as uuidFn } from "uuid";

export function request(url: string, config: RequestInit) {
  return fetch(url, {
    ...config,
    headers: {
      "Content-Type": "application/json",
      "access-code": localStorage.getItem("accessCode") || "",
      ...config.headers,
    },
  });
}

export function uuid(replace = true) {
  if (!replace) return uuidFn();
  return uuidFn().replaceAll("-", "");
}

export function scrollToElement(value: string | HTMLElement, option?: ScrollIntoViewOptions) {
  setTimeout(() => {
    let element;
    if (typeof value === "string") {
      element = document.getElementById(value);
    } else if (value) {
      element = value;
    }
    if (element && element.scrollIntoView) {
      element.scrollIntoView({ behavior: "smooth", block: "center", ...option });
    }
  }, 40);
}

export function getCurrentTime() {
  return new Date().toLocaleString();
}

export function removeLn(content?: string): string {
  let result = content?.trim();
  if (!result) return "";
  while (result.startsWith("\n") || result.endsWith("\n")) {
    if (result.startsWith("\n")) {
      result = result.substring(2);
    }
    if (result.endsWith("\n")) {
      result = result.substring(0, result.length - 2);
    }
  }
  return result;
}

export function addCodeCopy() {
  const clipboard = new Clipboard(".markdown-it-code-copy", {
    text: function (trigger) {
      return decodeURIComponent(trigger.getAttribute("data-clipboard-text") || "");
    },
  });
  clipboard.on("success", function (e) {
    const element = e.trigger?.getElementsByClassName("code-copy-content")?.[0];
    if (element) {
      element.innerHTML = "Copied!";
      setTimeout(() => (element.innerHTML = ""), 1000);
    }
  });
}

export async function readFileAsString(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsText(file, "UTF-8");
      reader.onload = function (event) {
        const result = event.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject();
        }
      };
    } catch (e) {
      reject(e);
    }
  });
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
