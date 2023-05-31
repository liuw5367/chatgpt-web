import { useMemoizedFn } from "ahooks";
import sha256 from "crypto-js/sha256";
import React, { useEffect, useImperativeHandle, useRef } from "react";

import { createStreamPlayer } from "../../utils/Recorder";
import type { BufferStreamPlayerType } from "../../utils/RecorderType";
import { getUnisoundKeySecret, Speaker, TTS_CONFIG } from "./Config";

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
  const { onStatusChange, speaker, config = {} } = props;

  const socketRef = useRef<WebSocket>();
  const playerRef = useRef<BufferStreamPlayerType>();

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

  const startTts = useMemoizedFn(async (inputContent: string) => {
    if (!inputContent.trim()) return;
    let content = inputContent;
    if (content.length > 500) {
      content = content.substring(0, 500);
    }

    const chatConfig = getUnisoundKeySecret();
    const appKey = chatConfig.KEY;
    const secret = chatConfig.SECRET;
    const time: number = +new Date();
    let sign: string;
    if (secret) {
      sign = sha256(`${appKey}${time}${secret}`).toString().toUpperCase();
    } else {
      try {
        const response = await fetch("/api/unisound", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: appKey, time }),
        });
        if (!response.ok) {
          const json = await response.json();
          throw Error(json?.error?.code);
        }
        const json = await response.json();
        sign = json.sign;
      } catch (e: any) {
        console.log(e);
        alert(e?.message || "asr sign error");
        return;
      }
    }

    const socket = new WebSocket(`${TTS_CONFIG.SOCKET_URL}?appkey=${appKey}&time=${time}&sign=${sign}`);
    socketRef.current = socket;
    socket.binaryType = "arraybuffer";

    const player = createStreamPlayer(playerStop);
    playerRef.current = player;

    socket.onopen = () => {
      onStatusChange?.(TTSStatusEnum.PLAYING);
      player.start();

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
          player && player.stop();
        }
      } catch (e) {
        player && player.input(res.data);
        // console.log('tts socket onmessage', e);
      }
    };
    socket.onclose = (e) => {
      console.log("tts socket onclose", e);
    };
    socket.onerror = (e) => {
      console.log("tts socket onerror", e);
    };
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
