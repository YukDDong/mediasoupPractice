import { useRef } from "react";
import { useSetRecoilState } from "recoil";
import { Socket, io } from "socket.io-client";
import styled from "styled-components";
import { socketState } from "../recoil/socket";
import { userState } from "../recoil/user";

interface ConnectSocketProps {
  setCurrentSocket: (socket: Socket) => void;
}

const ConnectSocket = ({ setCurrentSocket }: ConnectSocketProps) => {
  const setUser = useSetRecoilState(userState);
  const roomNameRef = useRef<HTMLInputElement>(null);
  const userNameRef = useRef<HTMLInputElement>(null);

  const handleConnectSocket = () => {
    const session_id = roomNameRef.current?.value;
    const user_id = userNameRef.current?.value;

    if (!session_id?.trim() || !user_id?.trim()) {
      alert("ROOM 또는 USERNAME을 입력해주세요.");
      return;
    }

    const socket: Socket = io(
      // `http://localhost:8081?user_id=${user_id}&session_id=${session_id}`
      `http://3.34.5.151:8081?user_id=${user_id}&session_id=${session_id}`
    );

    // 소켓 연결
    socket.on("connect", () => {
      setCurrentSocket(socket);
      setUser({ userId: user_id });
      console.log("Connected to the server");
    });
  };

  return (
    <Container>
      <h2>ekfhd5537의 방</h2>
      <Label>ROOM</Label>
      <Input ref={roomNameRef} />
      <Label>USERNAME</Label>
      <Input ref={userNameRef} />
      <ConnectBtn onClick={handleConnectSocket}>소켓 연결</ConnectBtn>
    </Container>
  );
};

export default ConnectSocket;

const Container = styled.div`
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding: 10px 40px;
  gap: 20px;
`;

const Label = styled.label`
  width: 100%;
  font-weight: 900;
  font-size: 20px;
`;

const Input = styled.input`
  width: 100%;
  height: 20px;
`;

const ConnectBtn = styled.button`
  width: 50%;
  background-color: lightgreen;
  margin-top: 20px;
`;
