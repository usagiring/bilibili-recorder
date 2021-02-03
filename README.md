## B站直播录播工具

### Useage
```
import BilibiliRecorder from 'bilibili-recorder'

const recorder = new BilibiliRecorder(
  { 
    roomId, // 房间号 required
    output // 输出流，默认当前文件夹, example: `./${roomId}_${Date.now()}.flv`
  },
  { adapter: httpAdapter, } // AxiosRequestConfig, 可自定义请求参数
)

// 开始录制
recorder.record()
```