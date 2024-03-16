import { ChakraProvider, cookieStorageManagerSSR, extendTheme, localStorageManager } from '@chakra-ui/react';
import type { GetServerSidePropsContext } from 'next/types';
import type { ReactNode } from 'react';

interface Props {
  cookies: string | number;
  children?: ReactNode;
}

export function Chakra({ cookies, children }: Props) {
  const colorModeManager = typeof cookies === 'string' ? cookieStorageManagerSSR(cookies) : localStorageManager;
  const theme = extendTheme({ initialColorMode: 'system', useSystemColorMode: true });

  return (
    <ChakraProvider colorModeManager={colorModeManager} theme={theme}>
      {children}
    </ChakraProvider>
  );
}

export function getServerSideProps({ req }: GetServerSidePropsContext) {
  return {
    props: {
      cookies: req.headers.cookie ?? '',
    },
  };
}
