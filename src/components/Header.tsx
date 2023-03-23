import { IconButton, useColorMode } from "@chakra-ui/react";
import { IconMoonStars, IconRobot, IconSun, IconSettings, IconPhoto } from "@tabler/icons-react";
import { visibleAtom } from "./atom";

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <div
      className="w-full min-h-16 flex flex-row items-center justify-between px-4 border-b"
      style={{ backgroundColor: "var(--chakra-colors-chakra-body-bg)" }}
    >
      <div className="flex items-center space-x-2 font-medium">
        <IconRobot size="2rem" stroke={1.5} className="fill-teal-600" />
        <div className="tracking-wider font-bold">ChatGPT</div>
      </div>

      <div className="flex flex-row items-center space-x-1">
        <IconButton
          aria-label="Settings"
          variant="ghost"
          icon={<IconSettings stroke={1.5} />}
          onClick={() => visibleAtom.set({ ...visibleAtom.get(), settingVisible: true })}
        />
        <IconButton
          aria-label="Image Create"
          variant="ghost"
          icon={<IconPhoto stroke={1.5} />}
          onClick={() => visibleAtom.set({ ...visibleAtom.get(), imageVisible: true })}
        />
        <IconButton
          aria-label="ColorMode"
          variant="ghost"
          onClick={toggleColorMode}
          icon={colorMode === "light" ? <IconMoonStars stroke={1.5} /> : <IconSun stroke={1.5} />}
        />
      </div>
    </div>
  );
}
