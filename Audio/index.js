import AudioPlayer from "./AudioPlayer"
import InputMentions from "./InputMentions"
import TalkTimeLIne from "./TalkTimeLine"
import Recorder from "./recorder"
require("./wav")

export default {
    AudioPlayer,
    InputMentions,
    TalkTimeLIne,
    Recorder,
    wavUtils: { vadCheck: vad_check, getWAV, encodeWAV }
}

