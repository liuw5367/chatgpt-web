import { IconButton, useColorMode } from '@chakra-ui/react';
import { IconMenu2, IconMoonStars, IconPhoto, IconSettings, IconSun, IconSunMoon } from '@tabler/icons-react';
import { Helmet } from 'react-helmet';

import { useEffect } from 'react';
import { Logo } from './Logo';
import { visibleStore } from './store';
import { getSystemColorMode, useThemeStore } from './theme';

export function Header() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { setColorMode } = useColorMode();
  const colorMode = theme === 'system' ? getSystemColorMode() : theme;

  useEffect(() => {
    setColorMode(theme);
  }, [theme, setColorMode]);

  function updateTheme() {
    if (theme === 'light') {
      setTheme('dark');
    }
    else if (theme === 'dark') {
      setTheme('system');
    }
    else {
      setTheme('light');
    }
  }

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
          onClick={updateTheme}
          icon={theme === 'light'
            ? <IconSun stroke={1.5} />
            : theme === 'dark'
              ? <IconMoonStars stroke={1.5} />
              : <IconSunMoon stroke={1.5} />}
        />
      </div>

      {colorMode === 'light'
        ? (
          <Helmet>
            <meta name="apple-mobile-web-app-status-bar-style" content="#FFFFFF" />
            <meta name="theme-color" content="#FFFFFF" />
          </Helmet>
          )
        : (
          <Helmet>
            <meta name="apple-mobile-web-app-status-bar-style" content="#1A202C" />
            <meta name="theme-color" content="#1A202C" />
          </Helmet>
          )}
    </div>
  );
}
