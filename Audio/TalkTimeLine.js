import React, {Fragment, PureComponent} from 'react';
import {Icon as LegacyIcon} from '@ant-design/compatible';
import {SyncOutlined} from '@ant-design/icons';
import {Card, Col, message, Row, Spin, Timeline, Typography} from 'antd';
import {antdUtils, frSchema} from '@/outter';
import InputMentions from '@/components/Extra/Audio/InputMentions';
import CheckableTag from 'antd/es/tag/CheckableTag';
import ButtonSpace from '@/components/Extra/Button/ButtonSpace';
import clone from 'clone';
import * as _ from 'lodash';
import keyboardJS from 'keyboardjs';

const { createComponent } = antdUtils.utils.component;
const { actions, schemaFieldType, utils } = frSchema;
const { Text } = Typography;

/**
 *对话类型
 */
export const RECORD_TYPE = {
    sign: 'sign',
    record: 'record',
};

/**
 * @class TalkTimeLine
 * @classdesc default export, if have not event just use InputMentions
 * @param {Array} dialogue  对话数据 is Immutable
 *              {
 *                   id: 1,
 *                   type: "record",
 *                   beginTime: moment(),
 *                   endTime: moment(),
 *                   text: "test"
 *               }
 * @param {Array} [null] hotWordList 热词
 * @param {Array}  [null] labels 标签
 * @param {Integer} [null] playId 当前播放的id
 * @param {Boolean}  [flse] running 组件运行状态（是否录音或者播放中）
 * @param {Boolean}  [true] pause 播放暂停标志
 * @param {Boolean}  [false] showUserSelect 是否开启用户选择
 * @param {Boolean}  [false] reverse 是否反转显示数据
 * @param {Function} [null] onItemChange 对话修改
 * @param {Function} [null] onPlayChange playid 修改
 * */
class TalkTimeLine extends PureComponent {
    /**
     * @property {object}
     * @desc react object of mention
     */
    mention = null;

    /**
     * @property {Array}
     * @desc 按键绑定
     */
    keyBindMethods = [];

    /**
     * @property {object}
     * @desc state
     */
    state = {
        changeId: null, // 当前修改ID
    };

    /**
     * @property {object}
     * @desc 对话map
     */
    dialogueMap = {};

    constructor(props) {
        super(props);
        this.setDialogueMap();

        // 先要取自要从项目中获取
        if (this.props.roles) {
            this.roleDict = {};
            this.props.roles.forEach((item) => {
                this.roleDict[item.value] = item;
            });
        }
    }

    componentDidMount() {
        this.bindKey();
    }

    componentDidUpdate(prevProps) {
        // play 切换
        if (this.props.playId !== prevProps.playId) {
            !_.isNil(this.props.playId)
            try {
                this.scrollToItem(this.dialogueMap[this.props.playId].item);
            } catch (error) {
            }
        }

        if (this.props.dialogue !== prevProps.dialogue) {
            this.setDialogueMap();
        }

        // changeId 正式
        if (this.props.changeId !== prevProps.changeId) {
            this.setChangeId(this.props.changeId);
        }
    }

    /**
     * 修改changeId
     * @param {*} changeId 修改的项目ID
     * @param {*} callback 回调函数
     */
    setChangeId(changeId, callback) {
        if (this.state.changeId !== changeId) {
            if(this.mention){
                this.mention.blur();
            }
        }

        this.setState({ changeId }, () => {
            if (this.state.changeId !== this.props.changeId) {
                if(this.props.onChangeIdChange){
                    this.props.onChangeIdChange(this.state.changeId);
                }
            }
            if (this.state.changeId === 0) {
                this.scrollToItem(this.dialogueMap[0].item);
            }

            this.props.onChangeIdChange(this.state.changeId);
            if(callback){
                callback();
            }
        });
    }


    componentWillUnmount = () => {
        this.keyBindMethods.forEach(({ key, method }) => {
            keyboardJS.unbind(key, method);
        });
    };

    setDialogueMap() {
        if(this.props.dialogue) {
            this.props.dialogue.forEach((item, index) => {
                this.dialogueMap[item.id] = {
                    item,
                    index,
                };
            });
        }
    }

    /**
     * 绑定按键
     */
    bindKey = () => {
        // rewrite the key event ,not to triger input
        const node = document.getElementById('timeline');
        node.onkeypress = (event) => {
            if (event.shiftKey && event.altKey) {
                return false;
            }
            return null
        };

        node.onclick = (event) => {
            if (
                event.target.className &&
                event.target.className.indexOf &&
                event.target.className.indexOf('flex') > -1
            ) {
                this.setChangeId(null);
            }
        };

        // set the event
        const { keyBindMethods } = this;
        let method = null;
        let key = null;

        // 退出
        key = 'esc';
        method = (e) => {
            e.preventDefault();
            e.stopPropagation();

            this.setChangeId(null);
        };
        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        // 下一条
        key = 'tab';
        method = (e) => {
            e.preventDefault();

            const { changeId } = this.state;

            let nextItem = null;
            if (!_.isNil(changeId)) {
                const nextIndex = this.dialogueMap[this.state.changeId].index + 1;
                nextItem = this.props.dialogue[nextIndex];
            }
            if (!nextItem) {
                nextItem = this.props.dialogue[0];
            }

            if (!nextItem) {
                this.setChangeId(null);

                return;
            }
            if (nextItem.id === 0 && !this.dialogueMap[1]) {
                if (this.props.onItemChange && this.state.changeId) {
                    return;
                }

                e.preventDefault();
                this.props.onPauseChange(!this.props.pause);
            }
            this.setChangeId(nextItem.id);
        };
        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        // 上一条
        key = 'shift + tab';
        method = (e) => {
            e.preventDefault();

            const { changeId } = this.state;
            if (!changeId) {
                return;
            }

            const nextIndex = this.dialogueMap[this.state.changeId].index - 1;
            const nextItem = this.props.dialogue[nextIndex];

            if (!nextItem) {
                this.setChangeId(changeId);
                return;
            }

            this.setChangeId(nextItem.id);
        };
        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        // play or suspend
        key = 'shift + alt + p';
        method = (e) => {
            e.preventDefault();
            this.props.onPauseChange(!this.props.pause);
        };
        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        // play or suspend
        key = 'shift + alt + l';
        method = () => {
            // e.preventDefault()
            const index = this.state.itemIndex;
            const item = this.props.dialogue[index];
            if (index) {
                const { dialogue } = this.props;
                const tempDialogue = clone(dialogue);
                const lastItem = tempDialogue[index - 1];
                lastItem.endTime = item.endTime;
                lastItem.beginTime =
                    lastItem.beginTime < item.beginTime ? lastItem.beginTime : item.beginTime;
                lastItem.endTime = lastItem.endTime >= item.endTime ? lastItem.endTime : item.endTime;
                lastItem.text =
                    (_.isNil(lastItem.text) ? '' : lastItem.text) + (_.isNil(item.text) ? '' : item.text);
                tempDialogue.splice(index, 1);
                this.setChangeId(null, () => this.props.onDialogueChange(tempDialogue, lastItem.id));
            }
        };
        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        // play or suspend
        key = 'shift + alt + K';
        method = () => {
            // e.preventDefault()
            const index = this.state.itemIndex;
            const item = this.props.dialogue[index];
            if (index !== undefined && index !== this.props.dialogue.length + 1) {
                const { dialogue } = this.props;
                const tempDialogue = clone(dialogue);
                const nextItem = tempDialogue[index + 1];
                if (_.isNil(nextItem)) {
                    return;
                }
                nextItem.beginTime =
                    item.beginTime < nextItem.beginTime ? item.beginTime : nextItem.beginTime;
                nextItem.endTime = item.endTime >= nextItem.endTime ? item.endTime : nextItem.endTime;
                nextItem.text =
                    (_.isNil(item.text) ? '' : item.text) + (_.isNil(nextItem.text) ? '' : nextItem.text);

                tempDialogue.splice(index, 1);
                this.setChangeId(null, () => {
                    this.props.onDialogueChange(tempDialogue, nextItem.id);
                });
            }
        };
        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        // Without editing, play or suspend
        key = 'shift + space';
        method = (e) => {
            if (this.props.onItemChange && this.state.changeId) {
                return;
            }

            e.preventDefault();
            this.props.onPauseChange(!this.props.pause);
        };

        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        key = 'ctrl + [';
        method = () => {
            const index = this.state.itemIndex;
            const item = this.props.dialogue[index];
            if (index !== undefined) {
                this.handleChangeTag(
                    item,
                    0,
                    { color: 'blue', remark: '男', value: 'man' },
                    '',
                    item.labels ? !item.labels.man : true,
                );
            }
        };

        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        key = 'ctrl + 0';
        method = () => {
            const index = this.state.itemIndex;
            const item = this.props.dialogue[index];
            if (index !== undefined) {
                this.handleChangeTag(
                    item,
                    0,
                    { value: 'noise', remark: '噪音', color: 'red' },
                    '',
                    item.labels ? !item.labels.noise : true,
                );
            }
        };

        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        key = 'ctrl + ]';
        method = () => {
            const index = this.state.itemIndex;
            const item = this.props.dialogue[index];
            if (index !== undefined) {
                this.handleChangeTag(
                    item,
                    0,
                    { color: 'pink', remark: '女', value: 'woman' },
                    '',
                    item.labels ? !item.labels.woman : true,
                );
            }
        };

        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });
        // 提交
        key = 'ctrl + enter';
        method = (e) => {
            e.preventDefault();
            this.props.onPauseChange(!this.props.pause);
        };
        keyboardJS.bind(key, method);
        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });

        key = 'shift + x';
        method = () => {
            const index = this.state.itemIndex;
            // const item = this.props.dialogue[index];
            if (index !== undefined) {
                const { dialogue } = this.props;
                let tempDialogue = clone(dialogue);
                const item = tempDialogue[index];

                const selectText = document.getSelection().toString();

                // get currentTime to be next item begin time
                const beginTime = document.wavesurfer.getCurrentTime() * 1000;

                if (item.endTime - beginTime < 250) {
                    message.warn('拆分间隔太短！');
                    return;
                }

                tempDialogue.splice(index + 1, 0, {
                    ...item,
                    id: index,
                    beginTime,
                    entTime: item.endTime,
                    text: selectText,
                });
                tempDialogue = tempDialogue.map((items, indexs) => {
                    if (indexs >= index + 1) return { ...items, id: items.id + 1 };
                    return { ...items };
                });
                tempDialogue[index].text = item.text && item.text.replace(selectText, '');
                tempDialogue[index].endTime = beginTime;
                this.setChangeId(null, () => {
                    this.props.onDialogueChange(tempDialogue, index);
                });
                                    
            }
        };

        keyboardJS.bind(key, method);
        keyBindMethods.push({
            key,
            method,
        });
    };

    /**
     * 渲染错误标签
     * @param item
     * @param index
     * @param label
     * @param inStyle
     * @param mark
     * @returns {*}
     */

    handleChangeTag = (item, index, label, inStyle, mark) => {
        const { value, checkFunc } = label;
        if (checkFunc) {
            checkFunc(item);
        }
        const labels = { ...item.labels };
        labels[value] = mark;
        if(this.props.onItemChange) {
            this.props.onItemChange({...item, labels});
        }
    };

    handleChangeRoleTag = (item, index, label) => {
        const { value, checkFunc } = label;
        if (checkFunc) {
            checkFunc(item);
        }
        console.log("handleChangeRoleTag")
        console.log(item.role)
        console.log(value)

        let role = { ...item.role };
        role = value;
        if(item.role === value){
            role= null
        }
        if(this.props.onItemChange) {
            this.props.onItemChange({...item, role});
        }
    };

    renderTag = (item, index, label, inStyle) => {

        const { remark, value, color = 'red', checkFunc, } = label;
        let checked = item.labels && item.labels[value];
        if (checkFunc) {
            checked = checkFunc(item);
        }

        const style = inStyle || {};
        if (checked) {
            style.backgroundColor = color;
        } else {
            style.backgroundColor = 'lightgray';
        }

        return (
            <CheckableTag
                style={style}
                key={value}
                color="red"
                checked={checked}
                onChange={(mark) => {
                    this.handleChangeTag(item, index, label, inStyle, mark);
                    // 数据请求
                }}
            >
                {remark}
            </CheckableTag>
        );
    };

    renderRoleTag = (item, index, label, inStyle) => {
        const { remark, value, color = 'red', checkFunc, } = label;
        let checked = item.role && item.role === label.value;
        if (checkFunc) {
            checked = checkFunc(item);
        }

        const style = inStyle || {};
        if (checked) {
            style.backgroundColor = color;
        } else {
            style.backgroundColor = 'lightgray';
        }

        return (
            <CheckableTag
                style={style}
                key={value}
                color="red"
                checked={checked}
                onChange={(mark) => {
                    this.handleChangeRoleTag(item, index, label, inStyle, mark);
                    // 数据请求
                }}
            >
                {remark}
            </CheckableTag>
        );
    };





    handleInputCheck(data, style) {
        if (!this.props.showTips) {
            return null;
        }
        if (data) {
            if (data.search('哎') !== -1 || data.search('噢') !== -1) {
                return { ...style, border: ' 1px solid red', padding: '4px', fontSize: '14px' };
            }
            if (data.search('】') !== -1 || data.search('【') !== -1) {
                return { ...style, border: ' 1px solid red', padding: '4px', fontSize: '14px' };
            }
            if (
                data.charAt(data.length - 1) !== '？' &&
                data.charAt(data.length - 1) !== '。' &&
                data.charAt(data.length - 1) !== '；' &&
                data.charAt(data.length - 1) !== '！'
            )
                return { ...style, border: ' 1px solid red', padding: '4px', fontSize: '14px' };
        }
        return null
    }

    handleInputData = (data) => {
        if (data) {
            if (data.search('哎') !== -1 || data.search('噢') !== -1) {
                return '*有哎或噢存在请检查是否确定';
            }
            if (
                data.charAt(data.length - 1) !== '？' &&
                data.charAt(data.length - 1) !== '。' &&
                data.charAt(data.length - 1) !== '；' &&
                data.charAt(data.length - 1) !=='！'
            )
                return '*句末符号出错';
            if (data.search('】') !== -1 || data.search('【') !== -1) {
                return '*【】应为[]';
            }
        }
        return null
    };

    /**
     * 渲染输入框
     * @param {x} item
     * @param {x} index
     */
    renderInput(item, index) {
        const { changeId } = this.state;
        const style = { fontSize: '1.1em' };

        return !_.isNil(changeId) && changeId === item.id && this.props.onItemChange ? (
            this.renderMentions(item, index, this.props.showTips)
        ) : (
            <div
                style={{ marginLeft: 12 }}
                onClick={(e) => {
                    this.setChangeId(item.id);
                    e.stopPropagation();
                    e.preventDefault();
                }}
            >
                <div style={this.handleInputCheck(item.text && item.text.trim(), style)}>
                    <Text disabled={!(item.text && item.text.trim())} style={style}>
                        {(item.text && item.text.trim()) || '空数据'}
                    </Text>
                </div>
                {this.props.showTips && (
                    <span style={{ color: 'red', marginTop: '5px', display: 'block' }}>
            {this.handleInputData(item.text && item.text.trim())}
          </span>
                )}
            </div>
        );
    }

    isElementVisible= (el) => {
        const rect = el.getBoundingClientRect();
        const vWidth = window.innerWidth || document.documentElement.clientWidth;
        const vHeight = window.innerHeight || document.documentElement.clientHeight;
        const efp = (x, y) => {
            return document.elementFromPoint(x, y);
        };

        // Return false if it's not in the viewport
        if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) return false;

        // Return true if any of its four corners are visible
        return (
            el.contains(efp(rect.left, rect.top)) ||
            el.contains(efp(rect.right, rect.top)) ||
            el.contains(efp(rect.right, rect.bottom)) ||
            el.contains(efp(rect.left, rect.bottom))
        );
    };

    /**
     * 滚动到对应的位置
     * @param item
     */
    scrollToItem = (item) => {
        const anchorElement = document.getElementById(`timeline_${  item.id}`);

        if (anchorElement && !this.isElementVisible(anchorElement)) {
            anchorElement.scrollIntoView();
        }
    };

    renderUserSelect(item) {
        /**
         * 数据修改模型
         */
        const disabled = !this.props.onItemChange;
        const inputProps = {
            showSearch: true,
            placeholder: '选择角色',
            size: 'small',
            style: { width: 100 },
            onChange: (role) => {
                this.props.onItemChange({ ...item, role });
            },
            disabled,
        };

        return createComponent.bind(null)(
            {
                title: '人员',
                type: schemaFieldType.Select,
                dict: this.roleDict,
                dataIndex: 'role',
            },
            item.role,
            inputProps,
            actions.add,
        );
    }

    /**
     * 渲染头部信息
     * @param {*} item
     * @param index item idnex
     * @param isLast is last item
     */
    renderInfo(item, index, isLast = false) {
        const { playId, labels, hideInfo, roles } = this.props;
        if (hideInfo) {
            return null;
        }

        // if (item.username && item.username !== '') {
        //   inputProps.defaultValue = Number.parseInt(item.username);
        // }

        return (
            <Row type="flex">
                <Col>
                    <Row
                        type="flex"
                        align="middle"
                        gutter={8}
                        style={{
                            marginBottom: 12,
                            fontSize: '1.1em',
                            marginRight: 10,
                        }}
                    >
                        {/* <Col
                            style={{
                                marginRight: 8
                            }}
                        >
                            {this.props.showUserSelect && this.roleDict && (
                                <Fragment>
                                    {!_.isNil(item.id) &&
                                    this.renderUserSelect(item, index)}
                                </Fragment>
                            )}
                        </Col> */}
                        {!_.isNil(item.beginTime) && (
                            <Col>
                                <h6
                                    style={{
                                        marginRight: 8,
                                        fontSize: '1em',
                                        display: 'inline',
                                    }}
                                >
                                    时间区间:
                                </h6>
                                {utils.moment.getTimeShow(item.beginTime)}
                                {!_.isNil(item.endTime) && ` - ${  utils.moment.getTimeShow(item.endTime)}`}
                            </Col>
                        )}
                        {!_.isNil(item.id) && !_.isNil(item.beginTime) && (
                            <Fragment>
                                <Col>
                                    <LegacyIcon
                                        type={playId === item.id && !this.props.pause ? 'stop' : 'play-circle'}
                                        style={{
                                            marginTop: '4px',
                                            fontSize: '1.1em',
                                        }}
                                        onClick={() => {
                                            this.setChangeId(item.id, () => {
                                                if (playId === item.id) {
                                                    this.props.onPauseChange(!this.props.pause);
                                                } else {
                                                    this.props.onPauseChange(false);
                                                    this.props.onPlayChange(item.id);
                                                }
                                            });
                                        }}
                                    />
                                </Col>
                                <Col>
                                    {playId === item.id && !this.props.pause && (
                                        <SyncOutlined
                                            style={{
                                                fontSize: '1.1em',
                                            }}
                                            spin
                                        />
                                    )}
                                </Col>
                            </Fragment>
                        )}
                        {!_.isEmpty(roles) && !_.isNil(item.id) && (
                            <Col style={{ marginLeft: 20 }}>
                                <h6
                                    style={{
                                        fontSize: '1em',
                                        marginRight: 8,
                                        display: 'inline',
                                    }}
                                >
                                    角色:
                                </h6>
                                {roles.map((label) => this.renderRoleTag(item, index, label, {}))}
                            </Col>
                        )}
                        {!_.isEmpty(labels) && !_.isNil(item.id) && (
                            <Col style={{ marginLeft: 20 }}>
                                <h6
                                    style={{
                                        fontSize: '1em',
                                        marginRight: 8,
                                        display: 'inline',
                                    }}
                                >
                                    标签:
                                </h6>

                                {labels.map((label) => this.renderTag(item, index, label, {}))}
                            </Col>
                        )}

  
                    </Row>
                </Col>
                {this.props.onItemChange && (
                    <Col style={{ marginTop: '1px' }}>
                        <Fragment>
                            {index !== 0 && (
                                <ButtonSpace
                                    size="small"
                                    onClick={() => {
                                        const { dialogue } = this.props;
                                        let tempDialogue = clone(dialogue);
                                        const lastItem = tempDialogue[index - 1];
                                        lastItem.endTime = item.endTime;

                                        lastItem.beginTime =
                                            lastItem.beginTime < item.beginTime ? lastItem.beginTime : item.beginTime;
                                        lastItem.endTime =
                                            lastItem.endTime >= item.endTime ? lastItem.endTime : item.endTime;

                                        lastItem.text =
                                            (_.isNil(lastItem.text) ? '' : lastItem.text) +
                                            (_.isNil(item.text) ? '' : item.text);

                                        tempDialogue.splice(index, 1);

                                        tempDialogue = tempDialogue.map((items, indexs) => {
                                            if (indexs >= index) return { ...items, id: items.id - 1 };
                                            return { ...items };
                                        });

                                        this.setChangeId(null, () =>
                                            this.props.onDialogueChange(tempDialogue, lastItem.id),
                                        );
                                    }}
                                >
                                    往上合并
                                </ButtonSpace>
                            )}
                            {!isLast && (
                                <ButtonSpace
                                    size="small"
                                    onClick={() => {
                                        const { dialogue } = this.props;
                                        let tempDialogue = clone(dialogue);
                                        // tempDialogue[index + 1].id = index
                                        const nextItem = tempDialogue[index + 1];
                                        if (_.isNil(nextItem)) {
                                            return;
                                        }
                                        nextItem.beginTime =
                                            item.beginTime < nextItem.beginTime ? item.beginTime : nextItem.beginTime;
                                        nextItem.endTime =
                                            item.endTime >= nextItem.endTime ? item.endTime : nextItem.endTime;
                                        nextItem.text =
                                            (_.isNil(item.text) ? '' : item.text) +
                                            (_.isNil(nextItem.text) ? '' : nextItem.text);

                                        tempDialogue.splice(index, 1);
                                        tempDialogue = tempDialogue.map((items, indexs) => {
                                            if (indexs >= index) return { ...items, id: items.id - 1 };
                                            return { ...items };
                                        });
                                        this.setChangeId(null, () => {
                                            this.props.onDialogueChange(tempDialogue, nextItem.id);
                                        });
                                    }}
                                >
                                    往下合并
                                </ButtonSpace>
                            )}
                            {this.props.pause && this.state.changeId === item.id && (
                                <ButtonSpace
                                    size="small"
                                    onClick={() => {
                                        const { dialogue } = this.props;

                                        let tempDialogue = clone(dialogue);
                                        const item = tempDialogue[index];

                                        const selectText = document.getSelection().toString();

                                        // get currentTime to be next item begin time
                                        const beginTime = document.wavesurfer.getCurrentTime() * 1000;

                                        if (item.endTime - beginTime < 250) {
                                            message.warn('拆分间隔太短！');
                                            return;
                                        }

                                        tempDialogue.splice(index + 1, 0, {
                                            ...item,
                                            id: index,
                                            beginTime,
                                            entTime: item.endTime,
                                            text: selectText,
                                        });
                                        tempDialogue = tempDialogue.map((items, indexs) => {
                                            if (indexs >= index + 1) return { ...items, id: items.id + 1 };
                                            return { ...items };
                                        });
                                        tempDialogue[index].text = item.text && item.text.replace(selectText, '');
                                        tempDialogue[index].endTime = beginTime;
                                        this.setChangeId(null, () => {
                                            this.props.onDialogueChange(tempDialogue, index);
                                        });
                                    }}
                                >
                                    拆分
                                </ButtonSpace>
                            )}
                            {(item.endTime - item.beginTime) / 1000 > 10 ? (
                                <span style={{ color: 'red', marginTop: '5px' }}>*音频段超过十秒请拆分</span>
                            ) : (
                                ''
                            )}
                        </Fragment>
                    </Col>
                )}
            </Row>
        );
    }

    /**
     *渲染建议
     * @param item
     * @param index
     * @param showTips
     * @returns {*}
     */
    renderMentions = (item, index, showTips) => {
        const { hotWordList } = this.props;
        return (
            <InputMentions
                showTips={showTips}
                key={item.id}
                item={item}
                index={index}
                style={{
                    fontSize: '1.1em',
                }}
                ref={(ref) => (this.mention = ref)}
                hotWordList={hotWordList}
                onBlur={(item) => {
                    console.log('onBlur')
                    this.props.handleChangeisFocus(false)
                }}
                onFocus={() => {
                    console.log('onFocus')
                    this.setState({ itemIndex: index });
                    if (item.id !== this.props.changeId) {
                        this.setChangeId(item.id, () => {
                            this.props.onPauseChange(false);
                        });
                    }
                    this.props.handleChangeisFocus(true)
                }}
                onChange={(changeItem) => {
                    if (changeItem.text !== item.text) {
                        this.props.onItemChange(changeItem);
                    }
                }}
            />
        );
    };

    render() {
        const { dialogue, reverse, running } = this.props;

        // 显示
        const itemList = dialogue.map((item, index) => {
            switch (item.type) {
                case RECORD_TYPE.sign:
                    return <Timeline.Item key={item.id || index}>{item.text}</Timeline.Item>;
                default:
                    return (
                        <Timeline.Item
                            key={item.id || index}
                            id={`timeline_${  item.id}`}
                            dot={running &&  index === dialogue.length ? <Spin /> : null}
                        >
                            <Card
                                bordered={false}
                                bodyStyle={{
                                    padding: '8px 8px 8px 8px',
                                }}
                            >
                                {this.renderInfo(item, index, index === dialogue.length - 1)}
                                <Row type="flex" justify="space-between" gutter={20}>
                                    <Col span={24}>{this.renderInput(item, index)}</Col>
                                </Row>
                            </Card>
                        </Timeline.Item>
                    );
            }
        });

        return (
            <Timeline id="timeline" reverse={reverse} style={{ ...this.props.style, width: '100%' }}>
                {itemList}
            </Timeline>
        );
    }
}

export default TalkTimeLine;
