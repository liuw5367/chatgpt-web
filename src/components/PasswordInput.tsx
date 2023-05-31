import { IconButton, Input, InputGroup, InputRightElement } from "@chakra-ui/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import React, { ChangeEvent } from "react";

interface Props {
  className?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function PasswordInput(props: Props) {
  const { className, value, onChange, placeholder } = props;
  const [show, setShow] = React.useState(false);
  const handleClick = () => setShow(!show);

  return (
    <InputGroup size="md" className={className}>
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        focusBorderColor="teal.600"
      />
      <InputRightElement>
        <IconButton aria-label="" size="sm" onClick={handleClick}>
          {show ? <IconEye stroke={1.5} size="1.1rem" /> : <IconEyeOff stroke={1.5} size="1.1rem" />}
        </IconButton>
      </InputRightElement>
    </InputGroup>
  );
}
