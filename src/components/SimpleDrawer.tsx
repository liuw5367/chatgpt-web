import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/react";
import type React from "react";

interface Props {
  type?: "side" | "drawer";
  sideWidth?: string;

  isOpen?: boolean;
  onClose: () => void;

  size?: string;
  placement?: "left" | "right";

  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function SimpleDrawer(props: Props) {
  const { isOpen = false, onClose, size = "sm", placement = "right", type = "drawer", sideWidth } = props;
  const { header, footer, children } = props;

  if (isOpen && type === "side") {
    return (
      <div
        className={`${sideWidth || "min-w-80 max-w-80"} h-full flex flex-col`}
        style={
          placement === "left"
            ? { borderRight: "1px solid var(--chakra-colors-chakra-border-color)" }
            : { borderLeft: "1px solid var(--chakra-colors-chakra-border-color)" }
        }
      >
        {header && <div className={"px-6 py-4 font-bold"}>{header}</div>}
        <div className={`px-6 pb-4 w-full flex-1 overflow-y-auto overflow-x-hidden ${header ? "pt-0" : "pt-4"}`}>
          {children}
        </div>
        {footer && <div className={"px-6 py-4"}>{footer}</div>}
      </div>
    );
  }

  return (
    <Drawer isOpen={isOpen} size={size} placement={placement} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>{header}</DrawerHeader>
        <DrawerBody className="!overflow-x-hidden">{children}</DrawerBody>
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
}
