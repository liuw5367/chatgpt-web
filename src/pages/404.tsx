import Link from 'next/link';

import { APP_NAME } from '@/constants';

import Layout from '../layouts/Layout';

export default function NotFound() {
  return (
    <Layout title={APP_NAME}>
      <h1>Page not found</h1>
      <h1>Upps, something is wrong, the requested page not found!</h1>
      <Link href="/">Back home</Link>
    </Layout>
  );
}
