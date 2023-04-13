import '@/styles/globals.css';
import '@/styles/markdown.css';
import 'uno.css';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';
import 'github-markdown-css';

import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';

import { Chakra, getServerSideProps } from '../chakra';

function App({ Component, pageProps }: AppProps) {
  return (
    <Chakra cookies={pageProps.cookies}>
      <Component {...pageProps} />
    </Chakra>
  );
}

export default appWithTranslation(App);

export { getServerSideProps };
