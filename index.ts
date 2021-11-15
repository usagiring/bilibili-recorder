import axios, { AxiosInstance, AxiosRequestConfig, CancelTokenSource } from "axios"
import EventEmitter from "events";
import * as fs from 'fs'

const CancelToken = axios.CancelToken;

const BASE_LIVE_URL = 'https://api.live.bilibili.com'
const DOWNLOAD_TIMER_MS = 2000

interface Options {
  roomId?: number
  output?: string
  qn?: number,
  platform?: string
  emitter?: EventEmitter
}

class BilibiliRecorder {
  options: Options
  axiosInstance: AxiosInstance
  sourceMap: { [x: string]: CancelTokenSource }
  emitter: EventEmitter

  constructor(options: Options, axiosOptions: AxiosRequestConfig = {}) {
    this.options = options || {}
    this.emitter = options.emitter || new EventEmitter()
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

  async record(options: Options = {}, axiosOptions: AxiosRequestConfig = {}) {
    const now = Date.now()
    const id = String(now)
    this.sourceMap = this.sourceMap ? { ...this.sourceMap, [id]: CancelToken.source() } : { [id]: CancelToken.source() }

    const { roomId, output, qn } = Object.assign({}, this.options, options)
    if (!roomId) throw new Error('roomId is required.')
    const playUrl = await this.getRandomPlayUrl({ roomId, qn }, axiosOptions)

    const writeStream = fs.createWriteStream(output || `${roomId}_${now}.flv`);
    const liveStream = await this.getLiveStream({ playUrl, id }, axiosOptions)
    const bufferSize = {
      current: 0,
      preTick: 0
    }

    const dowloadTimer = setInterval(() => {
      const delta = bufferSize.current - bufferSize.preTick
      const bps = delta / (DOWNLOAD_TIMER_MS / 1000)
      bufferSize.preTick = bufferSize.current
      this.emitter.emit(`${id}-download-rate`, { bps, totalSize: bufferSize.current })
    }, DOWNLOAD_TIMER_MS)

    liveStream.on("data", (chunk) => {
      bufferSize.current = bufferSize.current + chunk.length
      writeStream.write(Buffer.from(chunk));
    });

    liveStream.on("end", () => {
      this.emitter.emit(`${id}-download-end`)
      writeStream.end();
      delete this.sourceMap[id]
      clearInterval(dowloadTimer)
    });

    liveStream.on("error", (e) => {
      console.error(e);
      this.emitter.emit(`${id}-download-error`)
      writeStream.end();
      delete this.sourceMap[id]
      clearInterval(dowloadTimer)
    });

    liveStream.on("close", () => {
      this.emitter.emit(`${id}-download-close`)
      delete this.sourceMap[id]
      writeStream.end();
      clearInterval(dowloadTimer)
    })

    return {
      id
    }
  }

  async cancelRecord(id?: string) {
    const _id = id || Object.keys(this.sourceMap)[0]
    console.log('cancel live stream.')
    if (!_id) {
      throw new Error('not found')
    }
    this.sourceMap[_id].cancel('Operation canceled by the user.');
  }

  async getPlayUrl(options: Options, axiosOptions: AxiosRequestConfig = {}) {
    const { roomId, platform, qn } = options
    const url = `${BASE_LIVE_URL}/room/v1/Room/playUrl?cid=${roomId || this.options.roomId}&qn=${qn || 0}&platform=${platform || 'web'}`
    const res = await this.axiosInstance.get(url, axiosOptions)
    return res.data
  }

  async getRandomPlayUrl(options: Options, axiosOptions: AxiosRequestConfig = {}) {
    const result = await this.getPlayUrl(options, axiosOptions)
    const urlsLength = result.data.durl.length
    return result.data.durl[Math.floor(Math.random() * urlsLength)].url;
  }

  async getLiveStream({ playUrl, id }: { playUrl: string, id?: string }, axiosOptions: AxiosRequestConfig = {}) {
    const _id = id || Object.keys(this.sourceMap)[0]
    if (!_id) {
      throw new Error('not found')
    }
    const res = await this.axiosInstance.get(playUrl, {
      ...axiosOptions,
      responseType: "stream",
      cancelToken: this.sourceMap[_id].token,
    })
    return res.data
  }
}

export default BilibiliRecorder
