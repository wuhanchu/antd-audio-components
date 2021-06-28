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
 * */

import { Button, Col, Row } from 'antd';
import React, { Fragment, PureComponent } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
import Cursor from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';
import keyboardJS from 'keyboardjs';

import * as lodash from 'lodash';
// import { MARK_ACTIONS } from '@/pages/mark/components/MarkItem';

const ButtonGroup = Button.Group;

// const keyboardJS = window.keyboardJS

const MARK_ACTIONS = {
    mark: 'mark', // 标注
    inspection: 'inspection', // 检查
    view: 'view', // 查看
};
/**
 * Random RGBA color.
 */

/**
 * 生成一个随机颜色
 * @param {Number} alpha 透明度
 */
// function randomColor(alpha) {
//   return (
//     `rgba(${
//     [~~(Math.random() * 255), ~~(Math.random() * 255), ~~(Math.random() * 255), alpha || 1]
//     })`
//   );
// }

class AudioPlayer extends PureComponent {
    regions = {};

    dialogueMap = {};

    keyBindMethods = [];

    state = {
        pause: true, // 播放暂停
    };

    constructor(props) {
        super(props);
        this.setDialogueMap();
        this.bindKey();
        this.wavesurfer = {};
    }

    /**
     * bind the shortcuts to  audio
     */
    bindKey() {
        let method = null;
        let key = null;

        key = 'left';
        method = (e) => {
            if (!lodash.isNil(this.props.changeId)) {
                return;
            }
            e.preventDefault();
            this.wavesurfer.C0.skipBackward(1);
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({ key, method });

        key = 'right';
        method = (e) => {
            if (!lodash.isNil(this.props.changeId)) {
                return;
            }
            e.preventDefault();
            this.wavesurfer.C0.skip(1);
        };
        keyboardJS.bind(key, method);

        this.keyBindMethods.push({ key, method });

        // speed up
        key = 'shift+alt+up';
        method = (e) => {
            e.preventDefault();
            const rate = this.wavesurfer.C0.getPlaybackRate();
            if (rate >= 2) {
                return;
            }
            this.wavesurfer.C0.setPlaybackRate(rate + 0.2);
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({ key, method });

        // speed down
        key = 'shift+alt+down';
        method = (e) => {
            e.preventDefault();
            const rate = this.wavesurfer.C0.getPlaybackRate();
            if (rate <= 0.4) {
                return;
            }
            this.wavesurfer.C0.setPlaybackRate(rate - 0.2);
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({ key, method });

        // back
        key = 'shift+alt+left';
        method = (e) => {
            if (lodash.isNil(this.props.changeId)) {
                return;
            }
            e.preventDefault();

            const region = this.regions[this.props.changeId];

            if (region && this.wavesurfer.C0.getCurrentTime() - 1 <= region.start) {
                return;
            }

            this.wavesurfer.C0.skipBackward(0.3);
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({ key, method });

        // Fast forward
        key = 'shift+alt+right';
        method = (e) => {
            if (lodash.isNil(this.props.changeId)) {
                return;
            }
            e.preventDefault();

            const region = this.regions[this.props.changeId];
            if (region && this.wavesurfer.C0.getCurrentTime() + 1 >= region.end) {
                return;
            }

            this.wavesurfer.C0.skip(1);
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({ key, method });
    }

    componentWillUnmount = () => {
        this.keyBindMethods.forEach(({ key, method }) => {
            keyboardJS.unbind(key, method);
        });
        if (this.wavesurfer.C0) {
            this.wavesurfer.C0.destroy();
        }
        if (this.wavesurfer.C1) {
            this.wavesurfer.C1.destroy();
        }
    };

    componentDidMount() {
        //  create element
        console.log("内容")
        console.log(this.props)
        const args = (container, timelineContainer) => {
            return {
                container,
                height: this.props.enable_speech_audio ? 50 : 75,
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
                            'font-size': '10px',
                        },
                    }),
                    RegionPlugin.create({}),
                    TimelinePlugin.create({
                        container: timelineContainer,
                    }),
                ],
                xhr: { ...this.props.xhr },
            };
        };
        this.wavesurfer.C0 =
            this.wavesurfer.C0 || WaveSurfer.create(args('#waveformC0', '#wave-timelineC0'));
        document.wavesurfer = this.wavesurfer.C0;
        this.wavesurfer.C0.empty();
        if (this.props.enable_speech_audio) {
            this.wavesurfer.C1 =
                this.wavesurfer.C1 || WaveSurfer.create(args('#waveformC1', '#wave-timelineC1'));
            // document.wavesurfer = this.wavesurfer.C0;
            this.wavesurfer.C1.empty();
            if (this.props.url) {
                const urlExtension = `.${this.props.url.substring(
                    this.props.url.lastIndexOf('.') + 1,
                )}`;
                this.wavesurfer.C1.load(
                    `${this.props.url.split(urlExtension)[0]}_C1${urlExtension}`,
                );
                this.setRegions();
            } else if (this.props.file) {
                this.wavesurfer.C1.loadBlob(this.props.file);
            }
        }
        this.setDialogueMap();

        // load the file
        if (this.props.url) {
            const urlExtension = `.${this.props.url.substring(
                this.props.url.lastIndexOf('.') + 1,
            )}`;

            if (this.props.enable_speech_audio) {
                this.wavesurfer.C0.load(
                    `${this.props.url.split(urlExtension)[0]}_C0${urlExtension}`,
                );
            } else {
                this.wavesurfer.C0.load(this.props.url);
            }
            this.setRegions();
        } else if (this.props.file) {
            this.wavesurfer.C0.loadBlob(this.props.file);
        }

        // set the wavefile event
        this.setEvents();
    }

    handlePlay(playRegion, isOnClick) {
        this.wavesurfer.C1 && this.wavesurfer.C1.pause();
        this.wavesurfer.C0 && this.wavesurfer.C0.pause();
        if(isOnClick && this.props.enable_speech_audio){
            if(this.wavesurfer.C1.getCurrentTime() > this.wavesurfer.C0.getCurrentTime()){
                this.wavesurfer.C1 && this.wavesurfer.C1.play();
                this.wavesurfer.C0 && this.wavesurfer.C0.play(this.wavesurfer.C1.getCurrentTime());
            }
            else{
                this.wavesurfer.C1 && this.wavesurfer.C1.play(this.wavesurfer.C0.getCurrentTime());
                this.wavesurfer.C0 && this.wavesurfer.C0.play();
            }
            
            return
        }
        if (!lodash.isNil(this.props.changeId)) {
            const region = playRegion || this.regions[this.state.playId];
            if (region) {
                const currentTimeC0 = this.wavesurfer.C0.getCurrentTime();
                const currentTimeC1 = this.wavesurfer.C1 && this.wavesurfer.C1.getCurrentTime();

                if (currentTimeC0 > region.end || currentTimeC1 > region.end) {
                    if (this.props.dialogue[this.props.playId].channel_id === 'C1'&& this.props.enable_speech_audio) {

                        this.wavesurfer.C1.play(region.start, region.end);
                    } else {
                        this.wavesurfer.C0.play(region.start, region.end);
                    }
                } else if (this.props.dialogue[this.props.playId].channel_id === 'C1' && this.props.enable_speech_audio) {
                    this.wavesurfer.C1.play(currentTimeC1, region.end);
                } else {
                    this.wavesurfer.C0.play(currentTimeC0, region.end);

                }
            } else {
                if (this.props.playId && this.props.dialogue[this.props.playId].channel_id === 'C1' && this.props.enable_speech_audio) {
                    this.wavesurfer.C1.play();
                } else {
                    this.wavesurfer.C0.play();
                }
            }
        } else {
            if (this.props.playId && this.props.dialogue[this.props.playId].channel_id === 'C1' && this.props.enable_speech_audio) {
                this.wavesurfer.C1.play();
                
            } else {
                this.wavesurfer.C0.play();
            }
        }
    }

    componentDidUpdate = (prevProps) => {
        // 更新
        if (prevProps.url !== this.props.url) {
            this.wavesurfer.C0.load(this.props.url);
            this.setRegions();
        }

        // //  播放状态变化
        if (prevProps.pause !== this.props.pause && this.state.pause !== this.props.pause) {
            if (this.props.pause) {
                this.wavesurfer.C0 && this.wavesurfer.C0.pause();
                this.wavesurfer.C1 && this.wavesurfer.C1.pause();
            } else {
                this.handlePlay();
            }
        }

        // 段落变化
        if (this.props.dialogue !== prevProps.dialogue) {
            this.setDialogueMap();
            console.log('段落变化');

            if (
                this.props.dialogue &&
                prevProps.dialogue &&
                this.props.dialogue !== prevProps.dialogue
            ) {
                this.setRegions();
            }
        }

        // 播放位置变化

        if (this.props.changeId !== prevProps.changeId && this.props.changeId) {
            console.log('播放位置变化1');

            this.handlePlay();
        }

        // 播放位置变化
        if (this.props.playId !== prevProps.playId && this.props.playId !== this.state.playId) {
            this.setState(
                {
                    playId: this.props.playId,
                },
                () => {
                    const region = this.regions[this.state.playId];

                    if (!this.props.pause && region) {
                        if (this.props.dialogue[this.props.playId].channel_id === 'C1'&& this.props.enable_speech_audio) {
                            this.wavesurfer.C1 && this.wavesurfer.C1.play(region.start, region.end);
                            this.wavesurfer.C0 && this.wavesurfer.C0.pause();
                        } else {
                            this.wavesurfer.C0 && this.wavesurfer.C0.play(region.start, region.end);
                            this.wavesurfer.C1 && this.wavesurfer.C1.pause();
                        }
                        // region.play()
                    }
                },
            );
        }
    };

    setDialogueMap() {
        if (this.props.dialogue) {
            this.props.dialogue.forEach((item) => {
                this.dialogueMap[item.id] = item;
            });
        }
    }

    setEvents = () => {
        this.wavesurfer.C0.on('pause', () => {
            this.setState({ pause: true }, () => {
                if (this.props.pause !== this.state.pause && this.props.onPauseChange) {
                    this.props.onPauseChange(true);
                }
            });
        });

        // this.wavesurfer.C0.on("interaction", () => {
        //     console.log("interaction")
        //     this.handlePlay()
        // })

        this.wavesurfer.C0.on('play', () => {
            this.setState({ pause: false }, () => {
                if (this.props.pause !== this.state.pause && this.props.onPauseChange) {
                    this.props.onPauseChange(false);
                }
            });
        });

        this.wavesurfer.C0.on('region-in', (region) => {
            this.setState(
                { playId: region.id },
                () => {
                    if (this.props.playId !== this.state.playId && this.props.onPlayChange) {
                        this.props.onPlayChange(region.id);
                    }
                },
                () => {
                    this.handlePlay(region);
                },
            );
        });
        this.wavesurfer.C0.on('region-out', () => { });
        this.wavesurfer.C0.on('region-play', () => {
            this.setState({ pause: false }, () => {
                if (this.props.onPauseChange) {
                    this.props.onPauseChange(false);
                }
            });
        });

        this.wavesurfer.C0.on('region-click', () => {
            setTimeout(() => {
                // this.handlePlay(region)
            }, 100);
        });

        this.wavesurfer.C0.on('ready', (region, e) => {
            if (this.props.onReady) {
                this.props.onReady(e);
            }
        });

        this.wavesurfer.C0.on('region-update-end', (region) => {
            if (this.props.onRegionUpdate) {
                this.props.onRegionUpdate(
                    region.id,
                    region.start > 0 ? Math.round(region.start * 1000) : 0,
                    region.end > 0 ? Math.round(region.end * 1000) : 0,
                );
            }
        });

        if (this.props.enable_speech_audio) {
            this.wavesurfer.C1.on('pause', () => {
                this.setState({ pause: true }, () => {
                    if (this.props.pause !== this.state.pause && this.props.onPauseChange) {
                        this.props.onPauseChange(true);
                    }
                });
            });

            // this.wavesurfer.C0.on("interaction", () => {
            //     console.log("interaction")
            //     this.handlePlay()
            // })

            this.wavesurfer.C1.on('play', () => {
                this.setState({ pause: false }, () => {
                    if (this.props.pause !== this.state.pause && this.props.onPauseChange) {
                        this.props.onPauseChange(false);
                    }
                });
            });

            this.wavesurfer.C1.on('region-in', (region) => {
                this.setState(
                    { playId: region.id },
                    () => {
                        if (this.props.playId !== this.state.playId && this.props.onPlayChange) {
                            this.props.onPlayChange(region.id);
                        }
                    },
                    () => {
                        this.handlePlay(region);
                    },
                );
            });
            this.wavesurfer.C1.on('region-out', () => { });
            this.wavesurfer.C1.on('region-play', () => {
                this.setState({ pause: false }, () => {
                    if (this.props.onPauseChange) {
                        this.props.onPauseChange(false);
                    }
                });
            });

            this.wavesurfer.C1.on('region-click', () => {
                setTimeout(() => {
                    // this.handlePlay(region)
                }, 100);
            });

            this.wavesurfer.C1.on('ready', (region, e) => {
                if (this.props.onReady) {
                    this.props.onReady(e);
                }
            });

            this.wavesurfer.C1.on('region-update-end', (region) => {
                if (this.props.onRegionUpdate) {
                    this.props.onRegionUpdate(
                        region.id,
                        region.start > 0 ? Math.round(region.start * 1000) : 0,
                        region.end > 0 ? Math.round(region.end * 1000) : 0,
                    );
                }
            });
        }
    };

    /**
     * Load regions from localStorage.
     */
    setRegions = () => {
        const { dialogue } = this.props;
        const lastItem = {};
        this.wavesurfer.C0 && this.wavesurfer.C0.clearRegions();
        this.wavesurfer.C1 && this.wavesurfer.C1.clearRegions();
        if (dialogue) {
            dialogue.forEach((item, index) => {
                let start;
                if (item.channel_id === 'C1' && this.props.enable_speech_audio) {
                    start =
                        lastItem.C1 && item.beginTime < lastItem.C1.endTime
                            ? lastItem.C1.endTime
                            : item.beginTime;
                    if (lastItem.C1 && start <= lastItem.C1.endTime + 100) {
                        start += 100;
                    }
                } else {
                    start =
                        lastItem.C0 && item.beginTime < lastItem.C0.endTime
                            ? lastItem.C0.endTime
                            : item.beginTime;
                    if (lastItem.C0 && start <= lastItem.C0.endTime + 100) {
                        start += 100;
                    }
                }

                const options = {
                    id: item.id,
                    drag: false,
                    resize: this.props.action !== MARK_ACTIONS.view,
                    loop: false,
                    start: start / 1000,
                    end: item.endTime / 1000,
                    color: 'rgb(63, 63, 68,0.4)',
                };
                if (item.channel_id === 'C1' && this.props.enable_speech_audio) {
                    this.regions[item.id] = this.wavesurfer.C1.addRegion(options);
                    lastItem.C1 = item;
                } else {
                    this.regions[item.id] = this.wavesurfer.C0.addRegion(options);
                    lastItem.C0 = item;
                }
                // lastItem = item;
            });
        }
    };

    render() {
        const { pause } = this.state;
        return (
            <Fragment>
                <div id="wave-timelineC0" />
                <div id="waveformC0" />
                <div id="waveformC1" />
                <div id="wave-timelineC1" />

                <Row gutter={8} type="flex" justify="space-between" style={{ marginTop: 8 }}>
                    <Col>
                        <ButtonGroup>
                            {pause ? (
                                <Button
                                    onClick={() => {
                                        this.setState({
                                            pause: false,
                                        });
                                        this.handlePlay(null,true);
                                    }}
                                >
                                    播放
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        this.setState({
                                            pause: true,
                                        });
                                        this.wavesurfer.C0 && this.wavesurfer.C0.pause();
                                        this.wavesurfer.C1 && this.wavesurfer.C1.pause();
                                    }}
                                >
                                    暂停
                                </Button>
                            )}
                            {!_.isNil(this.props.changeId) ? (
                                <Button
                                    onClick={() => {
                                        this.props.onChangeIdChange(null);
                                    }}
                                >
                                    退出编辑
                                </Button>
                            ) : null}
                            <Button
                                style={{ marginLeft: '8px' }}
                                onClick={() => {
                                    const rate = this.wavesurfer.C0.getPlaybackRate();
                                    if (rate >= 2) {
                                        return;
                                    }
                                    this.wavesurfer.C0.setPlaybackRate(0.8);
                                }}
                            >
                                0.8倍速
                            </Button>
                            <Button
                                onClick={() => {
                                    const rate = this.wavesurfer.C0.getPlaybackRate();
                                    if (rate >= 2) {
                                        return;
                                    }
                                    this.wavesurfer.C0.setPlaybackRate(1);
                                }}
                            >
                                1倍速
                            </Button>
                            <Button
                                onClick={() => {
                                    const rate = this.wavesurfer.C0.getPlaybackRate();
                                    if (rate >= 2) {
                                        return;
                                    }
                                    this.wavesurfer.C0.setPlaybackRate(1.2);
                                }}
                            >
                                1.2倍速
                            </Button>
                        </ButtonGroup>
                    </Col>

                    {this.props.operationExtend && <Col>{this.props.operationExtend}</Col>}
                </Row>
            </Fragment>
        );
    }
}

export default AudioPlayer;
