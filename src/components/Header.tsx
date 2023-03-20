import { IconButton, useColorMode } from "@chakra-ui/react";
import { IconMoonStars, IconRobot, IconSun } from "@tabler/icons-react";

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <div
      className="w-full min-h-16 flex flex-row items-center justify-between px-4 border-b fixed z-100"
      style={{ backgroundColor: "var(--chakra-colors-chakra-body-bg)" }}
    >
      <div className="flex items-center space-x-1 font-medium">
        <IconRobot size="2rem" stroke={1.5} className="fill-teal-600" />
        <div className="tracking-wider font-bold">ChatGPT</div>
      </div>
      <IconButton
        aria-label="ColorMode"
        onClick={toggleColorMode}
        icon={
          colorMode === "light" ? (
            <IconMoonStars size="1.25rem" stroke={1.5} />
          ) : (
            <IconSun size="1.25rem" stroke={1.5} />
          )
        }
      />
    </div>
  );
}
