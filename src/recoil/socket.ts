import { atom } from "recoil";
// import { Socket } from "socket.io-client";

export interface SocketType {
  currentSocket: any;
}

export const socketState = atom<SocketType>({
  key: "socketState",
  default: {
    currentSocket: undefined,
  },
});
