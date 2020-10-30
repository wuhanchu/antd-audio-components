import React, { Fragment, PureComponent } from 'react';
import { Icon as LegacyIcon } from '@ant-design/compatible';
import { SyncOutlined } from '@ant-design/icons';
import { Card, Col, Mentions, message, Row, Spin, Timeline, Typography } from 'antd';
import { antdUtils, frSchema } from '@/outter';
import InputMentions from '@/components/Extra/Audio/InputMentions';
import CheckableTag from 'antd/es/tag/CheckableTag';
import ButtonSpace from '@/components/Extra/Button/ButtonSpace';
import clone from 'clone';
import * as _ from 'lodash';
import  keyboardJS from 'keyboardjs'

const { createComponent } = antdUtils.utils.component

const { actions, schemaFieldType, utils } = frSchema

const { Text } = Typography
const { Option } = Mentions

/**
 *对话类型
 */
export const RECORD_TYPE = {
    sign: "sign",
    record: "record"
}

/**
 * @class TalkTimeLine
 * @classdesc default export, if have not event just use InputMentions
 * @param {Array} dialogue  对话数据 is Immutable
 *              {
 *                   id: 1,
 *                   type: "record",
 *                   startTime: moment(),
 *                   endTime: moment(),
 *                   content: "test"
 *               }
 * @param {Array} [null] hotWordList 热词
 * @param {Array}  [null] labels 标签
 * @param {Integer} [null] playId 当前播放的id
 * @param {Boolean}  [flse] running 组件运行状态（是否录音或者播放中）
 * @param {Boolean}  [true] pause 播放暂停标志
 * @param {Boolean}  [false] showUserSelect 是否开启用户选择
 * @param {Boolean}  [false] reverse 是否反转显示数据
 * @param {Function} [null] onItemChange 对话修改
 * @param {Function} [null] onPlayChange playid 修改
 * @param {Boolen} [false] hideInfo 显示每句对话的相关信息
 **/
class TalkTimeLine extends PureComponent {
    /**
     * @property {object}
     * @desc react object of mention
     */
    mention = null

    /**
     * @property {Array}
     * @desc 按键绑定
     */
    keyBindMethods = []

    /**
     * @property {object}
     * @desc state
     */
    state = {
        changeId: null // 当前修改ID
    }

    /**
     * @property {object}
     * @desc 对话map
     */
    dialogueMap = {}

    constructor(props) {
        super(props)
        this.setDialogueMap()

        // 先要取自要从项目中获取
        if (this.props.roles) {
            this.roleDict = {}
            this.props.roles.forEach(item => {
                this.roleDict[item.value] = item
            })
        }
    }

    componentDidMount() {
        this.bindKey()
    }

    componentDidUpdate(prevProps, prevState) {
        // play 切换
        if (this.props.playId !== prevProps.playId) {
            !_.isNil(this.props.playId) &&
            console.log("this.props.playId",this.props.playId)
            console.log(this.dialogueMap)
            try {
                this.scrollToItem(this.dialogueMap[this.props.playId].item)
                
            } catch (error) {
                
            }
        }

        if (this.props.dialogue !== prevProps.dialogue) {
            this.setDialogueMap()
        }

        // changeId 正式
        if (this.props.changeId !== prevProps.changeId) {
            this.setChangeId(this.props.changeId)
        }
    }

    /**
     * 修改changeId
     * @param {*} changeId 修改的项目ID
     * @param {*} callback 回调函数
     */
    setChangeId(changeId, callback) {
        if (this.state.changeId != changeId) {
            this.mention && this.mention.blur()
        }

        this.setState({ changeId }, () => {
            if (this.state.changeId !== this.props.changeId) {
                this.props.onChangeIdChange &&
                this.props.onChangeIdChange(this.state.changeId)
            }
            if (this.state.changeId == 0) {
                console.log(this.dialogueMap[0].item)
                this.scrollToItem(this.dialogueMap[0].item)
            }

            this.props.onChangeIdChange(this.state.changeId)

            callback && callback()
        })
    }

    /**
     * 绑定按键
     */
    bindKey = () => {
        // rewrite the key event ,not to triger input
        const node = document.getElementById("timeline")
        node.onkeypress = event => {
            if (event.shiftKey && event.altKey) {
                return false
            }
        }

        node.onclick = event => {
            if (
                event.target.className &&
                event.target.className.indexOf &&
                event.target.className.indexOf("flex") > -1
            ) {
                this.setChangeId(null)
            }
        }

        // set the event
        let { keyBindMethods } = this
        let method = null
        let key = null

        // 退出
        key = "esc"
        method = e => {
            console.log("esc")
            e.preventDefault()
            e.stopPropagation()

            this.setChangeId(null)
        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // 下一条
        key = "tab"
        method = e => {
            e.preventDefault()

            const { changeId } = this.state

            let nextItem = null
            if (!_.isNil(changeId)) {
                const nextIndex =
                    this.dialogueMap[this.state.changeId].index + 1
                nextItem = this.props.dialogue[nextIndex]
            }

            if (!nextItem) {
                nextItem = this.props.dialogue[0]
            }

            

            if (!nextItem) {
                this.setChangeId(null)

                return
            }
            if(nextItem.id===0 && !this.dialogueMap[1]){
                console.log(this.dialogueMap)

                if (this.props.onItemChange && this.state.changeId) {
                    return
                }
    
                e.preventDefault()
                this.props.onPauseChange(!this.props.pause)
            }
            this.setChangeId(nextItem.id)
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

            const { changeId } = this.state
            if (!changeId) {
                return
            }

            const nextIndex = this.dialogueMap[this.state.changeId].index - 1
            const nextItem = this.props.dialogue[nextIndex]

            if (!nextItem) {
                this.setChangeId(changeId)
                return
            }

            this.setChangeId(nextItem.id)
        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // play or suspend
        key = "shift + alt + p"
        method = e => {
            e.preventDefault()
            this.props.onPauseChange(!this.props.pause)
        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        // play or suspend
        key = "shift + alt + l"
        method = e => {
            // e.preventDefault()
            console.log(e)
            console.log(this.props.dialogue)
            let index = this.state.itemIndex
            console.log(this.props.dialogue[index])
            let item = this.props.dialogue[index]
            if(index){
                const { dialogue } = this.props
                let tempDialogue = clone(dialogue)
                let lastItem = tempDialogue[index - 1]
                console.log(lastItem)

                lastItem.endTime = item.endTime
                lastItem.startTime = lastItem.startTime < item.startTime? lastItem.startTime : item.startTime
                lastItem.endTime = lastItem.endTime >= item.endTime? lastItem.endTime : item.endTime

                lastItem.content =
                    (_.isNil(lastItem.content)? "" : lastItem.content) + (_.isNil(item.content)? "" : item.content)

                tempDialogue.splice(index, 1)

                this.setChangeId(null, () =>
                    this.props.onDialogueChange(
                        tempDialogue,
                        lastItem.id
                    )
                )
            }

        }
        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })


                // play or suspend
                key = "shift + alt + K"
                method = e => {
                    // e.preventDefault()
                    console.log(e)
                    console.log(this.props.dialogue)
                    let index = this.state.itemIndex
                    console.log(this.props.dialogue[index])
                    let item = this.props.dialogue[index]
                    if(index!=undefined && index!=this.props.dialogue.length+1){
                        const { dialogue } = this.props
                        let tempDialogue = clone(dialogue)
                        let nextItem = tempDialogue[index + 1]
                        if (_.isNil(nextItem)) {
                            return
                        }
                        nextItem.startTime = item.startTime < nextItem.startTime? item.startTime : nextItem.startTime
                        nextItem.endTime = item.endTime >= nextItem.endTime? item.endTime : nextItem.endTime
                        nextItem.content =
                            (_.isNil(item.content)? "" : item.content) + (_.isNil(nextItem.content)? "" : nextItem.content)

                        tempDialogue.splice(index, 1)
                        this.setChangeId(null, () => {
                            this.props.onDialogueChange(
                                tempDialogue,
                                nextItem.id
                            )
                        })
                    }

                }
                keyboardJS.bind(key, method)
                keyBindMethods.push({
                    key,
                    method
                })

        // Without editing, play or suspend
        key = "space"
        method = e => {
            if (this.props.onItemChange && this.state.changeId) {
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

        key = "ctrl + ["
        method = e => {
            let index = this.state.itemIndex
            let item = this.props.dialogue[index]
            if(index!=undefined){
                this.handleChangeTag(item, 0, {color: "blue", remark: "男", value: "man"}, "", item.labels? !item.labels.man: true)

            }
        }

        keyboardJS.bind(key, method)
        keyBindMethods.push({
            key,
            method
        })

        key = "ctrl + ]"
        method = e => {
            let index = this.state.itemIndex
            let item = this.props.dialogue[index]
            if(index!=undefined){
                this.handleChangeTag(item, 0, {color: "pink", remark: "女", value: "woman"}, "", item.labels? !item.labels.woman: true)
            }
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
            this.dialogueMap[item.id] = {
                item,
                index
            }
        })
    }

    /**
     * 渲染错误标签
     * @param item
     * @param index
     * @returns {*}
     */

    
    handleChangeTag = (item, index, label, inStyle, mark) =>{
        const { onLabelChange } = this.props
        const { remark, value, color = "red", checkFunc, ...others } = label
        let checked = item.labels && item.labels[value]
        if (checkFunc) {
            checked = checkFunc(item)
        }
        const labels = { ...item.labels }
        labels[value] = mark
        console.log(mark)
        this.props.onItemChange &&
        this.props.onItemChange({ ...item, labels })
    }

    renderTag = (item, index, label, inStyle) => {
        const { onLabelChange } = this.props

        const { remark, value, color = "red", checkFunc, ...others } = label
        let checked = item.labels && item.labels[value]
        if (checkFunc) {
            checked = checkFunc(item)
        }

        let style = inStyle || {}
        if (checked) {
            style.backgroundColor = color
        } else {
            style.backgroundColor = "lightgray"
        }

        return (
            <CheckableTag
                style={style}
                key={value}
                color={"red"}
                checked={checked}
                onChange={(mark) => {
                    this.handleChangeTag(item, index, label, inStyle, mark)
                    // 数据请求
                    
                }}
            >
                {remark}
            </CheckableTag>
        )
    }

    renderUserSelect(item, index) {
        /**
         * 数据修改模型
         */
        const disabled = !this.props.onItemChange
        let inputProps = {
            showSearch: true,
            placeholder: "选择角色",
            size: "small",
            style: { width: 100 },
            onChange: role => {
                this.props.onItemChange({ ...item, role })
            },
            disabled
        }

        const component = createComponent.bind(null)(
            {
                title: "人员",
                type: schemaFieldType.Select,
                dict: this.roleDict,
                dataIndex: "role"
            },
            item.role,
            inputProps,
            actions.add
        )
        return component
    }

    /**
     * 渲染头部信息
     * @param {*} item
     * @param index item idnex
     * @param isLast is last item
     */
    renderInfo(item, index, isLast = false) {
        const { playId, labels, hideInfo } = this.props

        if (hideInfo) {
            return null
        }

        if (item.username && item.username !== "") {
            inputProps.defaultValue = Number.parseInt(item.username)
        }

        return (
            <Row type="flex">
                <Col>
                    <Row
                        type="flex"
                        align={"middle"}
                        gutter={8}
                        style={{
                            marginBottom: 12,
                            fontSize: "1.1em",
                            marginRight: 10
                        }}
                    >
                        <Col
                            style={{
                                marginRight: 8
                            }}
                        >
                            {this.props.showUserSelect && this.roleDict && (
                                <Fragment>
                                    {!_.isNil(item.id) &&
                                    this.renderUserSelect(item, index)}
                                </Fragment>
                            )}
                        </Col>
                        {!_.isNil(item.startTime) && (
                            <Col>
                                <h6
                                    style={{
                                        marginRight: 8,
                                        fontSize: "1em",
                                        display: "inline"
                                    }}
                                >
                                    时间区间:
                                </h6>
                                {utils.moment.getTimeShow(item.startTime)}
                                {!_.isNil(item.endTime) &&
                                " - " +
                                utils.moment.getTimeShow(item.endTime)}
                            </Col>
                        )}
                        {!_.isNil(item.id) &&
                        !_.isNil(item.startTime) && (
                            <Fragment>
                                <Col>
                                    <LegacyIcon
                                        type={
                                            playId === item.id &&
                                            !this.props.pause
                                                ? "stop"
                                                : "play-circle"
                                        }
                                        style={{
                                            marginTop: "4px",
                                            fontSize: "1.1em",

                                        }}
                                        onClick={e => {
                                            this.setChangeId(item.id, () => {
                                                if (playId === item.id) {
                                                    this.props.onPauseChange(
                                                        !this.props.pause
                                                    )
                                                } else {
                                                    this.props.onPauseChange(false)
                                                    this.props.onPlayChange(item.id)
                                                }
                                            })

                                        }}
                                    />
                                </Col>
                                <Col>
                                    {playId === item.id &&
                                    !this.props.pause && (
                                        <SyncOutlined
                                            style={{
                                                fontSize: "1.1em"
                                            }}
                                            spin/>
                                    )}
                                </Col>
                            </Fragment>
                        )}
                        {!_.isEmpty(labels) && !_.isNil(item.id) && (
                            <Col style={{ marginLeft: 20 }}>
                                <h6
                                    style={{
                                        fontSize: "1.1em",
                                        marginRight: 8,
                                        display: "inline"
                                    }}
                                >
                                    标签:
                                </h6>

                                {labels.map(label =>
                                    this.renderTag(item, index, label, {})
                                )}
                            </Col>
                        )}
                    </Row>
                </Col>
                {this.props.onItemChange && (
                    <Col>
                        <Fragment>
                            {index != 0 && (
                                <ButtonSpace
                                    size="small"
                                    onClick={() => {
                                        const { dialogue } = this.props
                                        let tempDialogue = clone(dialogue)
                                        let lastItem = tempDialogue[index - 1]
                                        lastItem.endTime = item.endTime

                                        lastItem.startTime = lastItem.startTime < item.startTime? lastItem.startTime : item.startTime
                                        lastItem.endTime = lastItem.endTime >= item.endTime? lastItem.endTime : item.endTime

                                        lastItem.content =
                                            (_.isNil(lastItem.content)? "" : lastItem.content) + (_.isNil(item.content)? "" : item.content)

                                        tempDialogue.splice(index, 1)

                                        tempDialogue = tempDialogue.map((item, indexs)=>{
                                            if(indexs >= index)
                                                return { ...item, id: item.id-1}
                                            return { ... item }
                                        })

                                        this.setChangeId(null, () =>
                                            this.props.onDialogueChange(
                                                tempDialogue,
                                                lastItem.id
                                            )
                                        )
                                    }}
                                >
                                    往上合并
                                </ButtonSpace>
                            )}
                            {!isLast && (
                                <ButtonSpace
                                    size="small"
                                    onClick={() => {
                                        const { dialogue } = this.props
                                        let tempDialogue = clone(dialogue)
                                        // tempDialogue[index + 1].id = index
                                        let nextItem = tempDialogue[index + 1]
                                        if (_.isNil(nextItem)) {
                                            return
                                        }
                                        nextItem.startTime = item.startTime < nextItem.startTime? item.startTime : nextItem.startTime
                                        nextItem.endTime = item.endTime >= nextItem.endTime? item.endTime : nextItem.endTime
                                        nextItem.content =
                                            (_.isNil(item.content)? "" : item.content) + (_.isNil(nextItem.content)? "" : nextItem.content)

                                        tempDialogue.splice(index, 1)
                                        tempDialogue = tempDialogue.map((item, indexs)=>{
                                            if(indexs >= index)
                                                return { ...item, id: item.id-1}
                                            return { ... item }
                                        })
                                        console.log(tempDialogue)

                                        this.setChangeId(null, () => {
                                            this.props.onDialogueChange(
                                                tempDialogue,
                                                nextItem.id
                                            )
                                        })
                                    }}
                                >
                                    往下合并
                                </ButtonSpace>
                            )}
                            {this.props.pause &&
                            this.state.changeId == item.id && (
                                <ButtonSpace
                                    size="small"
                                    onClick={() => {
                                        const { dialogue } = this.props

                                        let tempDialogue = clone(dialogue)
                                        const item = tempDialogue[index]

                                        const selectText = document
                                            .getSelection()
                                            .toString()

                                        // get currentTime to be next item begin time
                                        const startTime =
                                            document.wavesurfer.getCurrentTime()*
                                            1000

                                        if (
                                            item.endTime - startTime <
                                            250
                                        ) {
                                            message.warn("拆分间隔太短！")
                                            return
                                        }

                                        const id = item.id + "_" + startTime
                                        // tempDialogue.splice(index + 1, 0, {
                                        //     ...item,
                                        //     id: id,
                                        //     startTime,
                                        //     entTime: item.endTime,
                                        //     content: selectText
                                        // })
                                        tempDialogue.splice(index + 1, 0, {
                                            ...item,
                                            id: index ,
                                            startTime,
                                            entTime: item.endTime,
                                            content: selectText
                                        })
                                        tempDialogue = tempDialogue.map((item, indexs)=>{
                                            if(indexs >= index +1)
                                                return { ...item, id: item.id+1}
                                            return { ... item }
                                        })
                                        console.log(tempDialogue)
                                        tempDialogue[
                                            index
                                            ].content = item.content && item.content.replace(
                                            selectText,
                                            ""
                                        )
                                        tempDialogue[
                                            index
                                            ].endTime = startTime

                                            console.log(index)
                                        this.setChangeId(null, () => {
                                            this.props.onDialogueChange(
                                                tempDialogue, index
                                            )
                                        })
                                    }}
                                >
                                    拆分
                                </ButtonSpace>
                            )}
                            {(item.endTime - item.startTime)/ 1000 > 10 ? <span style={{ color:'red', marginTop: '5px'}}>*音频段超过十秒请拆分</span>: ''}
                        </Fragment>
                    </Col>
                )}
            </Row>
        );
    }

    handleInputCheck (data, style) {
        if(!this.props.showTips){
            return null
        }
        if(data){
            // if(data.length > 40) {
            //     return {...style, border: ' 1px solid red', padding: '4px', fontSize: '14px'}
            // }
            var reg = /[A-Z][A-Z]/g;
            if(data.match(reg)){
                return {...style, border: ' 1px solid red', padding: '4px', fontSize: '14px'}
            }
            var regs = /\噢/g
            if(data.search("哎") != -1 ||data.search("噢") != -1){

                return {...style, border: ' 1px solid red', padding: '4px', fontSize: '14px'}
            }
            if(data.search("】") != -1 ||data.search("【") != -1){
                return {...style, border: ' 1px solid red', padding: '4px', fontSize: '14px'}
            }
            if(data.charAt(data.length-1)!= '？' && data.charAt(data.length-1)!= '。'&& data.charAt(data.length-1)!= '；' && data.charAt(data.length-1)!= '！')
                return {...style, border: ' 1px solid red', padding: '4px', fontSize: '14px'}
            var isCanUse = true
            for(var i=0;i<data.length - 1;i++){
                if(data[i]===data[0]){
                }else{
                    isCanUse= false
                    break
                }
            }
            if(isCanUse){
                return {...style, border: ' 1px solid red', padding: '4px', fontSize: '14px'}
            }
        }
        
    }

    handleInputData (data) {
        if(data){
            // if(data.length > 40) {
            //     return "*文字字数超过四十"
            // }
            var reg = /[A-Z][A-Z]/g;
            if(data.match(reg)){
                return "*大写字母中间没有空格"
            }
            var regs = /\噢/g
            if(data.search("哎") != -1 ||data.search("噢") != -1){
                return "*有哎或噢存在请检查是否确定"
            }
            if(data.charAt(data.length-1)!= '？' && data.charAt(data.length-1)!= '。'&& data.charAt(data.length-1)!= '；' && data.charAt(data.length-1)!= '！')
                return '*句末符号出错'
            if(data.search("】") != -1 ||data.search("【") != -1){
                return '*【】应为[]'
            }
            var isCanUse = true
            for(var i=0;i<data.length - 1;i++){
                if(data[i]===data[0]){
                }else{
                    isCanUse= false
                    break
                }
            }
            if(isCanUse){
                return "*请检查是否为无效语音"
            }
        }
    }


    /**
     * 渲染输入框
     * @param {x} item
     */
    renderInput(item, index) {
        const { changeId } = this.state
        const style = { fontSize: "1.1em" }

        return !_.isNil(changeId) &&
        changeId === item.id &&
        this.props.onItemChange? (
            this.renderMentions(item, index, this.props.showTips)
        ) : (
            <div
                style={{ marginLeft: 12 }}
                onClick={e => {
                    this.setChangeId(item.id)
                    e.stopPropagation()
                    e.preventDefault()
                }}
            >
                <div 
                    style={this.handleInputCheck(item.content && item.content.trim(), style)}
                >
                    <Text disabled={!(item.content && item.content.trim())} style={ style}>
                        {(item.content && item.content.trim()) || "空数据"}
                    </Text>
                </div>
                {this.props.showTips && <span style={{ color:'red', marginTop: '5px', display: 'block'}}>{this.handleInputData(item.content && item.content.trim())}</span>}
            </div>
        )
    }

    isElementVisible(el) {
        var rect = el.getBoundingClientRect(),
            vWidth = window.innerWidth || doc.documentElement.clientWidth,
            vHeight = window.innerHeight || doc.documentElement.clientHeight,
            efp = function (x, y) {
                return document.elementFromPoint(x, y)
            };

        // Return false if it's not in the viewport
        if (rect.right < 0 || rect.bottom < 0
            || rect.left > vWidth || rect.top > vHeight)
            return false;

        // Return true if any of its four corners are visible
        return (
            el.contains(efp(rect.left, rect.top))
            || el.contains(efp(rect.right, rect.top))
            || el.contains(efp(rect.right, rect.bottom))
            || el.contains(efp(rect.left, rect.bottom))
        );
    }

    /**
     * 滚动到对应的位置
     * @param item
     */
    scrollToItem = function (item) {
        let anchorElement = document.getElementById("timeline_" + item.id)

        if (anchorElement && !this.isElementVisible(anchorElement)) {
            anchorElement.scrollIntoView()
        }
    }

    /**
     *渲染建议
     * @param item
     * @param index
     * @returns {*}
     */
    renderMentions = (item, index, showTips) => {
        const { hotWordList } = this.props
        return (
            <InputMentions
                showTips={showTips}
                key={item.id}
                item={item}
                index={index}
                style={{
                    fontSize: "1.1em"
                }}
                ref={ref => this.mention = ref}
                hotWordList={hotWordList}
                onBlur={item => {
                }}
                onFocus={() => {
                    this.setState({itemIndex: index})
                    if (item.id !== this.props.changeId) {

                        this.setChangeId(item.id, () => {
                            this.props.onPauseChange(false)
                        })

                    }
                }}
                onChange={changeItem => {
                    if (changeItem.content != item.content) {
                        this.props.onItemChange(changeItem)
                    }
                }}
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
                        <Timeline.Item
                            key={item.id || index}>
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
                                index === dialogue.length? (
                                    <Spin/>
                                ) : null
                            }
                        >
                            <Card
                                bordered={false}
                                bodyStyle={{
                                    padding: "8px 8px 8px 8px"
                                }}
                            >
                                {this.renderInfo(
                                    item,
                                    index,
                                    index == dialogue.length - 1
                                )}
                                <Row
                                    type="flex"
                                    justify={"space-between"}
                                    gutter={20}
                                >
                                    <Col span={24}>
                                        {this.renderInput(item, index)}
                                    </Col>
                                </Row>
                            </Card>
                        </Timeline.Item>
                    )
            }
        })

        return (
            <Timeline id="timeline" reverse={reverse} style={{ ...this.props.style, width: "100%" }}>
                {itemList}
            </Timeline>
        )
    }
}

export default TalkTimeLine
