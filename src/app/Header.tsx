import { IconButton, useColorMode } from '@chakra-ui/react';
import { IconMenu2, IconMoonStars, IconPhoto, IconSettings, IconSun } from '@tabler/icons-react';
import Head from 'next/head';

import { Logo } from './Logo';
import { visibleStore } from './store';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <div
      className="min-h-16 w-full flex flex-row items-center justify-between border-b px-4"
      style={{ backgroundColor: 'var(--chakra-colors-chakra-body-bg)' }}
    >
      <div className="flex items-center font-medium space-x-2">
        <Logo />
        <IconButton
          aria-label="ChatList"
          variant="ghost"
          icon={<IconMenu2 stroke={1.5} />}
          onClick={() => {
            visibleStore.setState((state) => ({ chatVisible: !state.chatVisible }));
          }}
        />
      </div>

      <div className="flex flex-row items-center space-x-1">
        <IconButton
          aria-label="Settings"
          variant="ghost"
          icon={<IconSettings stroke={1.5} />}
          onClick={() => visibleStore.setState({ settingVisible: true })}
        />
        <IconButton
          aria-label="ImageCreate"
          variant="ghost"
          icon={<IconPhoto stroke={1.5} />}
          onClick={() => visibleStore.setState({ imageVisible: true })}
        />
        <IconButton
          aria-label="ColorMode"
          variant="ghost"
          onClick={toggleColorMode}
          icon={colorMode === 'light' ? <IconMoonStars stroke={1.5} /> : <IconSun stroke={1.5} />}
        />
      </div>

      {colorMode === 'light'
        ? (
          <Head>
            <meta name="apple-mobile-web-app-status-bar-style" content="#FFFFFF" />
            <meta name="theme-color" content="#FFFFFF" />
          </Head>
          )
        : (
          <Head>
            <meta name="apple-mobile-web-app-status-bar-style" content="#1A202C" />
            <meta name="theme-color" content="#1A202C" />
          </Head>
          )}
    </div>
  );
}
