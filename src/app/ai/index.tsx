import { useMemoizedFn } from "ahooks";
import React, { useImperativeHandle, useState } from "react";

import ASRView, { ASRRef, ASRStatusEnum } from "./ASRView";
import { defaultSpeaker } from "./Config";
import TTSView, { TTSRef, TTSStatusEnum } from "./TTSView";

export interface VoiceRef {
  asr: () => void;
  stopAsr: () => void;
  tts: (v?: string) => void;
  stopTts: () => void;
}

interface Props {
  chatLoading: boolean;
  onAsrResultChange: (v: string, changing: boolean) => void;
  onAsrStatusChange: (v: ASRStatusEnum) => void;
  onTtsStatusChange: (v: TTSStatusEnum) => void;
}

const View = React.forwardRef<VoiceRef, Props>((props, ref) => {
  const { onAsrResultChange, onTtsStatusChange, onAsrStatusChange } = props;
  const [asrState, setAsrState] = useState<ASRStatusEnum>(ASRStatusEnum.NORMAL);
  const [ttsState, setTtsState] = useState<TTSStatusEnum>(TTSStatusEnum.NORMAL);
  const asrRef = React.useRef<ASRRef | null>();
  const ttsRef = React.useRef<TTSRef | null>();

  useImperativeHandle(
    ref,
    () => {
      return { asr, stopAsr, tts, stopTts };
    },
    []
  );

  const stopAsr = useMemoizedFn(() => {
    asrRef.current?.stop();
  });

  const asr = useMemoizedFn(() => {
    asrRef.current?.start();
  });

  const stopTts = useMemoizedFn(() => {
    ttsRef.current?.stop();
  });

  const tts = useMemoizedFn((content?: string) => {
    if (!content) return;
    ttsRef.current?.start(content);
  });

  function handleAsrStatus(status: ASRStatusEnum) {
    setAsrState(status);
    onAsrStatusChange?.(status);
  }

  function handleTtsStatus(status: TTSStatusEnum) {
    setTtsState(status);
    onTtsStatusChange?.(status);
  }

  const handleResultChange = useMemoizedFn((content: string, changing: boolean) => {
    if (ttsState !== TTSStatusEnum.NORMAL) return;
    onAsrResultChange?.(content, changing);
  });

  return (
    <>
      <ASRView
        status={asrState}
        onStatusChange={handleAsrStatus}
        onResultChange={handleResultChange}
        ref={(ref) => (asrRef.current = ref)}
      />
      <TTSView
        speaker={defaultSpeaker}
        status={ttsState}
        onStatusChange={handleTtsStatus}
        ref={(ref) => (ttsRef.current = ref)}
      />
    </>
  );
});

export default View;
