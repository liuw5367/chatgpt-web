let Recorder: any;

export async function importLib() {
  // 必须要先于 engine 导入
  // eslint-disable-next-line simple-import-sort/imports
  const RecorderX = (await import('recorder-core')).default;

  // 注意：recorder-core会自动往window下挂载名称为Recorder对象，全局可调用window.Recorder，也许可自行调整相关源码清除全局污染
  // 引入相应格式支持文件；如果需要多个格式支持，把这些格式的编码引擎js文件放到后面统统引入进来即可
  // import 'recorder-core/src/engine/mp3';
  // import 'recorder-core/src/engine/mp3-engine';

  // @ts-expect-error
  await import('recorder-core/src/engine/wav');
  // @ts-expect-error
  await import('recorder-core/src/engine/pcm');
  // @ts-expect-error
  await import('recorder-core/src/extensions/buffer_stream.player');

  // 禁用流量统计
  RecorderX.TrafficImgUrl = '';
  Recorder = RecorderX;
}

import type { AudioProcessFn, BufferStreamPlayerType, RecorderStatic, RecorderType } from './RecorderType';

let SAMPLE_RATE = 48000;
const TARGET_SAMPLE_RATE = 16000;
const MAX_VOICE_PRINT_DURATION = 6_000;

export function createRecorder(onAudioProcess: AudioProcessFn): RecorderType {
  const onProcess: AudioProcessFn = (buffers, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx) => {
    SAMPLE_RATE = bufferSampleRate || 48000;
    onAudioProcess(buffers, powerLevel, bufferDuration, bufferSampleRate, newBufferIdx);

    // https://xiangyuecn.gitee.io/recorder/assets/%E5%B7%A5%E5%85%B7-%E4%BB%A3%E7%A0%81%E8%BF%90%E8%A1%8C%E5%92%8C%E9%9D%99%E6%80%81%E5%88%86%E5%8F%91Runtime.html?jsname=teach.realtime.encode_transfer
    // 清理已处理完的缓冲数据，释放内存以支持长时间录音，最后完成录音时不能调用stop，因为数据已经被清掉了
    // 当前项目都是直接调用的 close，未使用到 stop
    let length = buffers?.length ?? 0;
    if (newBufferIdx < length) {
      length = newBufferIdx;
    }
    for (let i = 0; i < length; i++) {
      buffers[i] = null as any;
    }
  };

  return new Recorder({
    type: 'pcm',
    sampleRate: TARGET_SAMPLE_RATE,
    bitRate: 16,
    onProcess,
  });
}

export function buffer2pcm(buffers: Int16Array[], bufferSampleRate: number = SAMPLE_RATE): Int16Array {
  const sampleData: RecorderStatic['SampleData'] = Recorder.SampleData;
  return sampleData(buffers, bufferSampleRate, TARGET_SAMPLE_RATE).data;
}

export function convertPcmBlob(buffers: Int16Array[]): Blob {
  const pcm = buffer2pcm(buffers, SAMPLE_RATE);
  return new Blob([pcm.buffer], { type: 'audio/pcm' });
}

export function convertPcmBlobLimit(buffers: Int16Array[]): Promise<[Blob, Blob]> {
  return new Promise((resolve) => {
    const blob = convertPcmBlob(buffers);

    getPcmDuration(blob).then((duration) => {
      const max = MAX_VOICE_PRINT_DURATION;
      // 声纹识别对大小有限制
      if (duration <= max) {
        resolve([blob, blob]);
      } else {
        console.log('!! convertPcmBlob too long !!');
        const ratio = duration / max;
        const size = Math.floor(buffers.length / ratio);
        const data = buffers.slice(buffers.length - size, buffers.length);
        const newBlob = convertPcmBlob(data);
        console.log('!! convertPcmBlob retry !!', [ratio], newBlob);
        resolve([blob, newBlob]);
      }
    });
  });
}

export function convertWavBlob(blob: Blob): Promise<[Blob, number]> {
  return new Promise((resolve, reject) => {
    const pcm2wav: RecorderStatic['pcm2wav'] = Recorder.pcm2wav;
    pcm2wav(
      {
        sampleRate: TARGET_SAMPLE_RATE,
        bitRate: 16,
        blob,
      },
      (wavBlob: Blob, duration: number) => {
        console.log('pcm2wav success', duration, 'ms', wavBlob);
        resolve([wavBlob, duration]);
      },
      (msg: string) => {
        console.log('pcm2wav error:', msg);
        reject();
      },
    );
  });
}

export function getPcmDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    convertWavBlob(blob).then(([, duration]) => {
      resolve(duration);
    });
  });
}

export function createStreamPlayer(onPlayEnd: () => void): BufferStreamPlayerType {
  const createPlayer = Recorder.BufferStreamPlayer as RecorderStatic['BufferStreamPlayer'];
  return createPlayer({
    play: true,
    realtime: false,
    decode: false,
    sampleRate: 16000,
    onPlayEnd,
    transform: (arrayBuffer, sampleRate, success) => {
      success(new Int16Array(arrayBuffer), sampleRate);
    },
  });
}
