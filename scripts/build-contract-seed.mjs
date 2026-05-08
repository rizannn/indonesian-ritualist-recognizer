import { readFile, writeFile } from "node:fs/promises";
import vm from "node:vm";

const profilesPath = new URL("../app/src/profiles.js", import.meta.url);
const cachePath = new URL("../app/src/profile-cache.js", import.meta.url);
const outputPath = new URL("../script/SyncRitualistProfiles.s.sol", import.meta.url);

function readWindowAssignment(source, fileName, key) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: fileName });
  return sandbox.window[key];
}

function solString(value) {
  const escaped = String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t");

  return `unicode"${escaped}"`;
}

function renderProfileCall(profile, cached) {
  const username = profile.xUsername;
  const displayName = cached?.displayName || username;
  const bio = cached?.bio || profile.bio || "Indonesian Ritual community member.";

  return `        _syncProfile(
            recognizer,
            ${Number(profile.profileId)},
            ${solString(username)},
            ${solString(displayName)},
            ${solString(bio)}
        );`;
}

function renderResumeProfileCall(profile, cached) {
  const username = profile.xUsername;
  const displayName = cached?.displayName || username;
  const bio = cached?.bio || profile.bio || "Indonesian Ritual community member.";

  return `        _createProfileIfMissing(
            recognizer,
            ${Number(profile.profileId)},
            ${solString(username)},
            ${solString(displayName)},
            ${solString(bio)}
        );`;
}

function renderSolidity(profiles, cache) {
  const sortedProfiles = profiles.sort((left, right) => Number(left.profileId) - Number(right.profileId));
  const calls = sortedProfiles
    .map((profile) => renderProfileCall(profile, cache[profile.xUsername.toLowerCase()]))
    .join("\n\n");
  const resumeCalls = sortedProfiles
    .map((profile) => renderResumeProfileCall(profile, cache[profile.xUsername.toLowerCase()]))
    .join("\n\n");

  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/RitualistRecognizer.sol";

/// @notice Generated from app/src/profiles.js and app/src/profile-cache.js.
/// Run "npm run build:seed" after refreshing profile cache.
abstract contract RitualistProfileSync is Script {
    function _avatarURI(string memory username) internal pure returns (string memory) {
        return string.concat("https://unavatar.io/x/", username);
    }

    function _syncProfiles(RitualistRecognizer recognizer) internal {
${calls}
    }

    function _resumeProfiles(RitualistRecognizer recognizer) internal {
${resumeCalls}
    }

    function _syncProfile(
        RitualistRecognizer recognizer,
        uint256 profileId,
        string memory xUsername,
        string memory displayName,
        string memory metadataURI
    ) private {
        string memory avatarURI = _avatarURI(xUsername);

        if (recognizer.nextProfileId() <= profileId) {
            uint256 createdProfileId =
                recognizer.createProfile(xUsername, displayName, avatarURI, metadataURI, bytes32(0));
            require(createdProfileId == profileId, "Profile ID mismatch");
        } else {
            recognizer.updateProfile(profileId, xUsername, displayName, avatarURI, metadataURI, bytes32(0));
        }
    }

    function _createProfileIfMissing(
        RitualistRecognizer recognizer,
        uint256 profileId,
        string memory xUsername,
        string memory displayName,
        string memory metadataURI
    ) private {
        if (recognizer.nextProfileId() > profileId) {
            return;
        }

        uint256 createdProfileId =
            recognizer.createProfile(xUsername, displayName, _avatarURI(xUsername), metadataURI, bytes32(0));
        require(createdProfileId == profileId, "Profile ID mismatch");
    }
}

contract DeployAndSeedRitualistRecognizer is RitualistProfileSync {
    function run() external returns (RitualistRecognizer recognizer) {
        vm.startBroadcast();
        recognizer = new RitualistRecognizer();
        _syncProfiles(recognizer);
        vm.stopBroadcast();
    }
}

contract SyncRitualistProfiles is RitualistProfileSync {
    function run() external {
        address recognizerAddress = vm.envAddress("RECOGNIZER_ADDRESS");
        RitualistRecognizer recognizer = RitualistRecognizer(recognizerAddress);

        vm.startBroadcast();
        _syncProfiles(recognizer);
        vm.stopBroadcast();
    }
}

contract ResumeRitualistProfiles is RitualistProfileSync {
    function run() external {
        address recognizerAddress = vm.envAddress("RECOGNIZER_ADDRESS");
        RitualistRecognizer recognizer = RitualistRecognizer(recognizerAddress);

        vm.startBroadcast();
        _resumeProfiles(recognizer);
        vm.stopBroadcast();
    }
}
`;
}

const profilesSource = await readFile(profilesPath, "utf8");
const cacheSource = await readFile(cachePath, "utf8");
const profiles = readWindowAssignment(profilesSource, "profiles.js", "RITUALIST_PROFILES") || [];
const cache = readWindowAssignment(cacheSource, "profile-cache.js", "RITUALIST_PROFILE_CACHE") || {};

await writeFile(outputPath, renderSolidity(profiles, cache));

const namedCount = profiles.filter((profile) => {
  const cached = cache[profile.xUsername.toLowerCase()];
  return cached?.displayName && cached.displayName.toLowerCase() !== profile.xUsername.toLowerCase();
}).length;

console.log(`generated script/SyncRitualistProfiles.s.sol`);
console.log(`profiles: ${profiles.length}`);
console.log(`display names: ${namedCount}`);
