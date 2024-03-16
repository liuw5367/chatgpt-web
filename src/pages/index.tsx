import App from '../app';
import Layout from '../layouts/Layout';
import { APP_NAME } from '@/constants';

export default function Home() {
  return (
    <Layout title={APP_NAME}>
      <App />
    </Layout>
  );
}
