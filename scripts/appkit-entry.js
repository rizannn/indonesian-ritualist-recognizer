import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { defineChain } from "@reown/appkit/networks";

const projectId = "ritual-wordle-demo";

const ritualNetwork = defineChain({
  id: 1979,
  caipNetworkId: "eip155:1979",
  chainNamespace: "eip155",
  name: "Ritual Chain",
  nativeCurrency: {
    decimals: 18,
    name: "RITUAL",
    symbol: "RITUAL"
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.ritualfoundation.org"]
    },
    public: {
      http: ["https://rpc.ritualfoundation.org"]
    }
  },
  blockExplorers: {
    default: {
      name: "Ritual Explorer",
      url: "https://explorer.ritualfoundation.org"
    }
  }
});

const metadata = {
  name: "Indonesian Ritualist Recognizer",
  description: "On-chain Ritual community recognition",
  url: window.location.origin,
  icons: [`${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, "/")}assets/ritual-logo.jpg`]
};

const modal = createAppKit({
  adapters: [new EthersAdapter()],
  enableMobileFullScreen: true,
  features: {
    analytics: false,
    email: false,
    socials: false
  },
  metadata,
  networks: [ritualNetwork],
  projectId,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#1fff2b",
    "--w3m-border-radius-master": "2px"
  }
});

window.RIRAppKit = {
  modal,
  ritualNetwork
};
