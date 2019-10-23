import React, { useEffect, useState } from "react"
import ChatRecords from "./ChatRecords.js"
import clone from "clone"

let timer = null
let globalValue = null
function Demo(props) {
    const [value, setValue] = useState([])
    globalValue = value

    if (!timer) {
        timer = setInterval(() => {
            console.log("setInterval", globalValue)
            if (globalValue.length > 10) {
                return
            }
            setValue(
                clone(
                    globalValue.concat([
                        {
                            id: globalValue.length,
                            role:
                                globalValue.length % 2 == 1
                                    ? "my"
                                    : "interlocutors", // or interlocutors
                            content: "tes12312311231231231231231233t",
                            actions: globalValue.length % 2 == 1 ? "test" : null // or node]
                        }
                    ])
                )
            )
        }, 1000)
    }

    return <ChatRecords value={value} />
}

export default React.memo(Demo)
