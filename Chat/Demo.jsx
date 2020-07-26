import React, { useEffect, useState } from "react"
import ChatRecords from "./ChatRecords.jsx"
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
                            content:
                                globalValue.length % 2 == 1
                                    ? "n123123"
                                    : "123123123123123123123123123123123123123123123123",
                            actions:
                                globalValue.length % 2 == 1
                                    ? "test"
                                    : "12312312312" // or node]
                        }
                    ])
                )
            )
        }, 1000)
    }

    return <ChatRecords value={value} />
}

export default React.memo(Demo)
