import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { of, defer, forkJoin } from "rxjs";
import {
  map,
  tap,
  retry,
  catchError,
  retryWhen,
  mergeMap,
} from "rxjs/operators";
const m3u8Parser = require("m3u8-parser");
const muxjs = require("mux.js");

const mime = `video/mp4; codecs="mp4a.40.2,avc1.64001f"`;
const testUrl =
  // "https://static.uskid.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
  // "https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
  // "https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
  "https://static.uskid.com/playback/20200711/j3gdn354k/2_LTXKZ36xE7rhCZG9.m3u8";
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
  const play = () => {
    const video = document.getElementById("video") as HTMLVideoElement | null;
    video?.play();
  };
  const pause = () => {
    const video = document.getElementById("video") as HTMLVideoElement | null;
    video?.pause();
  };
  const transmuxer = new muxjs.mp4.Transmuxer() as any;
  const mediaSource = new MediaSource();
  let sourceBuffer;
  useEffect(() => {
    const video = document.getElementById("video") as HTMLVideoElement;
    video.src = URL.createObjectURL(mediaSource);
    const tsURLs = [];
    const updateend = () => {
      mediaSource.endOfStream();
      video.play();
      setLoaded(true);
    };
    const appendSegment = async () => {
      if (tsURLs.length <= 0) {
        return;
      }
      URL.revokeObjectURL(video.src);
      sourceBuffer = mediaSource.addSourceBuffer(mime);
      transmuxer.on("data", (segment) => {
        console.log(`transmuxer.on("data"`, segment);
        let data = new Uint8Array(
          segment.initSegment.byteLength + segment.data.byteLength
        );
        data.set(segment.initSegment, 0);
        data.set(segment.data, segment.initSegment.byteLength);
        console.log(muxjs.mp4.tools.inspect(data));
        sourceBuffer.addEventListener("updateend", updateend);
        sourceBuffer.appendBuffer(data);
      });
    };
    mediaSource.addEventListener("sourceopen", appendSegment);
    const task = (m3u8File) => {
      const tss = format(m3u8File);
      tsURLs.push(...tss);
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
    const data$ = getM3U8$(testUrl);
    data$.subscribe({
      next: task,
      complete: () => console.log("data-done"),
    });
  }, []);
  return (
    <div className="App">
      <video id="video" width={400} height={300} className="video" controls />
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
