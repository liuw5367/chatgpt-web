import { APP_NAME } from '@/constants';

import App from '../app';
import Layout from '../layouts/Layout';

export default function Home() {
  return (
    <Layout title={APP_NAME}>
      <App />
    </Layout>
  );
}
