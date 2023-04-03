import MarkdownIt from "markdown-it";
import mdHighlight from "markdown-it-highlightjs";
// @ts-ignore
import mdKatex from "markdown-it-katex";

export function renderMarkdown(content: string) {
  const markdown = MarkdownIt({ linkify: true, breaks: true }).use(mdKatex).use(mdHighlight);

  const fence = markdown.renderer.rules.fence;
  markdown.renderer.rules.fence = (...args) => {
    const [tokens, idx] = args;
    const token = tokens[idx];
    const rawCode = fence?.(...args);

    const copyCode = token.content.replaceAll('"', "&quot;").replaceAll("'", "&lt;");

    return `<div style="position: relative">
              ${rawCode}
              <button class="markdown-it-code-copy flex flex-row" data-clipboard-text="${copyCode}" style="position: absolute; top: 6px; right: 4px; cursor: pointer;" title="Copy">
                <span style="font-size: 16px; opacity: 0.7; color: grey;" class="i-tabler-copy"></span>
                <span style="margin-left: 2px; font-size: 10px; opacity: 0.7; color: grey;" class="code-copy-content"></span>
              </button>
            </div>`;
  };

  return markdown.render(content);
}
