import { atom } from "recoil";

export interface UserType {
  userId: string;
}

export const userState = atom<UserType>({
  key: "userState",
  default: {
    userId: "",
  },
});
