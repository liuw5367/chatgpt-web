import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import Layout from '../layouts/Layout';
import { APP_NAME } from '@/constants';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, []);

  return (
    <Layout title={APP_NAME}>
      <h1>Page not found</h1>
      <h1>Upps, something is wrong, the requested page not found!</h1>
      <Link href="/">Back home</Link>
    </Layout>
  );
}
