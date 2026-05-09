(function () {
  const contractAbi = [
    "function answer(uint256 profileId, bool knows)",
    "function answerBatch(uint256[] profileIds, bool[] knows)",
    "function answerBatchVerified(uint256[] profileIds, bool[] knows, uint256 ttl)",
    "function getProfile(uint256 profileId) view returns (string xUsername, string displayName, string avatarURI, string metadataURI, bytes32 metadataHash, uint256 knowCount, uint256 doNotKnowCount)",
    "function getAnswer(uint256 profileId, address voter) view returns (uint8)",
    "function httpExecutor() view returns (address)",
    "function lastVerificationHash(address) view returns (bytes32)"
  ];

  const twitterProxyBaseUrl = "https://ritual-twitter-proxy.artelamon.workers.dev/api/twitter";
  const explorerBaseUrl = "https://explorer.ritualfoundation.org";
  const contractAddress = "0x29682b24E056dCE515747047c9ED34a73Be665a8";
  const batchSubmitChunkSize = Number.MAX_SAFE_INTEGER;
  const plainBatchGasLimit = 6000000;
  const ritualChain = {
    blockExplorerUrls: [explorerBaseUrl],
    chainId: "0x7bb",
    chainName: "Ritual Chain",
    nativeCurrency: {
      decimals: 18,
      name: "RITUAL",
      symbol: "RITUAL"
    },
    rpcUrls: ["https://rpc.ritualfoundation.org"]
  };
  const profiles = window.RITUALIST_PROFILES || [];
  const profileCache = new Map();
  const statsByProfileId = new Map();

  for (const [username, profile] of Object.entries(window.RITUALIST_PROFILE_CACHE || {})) {
    profileCache.set(username.toLowerCase(), profile);
  }

  const elements = {
    avatar: document.getElementById("avatar"),
    backToUsername: document.getElementById("backToUsername"),
    candidateInitial: document.getElementById("candidateInitial"),
    completionAvatar: document.getElementById("completionAvatar"),
    completionCard: document.getElementById("completionCard"),
    completionChainStatus: document.getElementById("completionChainStatus"),
    completionInitial: document.getElementById("completionInitial"),
    completionName: document.getElementById("completionName"),
    completionTotal: document.getElementById("completionTotal"),
    completionUsername: document.getElementById("completionUsername"),
    completedCount: document.getElementById("completedCount"),
    connectWallet: document.getElementById("connectWallet"),
    displayName: document.getElementById("displayName"),
    downloadResult: document.getElementById("downloadResult"),
    doNotKnowCount: document.getElementById("doNotKnowCount"),
    knowCount: document.getElementById("knowCount"),
    gateViewerAvatar: document.getElementById("gateViewerAvatar"),
    gateViewerInitial: document.getElementById("gateViewerInitial"),
    gateViewerName: document.getElementById("gateViewerName"),
    gateViewerUsername: document.getElementById("gateViewerUsername"),
    leaderboardList: document.getElementById("leaderboardList"),
    nextProfile: document.getElementById("nextProfile"),
    previousProfile: document.getElementById("previousProfile"),
    profileBio: document.getElementById("profileBio"),
    profileCounter: document.getElementById("profileCounter"),
    progressFill: document.getElementById("progressFill"),
    recognitionCard: document.getElementById("recognitionCard"),
    recognizerApp: document.getElementById("recognizerApp"),
    refreshLeaderboard: document.getElementById("refreshLeaderboard"),
    remainingCount: document.getElementById("remainingCount"),
    setupConnectWallet: document.getElementById("setupConnectWallet"),
    statusLine: document.getElementById("statusLine"),
    submitBatchAnswers: document.getElementById("submitBatchAnswers"),
    totalCount: document.getElementById("totalCount"),
    userPill: document.getElementById("userPill"),
    usernameForm: document.getElementById("usernameForm"),
    usernameGate: document.getElementById("usernameGate"),
    usernameLoading: document.getElementById("usernameLoading"),
    usernameSubmit: document.getElementById("usernameSubmit"),
    viewerAvatar: document.getElementById("viewerAvatar"),
    viewerInitial: document.getElementById("viewerInitial"),
    viewerName: document.getElementById("viewerName"),
    viewerUsername: document.getElementById("viewerUsername"),
    viewerUsernameInput: document.getElementById("viewerUsernameInput"),
    walletGate: document.getElementById("walletGate"),
    walletGateHint: document.getElementById("walletGateHint"),
    voteDoNotKnow: document.getElementById("voteDoNotKnow"),
    voteKnow: document.getElementById("voteKnow"),
    xLink: document.getElementById("xLink")
  };

  const state = {
    account: "",
    activeIndex: 0,
    chainId: "",
    batchSubmitted: false,
    batchSubmitting: false,
    completedProfileIds: new Set(),
    onchainAnsweredProfileIds: new Set(),
    pendingAnswers: new Map(),
    appKitProviderUnsubscribe: null,
    metaMaskSdk: null,
    provider: null,
    publicProvider: null,
    signer: null,
    viewerProfile: null,
    viewerProfileRequestId: 0,
    walletEventsProvider: null,
    walletProvider: null,
    walletProviderSource: "",
    viewerUsername: ""
  };

  function normalizeUsername(username) {
    return (username || "").trim().replace(/^@/, "");
  }

  function completedStorageKey() {
    const owner = state.account || state.viewerUsername || "local";
    return `rir.completed.${owner.toLowerCase()}`;
  }

  function pendingAnswersStorageKey() {
    const owner = state.account || state.viewerUsername || "local";
    return `rir.pendingAnswers.${owner.toLowerCase()}`;
  }

  function batchSubmittedStorageKey() {
    const owner = state.account || state.viewerUsername || "local";
    return `rir.batchSubmitted.${owner.toLowerCase()}`;
  }

  function loadCompleted() {
    try {
      const rawPendingAnswers = localStorage.getItem(pendingAnswersStorageKey());
      const parsedPendingAnswers = rawPendingAnswers ? JSON.parse(rawPendingAnswers) : {};
      state.pendingAnswers = new Map(Object.entries(parsedPendingAnswers));
      state.completedProfileIds = new Set(state.pendingAnswers.keys());
      state.batchSubmitted = localStorage.getItem(batchSubmittedStorageKey()) === "true";
    } catch {
      state.pendingAnswers = new Map();
      state.completedProfileIds = new Set();
      state.batchSubmitted = false;
    }
  }

  function saveCompleted() {
    localStorage.setItem(completedStorageKey(), JSON.stringify([...state.completedProfileIds]));
  }

  function savePendingAnswers() {
    localStorage.setItem(pendingAnswersStorageKey(), JSON.stringify(Object.fromEntries(state.pendingAnswers)));
    saveCompleted();
  }

  function saveBatchSubmitted(isSubmitted) {
    state.batchSubmitted = isSubmitted;
    localStorage.setItem(batchSubmittedStorageKey(), isSubmitted ? "true" : "false");
  }

  function hasPendingAnswer(profile) {
    return Boolean(profile && state.pendingAnswers.has(profile.profileId));
  }

  function isProfileAnswered(profile) {
    return Boolean(
      profile &&
        (state.completedProfileIds.has(profile.profileId) || state.onchainAnsweredProfileIds.has(profile.profileId))
    );
  }

  function setStatus(message) {
    elements.statusLine.textContent = message;
  }

  function setWalletHint(message) {
    elements.walletGateHint.textContent = message;
  }

  function setStatusLink(message, href, label) {
    elements.statusLine.replaceChildren(document.createTextNode(`${message} `));

    if (!href) {
      return;
    }

    const link = document.createElement("a");
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = label;
    elements.statusLine.append(link);
  }

  function hasWalletProvider() {
    return Boolean(walletProvider());
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
  }

  function normalizeChainId(chainId) {
    if (typeof chainId === "number") {
      return `0x${chainId.toString(16)}`;
    }

    if (typeof chainId === "bigint") {
      return `0x${chainId.toString(16)}`;
    }

    if (typeof chainId === "string" && chainId) {
      return chainId.startsWith("0x") ? chainId.toLowerCase() : `0x${Number(chainId).toString(16)}`;
    }

    return "";
  }

  function appKitModal() {
    return window.RIRAppKit?.modal || null;
  }

  function appKitProvider() {
    const modal = appKitModal();
    if (!modal) {
      return null;
    }

    const provider = modal.getWalletProvider?.() || modal.getProvider?.("eip155");
    return provider?.request ? provider : null;
  }

  function appKitAddress() {
    const modal = appKitModal();
    return modal?.getAddress?.("eip155") || modal?.getAddress?.() || "";
  }

  function syncAppKitState() {
    const modal = appKitModal();
    if (!modal) {
      return { address: "", provider: null };
    }

    const provider = appKitProvider();
    const address = appKitAddress();
    const chainId = normalizeChainId(modal.getChainId?.());

    if (provider) {
      state.walletProvider = provider;
      state.walletProviderSource = "appkit";
    }

    if (address) {
      state.account = address;
    }

    if (chainId) {
      state.chainId = chainId;
    }

    return { address, provider };
  }

  function attachAppKitEvents() {
    const modal = appKitModal();
    if (!modal || state.appKitProviderUnsubscribe) {
      return;
    }

    state.appKitProviderUnsubscribe = modal.subscribeProvider((providerState) => {
      const provider = providerState?.provider || appKitProvider();
      const address = providerState?.address || appKitAddress();
      const chainId = normalizeChainId(providerState?.chainId || modal.getChainId?.());

      if (provider?.request) {
        state.walletProvider = provider;
        state.walletProviderSource = "appkit";
      }

      state.account = address || "";
      state.chainId = chainId || state.chainId;

      if (!address) {
        state.provider = null;
        state.signer = null;
      }

      updateWalletControls();
      updateGateVisibility();
      updateVoteButtons();
    });
  }

  function walletProvider() {
    if (state.walletProvider?.request) {
      return state.walletProvider;
    }

    if (window.ethereum?.request) {
      state.walletProviderSource = "injected";
      return window.ethereum;
    }

    const walletPickerProvider = appKitAddress() ? appKitProvider() : null;
    if (walletPickerProvider?.request) {
      state.walletProvider = walletPickerProvider;
      state.walletProviderSource = "appkit";
      return walletPickerProvider;
    }

    return null;
  }

  function attachWalletEvents(provider) {
    if (!provider?.on || state.walletEventsProvider === provider) {
      return;
    }

    provider.on("accountsChanged", async (accounts) => {
      if (!accounts.length) {
        disconnectWallet();
        return;
      }

      if (isMobileDevice()) {
        try {
          state.account = accounts[0];
          if (window.ethers && walletProvider()) {
            state.provider = new ethers.BrowserProvider(walletProvider());
            state.signer = await state.provider.getSigner();
            state.account = await state.signer.getAddress();
          }
          loadCompleted();
          updateWalletControls();
          updateProgress();
          updateGateVisibility();
          updateVoteButtons();
        } catch {
          window.location.reload();
        }
        return;
      }

      window.location.reload();
    });

    provider.on("chainChanged", async (chainId) => {
      state.chainId = normalizeChainId(chainId);

      if (isMobileDevice()) {
        try {
          if (window.ethers && walletProvider()) {
            state.provider = new ethers.BrowserProvider(walletProvider());
            state.signer = await state.provider.getSigner();
            state.account = await state.signer.getAddress();
          }
          updateWalletControls();
          updateGateVisibility();
          updateVoteButtons();
        } catch {
          window.location.reload();
        }
        return;
      }

      window.location.reload();
    });

    state.walletEventsProvider = provider;
  }

  async function getConnectProvider() {
    const injectedProvider = window.ethereum?.request ? window.ethereum : null;

    // If an injected provider exists, use it directly. This covers both
    // desktop extensions AND mobile wallet browsers (MetaMask, Trust, etc.).
    // Previously this skipped the injected provider on mobile, causing
    // AppKit to open a deep-link redirect loop that lost page state.
    if (injectedProvider) {
      state.walletProvider = injectedProvider;
      state.walletProviderSource = "injected";
      attachWalletEvents(injectedProvider);
      return injectedProvider;
    }

    // No injected provider (regular mobile browser) — try AppKit wallet picker.
    if (isMobileDevice() && appKitModal()) {
      try {
        return await connectWithAppKit();
      } catch (error) {
        setStatus(error.shortMessage || error.message || "Wallet picker failed. Trying MetaMask fallback...");
      }
    }

    const MetaMaskSDK = window.RIRMetaMaskSDK?.default || window.RIRMetaMaskSDK;
    if (!MetaMaskSDK) {
      throw new Error("MetaMask connection bridge did not load. Refresh and try again.");
    }

    state.metaMaskSdk =
      state.metaMaskSdk ||
      new MetaMaskSDK({
        checkInstallationImmediately: false,
        dappMetadata: {
          name: "Indonesian Ritualist Recognizer",
          url: window.location.href
        },
        logging: {
          developerMode: false
        },
        preferDesktop: false
      });

    state.walletProvider = state.metaMaskSdk.getProvider();
    state.walletProviderSource = "metamask-sdk";
    attachWalletEvents(state.walletProvider);
    return state.walletProvider;
  }

  async function connectWithAppKit() {
    const modal = appKitModal();
    if (!modal) {
      throw new Error("Wallet picker did not load. Refresh and try again.");
    }

    attachAppKitEvents();
    const current = syncAppKitState();
    if (current.provider?.request && current.address) {
      return current.provider;
    }

    setWalletHint("Choose your wallet from the picker. On mobile, approve in the wallet app and return here.");

    return new Promise((resolve, reject) => {
      let settled = false;
      let unsubscribe = null;
      let pollTimer = null;

      const cleanup = () => {
        settled = true;
        window.clearTimeout(timeoutTimer);
        window.clearInterval(pollTimer);
        unsubscribe?.();
      };

      const maybeResolve = () => {
        const next = syncAppKitState();
        if (next.provider?.request && next.address) {
          state.walletProviderSource = "appkit";
          cleanup();
          resolve(next.provider);
        }
      };

      const timeoutTimer = window.setTimeout(() => {
        if (settled) {
          return;
        }
        cleanup();
        reject(new Error("Wallet connection timed out. Open the picker and try another wallet."));
      }, 120000);

      unsubscribe = modal.subscribeProvider(() => maybeResolve());
      pollTimer = window.setInterval(maybeResolve, 500);
      modal.open().catch((error) => {
        if (!settled) {
          cleanup();
          reject(error);
        }
      });
      maybeResolve();
    });
  }

  function setUsernameLoading(isLoading) {
    elements.usernameSubmit.disabled = isLoading;
    elements.viewerUsernameInput.disabled = isLoading;
    elements.usernameSubmit.textContent = isLoading ? "Fetching..." : "Continue";
    elements.usernameLoading.hidden = !isLoading;
    elements.usernameForm.classList.toggle("is-loading", isLoading);
  }

  function shortenAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function firstInitial(value) {
    const clean = normalizeUsername(value);
    return clean ? clean[0].toUpperCase() : "?";
  }

  function isValidContractAddress() {
    return Boolean(window.ethers && ethers.isAddress(contractAddress));
  }

  function isRitualChain() {
    return normalizeChainId(state.chainId) === ritualChain.chainId;
  }

  async function readChainId() {
    // Only trust AppKit's cached chainId when we're actually connected via AppKit.
    // On mobile with an injected provider, AppKit's getChainId() can return
    // a stale value (e.g. Ethereum mainnet) even after we've switched chains.
    if (state.walletProviderSource === "appkit") {
      const appKitChainId = normalizeChainId(appKitModal()?.getChainId?.());
      if (appKitChainId) {
        state.chainId = appKitChainId;
        return state.chainId;
      }
    }

    const provider = walletProvider();
    if (!provider?.request) {
      state.chainId = "";
      return "";
    }

    state.chainId = normalizeChainId(await provider.request({ method: "eth_chainId" }));
    return state.chainId;
  }

  async function switchToRitualChain() {
    const provider = walletProvider();
    if (!provider?.request) {
      throw new Error("No wallet found. Install MetaMask or another EVM wallet.");
    }

    // Use AppKit's switchNetwork only when actually connected via AppKit.
    // On mobile with an injected provider (MetaMask in-app browser, Trust, etc.)
    // modal.switchNetwork() targets AppKit's internal state, not window.ethereum,
    // so the actual wallet stays on the old chain (usually Ethereum mainnet).
    const modal = appKitModal();
    if (modal && window.RIRAppKit?.ritualNetwork && state.walletProviderSource === "appkit") {
      await modal.switchNetwork(window.RIRAppKit.ritualNetwork, { throwOnFailure: true });
      await readChainId();
      if (!isRitualChain()) {
        throw new Error("Switch to Ritual Chain to continue.");
      }
      return;
    }

    // Injected provider path: force-add + switch in one step.
    // wallet_addEthereumChain adds Ritual Chain if not yet in wallet AND
    // switches to it — no separate switch call needed in the happy path.
    // Falls back to wallet_switchEthereumChain if add is rejected or fails.
    try {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [ritualChain]
      });
    } catch (addError) {
      // User explicitly rejected (4001) — stop, don't try further.
      if (addError.code === 4001) {
        throw addError;
      }
      // Chain may already be known but not selected — try a plain switch.
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ritualChain.chainId }]
      });
    }

    await readChainId();
    if (!isRitualChain()) {
      throw new Error("Switch to Ritual Chain to continue.");
    }
  }

  function updateWalletControls() {
    if (!state.account) {
      const hasInjected = Boolean(window.ethereum?.request);
      const needsWalletBrowser = isMobileDevice() && !hasInjected && !appKitModal();
      const inWalletBrowser = isMobileDevice() && hasInjected;
      const label = needsWalletBrowser ? "Open Wallet" : "Connect Wallet";

      elements.connectWallet.textContent = label;
      elements.connectWallet.title = needsWalletBrowser
        ? "Open a wallet browser or try again after the wallet picker loads."
        : "Choose an EVM wallet.";
      elements.setupConnectWallet.textContent = label;
      setWalletHint(
        needsWalletBrowser
          ? "Mobile detected. Open a wallet browser, or refresh and try the wallet picker again."
          : inWalletBrowser
            ? "Tap Connect Wallet to approve in your wallet."
            : "Choose any EVM wallet from the picker to submit on-chain answers."
      );
      return;
    }

    if (!isRitualChain()) {
      elements.connectWallet.textContent = "Switch to Ritual";
      elements.connectWallet.title = `Connected: ${state.account}. Switch network to Ritual Chain.`;
      elements.setupConnectWallet.textContent = "Switch to Ritual";
      setWalletHint("Switch your wallet network to Ritual Chain to continue.");
      return;
    }

    elements.connectWallet.textContent = "Disconnect";
    elements.connectWallet.title = `Connected: ${state.account}. Click to disconnect.`;
    elements.setupConnectWallet.textContent = shortenAddress(state.account);
    setWalletHint("Wallet connected. You can start recognizing members.");
  }

  function saveSettings() {
    localStorage.setItem("rir.viewerUsername", state.viewerUsername);
    localStorage.setItem("rir.activeIndex", state.activeIndex.toString());
    writeSessionToUrl();
  }

  function loadSettings() {
    const params = new URLSearchParams(window.location.search);
    const urlUsername = normalizeUsername(params.get("x") || params.get("u") || "");
    state.viewerUsername = urlUsername || normalizeUsername(localStorage.getItem("rir.viewerUsername"));
    elements.viewerUsernameInput.value = state.viewerUsername;
    const urlIndex = Number(params.get("i"));
    const savedIndex = Number.isInteger(urlIndex) ? urlIndex : Number(localStorage.getItem("rir.activeIndex") || 0);
    state.activeIndex = Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < profiles.length ? savedIndex : 0;
    if (state.viewerUsername) {
      localStorage.setItem("rir.viewerUsername", state.viewerUsername);
      writeSessionToUrl();
    }
    loadCompleted();
  }

  function writeSessionToUrl(options = {}) {
    if (!state.viewerUsername || !window.history?.replaceState) {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("x", state.viewerUsername);
    url.searchParams.set("i", state.activeIndex.toString());

    if (options.connecting) {
      url.searchParams.set("connect", "1");
    } else {
      url.searchParams.delete("connect");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function proxyUrlFor(username) {
    return `${twitterProxyBaseUrl}/${encodeURIComponent(normalizeUsername(username))}`;
  }

  function uncachedProxyUrlFor(username) {
    const url = new URL(proxyUrlFor(username));
    url.searchParams.set("t", Date.now().toString());
    return url.toString();
  }

  function findStringByKeys(value, keys) {
    if (!value || typeof value !== "object") {
      return "";
    }

    for (const key of keys) {
      if (typeof value[key] === "string" && value[key].trim()) {
        return value[key].trim();
      }
    }

    for (const nestedValue of Object.values(value)) {
      if (nestedValue && typeof nestedValue === "object") {
        const match = findStringByKeys(nestedValue, keys);
        if (match) {
          return match;
        }
      }
    }

    return "";
  }

  function preferLargeTwitterImage(url) {
    return url.replace("_normal.", "_400x400.");
  }

  function fallbackAvatarUrl(username) {
    return `https://unavatar.io/x/${encodeURIComponent(normalizeUsername(username))}`;
  }

  async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadTwitterProfile(username, fallbackBio, options = {}) {
    const cleanUsername = normalizeUsername(username);
    if (!cleanUsername) {
      return null;
    }

    const shouldFetch = options.fetch !== false;
    const cacheKey = cleanUsername.toLowerCase();
    const cachedProfile = profileCache.get(cacheKey);
    const cachedHasDisplayName =
      cachedProfile?.displayName && cachedProfile.displayName.toLowerCase() !== cleanUsername.toLowerCase();

    if (cachedProfile && (!shouldFetch || (!options.forceFetch && cachedHasDisplayName))) {
      return cachedProfile;
    }

    const fallback = {
      avatarUrl: cachedProfile?.avatarUrl || "",
      bio: cachedProfile?.bio || fallbackBio || "Indonesian Ritual community member.",
      displayName: cachedProfile?.displayName || cleanUsername,
      username: cleanUsername
    };

    if (!shouldFetch) {
      profileCache.set(cacheKey, fallback);
      return fallback;
    }

    try {
      const response = await fetchWithTimeout(
        options.noStore ? uncachedProxyUrlFor(cleanUsername) : proxyUrlFor(cleanUsername),
        { cache: options.noStore ? "no-store" : "default" },
        options.timeoutMs || 12000
      );
      if (!response.ok) {
        throw new Error(`Profile proxy returned ${response.status}`);
      }

      const payload = await response.json();
      const displayName =
        findStringByKeys(payload, ["displayName", "name", "display_name", "fullName"]) || fallback.displayName;
      const avatarUrl = findStringByKeys(payload, [
        "profile_image_url_https",
        "profile_image_url",
        "profileImageUrl",
        "profile_image",
        "avatar",
        "avatarUrl",
        "avatar_url",
        "profilePicture",
        "profile_picture",
        "image"
      ]);
      const bio =
        findStringByKeys(payload, ["description", "bio", "profileBio", "profile_bio", "summary"]) || fallback.bio;
      const normalized = {
        avatarUrl: avatarUrl ? preferLargeTwitterImage(avatarUrl) : fallbackAvatarUrl(cleanUsername),
        bio,
        displayName,
        username: cleanUsername
      };

      profileCache.set(cacheKey, normalized);
      return normalized;
    } catch (error) {
      const fallbackWithAvatar = { ...fallback, avatarUrl: fallback.avatarUrl || fallbackAvatarUrl(cleanUsername) };
      profileCache.set(cacheKey, fallbackWithAvatar);
      return fallbackWithAvatar;
    }
  }

  function setAvatar(imageElement, initialElement, imageUrl, username) {
    initialElement.hidden = false;
    initialElement.textContent = firstInitial(username);

    if (!imageUrl) {
      imageElement.classList.remove("is-visible");
      imageElement.removeAttribute("src");
      return;
    }

    imageElement.onload = () => {
      imageElement.classList.add("is-visible");
      initialElement.hidden = true;
    };
    imageElement.onerror = () => {
      imageElement.classList.remove("is-visible");
      imageElement.removeAttribute("src");
      initialElement.hidden = false;
    };
    imageElement.src = imageUrl;

    if (imageElement.complete && imageElement.naturalWidth > 0) {
      imageElement.classList.add("is-visible");
      initialElement.hidden = true;
    }
  }

  async function requestWalletSelection(provider) {
    if (!provider?.request) {
      return;
    }

    try {
      await provider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
      });
    } catch {
      // Some wallets do not support explicit account selection. eth_requestAccounts still works.
    }
  }

  function currentContract(readOnly) {
    if (!window.ethers) {
      throw new Error("Ethers did not load. Check your internet connection.");
    }

    if (!ethers.isAddress(contractAddress)) {
      throw new Error("Contract address is not configured yet.");
    }

    if (!readOnly && !isRitualChain()) {
      throw new Error("Switch to Ritual Chain to continue.");
    }

    const runner = readOnly ? readOnlyProvider() : state.signer;
    if (!runner) {
      throw new Error("Connect your wallet first.");
    }

    return new ethers.Contract(contractAddress, contractAbi, runner);
  }

  function readOnlyProvider() {
    if (!window.ethers) {
      return null;
    }

    state.publicProvider =
      state.publicProvider || new ethers.JsonRpcProvider(ritualChain.rpcUrls[0], Number(ritualChain.chainId));
    return state.publicProvider;
  }

  function batchAnswerEntries() {
    const profileIds = [];
    const knows = [];

    profiles.forEach((profile) => {
      if (!state.pendingAnswers.has(profile.profileId) || state.onchainAnsweredProfileIds.has(profile.profileId)) {
        return;
      }

      profileIds.push(BigInt(profile.profileId));
      knows.push(Boolean(state.pendingAnswers.get(profile.profileId)));
    });

    return { knows, profileIds };
  }

  function chunkBatchEntries(profileIds, knows, size) {
    const chunks = [];
    for (let index = 0; index < profileIds.length; index += size) {
      chunks.push({
        knows: knows.slice(index, index + size),
        profileIds: profileIds.slice(index, index + size)
      });
    }

    return chunks;
  }

  function recordOnchainAnswer(profile, answer) {
    const normalizedAnswer = Number(answer);
    if (!profile || normalizedAnswer === 0) {
      return false;
    }

    const knows = normalizedAnswer === 1;
    const hadAnswer =
      state.onchainAnsweredProfileIds.has(profile.profileId) &&
      state.pendingAnswers.has(profile.profileId) &&
      state.completedProfileIds.has(profile.profileId);

    state.onchainAnsweredProfileIds.add(profile.profileId);
    state.pendingAnswers.set(profile.profileId, knows);
    state.completedProfileIds.add(profile.profileId);
    return !hadAnswer;
  }

  function updateProgress() {
    const completed = state.completedProfileIds.size;
    const total = profiles.length;
    const remaining = Math.max(total - completed, 0);
    const percent = total ? (completed / total) * 100 : 0;

    elements.completedCount.textContent = completed.toString();
    elements.totalCount.textContent = total.toString();
    elements.remainingCount.textContent = remaining.toString();
    elements.progressFill.style.width = `${percent}%`;
    renderCompletion();
  }

  function renderCompletion() {
    const total = profiles.length;
    const completed = state.completedProfileIds.size;
    const isComplete = Boolean(total && completed >= total && state.viewerUsername);

    elements.completionCard.classList.toggle("is-hidden", !isComplete);
    elements.recognitionCard.classList.toggle("is-hidden", isComplete);

    if (!isComplete) {
      return;
    }

    const pendingBatchCount = batchAnswerEntries().profileIds.length;
    elements.completionChainStatus.textContent = state.batchSubmitted ? "On-chain" : "Ready";
    elements.submitBatchAnswers.hidden = state.batchSubmitted;
    elements.submitBatchAnswers.disabled = state.batchSubmitting || pendingBatchCount === 0;
    elements.submitBatchAnswers.textContent = state.batchSubmitting
      ? "Submitting..."
      : `Submit ${pendingBatchCount} answers`;

    const viewerProfile = state.viewerProfile || profileCache.get(state.viewerUsername.toLowerCase()) || {};
    elements.completionName.textContent = viewerProfile.displayName || state.viewerUsername;
    elements.completionUsername.textContent = `@${state.viewerUsername}`;
    elements.completionTotal.textContent = `${completed}/${total}`;
    setAvatar(elements.completionAvatar, elements.completionInitial, viewerProfile.avatarUrl || "", state.viewerUsername);
  }

  function drawCenteredText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const nextLine = line ? `${line} ${word}` : word;
      if (context.measureText(nextLine).width > maxWidth && line) {
        lines.push(line);
        line = word;
        return;
      }

      line = nextLine;
    });

    if (line) {
      lines.push(line);
    }

    lines.forEach((textLine, index) => {
      context.fillText(textLine, x, y + index * lineHeight);
    });

    return y + Math.max(lines.length - 1, 0) * lineHeight;
  }

  function fitText(context, text, maxWidth, startSize, minSize, weight = 900) {
    let size = startSize;
    do {
      context.font = `${weight} ${size}px Arial, sans-serif`;
      if (context.measureText(text).width <= maxWidth) {
        return size;
      }
      size -= 2;
    } while (size >= minSize);

    context.font = `${weight} ${minSize}px Arial, sans-serif`;
    return minSize;
  }

  function loadImageForCanvas(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  async function imageElementForCanvas(imageElement) {
    if (imageElement?.src && imageElement.classList.contains("is-visible") && imageElement.complete) {
      return imageElement;
    }

    return null;
  }

  function opaqueAvatarCanvas(image, size) {
    if (!image) {
      return null;
    }

    const avatarCanvas = document.createElement("canvas");
    const avatarContext = avatarCanvas.getContext("2d", { willReadFrequently: true });
    avatarCanvas.width = size;
    avatarCanvas.height = size;

    const imageRatio = image.naturalWidth / image.naturalHeight || 1;
    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;

    if (imageRatio > 1) {
      sourceWidth = image.naturalHeight;
      sourceX = (image.naturalWidth - sourceWidth) / 2;
    } else {
      sourceHeight = image.naturalWidth;
      sourceY = (image.naturalHeight - sourceHeight) / 2;
    }

    avatarContext.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, size, size);

    try {
      const imageData = avatarContext.getImageData(0, 0, size, size);
      for (let index = 3; index < imageData.data.length; index += 4) {
        if (imageData.data[index] > 8) {
          imageData.data[index] = 255;
        }
      }
      avatarContext.putImageData(imageData, 0, 0);
    } catch {
      // If a browser blocks pixel reads, keep the original image draw.
    }

    return avatarCanvas;
  }

  function drawAvatar(context, image, x, y, size, fallbackText) {
    context.save();
    context.globalAlpha = 1;
    context.filter = "none";
    context.beginPath();
    context.arc(x, y, size / 2, 0, Math.PI * 2);
    context.clip();

    const avatarBackground = context.createRadialGradient(x, y, size * 0.1, x, y, size * 0.55);
    avatarBackground.addColorStop(0, "#f4fff5");
    avatarBackground.addColorStop(1, "#b7d8bd");
    context.fillStyle = avatarBackground;
    context.fillRect(x - size / 2, y - size / 2, size, size);

    if (image) {
      const opaqueAvatar = opaqueAvatarCanvas(image, size);
      context.globalAlpha = 1;
      context.filter = "none";
      context.drawImage(opaqueAvatar || image, x - size / 2, y - size / 2, size, size);
      context.filter = "none";
    } else {
      context.fillStyle = "#08210f";
      context.fillRect(x - size / 2, y - size / 2, size, size);
      context.fillStyle = "#1fff2b";
      context.font = `900 ${Math.floor(size * 0.44)}px Arial, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(firstInitial(fallbackText), x, y + 2);
    }

    context.restore();
    context.globalAlpha = 1;
    context.filter = "none";
    context.strokeStyle = "rgba(31, 255, 43, 0.8)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(x, y, size / 2, 0, Math.PI * 2);
    context.stroke();
  }

  async function downloadCompletionImage() {
    const total = profiles.length;
    const completed = state.completedProfileIds.size;
    const viewerProfile = state.viewerProfile || profileCache.get(state.viewerUsername.toLowerCase()) || {};
    const displayName = viewerProfile.displayName || state.viewerUsername || "Ritualist";
    const username = state.viewerUsername ? `@${state.viewerUsername}` : "@ritualist";
    const canvas = document.createElement("canvas");
    const width = 800;
    const height = 800;
    const center = width / 2;
    const context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;
    context.textBaseline = "alphabetic";

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#031207");
    gradient.addColorStop(0.5, "#06230f");
    gradient.addColorStop(1, "#021006");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.strokeStyle = "rgba(31, 255, 43, 0.45)";
    context.lineWidth = 2;
    context.roundRect(1, 1, width - 2, height - 2, 4);
    context.stroke();

    const logo = await loadImageForCanvas("./assets/ritual-logo.jpg");
    if (logo) {
      const logoSize = 46;
      const logoX = center - logoSize / 2;
      const logoY = 52;
      context.shadowColor = "rgba(31, 255, 43, 0.35)";
      context.shadowBlur = 16;
      context.fillStyle = "#000";
      context.beginPath();
      context.roundRect(logoX, logoY, logoSize, logoSize, 8);
      context.fill();
      context.shadowBlur = 0;
      context.save();
      context.beginPath();
      context.roundRect(logoX, logoY, logoSize, logoSize, 8);
      context.clip();
      context.drawImage(logo, logoX + 12, logoY + 12, 22, 22);
      context.restore();
    }

    context.textAlign = "center";
    context.fillStyle = "#b9cbbd";
    context.font = "400 14px Arial, sans-serif";
    context.fillText("INDONESIAN RITUALIST RECOGNIZER", center, 134);

    context.fillStyle = "#f2f8ef";
    context.font = "900 66px Arial, sans-serif";
    context.fillText("Recognition", center, 202);
    context.fillText("complete", center, 272);

    const avatar = await imageElementForCanvas(elements.completionAvatar);
    drawAvatar(context, avatar, center, 365, 114, state.viewerUsername || displayName);

    context.fillStyle = "#f2f8ef";
    fitText(context, displayName, 520, 36, 24);
    drawCenteredText(context, displayName, center, 498, 520, 40);

    context.fillStyle = "#1fff2b";
    context.font = "900 16px Arial, sans-serif";
    context.fillText(username, center, 522);

    context.fillStyle = "rgba(9, 31, 15, 0.9)";
    context.strokeStyle = "rgba(31, 255, 43, 0.35)";
    context.lineWidth = 1;
    context.beginPath();
    context.roundRect(110, 552, 286, 97, 7);
    context.roundRect(408, 552, 286, 97, 7);
    context.fill();
    context.stroke();

    context.fillStyle = "#1fff2b";
    context.font = "900 28px Arial, sans-serif";
    context.fillText(`${completed}/${total}`, 253, 599);
    context.fillText(state.batchSubmitted ? "On-chain" : "Ready", 551, 599);

    context.fillStyle = "#b9cbbd";
    context.font = "400 18px Arial, sans-serif";
    context.fillText("Members checked", 253, 626);
    context.fillText("Batch submit", 551, 626);

    context.fillStyle = "#6fa27a";
    context.beginPath();
    context.roundRect(101, 675, 270, 54, 7);
    context.fill();

    context.fillStyle = "#22ff38";
    context.beginPath();
    context.roundRect(377, 675, 327, 54, 7);
    context.fill();

    context.fillStyle = "#020b05";
    context.font = "900 17px Arial, sans-serif";
    context.fillText("Submit 0 answers", 236, 708);
    context.fillText("Download recognition complete", 540, 708);

    context.fillStyle = "#f2f8ef";
    context.font = "900 14px Arial, sans-serif";
    context.fillText("MADE BY RIZAN - DEDICATED FOR RITUAL", center, 756);

    const link = document.createElement("a");
    link.download = `indonesian-ritualist-recognizer-${normalizeUsername(state.viewerUsername) || "result"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function updateGateVisibility() {
    const hasUsername = Boolean(state.viewerUsername);
    const hasWalletReady = Boolean(state.account && isRitualChain());

    elements.usernameGate.classList.toggle("is-hidden", hasUsername);
    elements.walletGate.classList.toggle("is-hidden", !hasUsername || hasWalletReady);
    elements.recognizerApp.classList.toggle("is-hidden", !hasUsername || !hasWalletReady);
  }

  function updateVoteButtons() {
    const currentProfile = profiles[state.activeIndex];
    const alreadyAnswered = isProfileAnswered(currentProfile);
    const ready = Boolean(state.viewerUsername && state.account && isRitualChain() && isValidContractAddress());
    const disabled = !ready || alreadyAnswered;

    elements.voteKnow.disabled = disabled;
    elements.voteDoNotKnow.disabled = disabled;

    if (!state.viewerUsername) {
      setStatus("Enter your X username to start.");
    } else if (!state.account) {
      setStatus("Connect your wallet to submit on-chain answers.");
    } else if (!isRitualChain()) {
      setStatus("Switch to Ritual Chain to submit on-chain answers.");
    } else if (!isValidContractAddress()) {
      setStatus("Contract address is not configured yet.");
    } else if (alreadyAnswered) {
      setStatus(
        hasPendingAnswer(currentProfile)
          ? "Answer saved locally. Submit all answers once you finish."
          : "You already answered this member on-chain. Skip to the next one."
      );
    }
  }

  async function renderViewer() {
    const requestId = (state.viewerProfileRequestId += 1);

    if (!state.viewerUsername) {
      elements.viewerName.textContent = "Set your X";
      elements.viewerUsername.textContent = "@username";
      elements.gateViewerName.textContent = "X user";
      elements.gateViewerUsername.textContent = "@username";
      setAvatar(elements.viewerAvatar, elements.viewerInitial, "", "");
      setAvatar(elements.gateViewerAvatar, elements.gateViewerInitial, "", "");
      return;
    }

    const cachedViewerProfile = profileCache.get(state.viewerUsername.toLowerCase());
    const optimisticName = cachedViewerProfile?.displayName || state.viewerUsername;

    elements.viewerUsername.textContent = `@${state.viewerUsername}`;
    elements.viewerName.textContent = optimisticName;
    elements.gateViewerUsername.textContent = `@${state.viewerUsername}`;
    elements.gateViewerName.textContent = optimisticName;
    setAvatar(elements.viewerAvatar, elements.viewerInitial, "", state.viewerUsername);
    setAvatar(elements.gateViewerAvatar, elements.gateViewerInitial, "", state.viewerUsername);

    const viewerProfile = await loadTwitterProfile(state.viewerUsername, "", { forceFetch: true, noStore: true });
    if (requestId !== state.viewerProfileRequestId) {
      return;
    }

    state.viewerProfile = viewerProfile;
    elements.viewerName.textContent = viewerProfile.displayName;
    elements.gateViewerName.textContent = viewerProfile.displayName;
    setAvatar(elements.viewerAvatar, elements.viewerInitial, viewerProfile.avatarUrl, state.viewerUsername);
    setAvatar(elements.gateViewerAvatar, elements.gateViewerInitial, viewerProfile.avatarUrl, state.viewerUsername);
    renderCompletion();
  }

  function readStats(profileId) {
    return statsByProfileId.get(profileId) || { doNotKnowCount: 0, knowCount: 0 };
  }

  async function refreshCurrentStats() {
    const profile = profiles[state.activeIndex];
    if (!profile) {
      return;
    }

    if (!isValidContractAddress()) {
      const stats = readStats(profile.profileId);
      elements.knowCount.textContent = stats.knowCount.toString();
      elements.doNotKnowCount.textContent = stats.doNotKnowCount.toString();
      return;
    }

    try {
      const contract = currentContract(true);
      const onchainProfile = await contract.getProfile(BigInt(profile.profileId));
      const stats = {
        doNotKnowCount: Number(onchainProfile.doNotKnowCount),
        knowCount: Number(onchainProfile.knowCount)
      };
      statsByProfileId.set(profile.profileId, stats);
      elements.knowCount.textContent = stats.knowCount.toString();
      elements.doNotKnowCount.textContent = stats.doNotKnowCount.toString();
    } catch (error) {
      const stats = readStats(profile.profileId);
      elements.knowCount.textContent = stats.knowCount.toString();
      elements.doNotKnowCount.textContent = stats.doNotKnowCount.toString();
      setStatus(error.shortMessage || error.message);
    }
  }

  async function syncCurrentAnswer() {
    const profile = profiles[state.activeIndex];
    if (!profile || !state.account || !isValidContractAddress()) {
      return;
    }

    try {
      const contract = currentContract(true);
      const answer = await contract.getAnswer(BigInt(profile.profileId), state.account);
      if (recordOnchainAnswer(profile, answer)) {
        savePendingAnswers();
        if (state.completedProfileIds.size >= profiles.length) {
          saveBatchSubmitted(true);
        }
        updateProgress();
        updateVoteButtons();
      }
    } catch {
      // The status area is reserved for user-facing action failures.
    }
  }

  async function syncAllAnswers(options = {}) {
    if (!state.account || !isValidContractAddress()) {
      return 0;
    }

    try {
      const contract = currentContract(true);
      const results = await Promise.allSettled(
        profiles.map((profile) => contract.getAnswer(BigInt(profile.profileId), state.account))
      );
      let loadedCount = 0;
      let changed = false;

      results.forEach((result, index) => {
        if (result.status !== "fulfilled" || Number(result.value) === 0) {
          return;
        }

        loadedCount += 1;
        changed = recordOnchainAnswer(profiles[index], result.value) || changed;
      });

      if (changed) {
        savePendingAnswers();
      }

      if (loadedCount >= profiles.length && profiles.length > 0) {
        saveBatchSubmitted(true);
      }

      updateProgress();
      updateVoteButtons();

      if (options.setStatus && loadedCount >= profiles.length && profiles.length > 0) {
        setStatus("All on-chain answers loaded. You can download your completion card.");
      } else if (options.setStatus && loadedCount > 0) {
        setStatus(`Loaded ${loadedCount}/${profiles.length} on-chain answers.`);
      }

      return loadedCount;
    } catch (error) {
      if (options.setStatus) {
        setStatus(error.shortMessage || error.message);
      }
      return 0;
    }
  }

  async function renderProfile() {
    const profile = profiles[state.activeIndex];
    if (!profile) {
      setStatus("No profiles found in app/src/profiles.js.");
      return;
    }

    elements.profileCounter.textContent = `Member ${state.activeIndex + 1} of ${profiles.length}`;
    elements.displayName.textContent = profile.xUsername;
    elements.xLink.textContent = `@${profile.xUsername}`;
    elements.xLink.href = `https://x.com/${profile.xUsername}`;
    elements.profileBio.textContent = profile.bio;
    setAvatar(elements.avatar, elements.candidateInitial, "", profile.xUsername);

    const twitterProfile = await loadTwitterProfile(profile.xUsername, profile.bio, { fetch: false });
    elements.displayName.textContent = twitterProfile.displayName;
    elements.profileBio.textContent = twitterProfile.bio || profile.bio;
    setAvatar(elements.avatar, elements.candidateInitial, twitterProfile.avatarUrl, profile.xUsername);

    await refreshCurrentStats();
    await syncCurrentAnswer();
    updateVoteButtons();
  }

  function renderLeaderboard() {
    const rankedProfiles = profiles
      .map((profile) => {
        const stats = readStats(profile.profileId);
        const cached = profileCache.get(profile.xUsername.toLowerCase());
        return {
          ...profile,
          displayName: cached?.displayName || profile.xUsername,
          score: stats.knowCount
        };
      })
      .sort((a, b) => b.score - a.score || Number(a.profileId) - Number(b.profileId))
      .slice(0, 10);

    elements.leaderboardList.replaceChildren(
      ...rankedProfiles.map((profile, index) => {
        const item = document.createElement("li");
        item.className = "leaderboard-item";

        const rank = document.createElement("span");
        rank.className = "leaderboard-rank";
        rank.textContent = `#${index + 1}`;

        const name = document.createElement("span");
        name.className = "leaderboard-name";
        name.innerHTML = `<strong></strong><small></small>`;
        name.querySelector("strong").textContent = profile.displayName;
        name.querySelector("small").textContent = `@${profile.xUsername}`;

        const score = document.createElement("span");
        score.className = "leaderboard-score";
        score.textContent = profile.score.toString();

        item.append(rank, name, score);
        return item;
      })
    );
  }

  async function refreshLeaderboard() {
    renderLeaderboard();

    if (!isValidContractAddress()) {
      return;
    }

    try {
      const contract = currentContract(true);
      const results = await Promise.allSettled(
        profiles.map((profile) => contract.getProfile(BigInt(profile.profileId)))
      );

      results.forEach((result, index) => {
        if (result.status !== "fulfilled") {
          return;
        }

        statsByProfileId.set(profiles[index].profileId, {
          doNotKnowCount: Number(result.value.doNotKnowCount),
          knowCount: Number(result.value.knowCount)
        });
      });

      renderLeaderboard();
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  function moveProfile(direction) {
    state.activeIndex = (state.activeIndex + direction + profiles.length) % profiles.length;
    saveSettings();
    renderProfile();
  }

  function moveToNextUnanswered() {
    const total = profiles.length;
    for (let offset = 1; offset <= total; offset += 1) {
      const nextIndex = (state.activeIndex + offset) % total;
      if (!isProfileAnswered(profiles[nextIndex])) {
        state.activeIndex = nextIndex;
        saveSettings();
        renderProfile();
        return;
      }
    }

    renderProfile();
  }

  async function connectWallet() {
    try {
      if (!window.ethers) {
        setStatus("Ethers did not load. Check your internet connection.");
        return;
      }

      saveSettings();
      writeSessionToUrl({ connecting: true });
      const ethereumProvider = await getConnectProvider();
      setWalletHint(
        isMobileDevice()
          ? "Your wallet may open for approval. Confirm there, then return here."
          : "Confirm the wallet connection request."
      );
      if (state.walletProviderSource !== "appkit") {
        // Skip requestWalletSelection on mobile — wallet_requestPermissions
        // triggers a re-permission flow that can navigate away from the page,
        // losing state and sending the user back to the username screen.
        if (!isMobileDevice()) {
          await requestWalletSelection(ethereumProvider);
        }
        await ethereumProvider.request({ method: "eth_requestAccounts", params: [] });
      }
      await readChainId();
      if (!isRitualChain()) {
        setStatus("Switching wallet to Ritual Chain...");
        await switchToRitualChain();
      }

      state.provider = new ethers.BrowserProvider(ethereumProvider);
      state.signer = await state.provider.getSigner();
      state.account = await state.signer.getAddress();

      loadCompleted();
      updateWalletControls();
      setStatus("Wallet connected. Recognition answers will be submitted on-chain.");
      updateProgress();
      updateGateVisibility();
      updateVoteButtons();
      await renderProfile();
      await syncAllAnswers({ setStatus: true });
      await refreshCurrentStats();
      await refreshLeaderboard();
      writeSessionToUrl();
    } catch (error) {
      setStatus(error.shortMessage || error.message);
      updateWalletControls();
      updateGateVisibility();
    }
  }

  async function restoreConnectedWallet() {
    attachAppKitEvents();
    syncAppKitState();
    const ethereumProvider = walletProvider();
    if (!ethereumProvider || !window.ethers) {
      return;
    }

    try {
      attachWalletEvents(ethereumProvider);
      const appKitAccount = appKitAddress();
      const accounts = appKitAccount ? [appKitAccount] : await ethereumProvider.request({ method: "eth_accounts" });
      if (!accounts.length) {
        return;
      }

      state.provider = new ethers.BrowserProvider(ethereumProvider);
      state.signer = await state.provider.getSigner();
      state.account = await state.signer.getAddress();
      await readChainId();
      updateWalletControls();
      loadCompleted();
    } catch {
      state.account = "";
      state.provider = null;
      state.signer = null;
    }
  }

  async function switchNetworkForConnectedWallet() {
    try {
      setStatus("Switching wallet to Ritual Chain...");
      await switchToRitualChain();
      const ethereumProvider = walletProvider();
      state.provider = new ethers.BrowserProvider(ethereumProvider);
      state.signer = await state.provider.getSigner();
      state.account = await state.signer.getAddress();
      updateWalletControls();
      updateGateVisibility();
      updateVoteButtons();
      await renderProfile();
      await syncAllAnswers({ setStatus: true });
      await refreshCurrentStats();
      await refreshLeaderboard();
      setStatus("Wallet connected on Ritual Chain.");
    } catch (error) {
      setStatus(error.shortMessage || error.message);
      updateWalletControls();
      updateGateVisibility();
      updateVoteButtons();
    }
  }

  async function disconnectWallet() {
    const modal = appKitModal();
    if (modal?.getIsConnectedState?.() || appKitAddress()) {
      try {
        await modal.disconnect("eip155");
      } catch {
        // AppKit disconnect is best effort; local state still disconnects.
      }
    }

    const provider = walletProvider();
    if (provider?.request && !appKitModal()) {
      try {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }]
        });
      } catch {
        // MetaMask permission revocation is best effort; local state still disconnects.
      }
    }

    state.account = "";
    state.chainId = "";
    state.provider = null;
    state.signer = null;
    state.walletProvider = null;
    state.walletProviderSource = "";
    state.metaMaskSdk = null;
    updateWalletControls();
    loadCompleted();
    updateProgress();
    updateGateVisibility();
    updateVoteButtons();
  }

  async function saveViewer(event) {
    event.preventDefault();
    state.viewerUsername = normalizeUsername(elements.viewerUsernameInput.value);
    elements.viewerUsernameInput.value = state.viewerUsername;
    if (!state.viewerUsername) {
      elements.viewerUsernameInput.focus();
      return;
    }

    saveSettings();
    loadCompleted();
    setUsernameLoading(true);
    try {
      await renderViewer();
      updateProgress();
      updateGateVisibility();
      updateVoteButtons();
    } finally {
      setUsernameLoading(false);
    }
  }

  async function submitAnswer(knows) {
    const profile = profiles[state.activeIndex];
    if (!profile) {
      return;
    }

    try {
      saveSettings();
      updateVoteButtons();

      if (!state.viewerUsername) {
        throw new Error("Enter your X username first.");
      }

      if (state.onchainAnsweredProfileIds.has(profile.profileId)) {
        throw new Error("You already answered this member on-chain.");
      }

      if (!state.signer) {
        await connectWallet();
      }

      state.pendingAnswers.set(profile.profileId, knows);
      state.completedProfileIds.add(profile.profileId);
      savePendingAnswers();
      saveBatchSubmitted(false);
      saveSettings();

      const currentStats = readStats(profile.profileId);
      statsByProfileId.set(profile.profileId, {
        doNotKnowCount: currentStats.doNotKnowCount + (knows ? 0 : 1),
        knowCount: currentStats.knowCount + (knows ? 1 : 0)
      });

      updateProgress();
      renderLeaderboard();
      setStatus("Answer saved locally. You will submit one transaction at the end.");
      moveToNextUnanswered();
    } catch (error) {
      setStatus(error.shortMessage || error.message);
      updateVoteButtons();
    }
  }

  async function submitBatchAnswers() {
    try {
      if (!state.viewerUsername) {
        throw new Error("Enter your X username first.");
      }

      if (!state.signer) {
        await connectWallet();
      }

      setStatus("Checking existing on-chain answers...");
      await syncAllAnswers();

      const { knows, profileIds } = batchAnswerEntries();
      if (!profileIds.length) {
        throw new Error("No new answers to submit.");
      }

      const contract = currentContract(false);
      state.batchSubmitting = true;
      renderCompletion();
      const chunks = chunkBatchEntries(profileIds, knows, batchSubmitChunkSize);
      const confirmedTxs = [];
      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index];
        const chunkLabel = chunks.length > 1 ? ` ${index + 1}/${chunks.length}` : "";

        setStatus(`Waiting for wallet confirmation for batch${chunkLabel}...`);
        const tx = await contract.answerBatch(chunk.profileIds, chunk.knows, { gasLimit: plainBatchGasLimit });

        setStatusLink(
          `Batch${chunkLabel} submitted on-chain.`,
          `${explorerBaseUrl}/tx/${tx.hash}`,
          "View on explorer"
        );
        await tx.wait();
        confirmedTxs.push(tx.hash);

        chunk.profileIds.forEach((profileId, answerIndex) => {
          const normalizedProfileId = profileId.toString();
          state.onchainAnsweredProfileIds.add(normalizedProfileId);
          state.pendingAnswers.set(normalizedProfileId, Boolean(chunk.knows[answerIndex]));
          state.completedProfileIds.add(normalizedProfileId);
        });
        savePendingAnswers();
        updateProgress();
      }

      saveBatchSubmitted(true);
      state.batchSubmitting = false;
      updateProgress();
      await refreshCurrentStats();
      await refreshLeaderboard();
      setStatusLink(
        "All answers confirmed on-chain.",
        `${explorerBaseUrl}/tx/${confirmedTxs[confirmedTxs.length - 1]}`,
        "View latest transaction"
      );
    } catch (error) {
      state.batchSubmitting = false;
      renderCompletion();
      setStatus(error.shortMessage || error.message);
    }
  }

  function bindEvents() {
    elements.usernameForm.addEventListener("submit", saveViewer);
    elements.setupConnectWallet.addEventListener("click", () => {
      if (state.account && !isRitualChain()) {
        switchNetworkForConnectedWallet();
        return;
      }

      connectWallet();
    });
    elements.connectWallet.addEventListener("click", () => {
      if (state.account && !isRitualChain()) {
        switchNetworkForConnectedWallet();
        return;
      }

      if (state.account) {
        disconnectWallet();
        return;
      }

      connectWallet();
    });
    elements.backToUsername.addEventListener("click", () => {
      elements.walletGate.classList.add("is-hidden");
      elements.usernameGate.classList.remove("is-hidden");
      elements.viewerUsernameInput.focus();
    });
    elements.userPill.addEventListener("click", () => {
      elements.recognizerApp.classList.add("is-hidden");
      elements.usernameGate.classList.remove("is-hidden");
      elements.viewerUsernameInput.focus();
    });
    elements.previousProfile.addEventListener("click", () => moveProfile(-1));
    elements.nextProfile.addEventListener("click", () => moveProfile(1));
    elements.downloadResult.addEventListener("click", downloadCompletionImage);
    elements.refreshLeaderboard.addEventListener("click", refreshLeaderboard);
    elements.submitBatchAnswers.addEventListener("click", submitBatchAnswers);
    elements.voteKnow.addEventListener("click", () => submitAnswer(true));
    elements.voteDoNotKnow.addEventListener("click", () => submitAnswer(false));

    attachWalletEvents(walletProvider());
  }

  async function init() {
    loadSettings();
    bindEvents();
    elements.totalCount.textContent = profiles.length.toString();
    updateProgress();
    renderLeaderboard();
    await renderViewer();
    await restoreConnectedWallet();
    await renderProfile();
    updateGateVisibility();
    updateVoteButtons();
    if (state.account) {
      await syncAllAnswers();
      await refreshCurrentStats();
      await refreshLeaderboard();
    } else if (state.viewerUsername && new URLSearchParams(window.location.search).get("connect") === "1") {
      updateGateVisibility();
      // On mobile wallet browsers (e.g. MetaMask in-app), if the user was
      // redirected back and an injected provider is available, auto-connect
      // immediately. Otherwise show a hint to tap the button.
      if (isMobileDevice() && window.ethereum?.request) {
        connectWallet();
      } else {
        setWalletHint("Return from your wallet detected. Tap Connect Wallet to finish if it does not continue automatically.");
        connectWallet();
      }
    }
  }

  init();
})();
