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

    handleInputData (data) {
        console.log(data)
        if(data){
            // if(data.length > 40) {
            //     return "*文字字数超过四十"
            // }
            var reg = /[A-Z][A-Z]/g;
            if(data.match(reg)){
                return "*大写字母中间没有空格"
            }
            reg = /\哎/g;
            var regs = /\噢/g
            if(data.search("哎") != -1 ||data.search("噢") != -1){
                return "*有哎或噢存在请检查是否正确"
            }
            if(data.charAt(data.length-1)!= '？' && data.charAt(data.length-1)!= '。'&& data.charAt(data.length-1)!= '；' && data.charAt(data.length-1)!= '！')
                return '*句末符号出错'
            reg = /\【/g;
            regs = /\】/g
            if(data.search("】") != -1 ||data.search("【") != -1){
                return '*【】应为[]'
            }
            // var isCanUse = true
            // for(var i=0;i<data.length - 1;i++){
            //     if(data[i]===data[0]){
            //     }else{
            //         isCanUse= false
            //         break
            //     }
            // }
            // if(isCanUse){
            //     return "*请检查是否为无效语音"
            // }
        }
    }

    render() {
        const { onChange, onBlur, index, onFocus, item, style, mention } = this.props
        const { changeText, optionPrefix } = this.state

        let wrapperWidth = document.body.clientWidth*0.9 - 121.5 + "px"
        let normalHeight = textSize(
            "1.1em",
            "",
            changeText,
            wrapperWidth,
            "normal"
        ).height
        let nowrapHeight = textSize(
            "1.1em",
            "",
            changeText,
            document.body.clientWidth,
            "nowrap"
        ).height
        const rows = normalHeight/nowrapHeight

        return <><Mentions
            // ref={ref}
            placement={"填写信息"}
            ref={mention}
            size={"small"}
            rows={rows}
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
        {this.props.showTips && <span style={{ color:'red', marginTop: '5px', display: 'block'}}>{this.handleInputData(changeText && changeText.trim())}</span>}
        </>
    }
}

export default React.forwardRef((props, ref) => <InputMentions
    mention={ref} {...props}
/>);
