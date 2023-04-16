import { useMemoizedFn } from "ahooks";
import { sha256 } from "js-sha256";
import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

import { APP_CONFIG, ASR_CONFIG, getUnisoundKeySecret } from "./Config";
import Recorder from "./Recorder";

export enum ASRStatusEnum {
  NORMAL,
  RECORDING,
}

export interface ASRRef {
  start: () => void;
  stop: () => void;
}

interface Props {
  status?: ASRStatusEnum;
  onResultChange?: (v: string, changing: boolean) => void;
  onStatusChange?: (v: ASRStatusEnum) => void;
  config?: Record<string, any>;
}

const langArr = ["cn", "sichuanese", "cantonese", "en"];

interface AsrResult {
  fixed: string[];
  changing: string;
}

const ASRView = React.forwardRef<ASRRef, Props>((props, ref) => {
  const { onStatusChange, onResultChange } = props;

  const [currentLang, setCurrentLang] = useState(0);

  const [simpleResult, setSimpleResult] = useState({ content: "", changing: false });
  const [asrResult, setAsrResult] = useState<AsrResult>({ fixed: [], changing: "" });
  const recorderRef = React.useRef<Recorder | null>();
  const socketRef = React.useRef<WebSocket | null>();

  const errorCountRef = useRef(0);
  const retryRef = useRef<any>();

  useImperativeHandle(
    ref,
    () => {
      return { start, stop };
    },
    []
  );

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const stop = useMemoizedFn(() => {
    stopRecording();
  });

  const start = useMemoizedFn(() => {
    startRecording();
  });

  const clearResult = useMemoizedFn(() => {
    setAsrResult({ fixed: [], changing: "" });
    setSimpleResult({ content: "", changing: false });
  });

  function startRecording() {
    clearResult();
    onStatusChange?.(ASRStatusEnum.RECORDING);
    doStartRecording();
  }

  function stopRecording() {
    doStopRecording();
    clearResult();
    onStatusChange?.(ASRStatusEnum.NORMAL);
  }

  function doStartRecording() {
    doStopRecording();
    const recorder = new Recorder(onAudioProcess);
    recorderRef.current = recorder;
    recorder.ready().then(
      () => {
        console.log("recorder ready ...");
        recorder.start();
        createSocket();
      },
      () => {
        alert("录音启动失败！");
        socketRef.current?.close();
        onStatusChange?.(ASRStatusEnum.NORMAL);
      }
    );
  }

  async function createSocket() {
    let sid: any;

    const chatConfig = getUnisoundKeySecret();
    const appKey = chatConfig.KEY;
    const secret = chatConfig.SECRET;
    const path = ASR_CONFIG.SOCKET_URL;
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

    const socket = new WebSocket(`${path}?appkey=${appKey}&time=${time}&sign=${sign}`);
    socketRef.current = socket;
    socket.onopen = () => {
      console.log("!!! socket open !!!");
      errorCountRef.current = 0;
      socket.send(
        JSON.stringify({
          type: "start",
          sha: "256",
          data: {
            lang: langArr[currentLang],
            appkey: appKey,
            userId: APP_CONFIG.USER_ID,
            udid: APP_CONFIG.UDID,
          },
        })
      );
    };

    socket.onmessage = (evt: MessageEvent) => {
      const res = JSON.parse(evt.data);
      if (res.code === 0 && res.text) {
        sid = res.sid;
        const { text } = res;
        if (res.type === "fixed") {
          setAsrResult((draft) => {
            const result = { fixed: [...draft.fixed, text], changing: "" };
            const value = result.fixed.join("") + result.changing;
            onResultChange?.(value, !!result.changing);
            return { fixed: [], changing: "" };
          });
        } else {
          setAsrResult((draft) => {
            const result = { ...draft, changing: text };
            const value = result.fixed.join("") + result.changing;
            onResultChange?.(value, !!result.changing);
            return result;
          });
        }
        // onResultChange?.(text, res.type === "variable");
        setSimpleResult({ content: text, changing: res.type === "variable" });
      } else {
        console.log("asr record end !", [new Date().toLocaleTimeString()], res);
        doStartRecording();
      }
    };

    socket.onerror = function (e: Event) {
      console.log("asr ws error", sid, [new Date().toLocaleTimeString()]);
      console.log(e);
      socketRef.current = null;
      retry();
    };

    socket.onclose = (e: CloseEvent) => {
      console.log("asr ws close", sid, [new Date().toLocaleTimeString()]);
      console.log(e);
      socketRef.current = null;
      if (e.code !== 1000) {
        retry();
      }
    };
  }

  function retry() {
    errorCountRef.current = errorCountRef.current + 1;
    clearRetryTimeout();
    retryRef.current = setTimeout(doStartRecording, errorCountRef.current * 200);
  }

  function clearRetryTimeout() {
    if (retryRef.current) {
      clearTimeout(retryRef.current);
      retryRef.current = undefined;
    }
  }

  function onAudioProcess(buffer: any) {
    const socket = socketRef.current;
    // console.log('onAudioProcess():', socket?.readyState, new Date());

    if (socket && socket.readyState === 1) {
      socket.send(buffer);
    }
  }

  function doStopRecording() {
    retryRef.current && clearTimeout(retryRef.current);
    recorderRef.current?.stop();
    const socket = socketRef.current;
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify({ type: "end" }));
      socket.close();
    }
  }

  return null;
  /*
  return (
    <div className="p-4 bg-light-600">
      点击开始录音，请对我说想说的话，我可以识别出你说的内容。请允许浏览器获取麦克风权限。
      <ul className="pt-4 children:mb-2" style={{ cursor: recording ? 'default' : 'pointer' }}>
        <li onClick={() => !recording && setCurrentLang(0)}>普通话</li>
        <li onClick={() => !recording && setCurrentLang(1)}>四川话</li>
        <li onClick={() => !recording && setCurrentLang(2)}>粤语</li>
        <li onClick={() => !recording && setCurrentLang(3)}>英语</li>
      </ul>
    </div>
  );
  */
});

export default ASRView;
