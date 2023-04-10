import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerPlacement,
} from "@chakra-ui/react";
import type React from "react";

interface Props {
  type?: "side" | "drawer";
  sideWidth?: string;

  isOpen?: boolean;
  onClose: () => void;

  size?: string;
  placement?: DrawerPlacement;

  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export default function SimpleDrawer(props: Props) {
  const { isOpen = false, onClose, size = "sm", placement = "right", type = "drawer", sideWidth = "" } = props;
  const { header, footer, children } = props;

  if (type === "side") {
    return (
      <div
        className={`min-w-80 max-w-80 h-full flex flex-col ${sideWidth}`}
        border="r r-solid r-$chakra-colors-chakra-border-color"
      >
        {header && <div className={"px-6 py-4"}>{header}</div>}
        <div className={"px-6 py-4 flex-1 flex flex-col overflow-y-auto overflow-x-hidden"}>
          <div className="!overflow-x-hidden">{children}</div>
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
