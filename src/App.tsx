import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import axios from 'axios'
import { of, defer, forkJoin } from 'rxjs'
import { map, retry, catchError, retryWhen, mergeMap } from 'rxjs/operators'
const m3u8Parser = require('m3u8-parser')
const muxjs = require('mux.js')

const mime = `video/mp4; codecs="mp4a.40.2,avc1.64001f"`
const testUrl =
  // "https://static.uskid.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
  // "https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
  'https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8'

const m3u8Urls = {
  static: 'https://static.uskid.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8',
  'oss-accelerate':
    'https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8',
  'oss-cn-beijing':
    'https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8',
}

const mp4Urls = {
  static: 'https://static.uskid.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4',
  'oss-accelerate':
    'https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4',
  'oss-cn-beijing':
    'https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4',
}
const getM3U8$ = (url: string) =>
  defer(() => axios.get(url)).pipe(
    map((item: any) => item.data),
    retryWhen((error: any) => error),
    catchError((err) => of({ error: true, message: err.message }))
  )
const getTs$ = (url: string) =>
  defer(() => axios.get(url, { responseType: 'arraybuffer' })).pipe(
    map((item: any) => item.data),
    retry(10)
  )
const format = (m3u8File: any, host) => {
  const parser = new m3u8Parser.Parser()
  parser.push(m3u8File)
  parser.end()
  const urls = parser.manifest.segments.map(({ uri }) => uri).map((uri) => `${host}/${uri}`)
  return urls
}
const getSegments$ = (tss) =>
  of(tss).pipe(
    mergeMap((items) =>
      forkJoin(...items.map((item) => getTs$(item).pipe(map((item) => new Uint8Array(item)))))
    ),
    catchError((err) => of({ error: true, message: err.message }))
  )

type M3u8UrlKeys = keyof typeof m3u8Urls
type Mp4UrlKeys = keyof typeof mp4Urls
function App() {
  const [loaded, setLoaded] = useState(false)
  const [m3u8, setM3u8] = useState<M3u8UrlKeys>('static')
  const [mp4, setMp4] = useState<Mp4UrlKeys>('static')
  const play = () => videoRef.current?.play()
  const pause = () => videoRef.current?.pause()
  const transmuxer = useMemo(() => new muxjs.mp4.Transmuxer(), [])
  const mediaSource = useMemo(() => new MediaSource(), [])
  const sourceBufferRef = useRef<SourceBuffer>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(mediaSource)
    }
    const updateend = () => {
      mediaSource.endOfStream()
      videoRef.current?.play()
      setLoaded(true)
    }
    const appendSegment = async () => {
      if (videoRef.current) {
        URL.revokeObjectURL(videoRef.current.src)
      }
      sourceBufferRef.current = mediaSource.addSourceBuffer(mime)
      transmuxer.on('data', (segment) => {
        console.log(`transmuxer.on("data"`, segment)
        let data = new Uint8Array(segment.initSegment.byteLength + segment.data.byteLength)
        data.set(segment.initSegment, 0)
        data.set(segment.data, segment.initSegment.byteLength)
        console.log(muxjs.mp4.tools.inspect(data))
        sourceBufferRef.current.addEventListener('updateend', updateend)
        sourceBufferRef.current.appendBuffer(data)
      })
    }
    mediaSource.addEventListener('sourceopen', appendSegment)
  }, [])
  const getMp4 = () => {
    const url = mp4Urls[mp4]
    getTs$(url)
      .pipe(map((item) => new Uint8Array(item)))
      .subscribe({
        next: (data) => {
          console.log(`mp4-url`, data)
          transmuxer.push(data)
          transmuxer.flush()
        },
      })
  }
  const task = (url) => (m3u8File) => {
    const host = url.match(/(.*)\/.*.m3u8$/)?.[1] ?? ''
    getSegments$(format(m3u8File, host)).subscribe({
      next: (data) => {
        console.log(`segments$.subscribe-item`, data)
        data.forEach((element) => transmuxer.push(element))
        transmuxer.flush()
      },
      error: console.log,
      complete: () => console.log('segments-done'),
    })
  }
  const getM3U8 = () => {
    const url = m3u8Urls[m3u8]
    getM3U8$(url).subscribe({
      next: task(url),
      complete: () => console.log('data-done'),
    })
  }
  return (
    <div className={'root'}>
      <div>
        <div>
          <select name={m3u8} id={m3u8} onChange={(e) => setM3u8(e.target.value as M3u8UrlKeys)}>
            {Object.entries(m3u8Urls).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <button onClick={getM3U8}>获取m3u8</button>
        </div>
        <div>
          <select name={mp4} id={mp4} onChange={(e) => setMp4(e.target.value as Mp4UrlKeys)}>
            {Object.entries(mp4Urls).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
          <button onClick={getMp4}>获取mp4</button>
        </div>
      </div>
      <div>
        <video id="video" width={400} height={300} className="video" controls ref={videoRef} />
      </div>

      {loaded && (
        <div>
          <button onClick={play}>播放</button>
          <button onClick={pause}>暂停</button>
        </div>
      )}
    </div>
  )
}

export default App
