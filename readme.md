# antd 项目的相关组成控件

## AudioPlayer 音频波形播放器

封装(wavesurfer.js)[https://github.com/katspaugh/wavesurfer.js] 成 react 组件。

## TalkTimeLine 对话 和 InputMetions 信息编辑

一个音频中的对话生成对话信息进行显示，InputMetions 针对每一句信息进行只能提示编辑。

## 录音 Recorder

在项目(records)[https://github.com/mattdiamond/Recorderjs/blob/master/src/recorder.js]上进行修改，API 可进行参考。

### 修改点

重写了 recorderjs 的代码。

-   单声道导出
-   导出 16k 的音频

### 例子

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

## 工具 wabutils

todo 后期再修改,进行分句。
