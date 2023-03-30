import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, CloseButton } from "@chakra-ui/react";

import { ResponseError } from "../../pages/api/_utils";

interface Props {
  error?: ResponseError;
  onClose?: () => void;
}

export default function ErrorItem(props: Props) {
  const { error, onClose } = props;

  if (!error) return null;

  return (
    <Alert status="error" className="mb-4 relative">
      <AlertIcon />
      {!error?.message ? (
        <>
          <Box>
            <AlertTitle>{error?.code || ""}</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Box>
          <CloseButton onClick={onClose} className="absolute !top-2 !right-2" />
        </>
      ) : (
        <>
          {error?.code || ""}
          <CloseButton onClick={onClose} className="absolute !right-2" />
        </>
      )}
    </Alert>
  );
}
