import React, { Fragment, PureComponent } from "react"
import {
    Avatar,
    Card,
    Col,
    Icon,
    Mentions,
    Row,
    Spin,
    Tag,
    Timeline,
    Typography
} from "antd"
import { antdUtils, frSchema } from "@/outter"
import InputMentions from "@/components/Extra/Audio/InputMentions"
import CheckableTag from "antd/es/tag/CheckableTag"

const { createComponent } = antdUtils.utils.component

const { actions, schemaFieldType, utils } = frSchema

const { Text } = Typography
const { Option } = Mentions

//对话类型
export const RECORD_TYPE = {
    sign: "sign",
    record: "record"
}

/**
 *   dialogue, // 对话数据
    hotWordList, // 热词
    labels, // 标签
    playId, //当前播放的id
    running, //开启录音标志
    pause, // 播放暂停标志
    showUserSelect, // 是否开启用户选择
    reverse, // 是否反转显示数据
    onTextChange, //对话修改
    onUserChange, //对话修改
    onLabelChange, // 标志修改
    onPlayChange // playid 修改
 */
class component extends PureComponent {
    mention = React.createRef()
    keyBindMethods = []

    state = {
        changeId: null // 当前修改ID
        // playId: null // 当前播放ID
    }

    dialogueMap = {}

    constructor(props) {
        super(props)
        this.setDialogueMap()
        this.bindKey()
    }

    componentDidUpdate(prevProps, prevState) {
        // play 切换
        if (this.props.playId !== prevProps.playId) {
            this.props.playId &&
                this.scrollToItem(this.dialogueMap[this.props.playId].item)
        }

        if (this.props.dialogue !== prevProps.dialogue) {
            this.setDialogueMap()
        }

        // changeId 正式
        if (this.state.changeId !== prevState.changeId) {
            this.props.onChangeIdChange &&
                this.props.onChangeIdChange(this.state.changeId)
            this.props.onPauseChange(!this.state.changeId)
        }
    }

    /**
     * 绑定按键
     */
    bindKey = () => {
        let { keyBindMethods } = this
        let method = null
        let key = null

        // 退出
        key = "esc"
        method = e => {
            this.setState({ changeId: null })
        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // 下一条
        key = "tab"
        method = e => {
            this.onBlurSkip = true
            const { changeId } = this.state

            let nextItem = null
            if (changeId) {
                const nextIndex =
                    this.dialogueMap[this.state.changeId].index + 1
                nextItem = this.props.dialogue[nextIndex]
            }

            if (!nextItem) {
                nextItem = this.props.dialogue[0]
            }

            if (!nextItem) {
                this.setState({
                    changeId: null
                })
                return
            }

            this.setState({
                changeId: nextItem.id
            })
        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // 上一条
        key = "shift + tab"
        method = e => {
            e.preventDefault()
            this.onBlurSkip = true

            const { changeId } = this.state
            if (!changeId) {
                return
            }

            const nextIndex = this.dialogueMap[this.state.changeId].index - 1
            const nextItem = this.props.dialogue[nextIndex]

            if (!nextItem) {
                this.setState({
                    changeId: null
                })
                return
            }

            this.setState({
                changeId: nextItem.id
            })
        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // 播放 or 暂停
        key = "ctrl + space"
        method = e => {
            e.preventDefault()
            this.props.onPauseChange(!this.props.pause)
        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // 播放 or 暂停
        key = "space"
        method = e => {
            if (this.state.changeId) {
                return
            }

            e.preventDefault()
            this.props.onPauseChange(!this.props.pause)
        }

        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // 提交
        key = "ctrl + enter"
        method = e => {
            e.preventDefault()
            this.props.onPauseChange(!this.props.pause)
        }
        keyboardJS.bind(key, method)
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })
    }

    componentWillUnmount = () => {
        this.keyBindMethods.forEach(({ key, method }) => {
            keyboardJS.unbind(key, method)
        })
    }

    setDialogueMap() {
        this.props.dialogue &&
            this.props.dialogue.forEach((item, index) => {
                this.dialogueMap[item.id] = { item, index }
            })
    }

    /**
     * 渲染错误标签
     * @param item
     * @param index
     * @returns {*}
     */
    renderTag = (item, index, label) => {
        const { onLabelChange } = this.props

        const { title, key, color = "red", checkFunc, ...others } = label
        let checked = item[key]
        if (checkFunc) {
            checked = checkFunc(item)
        }

        let style = {}
        if (checked) {
            style.backgroundColor = color
        }

        return (
            <CheckableTag
                style={style}
                key={key}
                color={"red"}
                checked={checked}
                onChange={mark => {
                    // 数据请求
                    onLabelChange &&
                        onLabelChange(item, {
                            key,
                            mark,
                            ...others
                        })
                }}
            >
                {title}
            </CheckableTag>
        )
    }

    /**
     * 渲染头部信息
     * @param {*} item
     */
    renderInfo(item) {
        const { playId } = this.props

        /**
         * 数据修改模型
         */
        let inputProps = {
            showSearch: true,
            placeholder: "选择用户",
            size: "small",
            style: { width: 120 },
            onChange: value => {
                onUserChange({
                    logid: item.id,
                    username: value
                })
            }
        }

        if (item.username && item.username !== "") {
            inputProps.defaultValue = Number.parseInt(item.username)
        }

        return (
            <Row
                type="flex"
                align={"bottom"}
                gutter={8}
                style={{ marginBottom: 12 }}
            >
                <Fragment>
                    {this.props.showUserSelect && (
                        <Fragment>
                            <Col>
                                <Avatar icon="user" />
                            </Col>
                            <Col>
                                {!item.id
                                    ? "未知用户"
                                    : createComponent.bind(null)(
                                          {
                                              title: "参会人员",
                                              type: schemaFieldType.MultiSelect,
                                              dict: {},
                                              dataIndex: "username",
                                              required: false
                                          },
                                          item,
                                          inputProps,
                                          actions.add
                                      )}
                            </Col>
                        </Fragment>
                    )}
                </Fragment>
                <Col>
                    {utils.moment.getTimeShow(item.startTime)}
                    {item.endTime &&
                        " - " + utils.moment.getTimeShow(item.endTime)}
                </Col>
                {item.id && (
                    <Fragment>
                        <Col>
                            <Icon
                                type={
                                    playId === item.id && !this.props.pause
                                        ? "stop"
                                        : "play-circle"
                                }
                                style={{
                                    marginTop: "8px",
                                    fontSize: "16px"
                                }}
                                onClick={e => {
                                    this.setState({
                                        changeId: item.id
                                    })
                                    playId === item.id &&
                                        this.props.onPauseChange(
                                            !this.props.pause
                                        )
                                }}
                            />
                        </Col>
                        <Col>
                            {playId === item.id && !this.props.pause && (
                                <Icon
                                    style={{
                                        fontSize: "16px"
                                    }}
                                    type="sync"
                                    spin
                                />
                            )}
                        </Col>
                    </Fragment>
                )}
            </Row>
        )
    }

    /**
     * 渲染输入框
     * @param {x} item
     */
    renderInput(item) {
        const { changeId } = this.state

        return changeId && changeId === item.id ? (
            this.renderMentions(item)
        ) : (
            <div
                style={{ marginLeft: 12 }}
                onClick={() => {
                    this.onBlurSkip = true
                    this.setState({ changeId: item.id })
                }}
            >
                <Text disabled={!item.content.trim()}>
                    {item.content.trim() || "空数据"}
                </Text>
            </div>
        )
    }

    /**
     * 滚动到对应的位置
     * @param item
     */
    scrollToItem = function(item) {
        let anchorElement = document.getElementById("timeline_" + item.id)
        if (anchorElement) {
            anchorElement.scrollIntoView()
        }
    }

    /**
     *渲染建议
     * @param item
     * @param index
     * @returns {*}
     */
    renderMentions = (item, index) => {
        const { hotWordList } = this.props
        return (
            <InputMentions
                item={item}
                index={index}
                hotWordList={hotWordList}
                onBlur={() => {
                    console.log("onBlur", item)
                    !this.onBlurSkip &&
                        this.setState({
                            changeId: null
                        })
                    this.onBlurSkip = false
                }}
                onFocus={() => {
                    console.log("onFocus", item)
                    this.setState({
                        changeId: item.id
                    })
                }}
                onChange={this.props.onTextChange}
            />
        )
    }

    render() {
        const { dialogue, reverse, running, labels } = this.props

        // 显示
        const itemList = dialogue.map((item, index) => {
            switch (item.type) {
                case RECORD_TYPE.sign:
                    return (
                        <Timeline.Item key={item.id || index}>
                            {item.content}
                        </Timeline.Item>
                    )
                    break
                default:
                    return (
                        <Timeline.Item
                            key={item.id || index}
                            id={"timeline_" + item.id}
                            dot={
                                running &&
                                !pause &&
                                index === dialogue.length ? (
                                    <Spin />
                                ) : null
                            }
                        >
                            <Card
                                bordered={false}
                                bodyStyle={{
                                    padding: "0px 8px 8px 8px"
                                }}
                            >
                                {this.renderInfo(item)}
                                <Row
                                    type="flex"
                                    justify={"space-between"}
                                    gutter={20}
                                >
                                    <Col span={20}>
                                        {this.renderInput(item)}
                                    </Col>
                                    {labels && item.id && (
                                        <Col span={4}>
                                            {labels.map(label =>
                                                renderTag(item, index, label)
                                            )}
                                        </Col>
                                    )}
                                </Row>
                            </Card>
                        </Timeline.Item>
                    )
            }
        })

        return <Timeline reverse={reverse}>{itemList}</Timeline>
    }
}

export default component
