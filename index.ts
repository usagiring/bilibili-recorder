import axios, { AxiosInstance, AxiosRequestConfig } from "axios"
import * as fs from 'fs'

const BASE_LIVE_URL = 'https://api.live.bilibili.com'

interface Options {
  roomId?: number
  output?: string
}

class BilibiliRecorder {
  options: Options
  axiosInstance: AxiosInstance

  constructor(options: Options, axiosOptions: AxiosRequestConfig = {}) {
    this.options = options || {}
    const defaultAxiosOptions = {
      headers: {
        origin: 'https://live.bilibili.com',
        // Host: 'api.live.bilibili.com',
        referer: 'https://live.bilibili.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36'
      },
    }
    this.axiosInstance = axios.create(Object.assign({}, defaultAxiosOptions, axiosOptions))
  }

  async record(options: Options) {
    const { roomId, output } = Object.assign({}, this.options, options)
    if (!roomId) throw new Error('roomId is required.')
    const result = await this.getPlayUrl(roomId)

    //TODO
    const playUrl = result.data.durl[0].url;

    const writeStream = fs.createWriteStream(output || `${roomId}_${Date.now()}.flv`);
    const liveStream = await this.getLiveStream(playUrl)
    liveStream.on("data", (chunk) => {
      writeStream.write(Buffer.from(chunk));
    });
    liveStream.on("end", () => {
      writeStream.end();
    });
    liveStream.on("error", (e) => {
      console.error(e);
      throw e
    });
  }

  async getPlayUrl(roomId?: number) {
    const url = `${BASE_LIVE_URL}/room/v1/Room/playUrl?cid=${roomId || this.options.roomId}&qn=0&platform=web`
    const res = await this.axiosInstance.get(url)
    return res.data
  }

  async getLiveStream(playUrl: string) {
    const res = await this.axiosInstance.get(playUrl, {
      responseType: "stream",
    })
    return res.data
  }
}

export default BilibiliRecorder
