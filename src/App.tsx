import { useEffect, useState } from "react";
import "./App.css";
import { useCommitText } from "./hooks/UseCommitText";
import { useHelia } from "./hooks/UseHelia";

function App() {
  const [text, setText] = useState("");
  const [retrieveText, setRetrieveText] = useState("");
  const { error, starting, helia } = useHelia();
  const { cidString, commitText, fetchCommittedText, committedText } =
    useCommitText();
  const [connectedPeers, setConnecedPeers] = useState(0);
  const [pinnedFiles, setPinnedFiles] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (helia) {
        const refreshHeliaData = async () => {
          const connectedPeers = helia.libp2p.getPeers();
          setConnecedPeers(connectedPeers.length);

          const pins: any = [];
          for await (const file of helia.pins.ls()) {
            pins.push(file.cid.toString());
          }
          setPinnedFiles(pins);
        };
        refreshHeliaData();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [helia]);

  return (
    <>
      <div
        id="heliaStatus"
        style={{
          border: `4px solid ${error ? "red" : starting ? "yellow" : "green"}`,
          paddingBottom: "4px",
        }}
      >
        IPFS Status
      </div>
      <input
        id="textInput"
        value={text}
        onChange={(event) => setText(event.target.value)}
        type="text"
      />
      <button id="commitTextButton" onClick={() => commitText(text)}>
        Add Text To Node
      </button>
      <div id="cidOutput">textCid: {cidString}</div>
      <input
        id="textInput"
        value={retrieveText}
        onChange={(event) => setRetrieveText(event.target.value)}
        type="text"
      />
      <>
        <button
          id="fetchCommittedTextButton"
          onClick={() => fetchCommittedText(retrieveText)}
        >
          Fetch Committed Text
        </button>
        <div id="committedTextOutput">Committed text: {committedText}</div>
      </>
      <div>Connected peers:{connectedPeers}</div>
      <div>
        Pinned files:
        {pinnedFiles.sort().map((file, index) => (
          <li key={index}>{file}</li>
        ))}
      </div>
    </>
  );
}

export default App;
