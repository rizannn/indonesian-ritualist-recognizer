import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import vm from "node:vm";

const profilesPath = new URL("../app/src/profiles.js", import.meta.url);
const assetsDir = new URL("../app/assets/profiles/", import.meta.url);
const cachePath = new URL("../app/src/profile-cache.js", import.meta.url);
const proxyBaseUrl = "https://ritual-twitter-proxy.artelamon.workers.dev/api/twitter";
const requestTimeoutMs = Number(process.env.CACHE_PROFILE_TIMEOUT_MS || 7000);
const concurrency = Number(process.env.CACHE_PROFILE_CONCURRENCY || 8);
const localOnly = process.argv.includes("--local-only");
const forceRefresh = process.argv.includes("--force");
const skipProxy = process.argv.includes("--skip-proxy");

function normalizeUsername(username) {
  return String(username || "").trim().replace(/^@/, "");
}

function safeFileName(username) {
  return normalizeUsername(username).replace(/[^a-z0-9_-]/gi, "_");
}

function readProfiles(source) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "profiles.js" });
  return sandbox.window.RITUALIST_PROFILES || [];
}

function readExistingCache(source) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "profile-cache.js" });
  return sandbox.window.RITUALIST_PROFILE_CACHE || {};
}

function avatarBytesFromDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl || "");
  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase();
  const extension = mimeType.includes("png") ? ".png" : mimeType.includes("webp") ? ".webp" : ".jpg";
  return {
    bytes: Buffer.from(match[2], "base64"),
    extension
  };
}

function avatarExtensionFromUrl(url) {
  const cleanUrl = new URL(url);
  const extension = extname(cleanUrl.pathname).toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].includes(extension) ? extension : ".jpg";
}

function svgAvatar(username, displayName) {
  const label = normalizeUsername(displayName || username);
  const initial = (label[0] || "?").toUpperCase();
  const hue = [...normalizeUsername(username)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="38%" r="70%">
      <stop offset="0%" stop-color="hsl(${hue}, 95%, 22%)"/>
      <stop offset="100%" stop-color="#031008"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="256" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="232" fill="none" stroke="#38ff29" stroke-opacity=".42" stroke-width="10"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
    font-family="Inter, Arial, sans-serif" font-size="210" font-weight="900" fill="#38ff29">${initial}</text>
</svg>
`;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 RitualRecognizer/1.0"
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function writeGeneratedAvatar(username, displayName) {
  const outputName = `${safeFileName(username)}.svg`;
  await writeFile(new URL(outputName, assetsDir), svgAvatar(username, displayName));
  return `./assets/profiles/${outputName}`;
}

async function downloadAvatar(username, avatar, suffix = "") {
  if (!avatar) {
    return "";
  }

  const fileName = `${safeFileName(username)}${suffix}`;
  const dataUrlAvatar = avatarBytesFromDataUrl(avatar);

  if (dataUrlAvatar) {
    const outputName = `${fileName}${dataUrlAvatar.extension}`;
    await writeFile(new URL(outputName, assetsDir), dataUrlAvatar.bytes);
    return `./assets/profiles/${outputName}`;
  }

  if (!/^https?:\/\//i.test(avatar)) {
    return "";
  }

  const response = await fetchWithTimeout(avatar);
  if (!response.ok) {
    return "";
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    return "";
  }

  const outputName = `${fileName}${avatarExtensionFromUrl(avatar)}`;
  await writeFile(new URL(outputName, assetsDir), Buffer.from(await response.arrayBuffer()));
  return `./assets/profiles/${outputName}`;
}

async function existingAvatarUrl(username) {
  try {
    const fileName = safeFileName(username).toLowerCase();
    const files = await readdir(assetsDir);
    const matches = files.filter((file) => file.toLowerCase().startsWith(`${fileName}.`));
    const match = matches.find((file) => !file.toLowerCase().endsWith(".svg")) || matches[0];
    return match ? `./assets/profiles/${match}` : "";
  } catch {
    return "";
  }
}

async function fetchProxyProfile(profile) {
  if (skipProxy) {
    throw new Error("Proxy skipped");
  }

  const username = normalizeUsername(profile.xUsername);
  const response = await fetchWithTimeout(`${proxyBaseUrl}/${encodeURIComponent(username)}`);

  if (!response.ok) {
    throw new Error(`Proxy returned ${response.status}`);
  }

  const data = await response.json();
  return {
    avatar: data.avatar,
    bio: data.bio || data.description || profile.bio || "Indonesian Ritual community member.",
    displayName: data.displayName || data.name || username,
    username
  };
}

async function tryRemoteAvatarProviders(username) {
  const providers = [
    `https://unavatar.io/x/${encodeURIComponent(username)}`,
    `https://unavatar.io/twitter/${encodeURIComponent(username)}`
  ];

  for (const [index, provider] of providers.entries()) {
    try {
      const avatarUrl = await downloadAvatar(username, provider, index ? `-${index}` : "");
      if (avatarUrl) {
        return avatarUrl;
      }
    } catch {
      // Keep trying other providers.
    }
  }

  return "";
}

function serializeCache(entries) {
  return `window.RITUALIST_PROFILE_CACHE = ${JSON.stringify(entries, null, 2)};\n`;
}

await mkdir(assetsDir, { recursive: true });

const source = await readFile(profilesPath, "utf8");
const profiles = readProfiles(source);
const existingCache = await readFile(cachePath, "utf8").then(readExistingCache).catch(() => ({}));
const cache = {};
const generatedAvatars = [];

async function cacheProfile(profile) {
  const username = normalizeUsername(profile.xUsername);
  const previous = existingCache[username.toLowerCase()] || {};
  const existingAvatar = forceRefresh ? "" : await existingAvatarUrl(username);
  const existingAvatarIsGenerated = existingAvatar.toLowerCase().endsWith(".svg");

  if (localOnly) {
    const avatarUrl = existingAvatar || (await writeGeneratedAvatar(username, username));
    if (!existingAvatar) {
      generatedAvatars.push(username);
    }

    cache[username.toLowerCase()] = {
      avatarUrl,
      bio: previous.bio || profile.bio || "Indonesian Ritual community member.",
      displayName: previous.displayName || username,
      username
    };

    console.log(`local ${username}`);
    return;
  }

  let proxyProfile = {
    avatar: "",
    bio: previous.bio || profile.bio || "Indonesian Ritual community member.",
    displayName: previous.displayName || username,
    username
  };

  const previousHasDisplayName =
    previous.displayName && previous.displayName.toLowerCase() !== username.toLowerCase();

  if (!forceRefresh && previousHasDisplayName) {
    console.log(`name cached ${username} -> ${previous.displayName}`);
  } else {
    try {
      proxyProfile = await fetchProxyProfile(profile);
    } catch (error) {
      console.log(`proxy miss ${username}: ${error.message}`);
    }
  }

  let avatarUrl = existingAvatarIsGenerated ? "" : existingAvatar;

  if (!avatarUrl) {
    avatarUrl = await downloadAvatar(username, proxyProfile.avatar);
  }

  if (!avatarUrl) {
    avatarUrl = await tryRemoteAvatarProviders(username);
  }

  if (!avatarUrl) {
    avatarUrl = existingAvatar || (await writeGeneratedAvatar(username, proxyProfile.displayName));
    if (!existingAvatar) {
      generatedAvatars.push(username);
    }
  }

  cache[username.toLowerCase()] = {
    avatarUrl,
    bio: proxyProfile.bio,
    displayName: proxyProfile.displayName,
    username
  };

  console.log(`cached ${username} -> ${avatarUrl}`);
}

for (let index = 0; index < profiles.length; index += concurrency) {
  await Promise.all(profiles.slice(index, index + concurrency).map(cacheProfile));
  await writeFile(cachePath, serializeCache(cache));
}

await writeFile(cachePath, serializeCache(cache));

console.log("");
console.log(`profiles: ${profiles.length}`);
console.log(`generated avatars: ${generatedAvatars.length}`);
if (generatedAvatars.length) {
  console.log(generatedAvatars.join(", "));
}
