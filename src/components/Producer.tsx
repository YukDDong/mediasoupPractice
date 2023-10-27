import { useRecoilValue } from "recoil";
import styled from "styled-components";
import { socketState } from "../recoil/socket";
import { useEffect, useRef } from "react";
import { Device, types } from "mediasoup-client";
import { Socket } from "socket.io-client";

interface ProducerProps {
  currentSocket: Socket | undefined;
}

const Producer = ({ currentSocket }: ProducerProps) => {
  // const { currentSocket } = useRecoilValue(socketState);
  const myVideoRef = useRef<HTMLVideoElement>(null);

  let videoParams: any = {
    // mediasoup params
    encodings: [
      {
        rid: "r0",
        maxBitrate: 100000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r1",
        maxBitrate: 300000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r2",
        maxBitrate: 900000,
        scalabilityMode: "S1T3",
      },
    ],
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
    codecOptions: {
      videoGoogleStartBitrate: 1000,
    },
  };
  let audioParams: any;
  let rtpCapabilities: any;
  let device: Device | undefined;
  let producerTransport: types.Transport | undefined;
  let dtlsParameters: any;
  let videoProducer: types.Producer | undefined;
  let audioProducer: types.Producer | undefined;

  const streamSuccess = async (stream: MediaStream) => {
    if (myVideoRef.current) {
      myVideoRef.current.srcObject = stream;
    }

    videoParams = { track: stream.getVideoTracks()[0], ...videoParams };
    audioParams = { track: stream.getAudioTracks()[0], ...audioParams };
    getRtpCapabilities();
  };

  const getLocalStream = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
          video: {
            width: {
              min: 640,
              max: 1920,
            },
            height: {
              min: 400,
              max: 1080,
            },
          },
        })
        .then(streamSuccess)
        .catch((error) => {
          console.log(error.message);
        });
    } else {
      console.log("Browser doesn't support getUserMedia");
    }
  };

  // 2. get rtp capabilities
  const getRtpCapabilities = () => {
    // 서버로 요청을 전송합니다.
    currentSocket?.emit(
      "media",
      { action: "getRouterRtpCapabilities" },
      (response: any) => {
        console.log(
          `Router RTP Capabilities :`,
          response.routerRtpCapabilities
        );

        rtpCapabilities = response.routerRtpCapabilities;
        createDevice();
      }
    );
  };

  // 3. create device
  const createDevice = async () => {
    try {
      device = new Device();
      await device.load({
        routerRtpCapabilities: rtpCapabilities,
      });

      console.log("RTP Capabilities", rtpCapabilities);
      createSendTransport();
    } catch (error) {
      console.log(error);
      // if (error.name === "UnsupportedError")
      //   console.warn("browser not supported");
    }
  };

  // 4
  const createSendTransport = () => {
    currentSocket?.emit(
      "media",
      {
        action: "createWebRtcTransport",
        data: { type: "producer" },
      },
      (response: any) => {
        if (response.params.error) {
          console.log(response.params.error);
          return;
        }

        console.log("response", response);
        producerTransport = device?.createSendTransport(response.params);
        dtlsParameters = response.params.dtlsParameters;

        producerTransport?.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            console.log("transport Connect");
            try {
              // Signal local DTLS parameters to the server side transport
              console.log("22222222", dtlsParameters);
              await currentSocket.emit("media", {
                action: "connectWebRtcTransport",
                data: { dtlsParameters, type: "producer" },
              });
              // Tell the transport that parameters were transmitted.
              callback();
            } catch (error) {
              errback(error);
            }
          }
        );

        producerTransport?.on(
          "produce",
          async (parameters, callback, errback) => {
            console.log("3333333", parameters);

            try {
              // tell the server to create a Producer
              // with the following parameters and produce
              // and expect back a server side producer id
              await currentSocket.emit(
                "media",
                {
                  action: "produce",
                  data: {
                    kind: parameters.kind,
                    rtpParameters: parameters.rtpParameters,
                    appData: parameters.appData,
                  },
                },
                (id) => {
                  // Tell the transport that parameters were transmitted and provide it with the
                  // server side producer's id.
                  console.log("444444", id);
                  callback({ id });
                }
              );
            } catch (error) {
              errback(error);
            }
          }
        );

        connectSendTransport();
      }
    );
  };

  // 5
  const connectSendTransport = async () => {
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // 위의 'connect' and 'produce' 이벤트를 발생시킵니다.
    videoProducer = await producerTransport?.produce(videoParams);
    audioProducer = await producerTransport?.produce(audioParams);

    videoProducer?.on("trackended", () => {
      console.log("video track ended");

      // close video track
    });

    videoProducer?.on("transportclose", () => {
      console.log("video transport ended");

      // close video track
    });

    audioProducer?.on("trackended", () => {
      console.log("audio track ended");

      // close video track
    });

    audioProducer?.on("transportclose", () => {
      console.log("audio transport ended");

      // close video track
    });
  };

  // const handleTotalFlow = async () => {
  //   await getLocalStream();
  //   await getRtpCapabilities();
  //   await createSendTransport();
  //   await connectSendTransport();
  // };

  console.log(currentSocket);

  useEffect(() => {
    if (!currentSocket) return;

    // handleTotalFlow();
    getLocalStream();
    // getRtpCapabilities();
    // connectSendTransport();
    // // createDevice();
    // await createSendTransport();
    // await connectSendTransport();
  }, [currentSocket]);

  return (
    <VideoContainer>
      <h2>내가 스트리머란다.</h2>
      <Video ref={myVideoRef} autoPlay muted />
    </VideoContainer>
  );
};

export default Producer;

export const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  > h2 {
    color: blue;
  }
`;

export const Video = styled.video`
  width: 100%;
  background-color: brown;
`;
