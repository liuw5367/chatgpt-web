declare namespace PCMPlayer {
  interface inputCodecs {
    Int8: 128;
    Int16: 327168;
    Int32: 2147483648;
    Float32: 1;
  }
  interface typedArrays {
    Int8: Int8Array;
    Int16: Int16Array;
    Int32: Int32Array;
    Float32: Float32Array;
  }
  interface option {
    inputCodec: keyof inputCodecs;
    channels: number;
    sampleRate: number;
    flushTime: number;
  }

  class PCMPlayer {
    constructor(option: option);

    inputFinished: boolean;

    readonly audioCtx: AudioContext;

    readonly samples: Float32Array;

    readonly interval: number;

    private init(option: option): void;

    private getConvertValue(): Error | inputCodecs[keyof inputCodecs];

    private getTypedArray(): Error | typedArrays[keyof inputCodecs];

    private initAudioContext(): void;

    static isTypedArray(data: ArrayBuffer): boolean;

    private isSupported(data: ArrayBuffer | keyof typedArrays): boolean | Error;

    private getFormatedValue(data: ArrayBuffer | keyof typedArrays): Float32Array;

    private flush(): void;

    feed(data: ArrayBuffer | keyof typedArrays): void;

    volume(volume: number): void;

    destroy(): void;

    pause(): Promise<any>;

    continue(): Promise<any>;

    onEnded(): any;
  }
}

export default PCMPlayer.PCMPlayer;
