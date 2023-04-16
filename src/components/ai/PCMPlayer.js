class PCMPlayer {
  constructor(option) {
    this.init(option);
  }

  init(option) {
    const defaultOption = {
      inputCodec: "Int16", // 传入的数据是采用多少位编码，默认16位
      channels: 1, // 声道数
      sampleRate: 8000, // 采样率 单位Hz
      flushTime: 1000, // 缓存时间 单位 ms
    };

    this.option = Object.assign({}, defaultOption, option); // 实例最终配置参数
    this.samples = new Float32Array(); // 样本存放区域
    this.interval = setInterval(this.flush.bind(this), this.option.flushTime);
    this.convertValue = this.getConvertValue();
    this.typedArray = this.getTypedArray();
    this.initAudioContext();
  }

  getConvertValue() {
    // 根据传入的目标编码位数
    // 选定转换数据所需要的基本值
    const inputCodecs = {
      Int8: 128,
      Int16: 327168,
      Int32: 2147483648,
      Float32: 1,
    };
    if (!inputCodecs[this.option.inputCodec]) {
      throw new Error("wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32");
    }
    return inputCodecs[this.option.inputCodec];
  }

  getTypedArray() {
    // 根据传入的目标编码位数
    // 选定前端的所需要的保存的二进制数据格式
    // 完整TypedArray请看文档
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
    const typedArrays = {
      Int8: Int8Array,
      Int16: Int16Array,
      Int32: Int32Array,
      Float32: Float32Array,
    };
    if (!typedArrays[this.option.inputCodec]) {
      throw new Error("wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32");
    }
    return typedArrays[this.option.inputCodec];
  }

  initAudioContext() {
    // 初始化音频上下文的东西
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // 控制音量的 GainNode
    // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createGain
    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.value = 10;
    this.gainNode.connect(this.audioCtx.destination);
    this.startTime = this.audioCtx.currentTime;
  }

  static isTypedArray(data) {
    // 检测输入的数据是否为 TypedArray 类型或 ArrayBuffer 类型
    return (
      (data.byteLength && data.buffer && data.buffer.constructor === ArrayBuffer) || data.constructor === ArrayBuffer
    );
  }

  isSupported(data) {
    // 数据类型是否支持
    // 目前支持 ArrayBuffer 或者 TypedArray
    if (!PCMPlayer.isTypedArray(data)) {
      throw new Error("请传入ArrayBuffer或者任意TypedArray");
    }
    return true;
  }

  feed(data) {
    this.isSupported(data);

    // 获取格式化后的buffer
    data = this.getFormattedValue(data);
    // 开始拷贝buffer数据
    // 新建一个Float32Array的空间
    const tmp = new Float32Array(this.samples.length + data.length);
    // console.log(data, this.samples, this.samples.length)
    // 复制当前的实例的buffer值（历史buff)
    // 从头（0）开始复制
    tmp.set(this.samples, 0);
    // 复制传入的新数据
    // 从历史buff位置开始
    tmp.set(data, this.samples.length);
    // 将新的完整buff数据赋值给samples
    // interval定时器也会从samples里面播放数据
    this.samples = tmp;
  }

  getFormattedValue(data) {
    if (data.constructor === ArrayBuffer) {
      data = new this.typedArray(data);
    } else {
      data = new this.typedArray(data.buffer);
    }

    let float32 = new Float32Array(data.length);

    for (let i = 0; i < data.length; i++) {
      // buffer 缓冲区的数据，需要是IEEE754 里32位的线性PCM，范围从-1到+1
      // 所以对数据进行除法
      // 除以对应的位数范围，得到-1到+1的数据
      // float32[i] = data[i] / 0x8000;
      float32[i] = data[i] / this.convertValue;
    }
    return float32;
  }

  volume(volume) {
    this.gainNode.gain.value = volume;
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.samples = null;
    this.audioCtx && this.audioCtx.close();
    this.audioCtx = null;
    if (this.timer) clearTimeout(this.timer);
  }

  flush() {
    if (!this.samples.length) return;
    var bufferSource = this.audioCtx.createBufferSource();
    const length = this.samples.length / this.option.channels;
    // console.log('flush', this.option.sampleRate);
    const audioBuffer = this.audioCtx.createBuffer(this.option.channels, length, this.option.sampleRate);

    for (let channel = 0; channel < this.option.channels; channel++) {
      const audioData = audioBuffer.getChannelData(channel);
      let offset = channel;
      let decrement = 50;
      for (let i = 0; i < length; i++) {
        audioData[i] = this.samples[offset];
        /* fadein */
        if (i < 50) {
          audioData[i] = (audioData[i] * i) / 50;
        }
        /* fadeout*/
        if (i >= length - 51) {
          audioData[i] = (audioData[i] * decrement--) / 50;
        }
        offset += this.option.channels;
      }
    }

    if (this.startTime < this.audioCtx.currentTime) {
      this.startTime = this.audioCtx.currentTime;
    }
    // this.startTime + ' vs ' + this.audioCtx.currentTime
    // console.log('start vs current ' + ' duration: ' + audioBuffer.duration);

    if (this.inputFinished) {
      // console.log('finished', +new Date(), (this.audioCtx.currentTime - this.startTime + audioBuffer.duration) * 1000 + 500)
      this.timer = setTimeout(() => {
        console.log("real finished", new Date().toISOString());
        this.onEnded && this.onEnded();
        // console.log('real  finished', +new Date())
      }, (this.startTime - this.audioCtx.currentTime + audioBuffer.duration) * 1000 + 500);
    }

    bufferSource.buffer = audioBuffer;
    bufferSource.connect(this.gainNode);
    bufferSource.start(this.startTime);
    this.startTime += audioBuffer.duration;
    this.samples = new Float32Array();
  }

  async pause() {
    await this.audioCtx.suspend();
  }

  async continue() {
    await this.audioCtx.resume();
  }
}

export default PCMPlayer;
