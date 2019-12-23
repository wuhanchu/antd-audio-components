/**
 * @module 音频波形组件
 * @param {Array} dialogue 对话数据
 * @param {String} [url] 音频url，和file二选一
 *  @param {Blob} [xhr] 认证信息
 * @param {Blob} [file] 音频文件Blob对象，和url二选一
 * @param {Number} [playId] 播放ID
 * @param {Number} [changeId] 修改的数据ID
 * @param  {Boolean} pause 是否暂停中
 * @param {Function} [onReady] 音频准备就绪
 * @param {Function} [onPauseChange] 暂停状态变化
 * @param {Function} [onPlayChange]  播放ID变化
 **/

import { Button, Col, Row } from "antd"
import React, { Fragment, PureComponent } from "react"
import WaveSurfer from "wavesurfer.js"
import RegionPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js"
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js"
import * as lodash from "lodash"

/**
 * Random RGBA color.
 */

/**
 * 生成一个随机颜色
 * @param {Number} alpha 透明度
 * @param {ReactNode} operationExtend extend operation buttons
 */
function randomColor(alpha) {
    return (
        "rgba(" +
        [
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            ~~(Math.random() * 255),
            alpha || 1
        ] +
        ")"
    )
}

class AudioPlayer extends PureComponent {
    regions = {}
    dialogueMap = {}
    keyBindMethods = []

    state = {
        pause: true // 播放暂停
    }

    constructor(props) {
        super(props)
        this.setDialogueMap()
        this.bindKey()
    }

    /**
     * bind the shortcuts to  audio
     */
    bindKey() {
        let method = null
        let key = null

        key = "left"
        method = e => {
            if (!lodash.isNil(this.props.changeId)) {
                return
            }
            e.preventDefault()
            this.wavesurfer.skipBackward(1)
        }
        keyboardJS.bind(key, method)
        this.keyBindMethods.push({ key, method })

        key = "right"
        method = e => {
            if (!lodash.isNil(this.props.changeId)) {
                return
            }
            e.preventDefault()
            this.wavesurfer.skip(1)
        }
        keyboardJS.bind(key, method)
        this.keyBindMethods.push({ key, method })

        key = "shift+alt+left"
        method = e => {
            if (lodash.isNil(this.props.changeId)) {
                return
            }
            e.preventDefault()

            const region = this.regions[this.props.changeId]

            if (
                region &&
                this.wavesurfer.getCurrentTime() - 1 <= region.start
            ) {
                return
            }

            this.wavesurfer.skipBackward(1)
        }
        keyboardJS.bind(key, method)
        this.keyBindMethods.push({ key, method })

        key = "shift+alt+right"
        method = e => {
            if (lodash.isNil(this.props.changeId)) {
                return
            }
            e.preventDefault()

            const region = this.regions[this.props.changeId]
            if (region && this.wavesurfer.getCurrentTime() + 1 >= region.end) {
                return
            }

            this.wavesurfer.skip(1)
        }
        keyboardJS.bind(key, method)
        this.keyBindMethods.push({ key, method })
    }

    componentWillUnmount = () => {
        this.keyBindMethods.forEach(({ key, method }) => {
            keyboardJS.unbind(key, method)
        })

        this.wavesurfer && this.wavesurfer.destroy()
    }

    componentDidMount() {
        let wavesurfer = null
        const container = document.querySelector("#waveform")

        //  create element
        this.wavesurfer =
            this.wavesurfer ||
            WaveSurfer.create({
                container,
                height: 50,
                hideScrollbar: false,
                minPxPerSec: 30,
                scrollParent: true,
                normalize: true,
                plugins: [
                    RegionPlugin.create(),
                    TimelinePlugin.create({
                        container: "#wave-timeline"
                    })
                ],
                xhr: { ...this.props.xhr }
            })
        document.wavesurfer = this.wavesurfer

        this.wavesurfer.empty()
        this.setDialogueMap()

        // load the file
        if (this.props.url) {
            this.wavesurfer.load(this.props.url)
            this.setRegions()
        } else if (this.props.file) {
            this.wavesurfer.loadBlob(this.props.file)
        }

        // set the wavefile event
        this.setEvents()
    }

    componentDidUpdate = (prevProps, prevState) => {
        // 更新
        if (prevProps.url != this.props.url) {
            this.wavesurfer.load(this.props.url)
            this.setRegions()
        }

        //  播放状态变化
        if (
            prevProps.pause !== this.props.pause &&
            this.state.pause !== this.props.pause
        ) {
            if (this.props.pause) {
                this.wavesurfer.pause()
            } else if (!lodash.isNil(this.props.changeId)) {
                const region = this.regions[this.props.playId]
                if (region) {
                    const currentTime = this.wavesurfer.getCurrentTime()
                    currentTime >= region.end
                        ? region.play()
                        : this.wavesurfer.play(currentTime, region.end)
                } else {
                    this.wavesurfer.play()
                }
            } else {
                this.wavesurfer.play()
            }
        }

        // 段落变化
        if (this.props.dialogue !== prevProps.dialogue) {
            this.setDialogueMap()

            if (
                this.props.dialogue &&
                prevProps.dialogue &&
                this.props.dialogue.length !== prevProps.dialogue.length
            ) {
                this.setRegions()
            }
        }

        // 播放位置变化
        if (
            this.props.playId != prevProps.playId &&
            this.props.playId != this.state.playId
        ) {
            this.setState(
                {
                    playId: this.props.playId
                },
                () => {
                    const region = this.regions[this.props.playId]
                    if (!this.props.pause && region) {
                        region.play()
                    }
                }
            )
        }
    }

    setDialogueMap() {
        this.props.dialogue &&
            this.props.dialogue.forEach(item => {
                this.dialogueMap[item.id] = item
            })
    }

    setEvents = () => {
        this.wavesurfer.on("pause", () => {
            console.log("did pause")

            this.setState({ pause: true }, () => {
                this.props.onPauseChange && this.props.onPauseChange(true)
            })
        })

        this.wavesurfer.on("play", () => {
            this.setState({ pause: false }, () => {
                this.props.onPauseChange && this.props.onPauseChange(false)
            })
        })
        this.wavesurfer.on("region-in", region => {
            console.log("region-in")
            this.setState({ playId: region.id }, () => {
                this.props.onPlayChange && this.props.onPlayChange(region.id)
            })
        })
        this.wavesurfer.on("region-out", region => {
            // console.log("region-out")
            // this.setState({ playId: null }, () => {
            //     this.props.onPlayChange(null)
            // })
        })
        this.wavesurfer.on("region-play", region => {
            this.setState({ pause: false }, () => {
                this.props.onPauseChange && this.props.onPauseChange(false)
            })
        })

        this.wavesurfer.on("region-click", (region, e) => {
            region.play()
            this.props.onPlayChange && this.props.onPlayChange(region.id)
        })

        this.wavesurfer.on("ready", (region, e) => {
            this.props.onReady && this.props.onReady(e)
        })
    }

    /**
     * Load regions from localStorage.
     */
    setRegions = () => {
        const { dialogue } = this.props
        this.wavesurfer.clearRegions()
        dialogue &&
            dialogue.forEach(item => {
                this.regions[item.id] = this.wavesurfer.addRegion({
                    id: item.id,
                    drag: false,
                    resize: false,
                    start: item.startTime / 1000,
                    end: item.endTime / 1000,
                    color: randomColor(0.1)
                })
            })
    }

    render() {
        const { pause } = this.state
        return (
            <Fragment>
                <div id="wave-timeline"></div>
                <div id="waveform" />
                <Row
                    gutter={8}
                    type={"flex"}
                    justify="space-between"
                    style={{ marginTop: 8 }}
                >
                    <Col>
                        {pause ? (
                            <Button
                                onClick={() => {
                                    this.setState({
                                        pause: false
                                    })
                                    this.wavesurfer.play()
                                }}
                            >
                                播放
                            </Button>
                        ) : (
                            <Button
                                onClick={() => {
                                    this.setState({
                                        pause: true
                                    })
                                    this.wavesurfer.pause()
                                }}
                            >
                                暂停
                            </Button>
                        )}
                    </Col>
                    {this.props.operationExtend && (
                        <Col>{this.props.operationExtend}</Col>
                    )}
                </Row>
            </Fragment>
        )
    }
}

export default AudioPlayer
