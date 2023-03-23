import React, { ChangeEvent } from "react";
import { Input, InputRightElement, InputGroup, IconButton } from "@chakra-ui/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";

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
      <Input type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={onChange} />
      <InputRightElement>
        <IconButton size="sm" onClick={handleClick}>
          {show ? <IconEye stroke={1.5} size="1.1rem" /> : <IconEyeOff stroke={1.5} size="1.1rem" />}
        </IconButton>
      </InputRightElement>
    </InputGroup>
  );
}
