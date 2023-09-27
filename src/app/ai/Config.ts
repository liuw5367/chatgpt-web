import { chatConfigStore } from '@/app/store';

const ENV_KEY = process.env.NEXT_PUBLIC_UNISOUND_AI_KEY;

export function getUnisoundKeySecret() {
  if (typeof window === 'undefined') {
    return { KEY: ENV_KEY };
  }
  const { unisoundAppKey, unisoundSecret } = chatConfigStore.getState();
  return {
    KEY: unisoundAppKey || ENV_KEY,
    SECRET: unisoundSecret || undefined,
  };
}

export function hasUnisoundConfig(): boolean {
  const config = getUnisoundKeySecret();
  return config.KEY != null && config.KEY !== '';
}

/** 官方 demo 中有这个。应该是区分用户的，可以随便填 */
export const APP_CONFIG = {
  USER_ID: 'abcdefg12345',
  UDID: 'abcdefg12345',
};

export const ASR_CONFIG = {
  SOCKET_URL: 'wss://ws-rtasr.hivoice.cn/v1/ws',
};

export const TTS_CONFIG = {
  URL: 'https://ltts.hivoice.cn',
  SOCKET_URL: 'wss://ws-stts.hivoice.cn/v1/tts',
};

export const qualitySpeakers = [
  {
    aiCode: 'plus',
    createTime: 1_600_303_795_000,
    id: 1,
    updateTime: 1_600_303_795_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_kiyo_plus.png',
    vcn: 'kiyo-plus',
    vcnLang: 'cn',
    vcnName: 'kiyo',
    vcnScenario: ' 适合交互、阅读及客服场景',
    vcnText:
      '云知声专注于物联网人工智能服务，拥有完全自主知识产权，是世界领先的智能语音识别AI技术企业之一。公司成立于2012年6月29日，总部位于北京，在上海、深圳、厦门、合肥均设有分公司。',
    vcnTone: '可爱女生',
  },
  {
    aiCode: 'plus',
    createTime: 1_600_303_805_000,
    id: 2,
    updateTime: 1_600_303_805_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_xiaowen_plus.png',
    vcn: 'xiaowen-plus',
    vcnLang: 'cn',
    vcnName: '小雯',
    vcnScenario: '适合播音场景',
    vcnText:
      '云知声 AI 开放平台面向各行各业，为企业及个人开发者应用增加人机对话、多模态交互技术服务，为开发者的终端用户、设备进行语音交互技术赋能；同时与开发者共享数据、分享解决方案，帮助其快速验证与落地市场机会，达到市场赋能。最终达到大大降低智能化产品开发成本，缩短开发周期，提高工作效率的目标。',
    vcnTone: '女播音员',
  },
  {
    aiCode: 'plus',
    createTime: 1_600_303_815_000,
    id: 3,
    updateTime: 1_600_303_815_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_xiaofeng_plus.png',
    vcn: 'xiaofeng-plus',
    vcnLang: 'cn',
    vcnName: '小峰',
    vcnScenario: '适合播音场景',
    vcnText:
      '近日，云知声基于语音云平台重磅升级推出 AI 开放平台，以更丰富的商业化 AI 服务能力、自定义功能及个性化效果，进一步解决语音交互相关技术的开发难点，为开发者提供业界领先的人机对话技术调用，实现全栈语音交互赋能，缩减智能化产品开发成本与周期。',
    vcnTone: '男播音员',
  },
  {
    aiCode: 'plus',
    createTime: 1_600_303_823_000,
    id: 4,
    updateTime: 1_600_303_823_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_jenny_plus.png',
    vcn: 'jenny-plus',
    vcnLang: 'en',
    vcnName: 'jenny',
    vcnScenario: '适合英语场景',
    vcnText:
      "Unisound is one of the world's most innovative artificial intelligence companies focused on intelligent voice and speech process",
    vcnTone: '纯正美音',
  },
].map((t) => {
  return {
    code: t.vcn,
    name: t.vcnName,
    isQuality: true,
    desc: t.vcnTone,
    imgPath: t.url,
    scence: t.vcnScenario,
    lang: t.vcnLang,
    playText: t.vcnText,
  };
});

const normalSpeakers = [
  {
    aiCode: 'base',
    createTime: 1_600_303_828_000,
    id: 5,
    updateTime: 1_600_303_828_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_kiyo_base.png',
    vcn: 'kiyo-base',
    vcnLang: 'cn',
    vcnName: 'kiyo',
    vcnScenario: '适合交互、阅读及客服场景',
    vcnText:
      '云知声专注于物联网人工智能服务，拥有完全自主知识产权，是世界领先的智能语音识别AI技术企业之一。公司成立于2012年6月29日，总部位于北京，在上海、深圳、厦门、合肥均设有分公司。',
    vcnTone: '可爱女生',
  },
  {
    aiCode: 'base',
    createTime: 1_600_303_835_000,
    id: 6,
    updateTime: 1_600_303_835_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_xiaofeng_base.png',
    vcn: 'xiaofeng-base',
    vcnLang: 'cn',
    vcnName: '小峰',
    vcnScenario: '适合播报场景',
    vcnText:
      '近日，云知声基于语音云平台重磅升级推出 AI 开放平台，以更丰富的商业化 AI 服务能力、自定义功能及个性化效果，进一步解决语音交互相关技术的开发难点，为开发者提供业界领先的人机对话技术调用，实现全栈语音交互赋能，缩减智能化产品开发成本与周期。',
    vcnTone: '男播音员',
  },
  {
    aiCode: 'base',
    createTime: 1_600_241_815_000,
    id: 7,
    updateTime: 1_600_241_815_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_jenny_base.png',
    vcn: 'jenny-base',
    vcnLang: 'en',
    vcnName: 'jenny',
    vcnScenario: '适合英语场景',
    vcnText:
      "Unisound is one of the world's most innovative artificial intelligence companies focused on intelligent voice and speech process",
    vcnTone: '纯正美音',
  },
  {
    aiCode: 'base',
    createTime: 1_600_303_852_000,
    id: 8,
    updateTime: 1_600_303_852_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_xuanxuan_base.png',
    vcn: 'xuanxuan-base',
    vcnLang: 'cn',
    vcnName: '萱萱',
    vcnScenario: '适合交互、阅读及客服场景',
    vcnText:
      '很抱歉，由于系统临时调整，对您的使用造成了影响，我代表公司向您道歉。我们正在积极的解决，大约1小时后可恢复正常，请您稍候观察，如果还有问题请您继续联系我们。',
    vcnTone: '甜美女生',
  },
  {
    aiCode: 'base',
    createTime: 1_600_861_290_000,
    id: 9,
    updateTime: 1_600_861_290_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_tiantian_base.png',
    vcn: 'tiantian-base',
    vcnLang: 'cn',
    vcnName: '天天',
    vcnScenario: '适合儿童应用场景',
    vcnText:
      '在遥远的M97星云上，生活着一群叫纳莫多的机器 人，这一天，纳莫多成员之一的机器人聪聪，驾驶着他心爱的飞船外出探险去了。在探险途中，一块陨石击中了聪聪的飞船，无奈之下，聪聪只能就近找一个星系停降，于是，他来到了位于太阳系中的地球上。',
    vcnTone: '天真男孩',
  },
  {
    aiCode: 'base',
    createTime: 1_600_303_866_000,
    id: 10,
    updateTime: 1_600_303_866_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_tangtang_base.png',
    vcn: 'tangtang-base',
    vcnLang: 'cn',
    vcnName: '糖糖',
    vcnScenario: ' 适合儿童应用场景',
    vcnText:
      '在聪聪的引导下，小胖慢慢学会如何去待人接物，如何去与人分享。渐渐地，大家都喜欢来小胖家做客啦。聪聪给小胖一个可以制造乌云的盒子，盒子里会飞出下雨的云，本来小胖是希望自己一个人拥有这个玩具的，可他想到聪聪告诉他要学会分享，于是他便把玩具拿去同小伙伴们一块儿玩。',
    vcnTone: '活泼女孩',
  },
  {
    aiCode: 'base',
    createTime: 1_600_303_873_000,
    id: 11,
    updateTime: 1_600_303_873_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_lingling_base.png',
    vcn: 'lingling-base',
    vcnLang: 'cn',
    vcnName: '玲玲',
    vcnScenario: '适合交互、阅读及客服场景',
    vcnText: '北京今天发布大风蓝色预警，全天晴，15度至26度，比昨天热一点儿，当前空气质量指数17，空气挺好的。',
    vcnTone: ' 台湾女生',
  },
  {
    aiCode: 'base',
    createTime: 1_600_303_879_000,
    id: 12,
    updateTime: 1_600_303_879_000,
    url: 'https://unios-paas-platform.oss-cn-beijing.aliyuncs.com/paas/vcn/icon_xiaowen_base.png',
    vcn: 'xiaowen-base',
    vcnLang: 'cn',
    vcnName: '小雯',
    vcnScenario: ' 适合播报场景',
    vcnText:
      '云知声 AI 开放平台面向各行各业，为企业及个人开发者应用增加人机对话、多模态交互技术服务，为开发者的终端用户、设备进行语音交互技术赋能；同时与开发者共享数据、分享解决方案，帮助其快速验证与落地市场机会，达到市场赋能。最终达到大大降低智能化产品开发成本，缩短开发周期，提高工作效率的目标。',
    vcnTone: '女播音员',
  },
].map((t) => {
  return {
    code: t.vcn,
    name: t.vcnName,
    isQuality: false,
    desc: t.vcnTone,
    imgPath: t.url,
    scence: t.vcnScenario,
    lang: t.vcnLang,
    playText: t.vcnText,
  };
});

export const defaultSpeaker = qualitySpeakers[0];

export type Speaker = typeof defaultSpeaker;
