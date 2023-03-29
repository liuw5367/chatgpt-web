import { Textarea, TextareaProps } from "@chakra-ui/react";
import React from "react";
import ResizeTextarea from "react-textarea-autosize";

export const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  return (
    <Textarea
      w="100%"
      minH="unset"
      overflow="auto"
      resize="none"
      ref={ref}
      minRows={1}
      as={ResizeTextarea}
      {...props}
    />
  );
});
