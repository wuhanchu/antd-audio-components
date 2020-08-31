import React, { Fragment } from "react"
import { AutoComplete, Avatar, Button, Menu, Card, Input, Spin, Space, Dropdown } from "antd"
import CharRecords from "./ChatRecords"
import mySvg from "./assets/userhead.svg"
import rebotSvg from "./assets/rebot.svg"
import frSchmaUtils from "@/outter/fr-schema-antd-utils/src"
import style from "./Dialogue.less"
import * as _ from "lodash"
import { SmileOutlined, FolderOutlined } from '@ant-design/icons';

const { utils } = frSchmaUtils
const { url } = utils

class Dialogue extends React.PureComponent {
    state = {
        dataSource: [],
        sendValue: "",
        isSpin: false,

    }

    constructor(props) {
        super(props)
        const { record, data } = props
    }

    handleChange = value => {
        this.setState({
            sendValue: value,
            dataSource:
                this.allData &&
                this.allData.filter(item => item.indexOf(value) >= 0)
        })
    }

    handleSend = async () => {
        const { sendValue } = this.state

        if (_.isNil(sendValue)) {
            return
        }

        this.props.data.push({
            actions: null,
            content: sendValue,
            id: this.props.data.length + 1,
            role: "interlocutors"
        })
        let card = document.getElementById("card")
        setTimeout(() => {
            card.scrollTop = card.scrollHeight
        }, 10)
        this.setState({ data: this.props.data, sendValue: "", isSpin: true })
        const response = await schemas.question.service.search({
            search: sendValue,
            project_id: this.project_id
        })
        let list
        if (response.list.length > 3) {
            list = response.list.slice(0, 3)
        } else {
            list = response.list
        }
        this.props.data.push({
            content: (
                <div
                    dangerouslySetInnerHTML={{
                        __html:
                            response.list[0] &&
                            response.list[0].answer &&
                            response.list[0].compatibility > 0.9
                                ? response.list[0].answer
                                : "暂时未找到您要的信息"
                    }}
                ></div>
            ),
            actions: response.list[0] &&
                response.list[0].answer_mark &&
                (response.list[0].compatibility < 0.9 ||
                    sendValue.length < 10) && [
                    <Fragment>
                        {sendValue.length < 10 &&
                        response.list[0].compatibility > 0.9 && (
                            <div>
                                <div>匹配问题：</div>

                                {list.length? (
                                    <div
                                        key={"comment-list-reply-to-" + -1}
                                    >
                                        <span>{}</span>
                                        <a
                                            onClick={() => {
                                                this.setState(
                                                    {
                                                        sendValue:
                                                        list[0]
                                                            .question_standard
                                                    },
                                                    this.handleSend
                                                )
                                            }}
                                        >
                                            {list[0].question_standard}
                                        </a>
                                    </div>
                                ) : (
                                    <a>没猜到哦！请输入详细信息。</a>
                                )}
                            </div>
                        )}

                        {(list.length > 1 || sendValue.length < 10) && (
                            <div>
                                {!(
                                    sendValue.length < 10 &&
                                    response.list[0].compatibility > 0.9 &&
                                    list.length == 1
                                ) && <div>猜你想问：</div>}

                                {list.length > 0 || sendValue.length < 10? (
                                    list.map((data, index) => {
                                        if (
                                            index == 0 &&
                                            sendValue.length < 10
                                        ) {
                                            if (
                                                sendValue.length < 10 &&
                                                response.list[0].compatibility >
                                                0.9
                                            ) {
                                                return null
                                            }
                                            return (
                                                <div
                                                    key={
                                                        "comment-list-reply-to-" +
                                                        index
                                                    }
                                                >
                                                    <span>{index + ": "}</span>
                                                    <a
                                                        onClick={() => {
                                                            this.setState(
                                                                {
                                                                    sendValue:
                                                                    data.question_standard
                                                                },
                                                                this.handleSend
                                                            )
                                                        }}
                                                    >
                                                        {data.question_standard}
                                                    </a>
                                                </div>
                                            )
                                        }
                                        if (index != 0)
                                            return (
                                                <div
                                                    key={
                                                        "comment-list-reply-to-" +
                                                        index
                                                    }
                                                >
                                                    <span>{index + ": "}</span>
                                                    <a
                                                        onClick={() => {
                                                            this.setState(
                                                                {
                                                                    sendValue:
                                                                    data.question_standard
                                                                },
                                                                this.handleSend
                                                            )
                                                        }}
                                                    >
                                                        {data.question_standard}
                                                    </a>
                                                </div>
                                            )
                                    })
                                ) : (
                                    <a>没猜到哦！请输入详细信息。</a>
                                )}
                            </div>
                        )}
                    </Fragment>
                ],
            id: this.props.data.length + 1,
            role: "my"
        })

        setTimeout(() => {
            card.scrollTop = card.scrollHeight
        }, 100)
        console.log(this.props.data)
        this.setState({ data: this.props.data, isSpin: false })
    }

    renderFooter() {
        const { sendValue } = this.state
        const others = {}
        if (_.isNil(sendValue) || sendValue === "") {
            others.value = ""
        }
        return (
            <Card type="inner" title={<Space>
                <SmileOutlined style={{ fontSize: 22 }}/><FolderOutlined style={{ fontSize: 24 }}/></Space>}>
                <div style={{ width: "100%", display: "flex", height: "42px", marginTop: "8px" }}>
                    <AutoComplete
                        dropdownMatchSelectWidth={252}
                        style={{ width: "100%", marginLeft: "20px" }}
                        onChange={value => {
                            this.handleChange(value)
                        }}
                        onSelect={value => {
                            this.selectOpen = true
                        }}
                        dataSource={this.props.dataSource}
                        {...others}
                    >
                        <Input
                            onPressEnter={e => {
                                setTimeout(() => {
                                    if (this.selectOpen) {
                                        this.selectOpen = false
                                    } else {
                                        !this.selectOpen && this.handleSend()
                                    }
                                })
                            }}
                        ></Input>
                    </AutoComplete>
                    <div style={{ flex: "0 0 74px", marginLeft: "20px", marginRight: "20px" }}>
                        <Dropdown.Button onClick={this.handleSend} overlay={<Menu onClick={this.handleSend}>
                            <Menu.Item key="1">
                                短信回复
                            </Menu.Item>
                            <Menu.Item key="2">
                                邮件回复
                            </Menu.Item>
                            <Menu.Item key="3">
                                公众号回复
                            </Menu.Item></Menu>}>
                            发送
                        </Dropdown.Button>
                    </div>
                </div>
            </Card>
        )
    }

    render() {
        return (
            <Fragment>
                <div
                    style={{
                        width: "100%",
                        height: this.props.height? this.props.height : "100%"
                    }}
                >
                    <Spin
                        tip="回答中。。。"
                        spinning={this.state.isSpin}
                        wrapperClassName={style.Spin}
                    >
                        <div className={style.wrapper}>
                            <Card
                                bordered={null}
                                style={{
                                    margin: "0px",
                                    flex: 1,
                                    // width: "98%",
                                    padding: "0",
                                    overflow: "scroll",
                                    overflowX: "hidden"
                                }}
                                ref={"card"}
                                id="card"
                            >
                                <CharRecords
                                    status={0 && 1? "ongoing" : ""}
                                    goingTip={"暂无数据"}
                                    iconMy={<Avatar src={rebotSvg}/>}
                                    iconInterlocutors={<Avatar src={mySvg}/>}
                                    value={this.props.data}
                                ></CharRecords>
                            </Card>
                            {this.renderFooter()}
                        </div>
                    </Spin>
                </div>
            </Fragment>
        )
    }
}

export default Dialogue
