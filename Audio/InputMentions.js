import React, { PureComponent } from 'react';

import { Mentions } from 'antd';

/**
 * 输入提示
 */

function textSize(fontSize, fontFamily, text, wrapperWidth, whiteSpace) {
    const span = document.createElement('div');
    const result = {};
    result.width = span.offsetWidth;
    result.height = span.offsetHeight;
    span.style.visibility = 'hidden';
    span.style.fontSize = fontSize;
    span.style.fontFamily = fontFamily;
    span.style.width = wrapperWidth;
    span.style.display = 'inline-block';
    span.style.whiteSpace = whiteSpace;
    document.body.appendChild(span);
    if (typeof span.textContent !== 'undefined') {
        span.textContent = text;
    } else {
        span.innerText = text;
    }
    result.width = parseFloat(window.getComputedStyle(span).width) - result.width;
    result.height = parseFloat(window.getComputedStyle(span).height) - result.height;

    return result;
}

class InputMentions extends PureComponent {
    state = {
        changeText: null,
        optionPrefix: [],
    };

    constructor(props) {
        super(props);

        const { item, hotWordList } = props;

        const optionPrefix = [];
        if(hotWordList){
            hotWordList.forEach((items) => {
                if (!items.hotWord) {
                    return;
                }
                optionPrefix.push(items.hotWord.substr(0, 1));
            });
        }
        this.state.optionPrefix = optionPrefix;
        this.state.changeText = item.text;
    }

    /**
     * 获取热词选项
     * @returns {[]}
     */
    getHotWordOptions = () => {
        const options = [];
        if(this.props.hotWordList){
            this.props.hotWordList.forEach((items) => {
                if(items.hotWord){
                    options.push(
                        <Mentions.Option key Option item={items.id} value={items.hotWord.substr(1)}>
                            {items.hotWord}
                        </Mentions.Option>,
                    );
                }
            });
        }
        return options;
    };

    handleInputData(data) {
        if (data) {
            // let regs = /\噢/g;
            if (data.search('哎') !== -1 || data.search('噢') !== -1) {
                return '*有哎或噢存在请检查是否正确';
            }
            if (
                data.charAt(data.length - 1) !== '？' &&
                data.charAt(data.length - 1) !== '。' &&
                data.charAt(data.length - 1) !== '；' &&
                data.charAt(data.length - 1) !== '！'
            )
                return '*句末符号出错';
            // reg = /\【/g;
            // regs = /\】/g;
            if (data.search('】') !== -1 || data.search('【') !== -1) {
                return '*【】应为[]';
            }
        }
        return null
    }

    render() {
        const { onChange, onBlur, index, onFocus, item, style, mention } = this.props;
        const { changeText, optionPrefix } = this.state;

        const wrapperWidth = `${document.body.clientWidth * 0.9 - 121.5  }px`;
        const normalHeight = textSize('1.1em', '', changeText, wrapperWidth, 'normal').height;
        const nowrapHeight = textSize('1.1em', '', changeText, document.body.clientWidth, 'nowrap')
            .height;
        const rows = normalHeight / nowrapHeight;

        return (
            <>
                <Mentions
                    // ref={ref}
                    placement="填写信息"
                    ref={mention}
                    size="small"
                    rows={rows}
                    defaultValue={item.text}
                    onBlur={() => {
                        if (changeText !== item.text) {
                            onChange({ ...item, text: changeText }, index);
                        }
                        if(onBlur){
                            onBlur(item);
                        }
                    }}
                    onFocus={() => {
                        if(onFocus){
                            onFocus(item);
                        }
                    }}
                    autoFocus
                    onChange={(changeText) => this.setState({ changeText })}
                    split=""
                    filterOption={(input, option) => {
                        for (let i = 1; i < option.children.length; i++) {
                            return changeText.endsWith(option.children.substr(0, i));
                        }
                        return null
                    }}
                    style={style}
                    prefix={optionPrefix}
                    validateSearch={() => optionPrefix.some((item) => changeText.endsWith(item))}
                >
                    {this.getHotWordOptions()}
                </Mentions>
                {this.props.showTips && (
                    <span style={{ color: 'red', marginTop: '5px', display: 'block' }}>
            {this.handleInputData(changeText && changeText.trim())}
          </span>
                )}
            </>
        );
    }
}

export default React.forwardRef((props, ref) => <InputMentions mention={ref} {...props} />);
