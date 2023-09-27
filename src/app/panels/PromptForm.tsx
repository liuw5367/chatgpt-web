import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { useTranslation } from "../i18n";

interface Props {
  open?: boolean;
  name?: string;
  desc?: string;
  onSave?: (name: string, desc?: string) => void;
  onClose: () => void;
}

export function PromptFormModal(props: Props) {
  const { name, desc, open, onSave, onClose } = props;
  const toast = useToast({ position: "top", isClosable: true });
  const { t } = useTranslation();
  const disclosure = useDisclosure();
  const [data, setData] = useState<{ name: string; desc?: string }>({ name: "" });

  useEffect(() => {
    setData({ name: name || "", desc });
  }, [name, desc]);

  useEffect(() => {
    if (open) {
      disclosure.onOpen();
    } else {
      disclosure.onClose();
    }
  }, [open, disclosure]);

  function handleSaveClick() {
    if (!data.name) {
      toast({ status: "warning", title: "请输入名称" });
      return;
    }
    onSave?.(data.name, data.desc);
    setData({ name: "" });
  }

  return (
    <Modal isOpen={disclosure.isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t("Save To Favorite")}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <FormControl isRequired>
            <FormLabel>{t("Name")}</FormLabel>
            <Input
              focusBorderColor="teal.600"
              placeholder=""
              value={data.name}
              onChange={(e) => setData((draft) => ({ ...draft, name: e.target.value }))}
            />
          </FormControl>

          <FormControl mt={4}>
            <FormLabel>{t("Description")}</FormLabel>
            <Textarea
              focusBorderColor="teal.600"
              placeholder=""
              rows={3}
              value={data.desc}
              onChange={(e) => setData((draft) => ({ ...draft, desc: e.target.value }))}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} mr={3}>
            {t("Cancel")}
          </Button>
          <Button colorScheme="teal" onClick={handleSaveClick}>
            {t("Save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
