import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";

import { print } from "../utils/core_constants.js";


const main = async () => {
    const node = await createLibp2p({
        addresses: {
            listen: ["/ip4/127.0.0.1/tcp/0"],
        },
        transports: [tcp()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
    });

    await node.start();
    print("Libp2p node started");

    print("Listening on addresses:");
    node.getMultiaddrs().forEach(addr => {
        print(addr.toString());
    })

    await node.stop();
    print("Libp2p node stopped");
}

main().then().catch(err => print(err));