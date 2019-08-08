import React from "react"
import Wavesurfer from "react-wavesurfer"

const component = ({ item, index, onChange, hotWordList }) => {
    return (
        <Wavesurfer
            audioFile={"path/to/audio/file.mp3"}
        />
    )
}

export default React.memo(component)
