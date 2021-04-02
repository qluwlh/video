import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
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
  useEffect(() => {
    doTask()
      .then()
      .catch((error) => {
        console.log(`error`, error);
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
