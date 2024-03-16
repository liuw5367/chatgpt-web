import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import 'github-markdown-css';

import '@unocss/reset/tailwind.css';
import 'uno.css';

import '@/styles/markdown.css';
import '@/styles/globals.css';

import type { AppProps } from 'next/app';

import { Chakra } from '../chakra';

function App({ Component, pageProps }: AppProps) {
  return (
    <Chakra cookies={pageProps.cookies}>
      <Component {...pageProps} />
    </Chakra>
  );
}

export default App;

export { getServerSideProps } from '../chakra';
