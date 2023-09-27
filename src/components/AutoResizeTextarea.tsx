import type { TextareaProps } from '@chakra-ui/react';
import { Textarea } from '@chakra-ui/react';
import React from 'react';
import ResizeTextarea from 'react-textarea-autosize';

export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps & { minRows: number; maxRows: number; enterKeyHint?: 'send' | undefined }
>((props, ref) => {
  return (
    <Textarea
      w="100%"
      minH="unset"
      overflow="auto"
      resize="none"
      ref={ref}
      focusBorderColor="teal.600"
      // @ts-expect-error
      minRows={1}
      as={ResizeTextarea}
      {...props}
    />
  );
});
