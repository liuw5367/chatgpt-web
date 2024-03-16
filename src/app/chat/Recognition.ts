import { chatConfigStore } from '../store';

export class Recognition {
  private recognition: any;

  private listener?: (result: string) => void;

  private isStop = false;

  public setListener(fn: (result: string) => void) {
    this.listener = fn;
  }

  public start() {
    this.isStop = false;
    // @ts-expect-error not exist
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      return;
    }
    if (!this.recognition) {
      // @ts-expect-error not exist
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      this.recognition = recognition;
    }
    const recognition = this.recognition;

    // 返回实时识别结果
    recognition.interimResults = true;
    // 设置语言
    const lang = chatConfigStore.getState().asrLanguage;
    recognition.lang = lang;

    // 设置是否连续识别
    recognition.continuous = true;

    // 当识别到语音时触发该事件
    recognition.addEventListener('result', (event: any) => {
      // console.log('recognition onResult:', event);

      let transcript = '';
      for (let index = 0; index < event.results.length; index++) {
        const item = event.results[index];
        // 中文添加逗号
        if (transcript && lang?.includes('Han')) {
          transcript += '，';
        }

        transcript += (item as unknown as SpeechRecognitionAlternative[])[0]?.transcript;
      }
      if (!transcript) {
        return;
      }
      this.listener?.(transcript);
    });

    // 当识别结束时触发该事件
    recognition.addEventListener('end', () => {
      console.log('recognition onEnd');
      if (this.isStop) {
        return;
      }
      // 继续监听
      recognition.start();
    });

    // 启动语音识别
    recognition.start();
  }

  public stop() {
    this.isStop = true;
    this.recognition?.stop();
  }
}

/**
 * https://stackoverflow.com/questions/23733537/what-are-the-supported-languages-for-web-speech-api-in-html5
 */
export const supportLanguages: Record<string, string> = {
  'cmn-Hans-CN': '普通话 (中国大陆)',
  'cmn-Hans-HK': '普通话 (中国香港)',
  'yue-Hant-HK': '粵語 (中国香港)',
  'en-US': 'English(United States)',
  'en-GB': 'English(United Kingdom)',
  'en-IN': 'English(India)',
  'es-ES': 'Español',
  'fr-FR': 'Français',
  'de-DE': 'Deutsch',
  'it-IT': 'Italiano',
  'ja-JP': '日本語',
  'ko-KR': '한국어',
  'ar-SA': 'العربية',
  'pt-BR': 'Português',
  'ru-RU': 'Русский',
  'nl-NL': 'Nederlands',
  'tr-TR': 'Türkçe',
  'sv-SE': 'Svenska',
  'hi-IN': 'हिन्दी',
  'el-GR': 'Ελληνικά',
  'he-IL': 'עברית',
  'id-ID': 'Bahasa Indonesia',
  'pl-PL': 'Polski',
  'th-TH': 'ไทย',
  'cs-CZ': 'Čeština',
  'hu-HU': 'Magyar',
  'da-DK': 'Dansk',
  'fi-FI': 'Suomi',
  'no-NO': 'Norsk',
  'sk-SK': 'Slovenčina',
  'uk-UA': 'Українська',
  'vi-VN': 'Tiếng Việt',
};
