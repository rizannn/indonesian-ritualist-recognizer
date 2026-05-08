# Indonesian Ritualist Recognizer

A small starter dApp for asking one question about an X profile: **do you recognize this ritualist?**

The frontend is English-only and intentionally static, so the first version can run without a build step. The smart contract stores X profile metadata and requires every answer to be submitted as an on-chain transaction.

## Files

- `src/RitualistRecognizer.sol` - Solidity contract for profiles and answers.
- `test/RitualistRecognizer.t.sol` - Foundry tests for the contract.
- `script/SyncRitualistProfiles.s.sol` - generated Foundry deploy-and-seed / sync scripts.
- `scripts/build-contract-seed.mjs` - regenerates the Foundry profile sync script from frontend cache.
- `scripts/set-contract-address.mjs` - writes the deployed contract address into the frontend.
- `app/index.html` - Static dApp screen.
- `app/src/profiles.js` - Editable X username list for the first prototype.
- `app/src/main.js` - Wallet connection, contract calls, and vote transaction flow.
- `app/src/styles.css` - UI styling.

## Foundry Commands

If Foundry is not in your PATH on Windows, run it with the full local binary path:

```powershell
C:\Users\muhri\.foundry\bin\forge.exe build
C:\Users\muhri\.foundry\bin\forge.exe test -vvv
```

## Run Website

From this folder:

```powershell
npm run dev
```

Then open:

```text
http://127.0.0.1:5173
```

The frontend is already configured for Ritual Chain and the deployed contract:

```text
0xce0c55a7eD14e61F0A828e2cDcc48cF2b34401DF
```

## Cache X Profiles

The website reads candidate names and avatars from local cache files, not live X requests.

Safe cache refresh:

```powershell
npm run cache:profiles
```

Fast local-only fallback:

```powershell
npm run cache:profiles:fast
```

This project does not require X login cookies. Profile images are cached from public sources when available, then the script generates stable local fallback avatars for anything missing.

If more X display names are fetched, regenerate the Foundry seed script:

```powershell
npm run build:seed
```

## Contract Workflow

Build and test:

```powershell
C:\Users\muhri\.foundry\bin\forge.exe build
C:\Users\muhri\.foundry\bin\forge.exe test -vvv
```

Dry-run deploy plus 100-profile seed:

```powershell
C:\Users\muhri\.foundry\bin\forge.exe script script/SyncRitualistProfiles.s.sol:DeployAndSeedRitualistRecognizer
```

Deploy and seed to an EVM network:

```powershell
$env:PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
$env:RPC_URL="YOUR_RPC_URL"
C:\Users\muhri\.foundry\bin\forge.exe script script/SyncRitualistProfiles.s.sol:DeployAndSeedRitualistRecognizer --rpc-url $env:RPC_URL --private-key $env:PRIVATE_KEY --broadcast
```

Sync the current 100 profiles to an already deployed contract:

```powershell
$env:PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
$env:RPC_URL="YOUR_RPC_URL"
$env:RECOGNIZER_ADDRESS="0xYOUR_CONTRACT_ADDRESS"
C:\Users\muhri\.foundry\bin\forge.exe script script/SyncRitualistProfiles.s.sol:SyncRitualistProfiles --rpc-url $env:RPC_URL --private-key $env:PRIVATE_KEY --broadcast
```

After deployment, connect the frontend:

```powershell
npm run set:contract -- 0xYOUR_CONTRACT_ADDRESS
```

Never commit `.env`, private keys, or deployer wallet secrets.

## First Setup

1. Refresh/cache profiles if needed.
2. Run `npm run build:seed`.
3. Deploy with `DeployAndSeedRitualistRecognizer`.
4. Run `npm run set:contract -- 0xYOUR_CONTRACT_ADDRESS`.
5. Run `npm run dev`.
6. Open the website, enter your X username, connect wallet, and switch to Ritual Chain if prompted.

## Profile List

For the first prototype, add usernames in `app/src/profiles.js`:

```js
{
  profileId: "1",
  xUsername: "ritualnet",
  displayName: "",
  avatarUrl: "",
  bio: "Indonesian Ritualist community member."
}
```

The frontend will try to load display name and profile picture from:

```text
https://ritual-twitter-proxy.artelamon.workers.dev/api/twitter/{username}
```

Keep `profileId` aligned with the on-chain profile ID created in the contract.

## Notes For The Next Build

- Move X profile fetching to a small backend because X data access and image fetching can hit API, CORS, or rate-limit constraints.
- Add an indexer or event reader if you want a leaderboard, profile history, or community analytics.
