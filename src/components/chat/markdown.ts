import MarkdownIt from "markdown-it";
// @ts-ignore
import mdKatex from "markdown-it-katex";
import mdHighlight from "markdown-it-highlightjs";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

export function renderMarkdown(content: string) {
  return MarkdownIt().use(mdKatex).use(mdHighlight, { hljs }).render(content);
}
