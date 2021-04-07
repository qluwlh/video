import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { of, Observable, defer, from, forkJoin } from "rxjs";
import {
  map,
  switchMap,
  tap,
  retry,
  catchError,
  retryWhen,
  mergeMap,
} from "rxjs/operators";
const m3u8Parser = require("m3u8-parser");
const muxjs = require("mux.js");
const url =
  "https://static.uskid.com/playback/20200711/j3gdn354k/2_LTXKZ36xE7rhCZG9.m3u8";
const host = url.match(/(.*)\/.*.m3u8$/)?.[1] ?? "";

const getNextSegment = async (url: string) => {
  const { data } = await axios.get(url, {
    responseType: "arraybuffer",
  });
  return data;
};
const getM3U8 = async (url) => {
  const parser = new m3u8Parser.Parser();
  let playManifest = {} as any;
  const { data } = await axios.get(url);
  parser.push(data);
  parser.end();
  playManifest = parser.manifest;
  const urls = playManifest.segments
    .map(({ uri }) => uri)
    .map((uri) => `${host}/${uri}`);
  return urls;
};
const mime = `video/mp4; codecs="mp4a.40.2,avc1.64001f"`;
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
  const doTask = async () => {
    const tsURLs = [];
    const urls = await getM3U8(url);
    tsURLs.push(...urls);
    let transmuxer = new muxjs.mp4.Transmuxer() as any;
    let mediaSource = new MediaSource();
    let sourceBuffer;
    const video = document.getElementById("video") as HTMLVideoElement;
    video.src = URL.createObjectURL(mediaSource);

    const updateend = () => {
      mediaSource.endOfStream();
      setLoaded(true);
    };
    const appendFirstSegment = async () => {
      if (tsURLs.length <= 0) {
        return;
      }
      URL.revokeObjectURL(video.src);
      sourceBuffer = mediaSource.addSourceBuffer(mime);
      transmuxer.on("data", (segment) => {
        let data = new Uint8Array(
          segment.initSegment.byteLength + segment.data.byteLength
        );
        data.set(segment.initSegment, 0);
        data.set(segment.data, segment.initSegment.byteLength);
        console.log(muxjs.mp4.tools.inspect(data));
        sourceBuffer.addEventListener("updateend", updateend);
        sourceBuffer.appendBuffer(data);
      });
      const tsReq = tsURLs.map((item) => getNextSegment(item));
      const res = await Promise.all(tsReq);
      res
        .map((item) => new Uint8Array(item))
        .forEach((item) => {
          transmuxer.push(item);
        });
      transmuxer.flush();
    };
    mediaSource.addEventListener("sourceopen", appendFirstSegment);
  };
  // useEffect(() => {
  //   doTask()
  //     .then()
  //     .catch((error) => {
  //       console.log(`error`, error);
  //     });
  // }, []);
  useEffect(() => {
    const testUrl =
      // "https://static.uskid.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
      // "https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
      "https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8";
    // "https://static.uskid.com/playback/20200711/j3gdn354k/2_LTXKZ36xE7rhCZG9.m3u8";
    const host = testUrl.match(/(.*)\/.*.m3u8$/)?.[1] ?? "";

    const getM3U8 = (url: string) =>
      defer(() => {
        console.log(`调用中------`);
        return axios.get(url);
      }).pipe(
        map((item: any) => {
          return item.data;
        }),
        retryWhen((error: any) => {
          console.log(error);
          return error;
        }),
        catchError((err) => {
          return of({ error: true, message: err.message });
        })
      );
    const urlMap = new Map();
    const getTs$ = (url: string) =>
      defer(() => {
        urlMap.set(url, (urlMap.get(url) ?? 0) + 1);
        if (urlMap.get(url) > 1) {
          console.log(`重试中`, url, urlMap.get(url));
        }
        return axios.get(url, {
          responseType: "arraybuffer",
        });
      }).pipe(
        map((item: any) => {
          return item.data;
        }),
        retry(10)
        // retryWhen((error: any) => {
        //   console.log(error);
        //   return error;
        // })
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
    const data$ = getM3U8(testUrl);
    const task = async (m3u8File) => {
      const tss = format(m3u8File);
      const segments$ = of(tss).pipe(
        mergeMap((items) => forkJoin(...items.map(getTs$))),
        catchError((err) => {
          console.log(`error`, err);
          return of({ error: true, message: err.message });
        })
      );
      segments$.subscribe({
        next: console.log,
        error: console.log,
        complete: () => console.log("segments-done"),
      });
    };
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
