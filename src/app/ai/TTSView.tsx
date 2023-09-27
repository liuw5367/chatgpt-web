import { useToast } from '@chakra-ui/react';
import { useMemoizedFn } from 'ahooks';
import sha256 from 'crypto-js/sha256';
import React, { useEffect, useImperativeHandle, useRef } from 'react';

import { createStreamPlayer } from '../../utils/Recorder';
import type { BufferStreamPlayerType } from '../../utils/RecorderType';
import { request } from '../utils';
import type { Speaker } from './Config';
import { getUnisoundKeySecret, TTS_CONFIG } from './Config';

export enum TTSStatusEnum {
  NORMAL,
  /** 合成中 */
  GENERATING,
  /** 播放中 */
  PLAYING,
}

export interface TTSRef {
  start: (content: string) => void;
  stop: () => void;
}

interface Props {
  status: TTSStatusEnum;
  onStatusChange?: (v: TTSStatusEnum) => void;
  speaker: Speaker;
  config?: Record<string, any>;
}

const TTSView = React.forwardRef<TTSRef, Props>((props, ref) => {
  const toast = useToast({ position: 'top', isClosable: true });
  const { onStatusChange, speaker, config = {} } = props;

  const socketRef = useRef<WebSocket>();
  const playerRef = useRef<BufferStreamPlayerType>();

  useImperativeHandle(
    ref,
    () => {
      return { start, stop };
    },
    [],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const startTts = useMemoizedFn(async (inputContent: string) => {
    if (!inputContent.trim()) return;
    let content = inputContent;
    if (content.length > 500) {
      content = content.slice(0, 500);
    }

    const chatConfig = getUnisoundKeySecret();
    const appKey = chatConfig.KEY;
    const secret = chatConfig.SECRET;
    const time: number = Date.now();
    let sign: string;
    if (secret) {
      sign = sha256(`${appKey}${time}${secret}`).toString().toUpperCase();
    } else {
      try {
        const response = await request('/api/unisound', {
          method: 'POST',
          body: JSON.stringify({ key: appKey, time }),
        });
        if (!response.ok) {
          const json = await response.json();
          throw new Error(json?.error?.code);
        }
        const json = await response.json();
        sign = json.sign;
      } catch (error: any) {
        console.log(error);
        toast({ status: 'error', title: error.message || 'asr sign error' });
        return;
      }
    }

    const socket = new WebSocket(`${TTS_CONFIG.SOCKET_URL}?appkey=${appKey}&time=${time}&sign=${sign}`);
    socketRef.current = socket;
    socket.binaryType = 'arraybuffer';

    const player = createStreamPlayer(playerStop);
    playerRef.current = player;

    socket.addEventListener('open', () => {
      onStatusChange?.(TTSStatusEnum.PLAYING);
      player.start();

      socket.send(
        JSON.stringify({
          format: 'pcm',
          vcn: speaker.code,
          text: content,
          sample: 16_000,
          speed: 50,
          volume: 50,
          pitch: 50,
          bright: 50,
          ...config,
        }),
      );
    });
    socket.addEventListener('message', (res) => {
      try {
        const result = JSON.parse(res.data);
        socket.close();
        if (result.code !== 0) {
          toast({ status: 'error', title: '合成遇到点问题，请稍后再试' });
          onStatusChange?.(TTSStatusEnum.NORMAL);
          player && player.stop();
        }
      } catch {
        player && player.input(res.data);
        // console.log('tts socket onmessage', e);
      }
    });
    socket.addEventListener('close', (e) => {
      console.log('tts socket onclose', e);
    });
    socket.addEventListener('error', (e) => {
      console.log('tts socket onerror', e);
    });
  });

  const start = useMemoizedFn((content: string) => {
    stop();
    startTts(content);
  });

  const stop = useMemoizedFn(() => {
    if (playerRef.current) {
      playerRef.current.stop();
      playerRef.current = undefined;
    }
    playerStop();
  });

  function playerStop() {
    onStatusChange?.(TTSStatusEnum.NORMAL);
    if (playerRef.current) {
      playerRef.current = undefined;
    }
    if (socketRef.current) {
      socketRef.current?.close();
      socketRef.current = undefined;
    }
  }

  return null;
});

export default TTSView;
