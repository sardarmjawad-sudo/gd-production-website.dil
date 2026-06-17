import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Explicitly link standard CSS without passing through Next.js Webpack */}
        <link rel="stylesheet" href="/style.css" />
        <script src="/script.js" async></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
