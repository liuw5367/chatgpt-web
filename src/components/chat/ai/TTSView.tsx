import { useMemoizedFn } from "ahooks";
import { message } from "antd";
import axios from "axios";
import { useStore } from "@nanostores/react";
import { sha256 } from "js-sha256";
import { isEmpty } from "lodash-es";
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

import { chatConfigAtom } from "../atom";
import { APP_CONFIG, Speaker, TTS_CONFIG } from "../Config";
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

  const chatConfig = useStore(chatConfigAtom);
  const appKey = chatConfig.unisoundAppKey;
  const secret = chatConfig.unisoundSecret;

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

    const time: number = +new Date();
    const sign = sha256(`${appKey}${time}${secret}`).toUpperCase();

    try {
      new window.AudioContext();
    } catch (e) {
      message.error("您当前的浏览器不支持 Web Audio API");
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
          message.error("合成遇到点问题，请稍后再试~");
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

  const startTtsLong = useMemoizedFn((content: string) => {
    if (isEmpty(content.trim())) return;

    const time: number = +new Date();
    const sign = sha256(`${appKey}${time}${secret}`).toUpperCase();

    let startTime = 0;

    const abortController = new AbortController();
    setAbortController(abortController);

    onStatusChange?.(TTSStatusEnum.GENERATING);
    axios
      .post(
        `${TTS_CONFIG.URL}/start`,
        {
          appkey: appKey,
          user_id: APP_CONFIG.USER_ID,
          time: time,
          sign: sign,
          format: "wav",
          vcn: speaker.code,
          text: content,
          sample: 16000,
          speed: 50,
          volume: 50,
          pitch: 50,
          bright: 50,
          ...config,
        },
        { signal: abortController.signal }
      )
      .then((res) => {
        const taskId = res.data.task_id;
        if (taskId) {
          startTime = Date.now();
          getResult(taskId);
        } else {
          message.warning("TTS错误，请重试");
          onStatusChange?.(TTSStatusEnum.NORMAL);
        }
      })
      .catch((e) => {
        onStatusChange?.(TTSStatusEnum.NORMAL);
        console.log(e);
      });

    const getResult = (taskId: string | number) => {
      axios
        .post(
          `${TTS_CONFIG.URL}/progress`,
          {
            time: time,
            sign: sign,
            task_id: taskId,
            appkey: appKey,
            user_id: APP_CONFIG.USER_ID,
          },
          { signal: abortController.signal }
        )
        .then((res) => {
          if (res.data.task_status !== "done") {
            setTimeout(() => getResult(taskId), 500);
          } else {
            const now = Date.now();
            const used = now - startTime;
            console.log("tts result:", used, "ms", res.data);
            const audio = audioRef.current;
            if (audio) {
              onStatusChange?.(TTSStatusEnum.PLAYING);
              audio.src = res.data.audio_address;
              audio.play();
            }
          }
        })
        .catch((e) => {
          onStatusChange?.(TTSStatusEnum.NORMAL);
          console.log(e);
        });
    };
  });

  const start = useMemoizedFn((content: string) => {
    stop();
    startTts(content);
    // startTtsLong(content);
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
