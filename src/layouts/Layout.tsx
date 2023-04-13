import Head from 'next/head';
import Script from 'next/script';
import React from 'react';

interface Props {
  title: string;
  children?: React.ReactNode;
}

export default function Layout(props: Props) {
  const { title, children } = props;

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" />
        <link rel="mask-icon" href="/favicon.svg" color="#FFFFFF" />
        <meta name="msapplication-TileColor" content="#FFFFFF" />
        <title>{title}</title>
        <meta name="description" content={title} />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <Script src="/swRegister.js" strategy="lazyOnload" />
      <main>{children}</main>
    </>
  );
}
