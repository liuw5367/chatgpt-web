import MarkdownIt from "markdown-it";
// @ts-ignore
import mdKatex from "markdown-it-katex";
import hljs from "highlight.js";
// @ts-expect-error
import mdCopy from "markdown-it-code-copy";
import "highlight.js/styles/github-dark.css";
import "github-markdown-css";

export function renderMarkdown(content: string) {
  const markdown = MarkdownIt({
    linkify: true,
    highlight: (str: string, lang: string): string => {
      let content = str;
      if (lang && hljs.getLanguage(lang)) {
        try {
          content = hljs.highlight(lang, str).value;
        } catch (e) {
          console.log(e);
          return str;
        }
      } else {
        content = markdown.utils.escapeHtml(str);
      }
      return `<pre class="hljs" style="overflow: auto"><code>${content}</code></pre>`;
    },
  });
  return markdown.use(mdKatex).use(mdCopy, { iconClass: "i-tabler-copy", iconStyle: "color: grey;" }).render(content);
}
