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
  isOpen?: boolean;
  onClose: () => void;

  size?: string;
  placement?: DrawerPlacement;

  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export default function SimpleDrawer(props: Props) {
  const { isOpen = false, onClose, size = "sm", placement = "right", header, footer, children } = props;
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
