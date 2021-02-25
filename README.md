## B站直播录播工具

### install

```
$ npm install @tokine/bilibili-recorder -S
```

### Useage
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

// 开始录制
recorder.record([options])
return {
  id
}

// 取消录制
cancelRecord([id])

// 获取视频流地址
getPlayUrl([options])

// 随机获取一个视频流地址
getRandomPlayUrl([options])

// 获取视频流
getLiveStream(playUrl)
```