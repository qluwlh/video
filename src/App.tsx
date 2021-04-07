import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import axios from "axios";
import { of, defer, forkJoin } from "rxjs";
import { map, retry, catchError, retryWhen, mergeMap } from "rxjs/operators";
const m3u8Parser = require("m3u8-parser");
const muxjs = require("mux.js");

const mime = `video/mp4; codecs="mp4a.40.2,avc1.64001f"`;
const testUrl =
  // "https://static.uskid.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
  // "https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
  "https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
// "https://static.uskid.com/playback/20200711/j3gdn354k/2_LTXKZ36xE7rhCZG9.m3u8";

// eslint-disable-next-line
const mp4Urls = {
  static:
    "https://static.uskid.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4",
  "oss-accelerate":
    "https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4",
  "oss-cn-beijing":
    "https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4",
};
const host = testUrl.match(/(.*)\/.*.m3u8$/)?.[1] ?? "";
const getM3U8$ = (url: string) =>
  defer(() => axios.get(url)).pipe(
    map((item: any) => item.data),
    retryWhen((error: any) => error),
    catchError((err) => of({ error: true, message: err.message }))
  );
const getTs$ = (url: string) =>
  defer(() => axios.get(url, { responseType: "arraybuffer" })).pipe(
    map((item: any) => item.data),
    retry(10)
  );
const format = (m3u8File: any) => {
  const parser = new m3u8Parser.Parser();
  parser.push(m3u8File);
  parser.end();
  const urls = parser.manifest.segments
    .map(({ uri }) => uri)
    .map((uri) => `${host}/${uri}`);
  return urls;
};
function App() {
  const [loaded, setLoaded] = useState(false);
  const play = () => videoRef.current?.play();
  const pause = () => videoRef.current?.pause();
  const transmuxer = useMemo(() => new muxjs.mp4.Transmuxer(), []);
  const mediaSource = useMemo(() => new MediaSource(), []);
  const sourceBufferRef = useRef<any>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const tsUrlRef = useRef<string[]>([]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(mediaSource);
    }
    const updateend = () => {
      mediaSource.endOfStream();
      videoRef.current?.play();
      setLoaded(true);
    };
    const appendSegment = async () => {
      if (tsUrlRef.current.length <= 0) {
        return;
      }
      if (videoRef.current) {
        URL.revokeObjectURL(videoRef.current.src);
      }
      sourceBufferRef.current = mediaSource.addSourceBuffer(mime);
      transmuxer.on("data", (segment) => {
        console.log(`transmuxer.on("data"`, segment);
        let data = new Uint8Array(
          segment.initSegment.byteLength + segment.data.byteLength
        );
        data.set(segment.initSegment, 0);
        data.set(segment.data, segment.initSegment.byteLength);
        console.log(muxjs.mp4.tools.inspect(data));
        sourceBufferRef.current.addEventListener("updateend", updateend);
        sourceBufferRef.current.appendBuffer(data);
      });
    };
    mediaSource.addEventListener("sourceopen", appendSegment);
    const task = (m3u8File) => {
      const tss = format(m3u8File);
      tsUrlRef.current.push(...tss);
      const segments$ = of(tss).pipe(
        mergeMap((items) =>
          forkJoin(
            ...items.map((item) =>
              getTs$(item).pipe(map((item) => new Uint8Array(item)))
            )
          )
        ),
        catchError((err) => of({ error: true, message: err.message }))
      );
      segments$.subscribe({
        next: (data) => {
          console.log(`segments$.subscribe-item`, data);
          data.forEach((element) => transmuxer.push(element));
          transmuxer.flush();
        },
        error: console.log,
        complete: () => console.log("segments-done"),
      });
    };
    // getTs$(mp4Urls["oss-accelerate"])
    //   .pipe(map((item) => new Uint8Array(item)))
    //   .subscribe({
    //     next: (data) => {
    //       console.log(`mp4-url`, data);
    //       transmuxer.push(data);
    //       transmuxer.flush();
    //     },
    //   });
    const data$ = getM3U8$(testUrl);
    data$.subscribe({
      next: task,
      complete: () => console.log("data-done"),
    });
    // eslint-disable-next-line
  }, []);
  return (
    <div className="App">
      {!loaded && "loading"}
      <video
        id="video"
        width={400}
        height={300}
        className="video"
        controls
        ref={videoRef}
      />
      {loaded && (
        <div>
          <button onClick={play}>播放</button>
          <button onClick={pause}>暂停</button>
        </div>
      )}
    </div>
  );
}

export default App;
