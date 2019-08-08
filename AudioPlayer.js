import React, { useEffect } from "react"
import WaveSurfer from "wavesurfer.js"

const component = ({}) => {
    let wavesurfer = null
    useEffect(() => {
        wavesurfer = WaveSurfer.create({
            container: document.querySelector("#waveform")
        })

        wavesurfer.load(
            "http://ia902606.us.archive.org/35/items/shortpoetry_047_librivox/song_cjrg_teasdale_64kb.mp3"
        )
    })

    return <div id="waveform" />
}

export default React.memo(component)
