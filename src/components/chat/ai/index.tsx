import { useMemoizedFn } from 'ahooks';
import React, { useImperativeHandle, useState } from 'react';

import { defaultSpeaker } from '../Config';
import type { Command } from '../type';
import ASRView, { ASRRef, ASRStatusEnum } from './ASRView';
import TTSView, { TTSRef, TTSStatusEnum } from './TTSView';

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
  onCommandChange: (v: Command) => void;
}

const Keys = {
  send: ['发送', '发送消息', '发出', '发出消息'],
  stopTts: ['停止', '停止播放', '暂停', '暂停播放', '取消', '取消播放'],
  stopAI: ['停止', '停止生成', '放弃', '放弃结果', '取消', '取消结果'],
};

const View = React.forwardRef<VoiceRef, Props>((props, ref) => {
  const { chatLoading, onAsrResultChange, onTtsStatusChange, onAsrStatusChange, onCommandChange } = props;
  const [asrState, setAsrState] = useState<ASRStatusEnum>(ASRStatusEnum.NORMAL);
  const [ttsState, setTtsState] = useState<TTSStatusEnum>(TTSStatusEnum.NORMAL);
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

    /*
    const value = removeChar(content);
    if (chatLoading) {
      if (changing) return;

      if (Keys.stopAI.includes(value)) {
        onCommandChange?.('stopAI');
      }
      return;
    }
    if (ttsState === TTSStatusEnum.NORMAL) {
      onAsrResultChange?.(value, changing);
      return;
    }
    if (changing) return;
    if (Keys.stopAI.includes(value)) {
      onCommandChange?.('stopTTS');
      return;
    }
    */
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

function removeChar(content: string) {
  if (content.length === 0) return content;
  const char = content.substring(content.length - 1, content.length);
  const list = ['，', '。', ',', '.'];
  const flag = list.find((c) => c === char);
  if (flag) {
    return content.substring(0, content.length - 1);
  }
  return content;
}
