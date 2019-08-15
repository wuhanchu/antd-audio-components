import React, { PureComponent, useEffect, useState, Fragment } from "react"
import WaveSurfer from "wavesurfer.js"
import TimelinePlugin from "wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js"
import MinimapPlugin from "wavesurfer.js/dist/plugin/wavesurfer.minimap.min.js"
import RegionPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.min.js"
import { Col, Row, Button } from "antd"

/**
 * Random RGBA color.
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

/**
 *
 */
class component extends PureComponent {
    regions = {}
    dialogueMap = {}

    state = {
        pause: true // 播放暂停
    }

    constructor(props) {
        super(props)
        this.setDialogueMap()
    }

    componentDidMount() {
        let wavesurfer = null
        this.wavesurfer =
            this.wavesurfer ||
            WaveSurfer.create({
                container: document.querySelector("#waveform"),
                height: 100,
                scrollParent: true,
                normalize: true,
                backend: "MediaElement",
                plugins: [
                    RegionPlugin.create(),
                    TimelinePlugin.create({
                        container: "#wave-timeline"
                    })
                ]
            })

        this.wavesurfer.empty()
        this.wavesurfer.load(this.props.url)
        this.setEvents()
    }

    setDialogueMap() {
        this.props.dialogue &&
            this.props.dialogue.forEach(item => {
                this.dialogueMap[item.id] = item
            })
    }

    componentWillUnmount() {
        this.wavesurfer && this.wavesurfer.destroy()
    }

    setEvents = () => {
        // this.wavesurfer.on("ready", () => {
        //     this.setRegions()
        // })

        this.wavesurfer.on("pause", () => {
            console.log("did pause")

            this.setState({ pause: true }, () => {
                this.props.onPauseChange(true)
            })
        })

        this.wavesurfer.on("play", () => {
            this.setState({ pause: false }, () => {
                this.props.onPauseChange(false)
            })
        })
        this.wavesurfer.on("region-in", region => {
            console.log("region-in")
            this.setState({ playId: region.id }, () => {
                this.props.onPlayChange(region.id)
            })
        })
        this.wavesurfer.on("region-play", region => {
            this.setState({ pause: false }, () => {
                this.props.onPauseChange(false)
            })
        })
        this.wavesurfer.on("region-out", region => {
            console.log("region-out")

            // const { playId } = this.state
            // this.setState({ playId: null, continue: null }, () => {
            //     this.props.onPlayChange(null)
            // })
        })
        this.wavesurfer.on("region-click", (region, e) => {
            e.stopPropagation()

            console.log("region-click")
            // region.play()
            this.props.onPlayChange(region.id)
        })
    }

    /**
     * Load regions from localStorage.
     */
    setRegions = () => {
        const { dialogue } = this.props
        this.wavesurfer.clearRegions()
        dialogue.forEach(item => {
            this.regions[item.id] = this.wavesurfer.addRegion({
                id: item.id,
                start: item.startTime / 1000,
                end: item.endTime / 1000,
                color: randomColor(0.1)
            })
        })
    }

    componentDidUpdate = (prevProps, prevState) => {
        //  播放状态变化
        if (
            prevProps.pause !== this.props.pause &&
            this.state.pause !== this.props.pause
        ) {
            this.props.pause ? this.wavesurfer.pause() : this.wavesurfer.play()
        }

        // 段落变化
        if (this.props.dialogue !== prevProps.dialogue) {
            this.setDialogueMap()
            this.setRegions()
        }

        // 播放位置变化
        if (
            this.props.playId != prevProps.playId &&
            this.state.playId != this.props.playId
        ) {
            this.setState(
                {
                    playId: this.props.playId
                },
                () => {
                    console.log("play regions", this.regions)

                    const region = this.regions[this.props.playId]
                    console.log("play region", region)
                    if (!this.props.pause && region) {
                        region.play()
                        this.wavesurfer.play()
                    }
                }
            )
        }
    }

    render() {
        const { pause } = this.state
        return (
            <Fragment>
                <div id="wave-timeline"></div>
                <div id="waveform" />
                <Row gutter={8} type={"flex"} style={{ marginTop: 8 }}>
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
                    {/*
                    <Col>
                        <Button>清除 </Button>
                    </Col>
                    <Col>
                        <Button>撤销</Button>
                    </Col> */}
                </Row>
            </Fragment>
        )
    }
}

export default component
