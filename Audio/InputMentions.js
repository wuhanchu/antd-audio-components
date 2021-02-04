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
        prefix: "",
        data: {} 
    };

    constructor(props) {
        super(props);

        const { item, hotWordList } = props;
        let data = {}
        const optionPrefix = [];
        if(hotWordList){
            this.state.prefix = hotWordList[2].substr(0, 1)
            hotWordList.forEach((items) => {
                if (!items) {
                    return;
                }
                optionPrefix.push(items.substr(0, 1));
                
            });
        }
        this.state.optionPrefix = Array.from(new Set(optionPrefix));
        Array.from(new Set(optionPrefix)).map((item)=>{
            data[item] = []
            hotWordList.map((list)=>{
                if(list.substr(0, 1) === item){
                    data[item].push(<Option key={list.substr(1)} value={list.substr(1)}>
                        {list}
                  </Option>)
                }
            })
        })
        
        // if(hotWordList){
        //     {(data[prefix] || []).map(value => (
        //         options.push(<Option key={value.substr(1)} value={value.substr(1)}>
        //           {value}
        //         </Option>)
        //       ))}
        // }

        this.state.changeText = item.text;
        this.state.data =data
    }

    /**
     * 获取热词选项
     * @returns {[]}
     */
    getHotWordOptions = (prefix) => {
        const { data } = this.state;
        return data[prefix];
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

    onSearch = (_, prefix) => {
        this.setState({ prefix });
      };

    render() {
        const { prefix } = this.state;
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
                    onSearch={this.onSearch}
                    autoFocus
                    onChange={(changeText) => this.setState({ changeText })}
                    split=""
                    // filterOption={(input, option) => {
                    //     console.log(changeText)
                    //     console.log(option.children)

                    //     for (let i = 1; i < option.children.length; i++) {
                    //         return changeText.endsWith(option.children.substr(0, i));
                    //     }
                    //     return null
                    // }}
                    style={style}
                    prefix={optionPrefix}
                    // validateSearch={() => optionPrefix.some((item) =>{console.log(item) 
                    //     return changeText.endsWith(item)})}
                >
                    {this.getHotWordOptions(this.state.prefix)}
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
