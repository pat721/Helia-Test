/* eslint-disable no-console */

import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { UnixFS, unixfs } from "@helia/unixfs";
import { bootstrap } from "@libp2p/bootstrap";
import { mplex } from "@libp2p/mplex";
import { webRTC, webRTCDirect } from "@libp2p/webrtc";
import { webSockets } from "@libp2p/websockets";
import { all as WebSocketsFiltersAll } from "@libp2p/websockets/filters";
import { webTransport } from "@libp2p/webtransport";
import { createHelia } from "helia";
import { createLibp2p } from "libp2p";

import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { autoNATService } from "libp2p/autonat";
import { circuitRelayTransport } from "libp2p/circuit-relay";
import { identifyService } from "libp2p/identify";

import { ipnsSelector, ipnsValidator } from "@helia/ipns";
import { ipniContentRouting } from "@libp2p/ipni-content-routing";
import { kadDHT } from "@libp2p/kad-dht";
import PropTypes from "prop-types";
import { createContext, useCallback, useEffect, useState } from "react";

import { LevelBlockstore } from "blockstore-level";
import { LevelDatastore } from "datastore-level";

import { pubsubPeerDiscovery } from "@libp2p/pubsub-peer-discovery";

import { pingService } from "libp2p/ping";

import { circuitRelayServer } from "libp2p/circuit-relay";
import { IDBBlockstore } from "blockstore-idb";

declare const window: Window &
  typeof globalThis & {
    helia: import("@helia/interface").Helia;
  };

export interface HeliaProviderContextProps {
  helia: import("@helia/interface").Helia;
  fs: UnixFS;
  error: boolean;
  starting: boolean;
}

export const HeliaContext = createContext({} as HeliaProviderContextProps);

export interface HeliaProviderProps {
  children: React.ReactNode;
}

async function createNode() {
  // the blockstore is where we store the blocks that make up files
  const blockstore = new IDBBlockstore("ipfs-blockstore");
  //const blockstore = new LevelBlockstore(localSafedBlockstore);
  await blockstore.open();

  // application-specific data lives in the datastore
  const datastore = new LevelDatastore("ipfs-datastore");
  await datastore.open();

  // libp2p is the networking layer that underpins Helia

  const libp2p = await createLibp2p({
    datastore,
    addresses: {
      listen: ["/webrtc", "/webrtc-direct"],
    },
    transports: [
      webRTC(),
      webRTCDirect(),
      webTransport(),
      webSockets({ filter: WebSocketsFiltersAll }),
      circuitRelayTransport({
        discoverRelays: 5,
      }),
    ],
    connectionManager: {
      maxParallelDials: 150, // 150 total parallel multiaddr dials
      maxParallelDialsPerPeer: 4, // Allow 4 multiaddrs to be dialed per peer in parallel
      dialTimeout: 10e3, // 10 second dial timeout per peer dial
    },
    connectionGater: {
      denyDialMultiaddr: () => {
        return false;
      },
    },
    contentRouters: [ipniContentRouting("https://cid.contact")],
    services: {
      relay: circuitRelayServer(),
      identify: identifyService(),
      ping: pingService(),
      autoNAT: autoNATService(),
      pubsub: gossipsub({
        enabled: true,
        emitSelf: true,
        allowPublishToZeroPeers: true,
      }),
      dht: kadDHT({
        clientMode: true,
        kBucketSize: 20,
        validators: {
          ipns: ipnsValidator,
        },
        selectors: {
          ipns: ipnsSelector,
        },
      }),
    },
    connectionEncryption: [noise()],
    streamMuxers: [yamux(), mplex()],
    peerDiscovery: [
      pubsubPeerDiscovery({ interval: 1000 }),
      bootstrap({
        list: [
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
          "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt",
          "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
        ],
      }),
    ],
  });

  // Listen for new peers
  /*
        helia.libp2p.addEventListener("peer:discovery", (evt) => {
          // dial them when we discover them
          helia.libp2p.dial(peer.id).catch((err) => {
            console.log(`Could not dial ${peer.id}`, err);
          });
        });
        // Listen for new connections to peers
        helia.libp2p.addEventListener("peer:connect", (evt) => {
          const connection = evt.detail;
          console.log(`Connected to ${connection.toString()}`);
        });
        // Listen for peers disconnecting
        helia.libp2p.addEventListener("peer:disconnect", (evt) => {
          const connection = evt.detail;
          console.log(`Disconnected from ${connection.toCID().toString()}`);
        });
        */

  return await createHelia({
    datastore,
    blockstore,
    libp2p,
  });
}

export const HeliaProvider: React.FC<HeliaProviderProps> = ({ children }) => {
  const [helia, setHelia] = useState<any>();
  const [fs, setFs] = useState<any>();
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState(false);

  const startHelia = useCallback(async () => {
    if (helia) {
      console.info("helia already started");
      // eslint-disable-next-line no-dupe-else-if
    } else {
      try {
        console.info("Starting Helia");
        const helia = await createNode();
        await helia.libp2p.start();

        setHelia(helia);
        setFs(unixfs(helia));
        setStarting(false);

        console.info("Starting Helia as Peer:", helia.libp2p.getMultiaddrs());
      } catch (e) {
        console.error(e);
        setError(true);
      }
    }
  }, []);

  useEffect(() => {
    const start = async () => {
      await startHelia();
    };
    start();
  }, [startHelia]);

  return (
    <HeliaContext.Provider
      value={{
        helia,
        fs,
        error,
        starting,
      }}
    >
      {children}
    </HeliaContext.Provider>
  );
};

HeliaProvider.propTypes = {
  children: PropTypes.any,
};
