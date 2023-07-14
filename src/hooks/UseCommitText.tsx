/* eslint-disable no-console */

import { useState, useCallback } from "react";
import { CID } from "multiformats/cid";
import { useHelia } from "./UseHelia";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const useCommitText = () => {
  const { helia, fs, error, starting } = useHelia();
  const [cid, setCid] = useState<CID | null>(null);
  const [cidString, setCidString] = useState("");
  const [committedText, setCommittedText] = useState("");

  const commitText = useCallback(
    async (text: any) => {
      if (!error && !starting) {
        try {
          const cid = await fs.addBytes(encoder.encode(text));
          setCid(cid);
          setCidString(cid.toString());
          helia.pins.add(cid);
          console.log("Added file:", cid.toString());
        } catch (e) {
          console.error(e);
        }
      } else {
        console.log("please wait for helia to start");
      }
    },
    [error, starting, helia]
  );

  const fetchCommittedText = useCallback(
    async (cidToFetch: string) => {
      let text = "";
      if (!error && !starting) {
        try {
          for await (const chunk of fs.cat(CID.parse(cidToFetch))) {
            text += decoder.decode(chunk, {
              stream: true,
            });
          }
          setCommittedText(text);
        } catch (e) {
          console.error(e);
        }
      } else {
        console.log("please wait for helia to start");
      }
    },
    [error, starting, cid, helia]
  );

  return { cidString, committedText, commitText, fetchCommittedText };
};
