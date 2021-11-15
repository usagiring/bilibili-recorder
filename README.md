## B站直播录播工具

### install

```
$ npm install @tokine/bilibili-recorder -S
```

### usage
```
import BilibiliRecorder from '@tokine/bilibili-recorder'

const recorder = new BilibiliRecorder(
  { 
    roomId, // 房间号 required
    output, // 输出流，默认当前文件夹, example: `./${roomId}_${Date.now()}.flv`,
    qn: number // 质量
    emitter: EventEmitter // node eventEmitter
  },
  { adapter: httpAdapter, } // AxiosRequestConfig, 可自定义请求参数
)



// -- methods --

// 开始录制
recorder.record([options], [axiosOptions])
return {
  id
}

// 取消录制
recorder.cancelRecord([id])

// 获取视频流地址
recorder.getPlayUrl([options], [axiosOptions])

// 随机获取一个视频流地址
recorder.getRandomPlayUrl([options], [axiosOptions])

// 获取视频流
recorder.getLiveStream({ playUrl }, [axiosOptions])


// -- events --

// 发出下载速度事件
emitter.emit(`${id}-download-rate`, { bps, totalSize: bufferSize.current })

// 结束事件
emitter.emit(`${id}-download-end`)

// 错误事件
emitter.emit(`${id}-download-error`)

// 关闭事件
emitter.emit(`${id}-download-close`)
```