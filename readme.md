# antd 项目的语音相关组成控件

## 录音

下面是录音的例子

```javascript
// 初始化
navigator.getUserMedia(
    { audio: true },
    stream => {
        const input = this.audioContext.createMediaStreamSource(stream)
        console.info("Media stream created.")
        this.recorder = new Recorder(input, {
            numChannels: 1,
            sampleRate: 16000
        })
        console.info("Recorder initialised.")
    },
    function(e) {
        console.info("No live audio input: " + e)
    }
)
```
