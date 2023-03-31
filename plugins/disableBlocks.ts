export default function plugin(platform?: string) {
  const transform = (code: string, id: string) => {
    if (id.includes("pages/api/generate.ts")) {
      return {
        code: code.replace(/^.*?#vercel-disable-blocks([\s\S]+?)#vercel-end.*?$/gm, ""),
        map: null,
      };
    }
    if (platform === "netlify" && id.includes("layouts/Layout.astro")) {
      let result = code.replace(/^.*?<!-- netlify-disable-blocks -->([\s\S]+?)<!-- netlify-disable-end -->.*?$/gm, "");
      try {
        result = result.replace(/^.*?import ReloadPrompt([\s\S]+?).astro";.*?$/gm, "");
        result = result.replace(/^.*?import LinkTag([\s\S]+?).astro";.*?$/gm, "");
      } catch (e) {
        console.log(e);
      }

      return { code: result, map: null };
    }
  };

  return {
    name: "vercel-disable-blocks",
    enforce: "pre",
    transform,
  };
}
