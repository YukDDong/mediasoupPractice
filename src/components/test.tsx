// import styled from "styled-components";
// import { useRef, useState } from "react";
// import { io, Socket } from "socket.io-client";
// import { Device, types } from "mediasoup-client";

// function App() {
//   const roomNameRef = useRef<HTMLInputElement>(null);
//   const userNameRef = useRef<HTMLInputElement>(null);
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const producerVideoRef = useRef<HTMLVideoElement>(null);
//   const [currentSocket, setCurrentSocket] = useState<Socket>();

//   let params: any = {
//     // mediasoup params
//     encodings: [
//       {
//         rid: "r0",
//         maxBitrate: 100000,
//         scalabilityMode: "S1T3",
//       },
//       {
//         rid: "r1",
//         maxBitrate: 300000,
//         scalabilityMode: "S1T3",
//       },
//       {
//         rid: "r2",
//         maxBitrate: 900000,
//         scalabilityMode: "S1T3",
//       },
//     ],
//     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
//     codecOptions: {
//       videoGoogleStartBitrate: 1000,
//     },
//   };
//   let rtpCapabilities: any;
//   let device: Device | undefined;
//   let producerTransport: types.Transport | undefined;
//   let dtlsParameters: any;
//   let producer: types.Producer | undefined;
//   let consumer: types.Consumer | undefined;
//   let consumerTransport: types.Transport | undefined;

//   const handleConnectSocket = () => {
//     const session_id = roomNameRef.current?.value;
//     const user_id = userNameRef.current?.value;

//     console.log("session_id", session_id);
//     console.log("user_id", user_id);

//     const socket: Socket = io(
//       `http://localhost:8081?user_id=${user_id}&session_id=${session_id}`
//     );

//     // 소켓 연결
//     socket.on("connect", () => {
//       setCurrentSocket(socket);
//       console.log("socket", socket);
//       console.log("Connected to the server");
//     });
//   };

//   // 비디오 가져오는게 성공하면 내 화면에 비디오 띄움(스트리머의 경우)
//   const streamSuccess = async (stream: MediaStream) => {
//     if (myVideoRef.current) {
//       myVideoRef.current.srcObject = stream;
//     }
//     const track = stream.getVideoTracks()[0];
//     params = {
//       track,
//       ...params,
//     };
//   };

//   // 1. 내 비디오를 가져오는 과정(실제 플젝에서는 스트리머만 필요한 부분일듯)
//   const getLocalStream = () => {
//     if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//       navigator.mediaDevices
//         .getUserMedia({
//           audio: false,
//           video: {
//             width: {
//               min: 640,
//               max: 1920,
//             },
//             height: {
//               min: 400,
//               max: 1080,
//             },
//           },
//         })
//         .then(streamSuccess)
//         .catch((error) => {
//           console.log(error.message);
//         });
//     } else {
//       console.log("Browser doesn't support getUserMedia");
//     }
//   };

//   // 2. get rtp capabilities
//   const getRtpCapabilities = () => {
//     // 서버로 요청을 전송합니다.
//     currentSocket?.emit(
//       "media",
//       { action: "getRouterRtpCapabilities" },
//       (response: any) => {
//         console.log(
//           `Router RTP Capabilities :`,
//           response.routerRtpCapabilities
//         );

//         rtpCapabilities = response.routerRtpCapabilities;
//       }
//     );
//   };

//   // 3. create device
//   const createDevice = async () => {
//     try {
//       device = new Device();
//       await device.load({
//         routerRtpCapabilities: rtpCapabilities,
//       });

//       console.log("RTP Capabilities", rtpCapabilities);
//     } catch (error) {
//       console.log(error);
//       // if (error.name === "UnsupportedError")
//       //   console.warn("browser not supported");
//     }
//   };

//   // 4
//   const createSendTransport = () => {
//     currentSocket?.emit(
//       "media",
//       {
//         action: "createWebRtcTransport",
//         data: { type: "producer" },
//       },
//       (response: any) => {
//         if (response.params.error) {
//           console.log(response.params.error);
//           return;
//         }
//         producerTransport = device?.createSendTransport(response.params);
//         dtlsParameters = response.params.dtlsParameters;

//         producerTransport?.on(
//           "connect",
//           async ({ dtlsParameters }, callback, errback) => {
//             console.log("transport Connect");
//             try {
//               // Signal local DTLS parameters to the server side transport
//               console.log("22222222", dtlsParameters);
//               await currentSocket.emit("media", {
//                 action: "connectWebRtcTransport",
//                 data: { dtlsParameters, type: "producer" },
//               });
//               // Tell the transport that parameters were transmitted.
//               callback();
//             } catch (error) {
//               errback(error);
//             }
//           }
//         );

//         producerTransport?.on(
//           "produce",
//           async (parameters, callback, errback) => {
//             console.log("3333333", parameters);

//             try {
//               // tell the server to create a Producer
//               // with the following parameters and produce
//               // and expect back a server side producer id
//               await currentSocket.emit(
//                 "media",
//                 {
//                   action: "produce",
//                   data: {
//                     kind: parameters.kind,
//                     rtpParameters: parameters.rtpParameters,
//                     appData: parameters.appData,
//                   },
//                 },
//                 (id) => {
//                   // Tell the transport that parameters were transmitted and provide it with the
//                   // server side producer's id.
//                   console.log("444444", id);
//                   callback({ id });
//                 }
//               );
//             } catch (error) {
//               errback(error);
//             }
//           }
//         );
//       }
//     );
//   };

//   // 5
//   const connectSendTransport = async () => {
//     // we now call produce() to instruct the producer transport
//     // to send media to the Router
//     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
//     // 위의 'connect' and 'produce' 이벤트를 발생시킵니다.
//     producer = await producerTransport?.produce(params);

//     producer?.on("trackended", () => {
//       console.log("track ended");

//       // close video track
//     });

//     producer?.on("transportclose", () => {
//       console.log("transport ended");

//       // close video track
//     });
//   };

//   // 6
//   const createRecvTransport = async () => {
//     await currentSocket?.emit(
//       "media",
//       {
//         action: "createWebRtcTransport",
//         data: { type: "consumer" },
//         user_id: "test-producer",
//       },
//       (response: any) => {
//         if (response.params.error) {
//           console.log(response.params.error);
//           return;
//         }

//         console.log("55555555", response);

//         // creates a new WebRTC Transport to receive media
//         // based on server's consumer transport params
//         // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
//         consumerTransport = device?.createRecvTransport(response.params);

//         // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
//         // this event is raised when a first call to transport.produce() is made
//         dtlsParameters = response.params.dtlsParameters;
//         consumerTransport?.on(
//           "connect",
//           async ({ dtlsParameters }, callback, errback) => {
//             try {
//               // Signal local DTLS parameters to the server side transport
//               // see server's socket.on('transport-recv-connect', ...)
//               await currentSocket?.emit("media", {
//                 action: "connectWebRtcTransport",
//                 data: { dtlsParameters, type: "consumer" },
//               });

//               // Tell the transport that parameters were transmitted.
//               callback();
//             } catch (error) {
//               // Tell the transport that something was wrong
//               errback(error);
//             }
//           }
//         );
//       }
//     );
//   };

//   // 7
//   const connectRecvTransport = async () => {
//     // for consumer, we need to tell the server first
//     // to create a consumer based on the rtpCapabilities and consume
//     // if the router can consume, it will send back a set of params as below
//     console.log(device);
//     await currentSocket?.emit(
//       "media",
//       {
//         action: "consume",
//         data: {
//           rtpCapabilities: device?.rtpCapabilities,
//           kind: "video",
//           user_id: "ddong",
//         },
//       },
//       async (response) => {
//         if (response.error) {
//           console.log("Cannot Consume");
//           return;
//         }

//         console.log("666666", response);
//         // then consume with the local consumer transport
//         // which creates a consumer
//         consumer = await consumerTransport?.consume({
//           id: response.id,
//           producerId: response.producerId,
//           kind: response.kind,
//           rtpParameters: response.rtpParameters,
//         });

//         console.log("consumer", consumer);
//         const track = consumer?.track;
//         // destructure and retrieve the video track from the producer
//         // const { _track } = consumer;
//         console.log("track", track);
//         if (track && producerVideoRef.current) {
//           const remoteStream = new MediaStream();
//           remoteStream.addTrack(track);
//           producerVideoRef.current.srcObject = remoteStream;
//         }

//         // // the server consumer started with media paused
//         // // so we need to inform the server to resume
//         // socket.emit('producerresume');
//       }
//     );
//   };

//   return (
//     <div style={{ width: "100%", height: "100vh", backgroundColor: "pink" }}>
//       <p>ddong</p>
//       <label htmlFor="roomName">방이름</label>
//       <input id="roomName" type="text" ref={roomNameRef} />
//       <label htmlFor="userName">유저이름</label>
//       <input id="userName" type="text" ref={userNameRef} />
//       <button onClick={handleConnectSocket}>소켓 연결</button>
//       <VideoContainer>
//         <p>my video</p>
//         <Video autoPlay ref={myVideoRef} />
//       </VideoContainer>
//       <VideoContainer>
//         <p>others video</p>
//         <Video autoPlay ref={producerVideoRef} />
//       </VideoContainer>
//       <button onClick={getLocalStream}>1.getLocalStream</button>
//       <button onClick={getRtpCapabilities}>2.getRtpCapabilities</button>
//       <button onClick={createDevice}>3.createDevice</button>
//       <button onClick={createSendTransport}>4.createSendTransport</button>
//       <button onClick={connectSendTransport}>5.connectSendTransport</button>
//       <button onClick={createRecvTransport}>6.createRecvTransport</button>
//       <button onClick={connectRecvTransport}>7.connectRecvTransport</button>
//     </div>
//   );
// }

// export default App;

// const Video = styled.video`
//   width: 360px;
//   background-color: black;
//   margin: 2px 0;
// `;

// const VideoContainer = styled.div`
//   padding: 5;
//   background-color: red;
//   display: flex;
//   justify-content: center;
//   margin-bottom: 10px;
// `;
