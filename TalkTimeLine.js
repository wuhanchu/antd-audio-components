import React, { Fragment, useEffect, useState } from "react"
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
import Sound from "react-sound"
import { createComponent } from "../../utils/component"
import schemas from "@/schemas/schemas"
import actions from "@/schemas/utils/actions"
import InputMentions from "@/components/Audio/InputMentions"
import CheckableTag from "antd/es/tag/CheckableTag"

const { Text } = Typography
const { Option } = Mentions

//对话类型
const RECORD_TYPE = {
    sign: "sign",
    record: "record"
}

/**
 * 语音时间线
 * @param {*} props
 *  data: 语句数据
 */
export default React.memo(function({
    dialogue, // 对话数据
    hotWordList, // 热词
    labels, // 标签
    playId, //当前播放的id
    running, //开启标志
    pause, // 暂停标志
    reverse, // 是否反转显示数据
    onTextChange, //对话修改
    onUserChange, //对话修改
    onLabelChange, // 标志修改
    onPlayIdChange // playid 修改
}) {
    console.debug("TalkTimeLine init")

    //init
    !dialogue && (dialogue = [])

    // state
    const [inPlayId, setInPlayId] = useState(playId) // 播放信息
    const [changeId, setChangeId] = useState() // 修改语句ID

    //
    let dialogueMap = {}
    dialogue.forEach(item => {
        dialogueMap[item.id] = item
    })

    useEffect(() => {
        console.log("scroolToItem")
        scroolToItem(dialogueMap[inPlayId])
    }, [inPlayId])

    /**
     * 渲染错误标签
     * @param item
     * @param index
     * @returns {*}
     */
    const renderTag = (item, index, label) => {
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
     * 滚动到对应的位置
     * @param item
     */
    const scroolToItem = function(item) {
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
    const renderMentions = (item, index) => {
        return (
            <InputMentions
                item={item}
                index={index}
                hotWordList={hotWordList}
                onChange={onTextChange}
            />
        )
    }

    /**
     * 渲染播放器
     * @param item
     * @param index
     * @returns {*}
     */
    const renderSound = (item, index) => {
        return (
            <Sound
                url={"/api/get_log_wav?logid=" + item.id}
                onFinishedPlaying={() => {
                    let next = false
                    dialogue.some(dialogueItem => {
                        if (next) {
                            setInPlayId(item.id)
                            return true
                        }

                        if (dialogueItem.id === item.id) {
                            next = true
                        }
                    })
                }}
                playStatus={
                    item.id == inPlayId
                        ? Sound.status.PLAYING
                        : Sound.status.STOPPED
                }
            />
        )
    }

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
                    <Timeline.Item
                        key={item.id || index}
                        id={"timeline_" + item.id}
                        dot={
                            running && !pause && index === dialogue.length ? (
                                <Spin />
                            ) : null
                        }
                    >
                        <Card
                            bordered={false}
                            bodyStyle={{
                                padding: "8px 8px 8px 8px"
                            }}
                        >
                            <Row
                                type="flex"
                                align={"middle"}
                                gutter={8}
                                style={{ marginBottom: 12 }}
                            >
                                <Col>
                                    <Avatar icon="user" />
                                </Col>
                                <Col>
                                    {!item.id
                                        ? "未知用户"
                                        : createComponent.bind(null)(
                                              {
                                                  ...schemas.meetingLog
                                                      .username,
                                                  dataIndex: "username",
                                                  required: false
                                              },
                                              item,
                                              inputProps,
                                              actions.add
                                          )}
                                </Col>
                                <Col>{item.modifyTime}</Col>
                                {item.id && (
                                    <Fragment>
                                        <Col>
                                            <Icon
                                                type={
                                                    inPlayId === item.id
                                                        ? "stop"
                                                        : "play-circle"
                                                }
                                                style={{
                                                    fontSize: "16px"
                                                }}
                                                onClick={() => {
                                                    setInPlayId(item.id)
                                                }}
                                            />
                                            {renderSound(item, index)}
                                        </Col>
                                        <Col>
                                            {inPlayId === item.id && (
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
                            <Row
                                type="flex"
                                justify={"space-between"}
                                gutter={20}
                            >
                                <Col span={20}>
                                    {changeId && changeId === item.id ? (
                                        renderMentions(item, index)
                                    ) : (
                                        <div
                                            style={{ marginLeft: 12 }}
                                            onClick={() => {
                                                setChangeId(item.id)
                                            }}
                                        >
                                            <Text
                                                disabled={!item.content.trim()}
                                            >
                                                {item.content.trim() ||
                                                    "空数据"}
                                            </Text>
                                        </div>
                                    )}
                                </Col>
                                {item.id && (
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
})
