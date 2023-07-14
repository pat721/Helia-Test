import { useContext } from "react";
import { HeliaContext } from "../providers/HeliaProviders";

export const useHelia = () => {
  const { helia, fs, error, starting } = useContext(HeliaContext);
  return { helia, fs, error, starting };
};
