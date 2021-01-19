import AudioPlayer from './AudioPlayer';
import TalkTimeLine, { RECORD_TYPE } from './TalkTimeLine';
import Iconfont from '../Utils/IconFont';
import { antdUtils, frSchema } from '@/outter';
import { schemaFieldType } from '@/outter/fr-schema/src/schema';
// import service, { markFormRemote } from '@/schemas/user/item/service';
// import { getMarkSchema } from '@/schemas/user/item/schema';
import { numToChinese } from '../Utils/nzh';
import { CaretDownOutlined } from '@ant-design/icons';
import moment from 'moment';
import keyboardJS from 'keyboardjs';
import {
    Alert,
    Button,
    Col,
    Descriptions,
    Divider,
    message,
    Modal,
    Popconfirm,
    Popover,
    Row,
    Spin,
} from 'antd';
import * as lodash from 'lodash';
import clone from 'clone';
import { connect } from 'dva';
import React, { Fragment, PureComponent } from 'react';
import Immutable from 'seamless-immutable';
import styled from 'styled-components';
// import itemService from '@/schemas/project/item/service';
import ButtonSpace from '@/components/Extra/Button/ButtonSpace';
import { createComponent } from '@/outter/fr-schema-antd-utils/src/utils/component';

const { actions } = frSchema;
const { InfoModal } = antdUtils.components;
/*
 * 可执行操作
 */
export const MARK_ACTIONS = {
    mark: 'mark', // 标注
    inspection: 'inspection', // 检查
    view: 'view', // 查看
};

/**
 * action 处理动作
 * record 需要处理的数据
 */
@connect(({ global, user }) => {
    return {
        dict: global.dict,
        projectList: global.data.project,
        user: user.currentUser,
    };
})
export default class MarkItem extends PureComponent {
    keyBindMethods = []; // 绑定方法
    type = null; // 查询的数据类型
    schema= {}
    
    state = {
        data: null, // item data
        audioUrl: null, // 音频 url
        chooseId: null, // 选中的语句ID
        playId: null, // 播放的语句ID
        pause: true, // 是否处于暂停中
        dialogue: [], // 对话语句
        filter: {}, // 但前过滤条件
        isFocus: false,
        project: {
            role: [
                {
                    "value" : "customer_servicer",
                    "color" : "darkviolet",
                    "remark" : "坐席"
                  },
                  {
                    "value" : "customer",
                    "color" : "aquamarine",
                    "remark" : "客户"
                  }
            ],
            label: [
                {
                  "value" : "man",
                  "color" : "blue",
                  "remark" : "男"
                },
                {
                  "value" : "woman",
                  "color" : "pink",
                  "remark" : "女"
                },
                {
                  "value" : "accent",
                  "color" : "green",
                  "remark" : "口音"
                },
                {
                  "value" : "dialect",
                  "color" : "black",
                  "remark" : "方言"
                },
                {
                  "value" : "noise",
                  "color" : "red",
                  "remark" : "噪音"
                },
                {
                  "value" : "loud",
                  "color" : "DarkSlateGray",
                  "remark" : "音量太大"
                },
              
                  {
                  "value" : "inaudible",
                  "color" : "PaleTurquoise",
                  "remark" : "音量太小"
                },{
                  "value" : "angry",
                  "color" : "OrangeRed",
                  "remark" : "愤怒"
                },{
                  "value" : "multi_user",
                  "color" : "HotPink",
                  "remark" : "多人"
                }
              ]
        },
        txtType: null, // 显示的文本类型
    };
    dialogueHist = [];

    constructor(props) {
        super(props);

        // 设置过滤条件
        switch (this.props.action) {
            case MARK_ACTIONS.mark:
                this.type = 'mark'; // 查询类型
                break;
            case MARK_ACTIONS.inspection:
                this.type = 'inspection'; // 查询类型
                break;
        }
        this.state.filter = {
            ...(this.props.queryArgs || {}),
            type: this.type,
        };

        // 绑定按键
        this.bindKey();
    }

    componentDidMount() {
        this.refreshData();
    }

    componentDidUpdate(prevProps, prevState) {
        // 如果修改的词条变化，修改播放的词条
        if (this.state.changeId !== prevState.changeId) {
            this.setState({ playId: this.state.changeId });
        }
    }

    /**
     * 刷新当前数据
     */
    refreshData = async () => {
        const { filter } = this.state;
        const { record, notShow } = this.props;
        let data = record
        data.content = record.content && record.content.map((item, index)=>{
            return {...item, id: item.id|| index }
        }),
        this.setState(
            {
                data: data,
                // project,
                loading: false,
            },
            () => {
                this.setTxtType();
            },
        );
    };

    /**
     * 绑定按键
     */
    bindKey() {
        let method = null;
        let key;

        // 提交
        key = 'ctrl + enter';
        method = (e) => {
            e.preventDefault();
            this.showConfirm();
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({
            key,
            method,
        });

        key = 'ctrl + z';
        method = (e) => {
            e.preventDefault();
            this.handleUndo();
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({
            key,
            method,
        });

        // play or suspend
        key = 'shift + ctrl + z';
        method = (e) => {
            e.preventDefault();
            this.handleRedo();
        };
        keyboardJS.bind(key, method);
        this.keyBindMethods.push({
            key,
            method,
        });
    }

    componentWillUnmount = () => {
        this.keyBindMethods.forEach(({ key, method }) => {
            keyboardJS.unbind(key, method);
        });
    };

    /**
     *设置结构化对话
     *
     * @memberof MarkItem
     */
    setDialogue = async () => {
        // 设置对话结构化数据
        // let audioUrl = this.props.record.file_path;
        let audioUrl;

        // const audioUrl = service.itemAudioUrl(this.state.data);
        if (this.state.data.file_path) {
            this.setState({ audioUrl: this.props.service.getFileUrl(this.state.data) });
        }
        const dialogue = this.getDialogue();
        this.setState({ dialogue });

        // 设置对话索引
        this.dialogueIndexMap = {};
        dialogue.forEach((item, index) => {
            this.dialogueIndexMap[item.id] = index;
        });
    };

    /**
     * 初始化要处理的对象
     * @param type  处理类型
     * @param data  处理数据
     */
    initHandleObj(type, data) {
        switch (type || this.props.action) {
            case MARK_ACTIONS.mark:
                this.type = 1; // 查询类型
                this.initTextObj = data && data['text'] ? 'text' : 'asr_txt';
                this.handleTextObj = 'text';
                break;
            case MARK_ACTIONS.inspection:
                this.type = 2; // 查询类型
                this.initTextObj = data && data['inspection_txt'] ? 'inspection_txt' : 'text';
                this.handleTextObj = 'inspection_txt';
                break;
            default:
                this.initTextObj = 'asr_txt';
                this.handleTextObj = null;
                break;
        }

        // 显示情况下
        if (this.props.action === MARK_ACTIONS.view) {
            this.initTextObj = this.handleTextObj || this.initTextObj;
        }
    }

    /**
     * 转换数据为对话信息
     */
    getDialogue() {
        let dialogue = localStorage.getItem(this.getStorageKey());
        if (dialogue) {
            dialogue = JSON.parse(dialogue);
            dialogue = dialogue.map((item) => {
                let text = item.text;
                if (text) {
                    text = text.replace(/、/g, '，');
                    text = text.replace(/\n/g, '');
                    let str = text
                        .replace(/\n/g, ' ')
                        .replace(/。/g, ' ')
                        .replace(/，/g, ' ')
                        .replace(/！/g, '')
                        .replace(/？/g, '')
                        .replace(/ /g, '');

                    console.log(str);
                    if (str === '') {
                        text = null;
                        console.log('文字无效');
                    }
                }

                return {
                    ...item,

                    text: text,
                };
            });
        } else {
            const { data, txtType } = this.state;
            const logList = data.content;

            if (!logList || logList.length < 1) {
                dialogue = [];
            } else {
                dialogue = logList.map((item) => {
                    let endTime;

                    if (this.state.data.file_info && this.state.data.file_info.original_length) {
                        endTime =
                            item.end_time < this.state.data.file_info.original_length
                                ? item.end_time
                                ? item.end_time - 1
                                : 1
                                : this.state.data.file_info.original_length - 1;
                    } else {
                        endTime = item.end_time ? item.end_time : 100;
                    }
                    return {
                        ...item,
                        type: RECORD_TYPE.record,
                        beginTime: item.begin_time > 0 ? item.begin_time : 0,
                        endTime: endTime,
                        text: item.text,
                    };
                });
            }
        }

        return Immutable(dialogue);
    }

    /**
     * 转换对话为文本
     */
    getSubmitObj(dialogue) {
        let lableSex = {};
        for (const item in dialogue) {
            if (
                dialogue[item].text &&
                dialogue[item].labels &&
                (dialogue[item].labels.man || dialogue[item].labels.woman)
            ) {
                console.log('不为空');
                if (dialogue[item].labels.man) {
                    lableSex.man = dialogue[item].labels.man;
                }
                if (dialogue[item].labels.woman) {
                    lableSex.woman = dialogue[item].labels.woman;
                }
                console.log(lableSex);
                break;
            }
        }
        return dialogue.map((item) => {
            let label = clone(item.labels);

            if (
                item.text &&
                item.labels &&
                !item.labels.man &&
                !item.labels.woman &&
                (lableSex.man || lableSex.woman)
            ) {
                if (lableSex.man) {
                    label.man = lableSex.man;
                } else {
                    label.woman = lableSex.woman;
                }
            } else {
                if (item.text && !item.labels && (lableSex.man || lableSex.woman)) {
                    if (!item.labels) {
                        label = {};
                    }
                    if (lableSex.man) {
                        label.man = lableSex.man;
                    } else {
                        label.woman = lableSex.woman;
                    }
                }
            }

            console.log({
                begin_time: item.beginTime,
                end_time: item.endTime,
                text: item.text,
                labels: label,
                role: item.role,
            });
            let text = item.text;

            if (text) {
                text = text.replace(/、/g, '，');
                text = text.replace(/\n/g, '');

                let str = text
                    .replace(/\n/g, ' ')
                    .replace(/。/g, ' ')
                    .replace(/，/g, ' ')
                    .replace(/！/g, '')
                    .replace(/？/g, '')
                    .replace(/ /g, '');
                if (str === '') {
                    text = null;
                    console.log('文字无效');
                }
            }

            return {
                begin_time: item.beginTime,
                end_time: item.endTime,
                text: text,
                labels: label,
                role: item.role,
            };
        });
    }

    /**
     * 提交
     */
    handleSubmit = async () => {
        this.dialogueHist = [];
        this.setState(
            { changeId: null, hisLength: undefined, histIndex: undefined, showConfirm: false },
            async () => {
                //  提交
                this.setDialogueChinese(async () => {
                    const { data, dialogue } = this.state;
                    const handleText = this.getSubmitObj(dialogue);

                    //  提交数据
                    let submitParam = {
                        id: data.id,
                        label: data.label,
                        status: this.type === 1 ? 'marked' : 'inspected',
                    };
                    submitParam['content'] = handleText;
                    await service.submit(submitParam);
                    this.setState({
                        dialogue: [],
                    });

                    if (this.props.type !== 'edit') {
                        this.props.onSubmit(); // 下一条
                    } else {
                        this.props.onCancel(); // 下一条
                    }
                    await this.refreshData();
                });
            },
        );
    };

    handleChangeisFocus(visable) {
        console.log(visable);
        if (visable) {
            keyboardJS.unbind('ctrl + z');
        } else {
            let key = 'ctrl + z';
            let method = (e) => {
                e.preventDefault();
                this.handleUndo();
            };
            keyboardJS.bind(key, method);
            this.keyBindMethods.push({
                key,
                method,
            });
        }
        this.setState({ isFocus: visable });
    }

    /**
     * 提交
     */
    handleJump = async () => {
        this.dialogueHist = [];
        this.setState({ changeId: null, hisLength: undefined, histIndex: undefined }, async () => {
            //  提交
            this.setDialogueChinese(async () => {
                const { data, dialogue } = this.state;
                const handleText = this.getSubmitObj(dialogue);

                //  提交数据
                let submitParam = {
                    id: data.id,
                    status: 'skip',
                };
                const res = await service.submit(submitParam);
                this.setState({
                    dialogue: [],
                });
                if (this.props.type !== 'edit') {
                    this.props.onSubmit(); // 下一条
                } else {
                    this.props.onCancel(); // 下一条
                }
                await this.refreshData();
            });
        });
    };

    /**
     * 设置对话数据中文转换
     */
    setDialogueChinese(callback) {
        const dialogue = this.state.dialogue.map((item) => {
            let text = item.text && numToChinese(item.text);
            return { ...item, text };
        });
        this.setState({ dialogue }, callback);
    }

    /**
     * 信息修改
     * @param item
     */
    handleItemChange = (item) => {
        const index = this.dialogueIndexMap[item.id];

        if (
            this.state.dialogue.some((checkItem, checkIndex) => {
                let max = [item.beginTime, checkItem.beginTime];
                let min = [item.endTime, checkItem.endTime];
                if (checkIndex !== index && Math.max.apply(null, max) < Math.min.apply(null, min)) {
                    return true;
                }
            })
        ) {
            let dialogue = this.state.dialogue.setIn([index], clone(this.state.dialogue[index]));

            this.setState({
                dialogue,
            });
            return;
        }

        let dialogue = this.state.dialogue.setIn([index], item);

        this.handlePushHist(dialogue);
        this.setState({
            dialogue,
        });
    };

    handleDialogueChange = (dialogue, changeId) => {
        this.setState({
            dialogue: [],
        });
        console.log(dialogue);
        this.handlePushHist(dialogue);
        this.setState({ dialogue: Immutable(dialogue), changeId: changeId || null });
    };

    /**
     * change dialogue operation need add to his
     *
     * @memberof dialogue change dialogue
     */
    handlePushHist = (dialogue) => {
        if (lodash.isEmpty(this.dialogueHist)) {
            this.dialogueHist.push(this.state.dialogue);
        }

        if (!lodash.isNil(this.state.histIndex)) {
            this.dialogueHist = lodash.dropRight(
                this.dialogueHist,
                this.dialogueHist.length - this.state.histIndex - 1,
            );
        }

        this.dialogueHist.push(dialogue);
        localStorage.setItem(this.getStorageKey(), JSON.stringify(dialogue));

        this.setState({
            hisLength: this.dialogueHist.length,
            histIndex: null,
        });

        // 设置对话索引
        this.dialogueIndexMap = {};
        dialogue.forEach((item, index) => {
            this.dialogueIndexMap[item.id] = index;
        });
    };

    handleUndo = () => {
        const histIndex =
            this.state.histIndex >= 1 ? this.state.histIndex - 1 : this.state.hisLength - 2;
        if (histIndex < -1) {
            return;
        }

        const data = this.dialogueHist[histIndex];
        data &&
        this.setState({
            dialogue: Immutable(data),
            histIndex: histIndex,
        });
    };

    handleRedo = () => {
        const histIndex = this.state.histIndex + 1;

        const data = this.dialogueHist[histIndex];
        data &&
        this.setState({
            dialogue: Immutable(data),
            histIndex: histIndex,
        });
    };

    /**
     * 获取localstorage存储key
     */
    getStorageKey() {
        return 'dialogue_' + this.props.action + '_' + this.state.data.id;
    }

    /**
     * 渲染标签
     * @returns {*}
     */
    renderLabel = () => {
        if (this.props.action === MARK_ACTIONS.view) {
            return null;
        }
        if (!this.schema || !this.schema.label.dict) {
            return null;
        }
        let props = {};
        if (this.state.data) {
            props.label = null;
        }
        let value = [];
        if (this.state.data.label) {
            value = this.state.data.label;
        }

        return createComponent.bind(null)({
            ...this.schema.label,
            props: {
                disabled: this.props.action === MARK_ACTIONS.view,
                size: 'middle',
                value: value,
                placeholder: '选择相关标签',
                mode: 'tags',
                onChange: (label) => this.setState({ data: { ...this.state.data, label } }),
                ...props,
            },
        });
    };

    /**
     * 渲染对话交流
     * @returns {*}
     */
    renderTimeLine() {
        const { dialogue, pause, data, playId, changeId, project } = this.state;
        if (!data) {
            return null;
        }
        let role = null;
        let labels = null;

        try {
            project.role && (role = project.role);
            project.label && (labels = project.label);
            console.log("九炼",role, labels)

            this.schema.label = {
                title: '标签',
                type: schemaFieldType.Select,
                dict: labels,
                props: {
                    mode: 'multiple',
                },
                // required: true,
            };
        } catch (e) {
            console.error('renderTimeLine JSON.parse error:' + e.message);
        }
        console.log('热词');
        return (
            <div
                style={{
                    maxHeight: document.documentElement.clientHeight - 400,
                    overflowY: 'auto',
                }}
            >
                <TalkTimeLine
                    dialogue={dialogue}
                    style={{
                        height: document.documentElement.clientHeight - 400,
                    }}
                    pause={pause}
                    action={this.props.action}
                    showUserSelect={true}
                    playId={playId}
                    changeId={changeId}
                    showTips={this.props.action !== MARK_ACTIONS.view}
                    onChangeIdChange={(changeId) =>
                        this.props.action !== MARK_ACTIONS.view && this.setState({ changeId })
                    }
                    onPauseChange={(pause) => {
                        this.setState({ pause });
                    }}
                    hotWordList={
                        this.state.project && this.state.project.hot_word ? this.state.project.hot_word.split('|') : []
                    }
                    onPlayChange={this.handlePlayChange}
                    onDialogueChange={
                        this.props.action !== MARK_ACTIONS.view && this.handleDialogueChange
                    }
                    onItemChange={this.props.action !== MARK_ACTIONS.view && this.handleItemChange}
                    roles={role}
                    labels={labels}
                    handleChangeisFocus={this.handleChangeisFocus.bind(this)}
                />
            </div>
        );
    }

    /**
     * 处理播放ID修改
     * @param playId
     */
    handlePlayChange = (playId) => {
        if (!lodash.isNil(this.state.changeId) && !lodash.isNil(playId)) {
            this.setState({
                playId,
                changeId: playId,
            });
        } else {
            this.setState({ playId });
        }
    };

    /**
     * render audio player
     */
    renderAudioPlayer() {
        let { data, audioUrl, dialogue, pause, playId, changeId } = this.state;
        const options = frSchema.utils.getXhrOptions();

        let dialogues = clone(dialogue);
        console.log('this.state.dialogue ', dialogue);

        return (
            audioUrl &&
            dialogues && (
                <AudioPlayer
                    data={data}
                    url={audioUrl}
                    // xhr={{ requestHeaders: options.headers }}
                    dialogue={dialogues}
                    pixelRatio={1}
                    pause={pause}
                    changeId={changeId}
                    playId={playId}
                    action={this.props.action}
                    onRegionUpdate={(id, beginTime, endTime) => {
                        this.handleItemChange({
                            id,
                            ...dialogues[id],
                            beginTime,
                            endTime,
                        });
                    }}
                    onPauseChange={(pause) => {
                        this.setState({ pause });
                    }}
                    onChangeIdChange={(changeId) =>
                        this.props.action !== MARK_ACTIONS.view && this.setState({ changeId })
                    }
                    onPlayChange={this.handlePlayChange}
                    operationExtend={
                        this.state.hisLength >= 1 && (
                            <Fragment>
                                {!lodash.isNil(this.state.histIndex) &&
                                this.state.histIndex < this.state.hisLength - 1 && (
                                    <ButtonSpace onClick={this.handleRedo}>反撤销</ButtonSpace>
                                )}
                                {(lodash.isNil(this.state.histIndex) ||
                                    this.state.histIndex > 0) && (
                                    <Button
                                        onClick={() => {
                                            console.debug('点击撤销');
                                            this.handleUndo();
                                        }}
                                    >
                                        撤销
                                    </Button>
                                )}
                            </Fragment>
                        )
                    }
                />
            )
        );
    }

    /**
     * 显示提交确认框
     */
    showConfirm = () => {
        if (!this.state.showConfirm) {
            Modal.confirm({
                title:
                    '是否提交当前数据（正文中包含的特殊字符会自动按标准转换），并进入下一条数据？',
                okText: '确认提交',
                onCancel: () => {
                    this.setState({
                        showConfirm: false,
                    });
                },
                cancelText: '取消',
                onOk: this.handleSubmit,
            });
        }

        this.setState({
            showConfirm: true,
        });
    };

    showJumpConfirm = () => {
        Modal.confirm({
            title: '是否跳过当前数据，并进入下一条数据？',
            okText: '确认跳过',
            cancelText: '取消',
            onOk: this.handleJump,
        });
    };

    /**
     * render the filter bar
     */
    renderFilter() {
        const { project_id } = this.schema;
        return (
            <Row>
                <Col>
                    {antdUtils.utils.component.createComponent(
                        project_id,
                        {},
                        {
                            placeholder: '不限制项目',
                            onChange: (project_id) => {
                                this.setState(
                                    {
                                        filter: { project_id },
                                    },
                                    this.refreshData,
                                );
                            },
                        },
                    )}
                </Col>
            </Row>
        );
    }

    /**
     * 初始化当前状态
     */
    async setTxtType() {
        const { record } = this.props;
        const { data } = this.state;

        this.txtTypeDict = {};
        let txtType = null;

        if (record && this.props.action === MARK_ACTIONS.view) {
            // let List = await itemService.getLog(this.state.data);
            // this.setState({ dataList: List });
            // List.map((item, index) => {
            //     console.log(item);
            //
            //     if (
            //         item.status === 'marked' ||
            //         item.status === 'inspected' ||
            //         item.operation === 'identify'
            //     ) {
            //         this.txtTypeDict[item.create_time] = {
            //             value: index,
            //             remark:
            //                 item.operation == 'mark'
            //                     ? '标注' + moment(item.create_time).format('YYYY-MM-DD HH:mm:ss')
            //                     : item.operation === 'inspection'
            //                     ? '质检' + moment(item.create_time).format('YYYY-MM-DD HH:mm:ss')
            //                     : '机转' + moment(item.create_time).format('YYYY-MM-DD HH:mm:ss'),
            //         };
            //         txtType = index;
            //     }
            // });
        }

        this.setState({ txtType }, () => {
            // 设置数据类型
            this.initHandleObj(txtType, data);
            this.setDialogue();
        });
    }

    /**
     * 状态栏：纠正率等
     */
    renderInfoBar() {
        const { action } = this.props;
        const { data } = this.state;
        const txtType = {
            title: '数据',
            type: schemaFieldType.Select,
            dict: this.txtTypeDict,
            props: {
                placeholder: '选择数据',
                defaultValue: this.state.txtType ? this.state.txtType : null,
                onChange: (txtType) => {
                    console.log(txtType);
                    this.initHandleObj(txtType);
                    this.setState(
                        {
                            data: markFormRemote(this.state.dataList[txtType]),
                            txtType,
                        },
                        this.setDialogue,
                    );
                },
                value: this.state.txtType,
            },
        };

        const Container = styled(Row)`
            margin-bottom: 8px;
        `;
        return (
            action === MARK_ACTIONS.view && (
                <Container type="flex" justify="start" align="bottom" gutter="16">
                    <Col>{antdUtils.utils.component.createComponent(txtType)}</Col>
                    {data && data.asr_score && (
                        <Col>
                            <span>模型准确率: {Math.floor(data.asr_score / 100)}%</span>
                        </Col>
                    )}
                </Container>
            )
        );
    }

    /**
     * 渲染异常提交
     */
    renderErrorModal() {
        const { id, file_path, remark, label } = this.schema;
        const { data, dialogue } = this.state;
        const handleText = this.getSubmitObj(dialogue);
        return (
            this.state.showErrorModal && (
                <InfoModal
                    title={'如果当前数据异常，请填写备注，跳过当前数据！'}
                    action={actions.edit}
                    handleUpdate={async (values) => {
                        await itemService.patch({
                            id: data.id,
                            label: values.label,
                            text: handleText,
                            status:
                                this.state.filter.type === 'mark' ? 'mark_error' : 'inspect_error',
                            remark: values.remark,
                        });
                        this.props.onSubmit(); // 下一条
                        this.refreshData();
                        this.setState({ showErrorModal: false });
                    }}
                    values={data}
                    visible={true}
                    onCancel={() => this.setState({ showErrorModal: false })}
                    schema={{
                        id,
                        file_path: { ...file_path, readOnly: true },
                        label,
                        remark,
                    }}
                />
            )
        );
    }

    render() {
        const { action } = this.props;
        const { dialogue, pause, project, data } = this.state;
        return (
            <Modal
                style={{
                    top: 32,
                    bottom: 32,
                }}
                title={
                    <Row justify={'space-between'} type="flex">
                        <Col>
                            {this.state.loading
                                ? '文件信息'
                                :
                                (data && data.file_path ?  data.file_path : '') +
                                (data && data.last_name ? ' - ' + data.last_name : '')}
                        </Col>

                        <Col>
                            {project && project.hot_word && (
                                <span style={{ marginRight: '10px' }}>
                                    {action !== MARK_ACTIONS.view && (
                                        <Popover
                                            placement="leftBottom"
                                            content={
                                                <Fragment>
                                                    <div style={{ width: '400px' }}>
                                                        {/* {
                                                            project &&
                                                            project.hot_word && project.hot_word.split('|').map((item, index)=>{
                                                                return <p>{item}</p>
                                                            })
                                                        } */}
                                                        <p
                                                            style={{
                                                                width: '400px',
                                                                wordWrap: 'break-word',
                                                                wordBreak: 'break-all',
                                                            }}
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    project &&
                                                                    project.hot_word &&
                                                                    project.hot_word.replace(
                                                                        /\|/g,
                                                                        '，',
                                                                    ),
                                                            }}
                                                            />
                                                    </div>
                                                </Fragment>
                                            }
                                        >
                                            <CaretDownOutlined />
                                        </Popover>
                                    )}
                                </span>
                            )}
                            {action !== MARK_ACTIONS.view && (
                                <Popover
                                    placement="leftBottom"
                                    content={
                                        <Fragment>
                                            <Descriptions bordered column={1} size="small">
                                                <Descriptions.Item label="全局播放/暂停">
                                                    Shift + Space
                                                </Descriptions.Item>
                                                <Descriptions.Item label="提交">
                                                    Ctrl + Enter
                                                </Descriptions.Item>
                                                <Descriptions.Item label="前进">
                                                    {'->'}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="后退">
                                                    {' <-'}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="撤销">
                                                    {' Ctrl + Z'}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="反撤销">
                                                    {' Shift + Ctrl + Z'}
                                                </Descriptions.Item>
                                            </Descriptions>
                                            <br />
                                            <Alert
                                                message="下方的快捷键只在编辑时生效！"
                                                type="info"
                                                style={{ marginBottom: 5 }}
                                            />

                                            <Descriptions bordered column={1} size="small">
                                                <Descriptions.Item label="播放/暂停">
                                                    SHIFT + Alt + P
                                                </Descriptions.Item>
                                                <Descriptions.Item label="向下合并">
                                                    SHIFT + Alt + K
                                                </Descriptions.Item>
                                                <Descriptions.Item label="向上合并">
                                                    SHIFT + Alt + L
                                                </Descriptions.Item>
                                                <Descriptions.Item label="前进">
                                                    SHIFT + Alt + {'->'}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="后退">
                                                    {'SHIFT + Alt + <-'}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="加速">
                                                    {'SHIFT + Alt + ⬆'}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="减速">
                                                    {'SHIFT + Alt + ⬇'}
                                                </Descriptions.Item>
                                                <Descriptions.Item label="播放下一段">
                                                    Tab
                                                </Descriptions.Item>
                                                <Descriptions.Item label="播放上一段">
                                                    Shift + Tab
                                                </Descriptions.Item>
                                                <Descriptions.Item label="打男性标签">
                                                    Ctrl + [
                                                </Descriptions.Item>
                                                <Descriptions.Item label="打女性标签">
                                                    Ctrl + ]
                                                </Descriptions.Item>

                                                <Descriptions.Item label="打噪音标签">
                                                    Ctrl + 0
                                                </Descriptions.Item>
                                            </Descriptions>
                                        </Fragment>
                                    }
                                >
                                    <Iconfont
                                        type="iconkuaijiejian"
                                        style={{ fontSize: '1.2em' }}
                                    />
                                </Popover>
                            )}
                        </Col>
                    </Row>
                }
                visible={true}
                width="90%"
                mask={true}
                closable={false}
                maskClosable={action === MARK_ACTIONS.view}
                onCancel={this.props.onCancel}
                footer={
                    action !== MARK_ACTIONS.view && (
                        <Fragment>
                            <Popconfirm
                                title="确认退出当前操作？"
                                okText="是"
                                cancelText="否"
                                onConfirm={() => {
                                    this.props.onCancel();
                                }}
                            >
                                <Button>回到列表</Button>
                            </Popconfirm>
                            <Button
                                type="danger"
                                onClick={() => {
                                    this.setState({ showErrorModal: true });
                                }}
                            >
                                上报异常
                            </Button>

                            <Button onClick={this.showConfirm}>提交</Button>
                        </Fragment>
                    )
                }
            >
                <Spin tip="加载中..." spinning={!this.schema || this.state.loading}>
                    {this.schema && !this.state.loading && (
                        <Fragment>
                            {/*{this.renderInfoBar()}*/}
                            <Row>
                                <Col span={24} style={{ height: '130px' }}>
                                    {this.renderAudioPlayer()}
                                </Col>
                            </Row>
                            <Divider style={{ marginTop: 8, marginBottom: 8 }} />
                            {this.schema && this.schema.label && (
                                <Fragment>
                                    <Row>
                                        <Col span={8}>{this.renderLabel()}</Col>
                                    </Row>
                                    <Divider style={{ marginTop: 8, marginBottom: 8 }} />
                                </Fragment>
                            )}
                            <Row>
                                <Col span={24}>{this.renderTimeLine()}</Col>
                            </Row>
                            {this.renderErrorModal()}
                        </Fragment>
                    )}
                </Spin>
            </Modal>
        );
    }
}
