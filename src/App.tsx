import styled from "styled-components";
import ConnectSocket from "./components/ConnectSocket";
import { useRecoilValue } from "recoil";
import { userState } from "./recoil/user";
import Producer from "./components/Producer";
import Consumer from "./components/Consumer";
import { useState } from "react";
import { Socket } from "socket.io-client";

const App = () => {
  const { userId } = useRecoilValue(userState);
  const [currentSocket, setCurrentSocket] = useState<Socket>();
  return (
    <TotalDiv>
      <LeftSide>
        <ConnectSocket setCurrentSocket={setCurrentSocket} />
      </LeftSide>
      <RightSide>
        {userId === "ekfhd5537" ? (
          <Producer currentSocket={currentSocket} />
        ) : (
          <Consumer currentSocket={currentSocket} />
        )}
      </RightSide>
    </TotalDiv>
  );
};

export default App;

const TotalDiv = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
`;

const LeftSide = styled.div`
  width: 400px;
  height: 100vh;
  background-color: beige;
`;

const RightSide = styled.div`
  width: calc(100vw - 400px);
  height: 100vh;
  background-color: gray;
`;
