import React, { PureComponent } from "react"

import { Mentions } from "antd"

/**
 * 输入提示
 */

function textSize(fontSize, fontFamily, text, wrapperWidth, whiteSpace) {
    const span = document.createElement("div")
    let result = {}
    result.width = span.offsetWidth
    result.height = span.offsetHeight
    span.style.visibility = "hidden"
    span.style.fontSize = fontSize
    span.style.fontFamily = fontFamily
    span.style.width = wrapperWidth
    span.style.display = "inline-block"
    span.style.whiteSpace = whiteSpace
    document.body.appendChild(span)
    if (typeof span.textContent != "undefined") {
        span.textContent = text
    } else {
        span.innerText = text
    }
    result.width =
        parseFloat(window.getComputedStyle(span).width) - result.width
    result.height =
        parseFloat(window.getComputedStyle(span).height) - result.height

    return result
}

class InputMentions extends PureComponent {
    state = {
        changeText: null,
        optionPrefix: []
    }

    constructor(props) {
        super(props)

        const {
            item,
            hotWordList
        } = props

        let optionPrefix = []
        hotWordList &&
        hotWordList.forEach(item => {
            if (!item.hotWord) {
                return
            }
            optionPrefix.push(item.hotWord.substr(0, 1))
        })

        this.state.optionPrefix = optionPrefix
        this.state.changeText = item.content
    }

    /**
     * 获取热词选项
     * @returns {[]}
     */
    getHotWordOptions = () => {
        const options = []
        this.props.hotWordList &&
        this.props.hotWordList.forEach(item => {
            item.hotWord &&
            options.push(
                <Mentions.Option
                    key
                    Option
                    item={item.id}
                    value={item.hotWord.substr(1)}
                >
                    {item.hotWord}
                </Mentions.Option>
            )
        })
        return options
    }

    render() {
        const { onChange, onBlur, index, onFocus, item, style, mention } = this.props
        const { changeText, optionPrefix } = this.state

        let wrapperWidth = document.body.clientWidth*0.9 - 121.5 + "px"
        let normalHeight = textSize(
            "1.5em",
            "",
            changeText,
            wrapperWidth,
            "normal"
        ).height
        let nowrapHeight = textSize(
            "1.5em",
            "",
            changeText,
            document.body.clientWidth,
            "nowrap"
        ).height
        const rows = normalHeight/nowrapHeight

        return <Mentions
            // ref={ref}
            placement={"填写信息"}
            ref={mention}
            size={"small"}
            defaultValue={item.content}
            onBlur={event => {
                if (changeText != item.conent) {
                    onChange({ ...item, content: changeText }, index)
                }
                onBlur && onBlur(item)
            }}
            onFocus={() => {
                onFocus && onFocus(item)
            }}
            rows={rows}
            autoFocus={true}
            onChange={changeText => this.setState({ changeText })}
            split={""}
            filterOption={(input, option) => {
                for (let i = 1; i < option.children.length; i++) {
                    return changeText.endsWith(option.children.substr(0, i))
                }
            }}
            style={style}
            prefix={optionPrefix}
            validateSearch={(text, props) => optionPrefix.some(item =>
                changeText.endsWith(item)
            )}
        >
            {this.getHotWordOptions()}
        </Mentions>
    }
}

export default React.forwardRef((props, ref) => <InputMentions
    mention={ref} {...props}
/>);
