(this["webpackJsonpmy-video-app"]=this["webpackJsonpmy-video-app"]||[]).push([[0],{51:function(e,n,t){},53:function(e,n,t){},79:function(e,n,t){"use strict";t.r(n);var c=t(7),r=t.n(c),i=t(42),a=t.n(i),u=(t(51),t(29)),o=t.n(u),s=t(43),l=t(17),b=t(46),d=(t(53),t(30)),j=t.n(d),p=t(89),f=t(88),m=t(86),v=t(25),O=t(87),h=t(83),g=t(84),x=t(85),y=t(2),k=t(80),w=t(78),_={static:"https://static.uskid.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8","oss-accelerate":"https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8","oss-cn-beijing":"https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_6gr4jM07dBixDv4D.m3u8"},L={static:"https://static.uskid.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4","oss-accelerate":"https://uskid.oss-accelerate.aliyuncs.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4","oss-cn-beijing":"https://uskid.oss-cn-beijing.aliyuncs.com/playback/20200523/qn5w3mn75/2_0_merge_av.mp4"},S=function(e){return Object(p.a)((function(){return j.a.get(e,{responseType:"arraybuffer"})})).pipe(Object(v.a)((function(e){return e.data})),Object(g.a)(10))};var C=function(){var e=Object(c.useState)(!1),n=Object(l.a)(e,2),t=n[0],r=n[1],i=Object(c.useState)(""),a=Object(l.a)(i,2),u=a[0],d=a[1],g=Object(c.useState)(""),C=Object(l.a)(g,2),B=C[0],D=C[1],M=Object(c.useMemo)((function(){return new w.mp4.Transmuxer}),[]),U=Object(c.useMemo)((function(){return new MediaSource}),[]),q=Object(c.useRef)(null),R=Object(c.useRef)(null);Object(c.useEffect)((function(){R.current&&(R.current.src=URL.createObjectURL(U));var e=function(){var e;U.endOfStream(),null===(e=R.current)||void 0===e||e.play(),r(!0)},n=function(){var n=Object(s.a)(o.a.mark((function n(){return o.a.wrap((function(n){for(;;)switch(n.prev=n.next){case 0:R.current&&URL.revokeObjectURL(R.current.src),q.current=U.addSourceBuffer('video/mp4; codecs="mp4a.40.2,avc1.64001f"'),M.on("data",(function(n){console.log('transmuxer.on("data"',n);var t=new Uint8Array(n.initSegment.byteLength+n.data.byteLength);t.set(n.initSegment,0),t.set(n.data,n.initSegment.byteLength),console.log(w.mp4.tools.inspect(t)),q.current.addEventListener("updateend",e),q.current.appendBuffer(t)}));case 3:case"end":return n.stop()}}),n)})));return function(){return n.apply(this,arguments)}}();U.addEventListener("sourceopen",n)}),[]);var E=function(e){return function(n){var t,c,r,i=null!==(t=null===(c=e.match(/(.*)\/.*.m3u8$/))||void 0===c?void 0:c[1])&&void 0!==t?t:"";(r=function(e,n){var t=new k.Parser;return t.push(e),t.end(),t.manifest.segments.map((function(e){return e.uri})).map((function(e){return"".concat(n,"/").concat(e)}))}(n,i),Object(f.a)(r).pipe(Object(x.a)((function(e){return m.a.apply(void 0,Object(b.a)(e.map((function(e){return S(e).pipe(Object(v.a)((function(e){return new Uint8Array(e)})))}))))})),Object(h.a)((function(e){return Object(f.a)({error:!0,message:e.message})})))).subscribe({next:function(e){console.log("segments$.subscribe-item",e),e.forEach((function(e){return M.push(e)})),M.flush()},error:console.log,complete:function(){return console.log("segments-done")}})}};return Object(y.jsxs)("div",{className:"root",children:[Object(y.jsxs)("div",{children:[Object(y.jsxs)("div",{children:[Object(y.jsxs)("select",{name:u,id:u,onChange:function(e){return d(e.target.value)},children:[Object(y.jsx)("option",{value:"",children:"\u9009\u62e9"},""),Object.entries(_).map((function(e){var n=Object(l.a)(e,2),t=n[0],c=n[1];return Object(y.jsx)("option",{value:t,children:c},t)}))]}),Object(y.jsx)("button",{onClick:function(){var e=_[u];(function(e){return Object(p.a)((function(){return j.a.get(e)})).pipe(Object(v.a)((function(e){return e.data})),Object(O.a)((function(e){return e})),Object(h.a)((function(e){return Object(f.a)({error:!0,message:e.message})})))})(e).subscribe({next:E(e),complete:function(){return console.log("data-done")}})},disabled:!u,children:"\u83b7\u53d6m3u8"})]}),Object(y.jsxs)("div",{children:[Object(y.jsxs)("select",{name:B,id:B,onChange:function(e){return D(e.target.value)},children:[Object(y.jsx)("option",{value:"",children:"\u9009\u62e9"},""),Object.entries(L).map((function(e){var n=Object(l.a)(e,2),t=n[0],c=n[1];return Object(y.jsx)("option",{value:t,children:c},t)}))]}),Object(y.jsx)("button",{onClick:function(){S(L[B]).pipe(Object(v.a)((function(e){return new Uint8Array(e)}))).subscribe({next:function(e){console.log("mp4-url",e),M.push(e),M.flush()}})},disabled:!B,children:"\u83b7\u53d6mp4"})]})]}),Object(y.jsx)("div",{children:Object(y.jsx)("video",{id:"video",width:400,height:300,className:"video",controls:!0,ref:R})}),t&&Object(y.jsxs)("div",{children:[Object(y.jsx)("button",{onClick:function(){var e;return null===(e=R.current)||void 0===e?void 0:e.play()},children:"\u64ad\u653e"}),Object(y.jsx)("button",{onClick:function(){var e;return null===(e=R.current)||void 0===e?void 0:e.pause()},children:"\u6682\u505c"})]})]})},B=function(e){e&&e instanceof Function&&t.e(3).then(t.bind(null,90)).then((function(n){var t=n.getCLS,c=n.getFID,r=n.getFCP,i=n.getLCP,a=n.getTTFB;t(e),c(e),r(e),i(e),a(e)}))};a.a.render(Object(y.jsx)(r.a.StrictMode,{children:Object(y.jsx)(C,{})}),document.getElementById("root")),B()}},[[79,1,2]]]);
//# sourceMappingURL=main.952a7f85.chunk.js.map