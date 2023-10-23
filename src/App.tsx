import styled from "styled-components";
import "./App.css";
import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

function App() {
  return (
    <>
      <VideoContainer>
        <p>my video</p>
        <Video autoPlay />
      </VideoContainer>
      <VideoContainer>
        <p>others video</p>
        <Video autoPlay />
      </VideoContainer>
    </>
  );
}

export default App;

const Video = styled.video`
  width: 360px;
  background-color: black;
  margin: 2px 0;
`;

const VideoContainer = styled.div`
  padding: 5;
  background-color: papayawhip;
  display: flex;
  justify-content: center;
`;
