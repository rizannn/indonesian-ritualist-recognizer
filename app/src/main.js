(function () {
  const contractAbi = [
    "function answer(uint256 profileId, bool knows)",
    "function getProfile(uint256 profileId) view returns (string xUsername, string displayName, string avatarURI, string metadataURI, bytes32 metadataHash, uint256 knowCount, uint256 doNotKnowCount)",
    "function getAnswer(uint256 profileId, address voter) view returns (uint8)"
  ];

  const twitterProxyBaseUrl = "https://ritual-twitter-proxy.artelamon.workers.dev/api/twitter";
  const explorerBaseUrl = "https://explorer.ritualfoundation.org";
  const contractAddress = "0xce0c55a7eD14e61F0A828e2cDcc48cF2b34401DF";
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
    completionInitial: document.getElementById("completionInitial"),
    completionName: document.getElementById("completionName"),
    completionTotal: document.getElementById("completionTotal"),
    completionUsername: document.getElementById("completionUsername"),
    completedCount: document.getElementById("completedCount"),
    connectWallet: document.getElementById("connectWallet"),
    displayName: document.getElementById("displayName"),
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
    shareResult: document.getElementById("shareResult"),
    statusLine: document.getElementById("statusLine"),
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
    completedProfileIds: new Set(),
    onchainAnsweredProfileIds: new Set(),
    provider: null,
    signer: null,
    viewerProfile: null,
    viewerProfileRequestId: 0,
    viewerUsername: ""
  };

  function normalizeUsername(username) {
    return (username || "").trim().replace(/^@/, "");
  }

  function completedStorageKey() {
    const owner = state.account || state.viewerUsername || "local";
    return `rir.completed.${owner.toLowerCase()}`;
  }

  function loadCompleted() {
    try {
      const raw = localStorage.getItem(completedStorageKey());
      state.completedProfileIds = new Set(raw ? JSON.parse(raw) : []);
    } catch {
      state.completedProfileIds = new Set();
    }
  }

  function saveCompleted() {
    localStorage.setItem(completedStorageKey(), JSON.stringify([...state.completedProfileIds]));
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
    return Boolean(window.ethereum?.request);
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
  }

  function mobileWalletUrl() {
    const dappUrl = window.location.href.replace(/^https?:\/\//, "");
    return `https://metamask.app.link/dapp/${dappUrl}`;
  }

  function openMobileWallet() {
    const url = mobileWalletUrl();
    setWalletHint("Opening this page inside MetaMask mobile. Connect again there.");
    setStatus("Opening this page inside MetaMask mobile. Connect again there.");
    window.location.href = url;
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
    return state.chainId?.toLowerCase() === ritualChain.chainId;
  }

  async function readChainId() {
    if (!window.ethereum?.request) {
      state.chainId = "";
      return "";
    }

    state.chainId = await window.ethereum.request({ method: "eth_chainId" });
    return state.chainId;
  }

  async function switchToRitualChain() {
    if (!window.ethereum?.request) {
      throw new Error("No wallet found. Install MetaMask or another EVM wallet.");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ritualChain.chainId }]
      });
    } catch (error) {
      if (error.code !== 4902) {
        throw error;
      }

      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [ritualChain]
      });
    }

    await readChainId();
    if (!isRitualChain()) {
      throw new Error("Switch to Ritual Chain to continue.");
    }
  }

  function updateWalletControls() {
    if (!state.account) {
      const needsWalletBrowser = isMobileDevice() && !hasWalletProvider();
      const label = needsWalletBrowser ? "Open in Wallet App" : "Connect Wallet";

      elements.connectWallet.textContent = label;
      elements.connectWallet.title = needsWalletBrowser
        ? "Open this dApp inside MetaMask mobile to connect."
        : "Connect wallet.";
      elements.setupConnectWallet.textContent = label;
      setWalletHint(
        needsWalletBrowser
          ? "Mobile detected. Open this page inside MetaMask mobile, then connect wallet."
          : "Connect an EVM wallet to submit on-chain answers."
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
  }

  function loadSettings() {
    state.viewerUsername = normalizeUsername(localStorage.getItem("rir.viewerUsername"));
    elements.viewerUsernameInput.value = state.viewerUsername;
    const savedIndex = Number(localStorage.getItem("rir.activeIndex") || 0);
    state.activeIndex = Number.isInteger(savedIndex) && savedIndex >= 0 && savedIndex < profiles.length ? savedIndex : 0;
    loadCompleted();
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

  async function requestWalletSelection() {
    if (!window.ethereum?.request) {
      return;
    }

    try {
      await window.ethereum.request({
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

    if (!isRitualChain()) {
      throw new Error("Switch to Ritual Chain to continue.");
    }

    const runner = readOnly ? state.provider : state.signer;
    if (!runner) {
      throw new Error("Connect your wallet first.");
    }

    return new ethers.Contract(contractAddress, contractAbi, runner);
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

    const viewerProfile = state.viewerProfile || profileCache.get(state.viewerUsername.toLowerCase()) || {};
    elements.completionName.textContent = viewerProfile.displayName || state.viewerUsername;
    elements.completionUsername.textContent = `@${state.viewerUsername}`;
    elements.completionTotal.textContent = `${completed}/${total}`;
    elements.shareResult.href = `https://x.com/intent/tweet?text=${encodeURIComponent(
      `I recognized ${completed}/${total} Indonesian Ritualists on-chain.`
    )}&url=${encodeURIComponent(`${explorerBaseUrl}/address/${contractAddress}`)}`;
    setAvatar(elements.completionAvatar, elements.completionInitial, viewerProfile.avatarUrl || "", state.viewerUsername);
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
      setStatus("You already answered this member. Skip to the next one.");
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

    if (!state.provider || !isValidContractAddress()) {
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
    if (!profile || !state.account || !state.provider || !isValidContractAddress()) {
      return;
    }

    try {
      const contract = currentContract(true);
      const answer = await contract.getAnswer(BigInt(profile.profileId), state.account);
      if (Number(answer) !== 0) {
        state.onchainAnsweredProfileIds.add(profile.profileId);
        updateVoteButtons();
      }
    } catch {
      // The status area is reserved for user-facing action failures.
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

    if (!state.provider || !isValidContractAddress()) {
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
      if (!hasWalletProvider()) {
        if (isMobileDevice()) {
          openMobileWallet();
          return;
        }

        setWalletHint("No wallet found. Install MetaMask or another EVM wallet.");
        setStatus("No wallet found. Install MetaMask or another EVM wallet.");
        return;
      }

      if (!window.ethers) {
        setStatus("Ethers did not load. Check your internet connection.");
        return;
      }

      await requestWalletSelection();
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await readChainId();
      if (!isRitualChain()) {
        setStatus("Switching wallet to Ritual Chain...");
        await switchToRitualChain();
      }

      state.provider = new ethers.BrowserProvider(window.ethereum);
      state.signer = await state.provider.getSigner();
      state.account = await state.signer.getAddress();

      loadCompleted();
      updateWalletControls();
      setStatus("Wallet connected. Recognition answers will be submitted on-chain.");
      updateProgress();
      updateGateVisibility();
      updateVoteButtons();
      await syncCurrentAnswer();
      await refreshCurrentStats();
      await refreshLeaderboard();
    } catch (error) {
      setStatus(error.shortMessage || error.message);
    }
  }

  async function restoreConnectedWallet() {
    if (!window.ethereum || !window.ethers) {
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (!accounts.length) {
        return;
      }

      state.provider = new ethers.BrowserProvider(window.ethereum);
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
      state.provider = new ethers.BrowserProvider(window.ethereum);
      state.signer = await state.provider.getSigner();
      state.account = await state.signer.getAddress();
      updateWalletControls();
      updateGateVisibility();
      updateVoteButtons();
      await syncCurrentAnswer();
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
    if (window.ethereum?.request) {
      try {
        await window.ethereum.request({
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

      if (!state.signer) {
        await connectWallet();
      }

      const contract = currentContract(false);
      elements.voteKnow.disabled = true;
      elements.voteDoNotKnow.disabled = true;
      setStatus("Waiting for wallet confirmation...");

      const tx = await contract.answer(BigInt(profile.profileId), knows);
      setStatusLink("Transaction submitted.", `${explorerBaseUrl}/tx/${tx.hash}`, "View on explorer");
      await tx.wait();

      state.completedProfileIds.add(profile.profileId);
      saveCompleted();
      saveSettings();

      const currentStats = readStats(profile.profileId);
      statsByProfileId.set(profile.profileId, {
        doNotKnowCount: currentStats.doNotKnowCount + (knows ? 0 : 1),
        knowCount: currentStats.knowCount + (knows ? 1 : 0)
      });

      updateProgress();
      await refreshCurrentStats();
      await refreshLeaderboard();
      setStatusLink("Answer confirmed on-chain.", `${explorerBaseUrl}/tx/${tx.hash}`, "View on explorer");
      moveToNextUnanswered();
    } catch (error) {
      setStatus(error.shortMessage || error.message);
      updateVoteButtons();
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
    elements.refreshLeaderboard.addEventListener("click", refreshLeaderboard);
    elements.voteKnow.addEventListener("click", () => submitAnswer(true));
    elements.voteDoNotKnow.addEventListener("click", () => submitAnswer(false));

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (!accounts.length) {
          disconnectWallet();
          return;
        }

        window.location.reload();
      });
      window.ethereum.on("chainChanged", (chainId) => {
        state.chainId = chainId;
        window.location.reload();
      });
    }
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
      await syncCurrentAnswer();
      await refreshCurrentStats();
      await refreshLeaderboard();
    }
  }

  init();
})();
