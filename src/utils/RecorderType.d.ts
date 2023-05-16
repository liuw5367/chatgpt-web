export type AudioProcessFn = (
  buffers: Int16Array[],
  powerLevel: number,
  bufferDuration: number,
  bufferSampleRate: number,
  newBufferIdx: number,
  asyncEnd?: () => void
) => void;

export class RecorderType {
  constructor(options: {
    type: "mp3" | "wav" | "pcm";
    sampleRate: 16000;
    bitRate: 16;
    /**
     * 录音实时回调，大约1秒调用12次本回调，buffers为开始到现在的所有录音pcm数据块(16位小端LE)
     * 可实时绘制波形（extensions目录内的waveview.js、wavesurfer.view.js、frequency.histogram.view.js插件功能）
     * 可利用extensions/sonic.js插件实时变速变调，此插件计算量巨大，onProcess需要返回true开启异步模式
     * 可实时上传（发送）数据，配合Recorder.SampleData方法，将buffers中的新数据连续的转换成pcm上传，
     * 或使用mock方法将新数据连续的转码成其他格式上传，可以参考文档里面的：Demo片段列表 -> 实时转码并上传-通用版；基于本功能可以做到：实时转发数据、实时保存数据、实时语音识别（ASR）等
     */
    onProcess: AudioProcessFn;
  });

  /** 请求打开录音资源 */
  open(success?: () => void, error?: (msg: string, isUserNotAllow: boolean) => void): void;

  /** 开始录音，需先调用open；未close之前可以反复进行调用开始新的录音。 */
  start(): void;

  /** 暂停录音 */
  pause(): void;

  /** 恢复继续录音 */
  resume(): void;

  /** 结束录音并返回录音数据blob文件对象 */
  stop(success?: (blob?: Blob, duration: string) => void, error?: (msg: string) => void, autoClose?: boolean): void;

  /** 关闭释放录音资源，释放完成后会调用success()回调。 */
  close(success?: () => void): void;

  /**
   * 从开始录音到现在为止的所有已缓冲的PCM片段列表(16位小端LE)
   */
  buffers: Float32Array[];
}

export class RecorderStatic {
  /**
   * 对pcm数据的采样率进行转换，可配合mock方法可转换成音频文件，比如实时转换成小片段语音文件。
   */
  SampleData(
    pcmData: Int16Array[],
    pcmSampleRate: number,
    newSampleRate: number
  ): {
    /**
     * 转换后的PCM结果(16位小端LE)，为一维数组，可直接new Blob([data],{type:"audio/pcm"})生成Blob文件
     * 或者使用mock方法转换成其他音频格式
     * 注意：如果是连续转换，并且 pcmData 中并没有新数据时，data的长度可能为0
     */
    data: Int16Array;
    /** 结果的采样率 */
    sampleRate: number;
    /** 下一帧的部分数据，frameSize设置了的时候才可能会有 */
    frameNext: null | Int16Array;
    /** 可定义，从指定位置开始转换到结尾 */
    offset: number;
    /** 已处理到的index对应的pcm中的偏移的下一个位置 */
    index: number;
  };

  pcm2wav(
    data: {
      /** pcm的采样率 */
      sampleRate: 16000;
      /** pcm的位数 取值：8 或 16  */
      bitRate: 16;
      /** pcm的blob对象  */
      blob: Blob;
    },
    success?: (wavBlob: Blob, duration: number) => void,
    error?: (msg: string) => void
  ): void;

  BufferStreamPlayer(option: BufferStreamPlayerOption): BufferStreamPlayerType;
}

export type BufferStreamPlayerOption = Partial<{
  /**
   * 要播放声音，设为false不播放，只提供MediaStream
   */
  play: boolean;

  /**
   * 默认为true实时模式，设为false为非实时模式
   * 实时模式：
   *     如果有新的input输入数据，但之前输入的数据还未播放完，如果积压的数据量过大则积压的数据将会被直接丢弃，少量积压会和新数据一起加速播放，最终达到尽快播放新输入的数据的目的；这在网络不流畅卡顿时会发挥很大作用，可有效降低播放延迟
   * 非实时模式：
   *     连续完整的播放完所有input输入的数据，之前输入的还未播放完又有新input输入会加入队列排队播放，比如用于：一次性同时输入几段音频完整播放
   */
  realtime: boolean;

  /**
   * input输入的数据在调用transform之前是否要进行一次音频解码成pcm [Int16,...]
   * mp3、wav等都可以设为true，会自动解码成pcm
   */
  decode: boolean;

  /**
   * 可选input输入的数据默认的采样率，当没有设置解码也没有提供transform时应当明确设置采样率
   */
  sampleRate: number;

  /**
   * 没有可播放的数据时回调（stop后一定会回调），已输入的数据已全部播放完了，可代表正在缓冲中或播放结束；
   * 之后如果继续input输入了新数据，播放完后会再次回调，因此会多次回调；
   * 非实时模式一次性输入了数据时，此回调相当于播放完成，可以stop掉，重新创建对象来input数据可达到循环播放效果
   */
  onPlayEnd: () => void;

  /**
   * 当input输入出错时回调，参数为input第几次调用和错误消息
   */
  onInputError: (msg: string, inputIndex: number) => void;

  /**
   * 已播放时长、总时长更新回调（stop、pause、resume后一定会回调），this.currentTime为已播放时长，this.duration为已输入的全部数据总时长（实时模式下意义不大，会比实际播放的长），单位都是ms
   */
  onUpdateTime: () => void;

  /**
   * 将input输入的data（如果开启了decode将是解码后的pcm）转换处理成要播放的pcm数据；如果没有解码也没有提供本方法，input的data必须是[Int16,...]并且设置set.sampleRate
   * inputData:any input方法输入的任意格式数据，只要这个转换函数支持处理；如果开启了decode，此数据为input输入的数据解码后的pcm [Int16,...]
   * sampleRate:123 如果设置了decode为解码后的采样率，否则为set.sampleRate || null
   * True(pcm,sampleRate) 回调处理好的pcm数据([Int16,...])和pcm的采样率
   * False(errMsg) 处理失败回调
   */
  transform: (
    inputData: any,
    sampleRate: number,
    success: (pcm: Int16Array, sampleRate: number) => void,
    error: (msg) => void
  ) => void;
}>;

export class BufferStreamPlayerType {
  /** 当前已播放的时长，单位ms，数值变化时会有onUpdateTime事件 */
  currentTime: number;

  /**
   * 已输入的全部数据总时长，单位ms，数值变化时会有onUpdateTime事件；
   * 实时模式下意义不大，会比实际播放的长，因为实时播放时卡了就会丢弃部分数据不播放
   */
  duration: number;

  /** 是否已停止，调用了stop方法时会设为true */
  isStop: boolean;

  /** 是否已暂停，调用了pause方法时会设为true */
  isPause: boolean;

  /**
   * 已输入的数据是否播放到了结尾（没有可播放的数据了），input后又会变成false；
   * 可代表正在缓冲中或播放结束，状态变更时会有onPlayEnd事件
   */
  isPlayEnd: boolean;

  start(success?: () => void, error?: (msg) => void): void;

  /**
   * 随时都能调用input，会等到start成功后播放出来，不停的调用input，就能持续的播放出声音了，需要暂停播放就不要调用input就行了
   */
  input(data: any): void;

  /**
   * 暂停播放，暂停后：实时模式下会丢弃所有input输入的数据（resume时只播放新input的数据），
   * 非实时模式下所有input输入的数据会保留到resume时继续播放
   */
  pause(): void;

  /**
   * 恢复播放，实时模式下只会从最新input的数据开始播放，非实时模式下会从暂停的位置继续播放
   */
  resume(): void;

  /**
   * 不要播放了就调用stop停止播放，关闭所有资源
   */
  stop(): void;

  /**
   * 通过getMediaStream方法得到MediaStream流，此流可以作为WebRTC的local流发送到对方，
   * 或者直接拿来赋值给audio.srcObject来播放（和赋值audio.src作用一致）；
   * 未start时调用此方法将会抛异常
   */
  getMediaStream(): any;

  /**
   * @deprecated 【已过时】
   * 超低版本浏览器中得到MediaStream流的字符串播放地址，可赋值给audio标签的src，直接播放音频；
   * 未start时调用此方法将会抛异常；
   * 新版本浏览器已停止支持将MediaStream转换成url字符串，调用本方法新浏览器会抛异常，
   * 因此在不需要兼容不支持srcObject的超低版本浏览器时，请直接使用getMediaStream然后赋值给auido.srcObject来播放
   */
  getAudioSrc(): any;
}
