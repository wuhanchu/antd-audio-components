import React, { PureComponent } from "react"

/**
 * 嵌入iframe的page
 * src 嵌入的页面 url
 * ...props iframe的相关属性
 */
class IframePage extends PureComponent {
    constructor() {
        super()
        this.state = {
            iFrameHeight: "0px"
        }
    }

    render() {
        return (
            <iframe
                style={{
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                    minHeight: "800px"
                }}
                ref="iframe"
                scrolling="yes"
                frameBorder="0"
                {...this.props}
            />
        )
    }
}

export default IframePage
