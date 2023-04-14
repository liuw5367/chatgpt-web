import { GetStaticPropsContext } from 'next/types';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

import { APP_NAME } from '@/constants';

import App from '../components/ReactApp';
import Layout from '../layouts/Layout';

export default function Home() {
  return (
    <Layout title={APP_NAME}>
      <App />
    </Layout>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(locale || '', ['common'], null, ['en', 'zh'])),
    },
  };
}
