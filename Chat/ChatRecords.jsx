/**
 * @module 聊天记录组件
 * @param {Array} value 对话数据
 * {
 *       id: 1,
 *       role: "my", // or interlocutors
 *       content: "test",
 *       actions: "test" // or node
 *   }
 * @param {Node} iconMy 本人头像
 * @param {Node} iconInterlocutors 对话人头像
 * @param {string}
 **/

import React, { Fragment, useEffect } from "react"
import { PlayCircleOutlined } from '@ant-design/icons';
import { Comment, Divider, List, Spin, Typography } from "antd";
import styled from "styled-components"
import * as lodash from "lodash"
import style from "../style"

/**
 * the Chat state
 * default suspend
 * @enum
 */
export const STATUS = {
    ongoing: "ongoing",
    suspend: "suspend"
}

const { Text } = Typography

const CommentBase = styled(Comment)`
    & .ant-comment-content-detail {
        border-radius: 5px;
        background: ${style.colors.background.gray};
        padding: 10px;
        width: fit-content;
    }

    & .ant-comment-actions {
        float: right;
        border-radius: 5px;
        background: ${style.colors.background.lightBlue};
        padding: 10px;
    }
    & .ant-comment-actions span {
        padding-right: 0px;
        color: ${style.colors.text.blue};
    }

    & span {
        word-wrap: break-word;
        word-break: break-all;
    }
`

const CommentMy = styled(CommentBase)`
    padding-right: 40%;
    margin-top: 12px;
    & .ant-comment-actions {
        float: left;
    }
`

/**
 * my comment
 */
const CommentClient = styled(CommentBase)`
    padding-left: 40%;
    & .ant-comment-avatar {
        margin-left: 12px;
    }
    & .ant-comment-content-detail {
        margin: auto 0px auto auto;
    }
    & .ant-comment-inner {
        flex-direction: row-reverse;
    }
`

function ChatRecords({ value = [], iconMy, status, iconInterlocutors, goingTip }) {
    const audio = document.createElement("AUDIO")

    const data = value.map(item => ({
        ...item,
        avatar:
            (item.role == "my"? iconMy : iconInterlocutors) ||
            "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
        content:
            typeof item.content == "string"? (
                <span>{item.content}</span>
            ) : (
                item.content
            ),
        actions:
            typeof item.actions == "string"
                ? [<span>{item.actions}</span>]
                : item.actions
    }))

    /**
     * 滚动到对应的位置
     * @param item
     */
    const scrollToItem = function (item) {
        if (!item) {
            return
        }

        let anchorElement = document.getElementById("chat_" + item.id)
        if (anchorElement) {
            anchorElement.scrollIntoView()
        }
    }

    useEffect(() => {
        scrollToItem(lodash.last(value))
    }, [value])

    return (
        <Fragment>
            <List
                itemLayout="horizontal"
                dataSource={data}
                renderItem={item => (
                    <li>
                        <div>
                            {item.role == "my"? (
                                <Fragment>
                                    <CommentMy
                                        id={"chat_" + item.id}
                                        key={item.id}
                                        actions={item.actions}
                                        avatar={item.avatar}
                                        content={
                                            <div>
                                                {item.content}
                                                {item.type && item.c_wav && (
                                                    <a
                                                        style={{
                                                            marginLeft: "5px"
                                                        }}
                                                        onClick={() => {
                                                            console.log(
                                                                item.c_wav.split(
                                                                    "|U:"
                                                                )[0]
                                                            )
                                                            audio.src =
                                                                "/api/v1/recording/dialogue_user?filepath=" +
                                                                item.c_wav.split(
                                                                    "|U:"
                                                                )[0]
                                                            audio.play()
                                                        }}
                                                    >
                                                        <PlayCircleOutlined></PlayCircleOutlined>
                                                    </a>
                                                )}
                                            </div>
                                        }
                                    />
                                    <div>
                                        {item.type && (
                                            <div
                                                style={{
                                                    marginRight: "55px",
                                                    marginBottom: "30px",
                                                    background: "#e6f7ff",
                                                    border: "1px solid #91d5ff",
                                                    height: "31px",
                                                    fontSize: "12px",
                                                    float: "right",
                                                    padding: "5px 10px",
                                                    borderRadius: "5px"
                                                }}
                                            >
                                                {"命中：【" +
                                                item.type.info +
                                                "】"}
                                            </div>
                                        )}
                                    </div>
                                </Fragment>
                            ) : item.isDivider? (
                                <Divider>
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            color: "rgba(0,0,0,0.5)"
                                        }}
                                    >
                                        {" "}
                                        重新试听
                                    </span>
                                </Divider>
                            ) : (
                                <CommentClient
                                    id={"chat_" + item.id}
                                    key={item.id}
                                    actions={item.actions}
                                    avatar={item.avatar}
                                    content={item.content}
                                />
                            )}
                        </div>
                    </li>
                )}
            />
            <Spin spinning={status == STATUS.ongoing} tip={goingTip}>
                <Comment></Comment>
            </Spin>
        </Fragment>
    );
}

export default React.memo(ChatRecords)
