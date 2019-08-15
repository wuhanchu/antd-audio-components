//每100ms 读取一次音频数据，做vad判断
//  如果是静音，判断是否有缓冲，有的话就将缓冲数据推送到后台asr
//  如果不是静音，缓冲数据，并判断缓冲队列是否已满（5个）已满就推送到后台asr
// 数据统一用文本保存，后台统一拼接成文件
var wav_buff_arr  = [];  //缓冲对象
var vad_counter = 0;
//进行音频格式转换以及音量校验
vad_check = function(input){
    //修改采集频率为16k 44k
    var sampleStep = 3
    //如果此处不按比例缩短，实际输出的文件会包含sampleStep倍长度的空录音
    var length = Math.ceil(input.length / sampleStep);
    var result = new Float32Array(length);
    var index = 0, inputIndex = 0,vad_avg=0;
    while (index < length) {
        //此处是处理关键，算法就是输入的数据点每隔sampleStep距离取一个点放入result
        var s = Math.max(-1, Math.min(1, input[inputIndex]));
        //修改为16bit
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        result[index++] = s
        inputIndex += sampleStep;
        vad_avg += Math.abs(s)
    }
    vad_avg = vad_avg/result.length
    //console.info("vad avg :"+vad_avg)
    //一直没有人说话就直接返回
    if(window.sessionStorage.getItem("upload_error_code")==0 && wav_buff_arr.length==0 && vad_avg<600){
        //console.info("一直没有声音，返回")
        return null;
    }

    wav_buff_arr.push(result)
    //音量太小,并且已经有缓冲,计数器+1
    if(vad_avg<600 ){
        vad_counter = vad_counter + 1;
        console.info("vad_counter +1 = "+vad_counter)
    }
    //缓存已满，或者300ms的音量小于600 ， 进行asr
    if(wav_buff_arr.length >= 5 ||  vad_counter>=3){

        tmp_wav = wav_buff_arr
        wav_buff_arr = []
        eos = vad_counter>=3 ? 1:0;
        vad_counter = 0;
        console.info("调用asr,eos= "+ eos+" ;  wav_len: "+tmp_wav.length +";  vad_avg:"+vad_avg)
        return {"blob":encodeWAV(tmp_wav),"eos":eos}
    }
    console.info("没有调用vad_counter :"+ vad_counter +";  wav_len: "+wav_buff_arr.length +";  vad_avg:"+vad_avg)
    return null;
}

//合并音频数据,生成文件
function getWAV(input) {
    //修改采集频率为16k 44k
    var sampleStep = 3
    //如果此处不按比例缩短，实际输出的文件会包含sampleStep倍长度的空录音
    var length = Math.ceil(input.length / sampleStep);
    var index = 0, inputIndex = 0;

    var wavView = new DataView(new ArrayBuffer(length*2));
    while (index < length) {
        //此处是处理关键，算法就是输入的数据点每隔sampleStep距离取一个点放入result
        var s = Math.max(-1, Math.min(1, input[inputIndex]));
        //修改为16bit
        s = s < 0 ? s * 0x8000 : s * 0x7FFF;
        try{
           wavView.setInt16(index*2, s, true);
           index++;
        }catch(err){
           console.info("all_len:"+length*2+"  ; offset"+index*2)
        }
        inputIndex += sampleStep;
    }
    return new Blob([wavView], { type: "audio/wav" });
}
//合并音频数据,生成文件
function encodeWAV(wav_buff_arr) {
    var all_len = 0 ;
    for(i in wav_buff_arr){
        all_len += wav_buff_arr[i].length
    }
    var buffer = new ArrayBuffer(all_len * 2);
    var view = new DataView(buffer);

    var offset = 0
    for(var i = 0; i < wav_buff_arr.length; i++){
        wav_buff = wav_buff_arr[i]
        for(var j = 0; j < wav_buff.length; j ++, offset += 2){
            try{
               view.setInt16(offset, wav_buff[j], true);
            }catch(err){
               console.info("all_len:"+all_len+"  ; offset"+offset)
            }

        }
    }
    return new Blob([view], { type: "audio/wav" });
}
