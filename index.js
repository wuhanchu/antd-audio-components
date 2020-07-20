export { AudioPlayer } from './Audio/AudioPlayer';
export { InputMentions } from './Audio/InputMentions';
export { TalkTimeLIne } from './Audio/TalkTimeLine';
export { Recorder } from './Audio/recorder';

require('./Audio/wav');
export const wavUtils = { vadCheck: vad_check, getWAV, encodeWAV };
