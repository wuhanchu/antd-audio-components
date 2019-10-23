/**
 * @module 聊天记录
 * @param {Array} value 对话数据
 * {
 *       id: 1,
 *       role: "my", // or interlocutors
 *       content: "test",
 *       actions: "test" // or node
 *   }
 * @param {Node} iconMy 本人头像
 * @param {Node} iconInterlocutors 对话人头像
 **/

import React, { useEffect } from "react"
import { Comment, List } from "antd"
import moment from "moment"
import styled from "styled-components"
import * as lodash from "lodash"

import style from "../style"

const CommentBase = styled(Comment)`
    width: fit-content;
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
`

const CommentClient = styled(CommentBase)`
    padding-right: 100px;
    & .ant-comment-actions {
        float: left;
    }
`

/**
 * my comment
 */
const CommentMy = styled(CommentBase)`
    float: right;
    padding-left: 100px;
    & .ant-comment-inner {
        flex-direction: row-reverse;
    }
    & .ant-comment-actions {
        float: right;
    }
`

function ChatRecords({ value, iconMy, iconInterlocutors }) {
    const data = value.map(item => ({
        ...item,
        avatar:
            (item.role == "my" ? iconMy : iconInterlocutors) ||
            "https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
        content:
            typeof item.content == "string" ? (
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
    const scrollToItem = function(item) {
        if (!item) {
            return
        }

        let anchorElement = document.getElementById("chat_" + item.id)
        if (anchorElement) {
            anchorElement.scrollIntoView()
        }
    }

    useEffect(() => {
        console.debug("value", value)
        scrollToItem(lodash.last(value))
    }, [value])

    return (
        <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={item => (
                <li>
                    <div style={{ height: item.actions ? "80px" : "60px" }}>
                        {item.role == "my" ? (
                            <CommentMy
                                id={"chat_" + item.id}
                                key={item.id}
                                actions={item.actions}
                                avatar={item.avatar}
                                content={item.content}
                            />
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
    )
}

export default React.memo(ChatRecords)
