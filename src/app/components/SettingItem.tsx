import {
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Switch,
} from '@chakra-ui/react';
import { PasswordInput } from '../../components';
import type { SettingItemType } from '../panels';

interface ItemProps {
  item: SettingItemType;

  value: string;
  onChange?: (v: string) => void;

  options?: { label: string; value: string }[];
}

export function SettingItem({ item, value, options, onChange }: ItemProps) {
  const horizontal = item.type === 'switch';

  function renderContent() {
    if (item.type === 'password') {
      return (
        <PasswordInput
          className="flex-1"
          placeholder={item.placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
    }

    if (item.type === 'select') {
      return (
        <Select value={value} onChange={(e) => onChange?.(e.target.value)}>
          {options?.map((item) => (
            <option key={item.label} value={item.label}>
              {item.value}
            </option>
          ))}
        </Select>
      );
    }

    if (item.type === 'number') {
      return (
        <NumberInput
          className="flex-1"
          min={0}
          step={0.1}
          value={value}
          onChange={(v) => {
            onChange?.(v !== '' ? Number(v) as any : undefined);
          }}
        >
          <NumberInputField placeholder={item.placeholder} />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      );
    }

    if (item.type === 'switch') {
      return (
        <Switch
          colorScheme="teal"
          isChecked={value === '1'}
          onChange={(e) => onChange?.(e.target.checked ? '1' : '0')}
        />
      );
    }

    return (
      <Input
        className="flex-1"
        focusBorderColor="teal.600"
        placeholder={item.placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  }

  return (
    <FormControl className={`${horizontal && 'flex flex-row'}`}>
      <FormLabel className={`${horizontal && 'flex-1'}`}>
        <span>{item.label}</span>
      </FormLabel>

      {renderContent()}

      {item.desc && <FormHelperText>{item.desc}</FormHelperText>}
    </FormControl>
  );
}
