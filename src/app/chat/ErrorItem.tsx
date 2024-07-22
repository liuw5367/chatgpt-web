import { Alert, AlertDescription, AlertTitle, Box, CloseButton } from '@chakra-ui/react';

import type { ResponseError } from '../../utils';

interface Props {
  error?: ResponseError;
  onClose?: () => void;
}

export default function ErrorItem(props: Props) {
  const { error, onClose } = props;

  if (!error) {
    return null;
  }

  if (error?.message) {
    return (
      <Alert status="error" className="relative mb-4 rounded">
        <Box>
          <AlertTitle>{error?.code || ''}</AlertTitle>
          <AlertDescription>{error?.message}</AlertDescription>
        </Box>
        <CloseButton onClick={onClose} className="absolute !right-2 !top-2" />
      </Alert>
    );
  }

  return (
    <Alert status="error" className="relative mb-4 rounded">
      {error?.code || ''}
      <CloseButton onClick={onClose} className="absolute !right-2" />
    </Alert>
  );
}
