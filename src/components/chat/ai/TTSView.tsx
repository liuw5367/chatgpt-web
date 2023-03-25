import { useMemoizedFn } from "ahooks";
import { sha256 } from "js-sha256";
import { isEmpty } from "lodash-es";
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

import { getUnisoundKeySecret, Speaker, TTS_CONFIG } from "./Config";
import PCMPlayer from "./PCMPlayer";

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
  const { status, onStatusChange, speaker, config = {} } = props;
  const audioRef = useRef<HTMLAudioElement | null>();
  const [abortController, setAbortController] = useState<AbortController>();

  const socketRef = useRef<WebSocket>();
  const playerRef = useRef<PCMPlayer>();

  useImperativeHandle(
    ref,
    () => {
      return { start, stop };
    },
    []
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  const startTts = useMemoizedFn((inputContent: string) => {
    if (isEmpty(inputContent.trim())) return;
    let content = inputContent;
    if (content.length > 500) {
      content = content.substring(0, 500);
    }

    const chatConfig = getUnisoundKeySecret();
    const appKey = chatConfig.KEY;
    const secret = chatConfig.SECRET;
    const time: number = +new Date();
    const sign = sha256(`${appKey}${time}${secret}`).toUpperCase();

    try {
      new window.AudioContext();
    } catch (e) {
      alert("您当前的浏览器不支持 Web Audio API");
      return;
    }
    onStatusChange?.(TTSStatusEnum.PLAYING);

    const socket = new WebSocket(`${TTS_CONFIG.SOCKET_URL}?appkey=${appKey}&time=${time}&sign=${sign}`);
    socketRef.current = socket;
    socket.binaryType = "arraybuffer";

    const player = new PCMPlayer({
      inputCodec: "Int16",
      channels: 1,
      sampleRate: 16000,
      flushTime: 100,
    });
    playerRef.current = player;
    player.inputFinished = false;
    player.onEnded = () => stopPlay();

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          format: "pcm",
          vcn: speaker.code,
          text: content,
          sample: 16000,
          speed: 50,
          volume: 50,
          pitch: 50,
          bright: 50,
          ...config,
        })
      );
    };
    socket.onmessage = (res) => {
      try {
        const result = JSON.parse(res.data);
        socket.close();
        if (result.code !== 0) {
          alert("合成遇到点问题，请稍后再试~");
          onStatusChange?.(TTSStatusEnum.NORMAL);
          player && player.destroy();
        }
      } catch (e) {
        player && player.feed(res.data);
        // console.log('tts socket onmessage', e);
      }
    };
    socket.onclose = (e) => {
      player.inputFinished = true;
      console.log("tts socket onclose", e);
    };
    socket.onerror = (e) => {
      player.inputFinished = true;
      console.log("tts socket onerror", e);
    };
  });

  const start = useMemoizedFn((content: string) => {
    stop();
    startTts(content);
  });

  const stop = useMemoizedFn(() => {
    stopPlay();
    stopAudio();
  });

  function stopAudio() {
    abortController?.abort();
    const audio = audioRef.current;
    onStatusChange?.(TTSStatusEnum.NORMAL);
    if (audio) {
      audio.pause();
    }
  }

  function stopPlay() {
    onStatusChange?.(TTSStatusEnum.NORMAL);
    if (playerRef.current) {
      playerRef.current?.pause();
      playerRef.current?.destroy();
      playerRef.current = undefined;
    }
    if (socketRef.current) {
      socketRef.current?.close();
      socketRef.current = undefined;
    }
  }

  return (
    <audio
      ref={(ref) => (audioRef.current = ref)}
      autoPlay={true}
      onEnded={() => onStatusChange?.(TTSStatusEnum.NORMAL)}
    />
  );
});

export default TTSView;
