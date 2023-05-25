import React, { ChangeEvent, useRef } from 'react';

interface Props {
  accept?: string;
  multiple?: boolean;
  onChange?: (file: File) => void;
  render: (onClick: () => void) => React.ReactNode;
}

export function FileUpload(props: Props) {
  const { multiple = false, accept = '', onChange, render } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.files?.[0];
    if (file) {
      onChange?.(file);
    }
  };

  return (
    <div className="flex">
      <input onChange={handleChange} type="file" accept={accept} multiple={multiple} ref={inputRef} hidden />
      {render(handleClick)}
    </div>
  );
}
