import { atomWithStorage, createJSONStorage } from "jotai/utils";
import Cookies from "js-cookie";

const cookieStorage = createJSONStorage<any>(() => ({
  getItem: () => Cookies.get("authTokens"),
  removeItem: (key) => Cookies.remove(key),
  setItem: (key, value) => Cookies.set(key, value, { expires: 30 }),
}));

export const authTokensAtom = atomWithStorage<any | null>(
  "authTokens",
  null,
  cookieStorage
);
