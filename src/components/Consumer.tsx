import { useRecoilValue } from "recoil";
import { Video, VideoContainer } from "./Producer";
// import { socketState } from "../recoil/socket";
import { Socket } from "socket.io-client";
import { useEffect, useRef } from "react";
import { Device, types } from "mediasoup-client";
import { userState } from "../recoil/user";

interface ConsumerProps {
  currentSocket: Socket | undefined;
}

const Consumer = ({ currentSocket }: ConsumerProps) => {
  const producerVideoRef = useRef<HTMLVideoElement>(null);
  const producerAudioRef = useRef<HTMLAudioElement>(null);
  const { userId } = useRecoilValue(userState);
  let rtpCapabilities: any;
  let device: Device | undefined;
  let consumer: types.Consumer | undefined;
  let consumerTransport: types.Transport | undefined;
  // let dtlsParameters: any;

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
      createRecvTransport();
    } catch (error) {
      console.log(error);
      // if (error.name === "UnsupportedError")
      //   console.warn("browser not supported");
    }
  };

  // 6
  const createRecvTransport = async () => {
    await currentSocket?.emit(
      "media",
      {
        action: "createWebRtcTransport",
        data: { type: "consumer" },
        user_id: userId,
      },
      (response: any) => {
        if (response.params.error) {
          console.log(response.params.error);
          return;
        }

        console.log("55555555", response);

        // creates a new WebRTC Transport to receive media
        // based on server's consumer transport params
        // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
        consumerTransport = device?.createRecvTransport(response.params);

        // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
        // this event is raised when a first call to transport.produce() is made
        // dtlsParameters = response.params.dtlsParameters;
        consumerTransport?.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            try {
              // Signal local DTLS parameters to the server side transport
              // see server's socket.on('transport-recv-connect', ...)
              await currentSocket?.emit("media", {
                action: "connectWebRtcTransport",
                data: { dtlsParameters, type: "consumer" },
              });

              // Tell the transport that parameters were transmitted.
              callback();
            } catch (error) {
              console.log(error);
              // Tell the transport that something was wrong
              // errback(error);
            }
          }
        );

        connectRecvTransport();
      }
    );
  };

  // 7
  const connectRecvTransport = async () => {
    // for consumer, we need to tell the server first
    // to create a consumer based on the rtpCapabilities and consume
    // if the router can consume, it will send back a set of params as below
    console.log("connectRecvTransport");
    await currentSocket?.emit(
      "media",
      {
        action: "consume",
        data: {
          rtpCapabilities: device?.rtpCapabilities,
          kind: "video",
          user_id: "ekfhd5537",
        },
      },
      async (response: any) => {
        if (response.error) {
          console.log("Cannot Consume");
          return;
        }
        console.log("666666", response);
        // then consume with the local consumer transport
        // which creates a consumer
        consumer = await consumerTransport?.consume({
          id: response.id,
          producerId: response.producerId,
          kind: response.kind,
          rtpParameters: response.rtpParameters,
        });

        console.log("consumer", consumer);
        const track = consumer?.track;
        // destructure and retrieve the video track from the producer
        // const { _track } = consumer;
        console.log("track", track);
        if (track && producerVideoRef.current) {
          const remoteStream = new MediaStream();
          remoteStream.addTrack(track);
          producerVideoRef.current.srcObject = remoteStream;
        }

        // // the server consumer started with media paused
        // // so we need to inform the server to resume
        // socket.emit('producerresume');
      }
    );
    await currentSocket?.emit(
      "media",
      {
        action: "consume",
        data: {
          rtpCapabilities: device?.rtpCapabilities,
          kind: "audio",
          user_id: "ekfhd5537",
        },
      },
      async (response: any) => {
        if (response.error) {
          console.log("Cannot Consume");
          return;
        }
        console.log("666666", response);
        // then consume with the local consumer transport
        // which creates a consumer
        consumer = await consumerTransport?.consume({
          id: response.id,
          producerId: response.producerId,
          kind: response.kind,
          rtpParameters: response.rtpParameters,
        });

        console.log("consumer", consumer);
        const track = consumer?.track;
        // destructure and retrieve the video track from the producer
        // const { _track } = consumer;
        console.log("track", track);
        if (track && producerAudioRef.current) {
          const remoteStream = new MediaStream();
          remoteStream.addTrack(track);
          producerAudioRef.current.srcObject = remoteStream;
        }

        // // the server consumer started with media paused
        // // so we need to inform the server to resume
        // socket.emit('producerresume');
      }
    );
  };

  useEffect(() => {
    if (!currentSocket) return;

    getRtpCapabilities();
  }, [currentSocket]);
  return (
    <VideoContainer>
      <h2>나는 시청자란다.</h2>
      <Video ref={producerVideoRef} autoPlay />
      <audio ref={producerAudioRef} autoPlay />
    </VideoContainer>
  );
};

export default Consumer;
