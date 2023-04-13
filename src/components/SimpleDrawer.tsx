import {
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
} from '@chakra-ui/react';
import type React from 'react';

interface Props {
  type?: 'side' | 'drawer';
  sideWidth?: string;

  isOpen?: boolean;
  onClose: () => void;

  size?: string;
  placement?: 'left' | 'right';

  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export default function SimpleDrawer(props: Props) {
  const { isOpen = false, onClose, size = 'sm', placement = 'right', type = 'drawer', sideWidth } = props;
  const { header, footer, children } = props;

  if (isOpen && type === 'side') {
    return (
      <div
        className={`${sideWidth || 'min-w-80 max-w-80'} h-full flex flex-col`}
        border={
          placement === 'left'
            ? 'r r-solid r-$chakra-colors-chakra-border-color'
            : 'l l-solid l-$chakra-colors-chakra-border-color'
        }
      >
        {header && <div className={'px-6 py-4'}>{header}</div>}
        <div className={'px-6 py-4 w-full flex-1 overflow-y-auto overflow-x-hidden'}>{children}</div>
        {footer && <div className={'px-6 py-4'}>{footer}</div>}
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
