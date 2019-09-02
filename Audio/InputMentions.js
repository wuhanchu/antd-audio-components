import React, { useEffect, useState } from "react"

import { Mentions } from "antd"

/**
 * 输入提示
 */
export default React.memo(
    React.forwardRef(
        (
            { item, index, onBlur, onFocus, onChange, hotWordList, style },
            mention
        ) => {
            const [changeText, setChangeText] = useState(item.content) // 修改语句Text
            const [optionPrefix, setOptionPrefix] = useState([]) // 修改语句Text
            // let mention = React.createRef()

            useEffect(
                () =>
                    hotWordList &&
                    hotWordList.forEach(item => {
                        if (!item.hotWord) {
                            return
                        }
                        optionPrefix.push(item.hotWord.substr(0, 1))

                        // todo 优化多字符匹配
                        setOptionPrefix(optionPrefix)
                    }),
                [hotWordList]
            )

            /**
             * 获取热词选项
             * @returns {[]}
             */
            const getHotWordOptions = () => {
                const options = []
                hotWordList &&
                    hotWordList.forEach(item => {
                        item.hotWord &&
                            options.push(
                                <Option
                                    key
                                    Option
                                    item={item.id}
                                    value={item.hotWord.substr(1)}
                                >
                                    {item.hotWord}
                                </Option>
                            )
                    })
                return options
            }

            debugger
            const rows = Math.floor(changeText.length / 50)

            return (
                <Mentions
                    // ref={ref}
                    placement={"填写信息"}
                    ref={mention}
                    size={"small"}
                    defaultValue={changeText}
                    onBlur={event => {
                        onChange({ ...item, content: changeText }, index)
                        onBlur && onBlur(item)
                    }}
                    onFocus={() => {
                        onFocus && onFocus(item)
                    }}
                    rows={rows}
                    autoFocus={true}
                    onChange={changeText => setChangeText(changeText)}
                    split={""}
                    filterOption={(input, option) => {
                        for (let i = 1; i < option.children.length; i++) {
                            return changeText.endsWith(
                                option.children.substr(0, i)
                            )
                        }
                    }}
                    style={style}
                    prefix={optionPrefix}
                    validateSearch={(text, props) => {
                        const result = optionPrefix.some(item =>
                            changeText.endsWith(item)
                        )

                        return result
                    }}
                >
                    {getHotWordOptions()}
                </Mentions>
            )
        }
    )
)
