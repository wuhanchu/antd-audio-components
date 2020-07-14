/**
 * @module 音频波形组件
 * @param {Array} dialogue 对话数据
 * @param {String} [url] 音频url，和file二选一
 * @param {Blob} [xhr] 认证信息
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
import Cursor from "wavesurfer.js/dist/plugin/wavesurfer.cursor"

import * as lodash from "lodash"
import { MARK_ACTIONS } from "@/pages/mark/components/MarkItem";

const ButtonGroup = Button.Group;

// const keyboardJS = window.keyboardJS

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
            ~~(Math.random()*255),
            ~~(Math.random()*255),
            ~~(Math.random()*255),
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

        // speed up
        key = "shift+alt+up"
        method = e => {
            e.preventDefault()
            const rate = this.wavesurfer.getPlaybackRate()
            if (rate >= 2) {
                return
            }
            this.wavesurfer.setPlaybackRate(rate + 0.2)
        }
        keyboardJS.bind(key, method)
        this.keyBindMethods.push({ key, method })

        // speed down
        key = "shift+alt+down"
        method = e => {
            e.preventDefault()
            const rate = this.wavesurfer.getPlaybackRate()
            if (rate <= 0.4) {
                return
            }
            this.wavesurfer.setPlaybackRate(rate - 0.2)
        }
        keyboardJS.bind(key, method)
        this.keyBindMethods.push({ key, method })

        // back
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

            this.wavesurfer.skipBackward(0.3)
        }
        keyboardJS.bind(key, method)
        this.keyBindMethods.push({ key, method })

        // Fast forward
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
        const container = document.querySelector("#waveform")

        //  create element
        this.wavesurfer =
            this.wavesurfer ||
            WaveSurfer.create({
                container,
                height: 75,
                hideScrollbar: false,
                cursorColor: 'red',
                cursorWidth: 2,
                progressColor: 'red',

                // minPxPerSec: 30,
                scrollParent: true,
                normalize: true,
                plugins: [
                    Cursor.create({
                        showTime: true,
                        opacity: 1,
                        customShowTimeStyle: {
                            'background-color': 'red',
                            color: '#fff',
                            padding: '2px',
                            'font-size': '10px'
                        }
                    }),
                    RegionPlugin.create({}),
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

    handlePlay(playRegion) {
        if (!lodash.isNil(this.props.changeId)) {
            let region = playRegion || this.regions[this.state.playId]
            if (region) {
                const currentTime = this.wavesurfer.getCurrentTime()
                if (currentTime > region.end) {
                    this.wavesurfer.play(region.start, region.end)
                } else {
                    this.wavesurfer.play(currentTime, region.end)
                }

            } else {
                this.wavesurfer.play()
            }
        } else {
            this.wavesurfer.play()
        }
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
            } else {
                this.handlePlay()
            }
        }

        // 段落变化
        if (this.props.dialogue !== prevProps.dialogue) {
            this.setDialogueMap()

            if (
                this.props.dialogue &&
                prevProps.dialogue &&
                this.props.dialogue !== prevProps.dialogue
            ) {
                this.setRegions()
            }
        }

        // 播放位置变化
        if (
            this.props.changeId != prevProps.changeId &&
            this.props.changeId
        ) {
            this.handlePlay()
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
                    const region = this.regions[this.state.playId]

                    if (!this.props.pause && region) {
                        this.wavesurfer.play(region.start, region.end)
                        // region.play()
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
            this.setState({ pause: true }, () => {
                this.props.pause != this.state.pause && this.props.onPauseChange && this.props.onPauseChange(true)
            })
        })

        // this.wavesurfer.on("interaction", () => {
        //     console.log("interaction")
        //     this.handlePlay()
        // })

        this.wavesurfer.on("play", () => {
            this.setState({ pause: false }, () => {
                this.props.pause != this.state.pause && this.props.onPauseChange && this.props.onPauseChange(false)
            })
        })

        this.wavesurfer.on("region-in", region => {
            this.setState({ playId: region.id }, () => {
                this.props.playId != this.state.playId && this.props.onPlayChange && this.props.onPlayChange(region.id)
            }, () => {
                this.handlePlay(region)
            })
        })
        this.wavesurfer.on("region-out", region => {
            // setTimeout(()=>{
            //
            // })
            // this.setState({ playId: null })
        })
        this.wavesurfer.on("region-play", region => {
            this.setState({ pause: false }, () => {
                this.props.onPauseChange && this.props.onPauseChange(false)
            })
        })

        this.wavesurfer.on("region-click", region => {
            setTimeout(() => {
                // this.handlePlay(region)
            }, 100)
        })

        this.wavesurfer.on("ready", (region, e) => {
            this.props.onReady && this.props.onReady(e)
        })

        this.wavesurfer.on("region-update-end", (region, e) => {
            this.props.onRegionUpdate && this.props.onRegionUpdate(region.id, Math.round(region.start*1000)
                ,
                Math.round(region.end*1000)
            )
        })
    }

    /**
     * Load regions from localStorage.
     */
    setRegions = () => {
        const { dialogue } = this.props
        let lastItem = null

        dialogue &&
        dialogue.forEach(item => {
            let start = (lastItem && item.startTime < lastItem.endTime? lastItem.endTime : item.startTime)
            if (lastItem && start <= lastItem.endTime + 100) {
                start = start + 100
            }

            const currentRegion = this.regions[item.id]
            const options = {
                id: item.id,
                drag: false,
                resize: this.props.action != MARK_ACTIONS.view,
                loop: false,
                start: start/1000,
                end: (item.endTime)/1000,
                color: "rgb(63, 63, 68,0.4)"
            }

            if (currentRegion) {
                if (currentRegion.start != options.start || currentRegion.end != options.end) {
                    currentRegion.update(options)
                }
            } else {
                this.regions[item.id] = this.wavesurfer.addRegion(options)
            }

            lastItem = item
        })
    }

    render() {
        const { pause } = this.state
        return (
            <Fragment>
                <div id="wave-timeline"></div>
                <div id="waveform"/>
                <Row
                    gutter={8}
                    type={"flex"}
                    justify="space-between"
                    style={{ marginTop: 8 }}
                >
                    <Col>
                        <ButtonGroup>
                            {pause? (
                                <Button
                                    onClick={() => {
                                        this.setState({
                                            pause: false
                                        })
                                        this.handlePlay()
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
                            {!_.isNil(this.props.changeId)? (
                                <Button
                                    onClick={() => {
                                        this.props.onChangeIdChange(null)
                                    }}
                                >
                                    退出编辑
                                </Button>
                            ) : null}
                            <Button
                                style={{marginLeft: '8px'}}
                                onClick={() => {
                                    const rate = this.wavesurfer.getPlaybackRate()
                                    if (rate >= 2) {
                                        return
                                    }
                                    this.wavesurfer.setPlaybackRate(0.8)
                                }}
                            >
                                0.8倍速
                            </Button>
                            <Button
                                onClick={() => {
                                    const rate = this.wavesurfer.getPlaybackRate()
                                    if (rate >= 2) {
                                        return
                                    }
                                    this.wavesurfer.setPlaybackRate(1)
                                }}
                            >
                                1倍速
                            </Button>
                            <Button
                                onClick={() => {
                                    const rate = this.wavesurfer.getPlaybackRate()
                                    if (rate >= 2) {
                                        return
                                    }
                                    this.wavesurfer.setPlaybackRate(1.2)
                                }}
                            >
                                1.2倍速
                            </Button>
                        </ButtonGroup>
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
