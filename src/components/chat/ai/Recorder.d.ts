export default class Recorder {
  constructor(onaudioprocess?: Function | undefined);

  ready: () => Promise;

  start: () => void;

  stop: () => void;
}
