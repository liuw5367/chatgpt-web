/**
 * @Time    :   2019/03/08 17:09:53
 * @Author  :   wyh19
 * @Contact :   wyh_19@163.com
 * @Desc    :   None
 */
let Recorder = function (onaudioprocess, showWaveFn) {
  this.config = {
    sampleBits: 16, // 采样数位 8, 16
    sampleRate: 16000, // 采样率(1/6 44100)
  };
  this.size = 0; // 录音文件总长度
  this.buffer = []; // 录音缓存
  this.realtimeBuffer = [];
  // 录音实时获取数据
  this.input = function (data) {
    // 记录数据，这儿的buffer是二维的
    this.buffer.push(new Float32Array(data));
    this.size += data.length;
  };
  this.onaudioprocess = onaudioprocess;
  this.showWaveFn = showWaveFn;
};
// 设置如采样位数的参数
Recorder.prototype.setOption = function (option) {
  // 修改采样率，采样位数配置
  Object.assign(this.config, option);
};
Recorder.prototype.ready = function () {
  this.context = new (window.AudioContext || window.webkitAudioContext)();
  // 第一个参数表示收集采样的大小，采集完这么多后会触发 onaudioprocess 接口一次，该值一般为1024,2048,4096等，一般就设置为4096
  // 第二，三个参数分别是输入的声道数和输出的声道数，保持一致即可。
  this.createScript = this.context.createScriptProcessor || this.context.createJavaScriptNode;
  this.recorder = this.createScript.apply(this.context, [4096, 1, 1]);

  // 音频采集
  this.recorder.onaudioprocess = (e) => {
    const data = e.inputBuffer.getChannelData(0);
    this.input(data);
    if (this.onaudioprocess) {
      this.onaudioprocess(this.encodePCMFragment(data));
      // this.onaudioprocess(data);
    }
    if (this.showWaveFn) {
      this.toWaveData(data);
    }
  };
  if (!navigator.mediaDevices) {
    return Promise.reject(new Error("无法发现指定的硬件设备。"));
  }
  return navigator.mediaDevices
    .getUserMedia({
      audio: true,
    })
    .then(
      (stream) => {
        // audioInput表示音频源节点
        // stream是通过navigator.getUserMedia获取的外部（如麦克风）stream音频输出，对于这就是输入
        this.audioInput = this.context.createMediaStreamSource(stream);
      },
      (error) => {
        switch (error.code || error.name) {
          case "PERMISSION_DENIED":
          case "PermissionDeniedError":
            Recorder.throwError("用户拒绝提供信息。");
            break;
          case "NOT_SUPPORTED_ERROR":
          case "NotSupportedError":
            Recorder.throwError("浏览器不支持硬件设备。");
            break;
          case "MANDATORY_UNSATISFIED_ERROR":
          case "MandatoryUnsatisfiedError":
            Recorder.throwError("无法发现指定的硬件设备。");
            break;
          case "NotAllowedError":
            Recorder.throwError("请在浏览器设置中开启麦克风权限!");
            break;
          case 8:
          case "NotFoundError":
            Recorder.throwError("无法发现指定的硬件设备。");
            break;
          default:
            Recorder.throwError("无法打开麦克风。异常信息:" + (error.code || error.name));
            break;
        }
      }
    );
};
// 异常处理
Recorder.throwError = function (message) {
  throw new Error(message);
};
// 开始录音
Recorder.prototype.start = function () {
  try {
    // 清空数据
    this.buffer.length = 0;
    this.size = 0;
    // audioInput 为声音源，连接到处理节点 recorder
    this.audioInput.connect(this.recorder);
    // 处理节点 recorder 连接到扬声器
    this.recorder.connect(this.context.destination);
    // 设置压缩参数
    this.inputSampleRate = this.context.sampleRate; // 获取当前输入的采样率
    this.inputSampleBits = 16; // 输入采样数位 8, 16
    this.outputSampleRate = this.config.sampleRate; // 输出采样率
    this.oututSampleBits = this.config.sampleBits; // 输出采样数位 8, 16
  } catch (error) {
    Recorder.throwError("无法打开麦克风。异常信息:" + (error.code || error.name));
  }
};

Recorder.prototype.destroy = function () {
  this.context.close().then(function () {
    //
  });
};

// 停止录音
Recorder.prototype.stop = function () {
  this.recorder.disconnect();
};
// 播放到audio标签中
// 参数表示audio元素
Recorder.prototype.play = function (audio) {
  audio.src = window.URL.createObjectURL(this.getWAVBlob());
};
// 获取PCM编码的二进制数据
Recorder.prototype.getPCM = function () {
  this.stop();

  return this.encodePCM();
};
// 获取不压缩的PCM格式的编码
Recorder.prototype.getPCMBlob = function () {
  return new Blob([this.getPCM()]);
};
// 获取WAV编码的二进制数据
Recorder.prototype.getWAV = function (isRecord) {
  this.stop();

  return this.encodeWAV(isRecord);
};
// 获取不压缩的WAV格式的编码
Recorder.prototype.getWAVBlob = function () {
  return new Blob([this.getWAV(true)], { type: "audio/wav" });
};

Recorder.prototype.SRC = function (input, inputFs, outputFs) {
  // 输入为空检验
  if (input == null) {
    throw Error("Error:\t输入音频为空数组");
    // return null;
  }

  // 采样率合法检验
  if (inputFs <= 1 || outputFs <= 1) {
    throw Error("Error:\t输入或输出音频采样率不合法");
    // return null;
  }

  // 输入音频长度
  let len = input.length;

  // 输出音频长度
  let outlen = Math.round((len * outputFs) / inputFs);

  let output = new Float32Array(outlen);
  let S = new Float32Array(len);
  let T = new Float32Array(outlen);
  // 输入信号归一化
  for (let i = 0; i < len; i++) {
    S[i] = input[i] / 32768.0;
  }

  // 计算输入输出个数比
  let F = (len - 1) / (outlen - 1);
  let Fn = 0;
  let Ceil = 0,
    Floor = 0;
  output[0] = input[0];
  for (let n = 1; n < outlen; n++) {
    // 计算输出对应输入的相邻下标
    Fn = F * n;
    Ceil = Math.ceil(Fn);
    Floor = Math.floor(Fn);

    // 防止下标溢出
    if (Ceil >= len && Floor < len) {
      Ceil = Floor;
    } else if (Ceil >= len && Floor >= len) {
      Ceil = len - 1;
      Floor = len - 1;
    }

    // 相似三角形法计算输出点近似值
    T[n] = S[Floor] + (Fn - Floor) * (S[Ceil] - S[Floor]);
  }

  for (let i = 1; i < outlen; i++) {
    output[i] = T[i] * 32768.0;
  }
  return output;
};

// 数据合并压缩
// 根据输入和输出的采样率压缩数据，
// 比如输入的采样率是48k的，我们需要的是（输出）的是16k的，由于48k与16k是3倍关系，
// 所以输入数据中每隔3取1位
Recorder.prototype.compress = function (isReplay) {
  // 合并
  var data = new Float32Array(this.size);
  var offset = 0; // 偏移量计算
  // 将二维数据，转成一维数据
  for (var i = 0; i < this.buffer.length; i++) {
    data.set(this.buffer[i], offset);
    offset += this.buffer[i].length;
  }
  let result = this.SRC(data, this.inputSampleRate, this.outputSampleRate);
  return result;
};
/**
 * 转换到我们需要的对应格式的编码
 * return {DataView}    pcm编码的数据
 */
Recorder.prototype.encodePCM = function (isReplay) {
  let bytes = this.compress(isReplay),
    sampleBits = Math.min(this.inputSampleBits, isReplay ? this.inputSampleBits : this.oututSampleBits),
    offset = 0,
    dataLength = bytes.length * (sampleBits / 8),
    buffer = new ArrayBuffer(dataLength),
    data = new DataView(buffer);

  // 写入采样数据
  if (sampleBits === 8) {
    for (let i = 0; i < bytes.length; i++, offset++) {
      // 范围[-1, 1]
      let s = Math.max(-1, Math.min(1, bytes[i]));
      // 8位采样位划分成2^8=256份，它的范围是0-255; 16位的划分的是2^16=65536份，范围是-32768到32767
      // 因为我们收集的数据范围在[-1,1]，那么你想转换成16位的话，只需要对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
      // 对于8位的话，负数*128，正数*127，然后整体向上平移128(+128)，即可得到[0,255]范围的数据。
      let val = s < 0 ? s * 128 : s * 127;
      val = parseInt(val + 128);
      data.setInt8(offset, val, true);
    }
  } else {
    for (let i = 0; i < bytes.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, bytes[i]));
      // 16位直接乘就行了
      data.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }

  return data;
};

Recorder.prototype.encodePCMFragment = function (fragment) {
  let data = new Float32Array(fragment);

  // // 压缩
  // var compression = this.inputSampleRate / this.outputSampleRate;
  // var length = data.length / compression;
  // compression = Math.round(compression)
  // var result = new Float32Array(length);
  // var index = 0,
  //   j = 0;
  // // 循环间隔 compression 位取一位数据
  // while (index < length) {
  //   result[index] = data[j];
  //   j += compression;
  //   index++;
  // }
  // 返回压缩后的一维数据

  let bytes = this.SRC(data, this.inputSampleRate, this.outputSampleRate),
    sampleBits = Math.min(this.inputSampleBits, this.oututSampleBits),
    offset = 0,
    dataLength = bytes.length * (sampleBits / 8),
    buffer = new ArrayBuffer(dataLength),
    lastData = new DataView(buffer);

  // 写入采样数据
  if (sampleBits === 8) {
    for (let i = 0; i < bytes.length; i++, offset++) {
      // 范围[-1, 1]
      let s = Math.max(-1, Math.min(1, bytes[i]));
      // 8位采样位划分成2^8=256份，它的范围是0-255; 16位的划分的是2^16=65536份，范围是-32768到32767
      // 因为我们收集的数据范围在[-1,1]，那么你想转换成16位的话，只需要对负数*32768,对正数*32767,即可得到范围在[-32768,32767]的数据。
      // 对于8位的话，负数*128，正数*127，然后整体向上平移128(+128)，即可得到[0,255]范围的数据。
      let val = s < 0 ? s * 128 : s * 127;
      val = parseInt(val + 128);
      lastData.setInt8(offset, val, true);
    }
  } else {
    for (let i = 0; i < bytes.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, bytes[i]));
      // 16位直接乘就行了
      lastData.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }

  return lastData;
};

Recorder.prototype.encodeWAV = function (isReplay) {
  var sampleRate = this.outputSampleRate;
  var sampleBits = Math.min(this.inputSampleBits, isReplay ? this.inputSampleBits : this.oututSampleBits);
  var bytes = this.encodePCM(isReplay);
  var buffer = new ArrayBuffer(44);
  var data = new DataView(buffer);

  var channelCount = 1; // 单声道
  var offset = 0;

  // 资源交换文件标识符
  writeString(data, offset, "RIFF");
  offset += 4;
  // 下个地址开始到文件尾总字节数,即文件大小-8
  data.setUint32(offset, 36 + bytes.byteLength, true);
  offset += 4;
  // WAV文件标志
  writeString(data, offset, "WAVE");
  offset += 4;
  // 波形格式标志
  writeString(data, offset, "fmt ");
  offset += 4;
  // 过滤字节,一般为 0x10 = 16
  data.setUint32(offset, 16, true);
  offset += 4;
  // 格式类别 (PCM形式采样数据)
  data.setUint16(offset, 1, true);
  offset += 2;
  // 通道数
  data.setUint16(offset, channelCount, true);
  offset += 2;
  // 采样率,每秒样本数,表示每个通道的播放速度
  data.setUint32(offset, sampleRate, true);
  offset += 4;
  // 波形数据传输率 (每秒平均字节数) 单声道×每秒数据位数×每样本数据位/8
  data.setUint32(offset, channelCount * sampleRate * (sampleBits / 8), true);
  offset += 4;
  // 快数据调整数 采样一次占用字节数 单声道×每样本的数据位数/8
  data.setUint16(offset, channelCount * (sampleBits / 8), true);
  offset += 2;
  // 每样本数据位数
  data.setUint16(offset, sampleBits, true);
  offset += 2;
  // 数据标识符
  writeString(data, offset, "data");
  offset += 4;
  // 采样数据总数,即数据总大小-44
  data.setUint32(offset, bytes.byteLength, true);
  offset += 4;

  // 给pcm文件增加头
  data = combineDataView(DataView, data, bytes);

  return data;
};

Recorder.prototype.toWaveData = function (o) {
  var PowerLevel = function (pcmAbsSum, pcmLength) {
    /* 计算音量 https://blog.csdn.net/jody1989/article/details/73480259
    更高灵敏度算法:
      限定最大感应值10000
        线性曲线：低音量不友好
          power/10000*100
        对数曲线：低音量友好，但需限定最低感应值
          (1+Math.log10(power/10000))*100
    */
    var power = pcmAbsSum / pcmLength || 0; // NaN
    var level;
    if (power < 1251) {
      // 1250的结果10%，更小的音量采用线性取值
      level = Math.round((power / 1250) * 10);
    } else {
      level = Math.round(Math.min(100, Math.max(0, (1 + Math.log(power / 10000) / Math.log(10)) * 100)));
    }
    return level;
  };

  var size = o.length;
  var pcm = new Int16Array(size);
  var sum = 0;
  for (var j = 0; j < size; j++) {
    // floatTo16BitPCM
    var s = Math.max(-1, Math.min(1, o[j]));
    s = s < 0 ? s * 0x8000 : s * 0x7fff;
    pcm[j] = s;
    sum += Math.abs(s);
  }

  var buffers = [];
  buffers.push(pcm);

  var sizeOld = this.recSize,
    addSize = pcm.length;

  var bufferSize = sizeOld + addSize;
  this.recSize = bufferSize;

  var bufferSampleRate = this.inputSampleRate;
  var powerLevel = PowerLevel(sum, pcm.length);
  var duration = Math.round((bufferSize / bufferSampleRate) * 1000);
  this.showWaveFn(buffers, powerLevel, duration, bufferSampleRate);
};

/**
 * 在data中的offset位置开始写入str字符串
 * @param {TypedArrays} data 二进制数据
 * @param {String}      str  字符串
 */
function writeString(data, offset, str) {
  for (var i = 0; i < str.length; i++) {
    data.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * 合并二进制数据
 * @param {TypedArrays} resultConstructor   需要合并成的数据类型
 * @param {TypedArrays} ...arrays           需要合并的数据
 */
function combineDataView(resultConstructor, ...arrays) {
  let totalLength = 0,
    offset = 0;
  // 统计长度
  for (let arr of arrays) {
    totalLength += arr.length || arr.byteLength;
  }
  // 创建新的存放变量
  let buffer = new ArrayBuffer(totalLength),
    result = new resultConstructor(buffer);
  // 设置数据
  for (let arr of arrays) {
    // dataview合并
    for (let i = 0, len = arr.byteLength; i < len; ++i) {
      result.setInt8(offset, arr.getInt8(i));
      offset += 1;
    }
  }

  return result;
}

export default Recorder;
