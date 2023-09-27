import { useMemoizedFn } from 'ahooks';
import React, { useImperativeHandle } from 'react';

import type { ASRRef } from './ASRView';
import { ASRView } from './ASRView';
import { defaultSpeaker } from './Config';
import type { TTSRef } from './TTSView';
import { TTSView } from './TTSView';

export interface VoiceRef {
  asr: () => void;
  stopAsr: () => void;
  tts: (v?: string) => void;
  stopTts: () => void;
}

interface Props {
  chatLoading: boolean;
  onAsrResultChange: (v: string, changing: boolean) => void;
  onAsrStatusChange: (recording: boolean) => void;
  onTtsStatusChange: (playing: boolean) => void;
}

const View = React.forwardRef<VoiceRef, Props>((props, ref) => {
  const { onAsrResultChange, onTtsStatusChange, onAsrStatusChange } = props;
  const asrRef = React.useRef<ASRRef | null>();
  const ttsRef = React.useRef<TTSRef | null>();

  useImperativeHandle(
    ref,
    () => {
      return { asr, stopAsr, tts, stopTts };
    },
    [],
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

  return (
    <>
      <ASRView
        onStatusChange={onAsrStatusChange}
        onResultChange={onAsrResultChange}
        ref={(ref) => (asrRef.current = ref)}
      />
      <TTSView speaker={defaultSpeaker} onStatusChange={onTtsStatusChange} ref={(ref) => (ttsRef.current = ref)} />
    </>
  );
});

export default View;
