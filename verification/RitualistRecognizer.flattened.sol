// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// src/RitualistRecognizer.sol

/// @title Indonesian Ritualist Recognizer
/// @notice Stores X-based ritualist profiles and recognition answers.
///         Uses Ritual HTTP precompile (0x0801) to fetch on-chain block data
///         as a TEE-verified timestamp proof when answers are submitted.
contract RitualistRecognizer {

    // ─── Ritual precompile & system contract addresses ────────────────────────
    address constant HTTP_PRECOMPILE  = address(0x0801);
    address constant RITUAL_WALLET    = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;

    // ─── Types ─────────────────────────────────────────────────────────────────
    enum RecognitionAnswer { Unanswered, Know, DoNotKnow }

    struct Profile {
        string  xUsername;
        string  displayName;
        string  avatarURI;
        string  metadataURI;
        bytes32 metadataHash;
        uint256 knowCount;
        uint256 doNotKnowCount;
        bool    exists;
    }

    // ─── Storage ───────────────────────────────────────────────────────────────
    address public owner;
    uint256 public nextProfileId = 1;

    /// @dev TEE executor address fetched from TEEServiceRegistry; settable by owner.
    address public httpExecutor;

    mapping(uint256 => Profile)                                private profiles;
    mapping(uint256 => mapping(address => RecognitionAnswer))  private answers;

    /// @dev Stores the last HTTP verification response per submitter.
    mapping(address => bytes32) public lastVerificationHash;

    // ─── Events ────────────────────────────────────────────────────────────────
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event ProfileCreated(
        uint256 indexed profileId,
        string xUsername,
        string displayName,
        string avatarURI,
        string metadataURI,
        bytes32 metadataHash
    );
    event ProfileUpdated(
        uint256 indexed profileId,
        string xUsername,
        string displayName,
        string avatarURI,
        string metadataURI,
        bytes32 metadataHash
    );
    event AnswerSubmitted(uint256 indexed profileId, address indexed voter, bool knows);
    event ExecutorUpdated(address indexed newExecutor);

    /// @dev Emitted when the HTTP precompile returns a verification response.
    event VerificationCompleted(
        address indexed voter,
        uint256 answersSubmitted,
        bytes32 responseHash
    );

    // ─── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier profileExists(uint256 profileId) {
        require(profiles[profileId].exists, "Profile does not exist");
        _;
    }

    // ─── Constructor ───────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ─── Receive (accept RITUAL for wallet top-ups) ────────────────────────────
    receive() external payable {}

    // ─── Owner functions ───────────────────────────────────────────────────────
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Set the TEE HTTP executor address (from TEEServiceRegistry).
    function setHttpExecutor(address executor) external onlyOwner {
        require(executor != address(0), "Invalid executor");
        httpExecutor = executor;
        emit ExecutorUpdated(executor);
    }

    /// @notice Deposit RITUAL into RitualWallet to fund HTTP precompile fees.
    function depositForFees() external payable {
        (bool ok,) = RITUAL_WALLET.call{value: msg.value}(
            abi.encodeWithSignature("deposit(uint256)", uint256(5000))
        );
        require(ok, "RitualWallet deposit failed");
    }

    // ─── Profile management ────────────────────────────────────────────────────
    function totalProfiles() external view returns (uint256) {
        return nextProfileId - 1;
    }

    function createProfile(
        string calldata xUsername,
        string calldata displayName,
        string calldata avatarURI,
        string calldata metadataURI,
        bytes32 metadataHash
    ) external onlyOwner returns (uint256 profileId) {
        require(bytes(xUsername).length > 0, "Missing X username");
        require(bytes(avatarURI).length > 0, "Missing avatar URI");

        profileId = nextProfileId++;
        profiles[profileId] = Profile({
            xUsername:      xUsername,
            displayName:    displayName,
            avatarURI:      avatarURI,
            metadataURI:    metadataURI,
            metadataHash:   metadataHash,
            knowCount:      0,
            doNotKnowCount: 0,
            exists:         true
        });

        emit ProfileCreated(profileId, xUsername, displayName, avatarURI, metadataURI, metadataHash);
    }

    function updateProfile(
        uint256 profileId,
        string calldata xUsername,
        string calldata displayName,
        string calldata avatarURI,
        string calldata metadataURI,
        bytes32 metadataHash
    ) external onlyOwner profileExists(profileId) {
        require(bytes(xUsername).length > 0, "Missing X username");
        require(bytes(avatarURI).length > 0, "Missing avatar URI");

        Profile storage profile = profiles[profileId];
        profile.xUsername    = xUsername;
        profile.displayName  = displayName;
        profile.avatarURI    = avatarURI;
        profile.metadataURI  = metadataURI;
        profile.metadataHash = metadataHash;

        emit ProfileUpdated(profileId, xUsername, displayName, avatarURI, metadataURI, metadataHash);
    }

    // ─── Answer functions ──────────────────────────────────────────────────────
    function answer(uint256 profileId, bool knows) external profileExists(profileId) {
        _answer(profileId, knows, msg.sender);
    }

    /// @notice Submit all recognition answers WITHOUT HTTP verification.
    ///         Use this if httpExecutor is not set yet.
    function answerBatch(uint256[] calldata profileIds, bool[] calldata knows) external {
        require(profileIds.length > 0, "No answers");
        require(profileIds.length == knows.length, "Length mismatch");
        for (uint256 i = 0; i < profileIds.length; i++) {
            _answer(profileIds[i], knows[i], msg.sender);
        }
    }

    /// @notice Submit recognition answers AND call the HTTP precompile for
    ///         TEE-verified on-chain proof. Requires httpExecutor to be set
    ///         and caller's RitualWallet to be funded.
    ///
    ///         This creates TxAsyncCommitment + TxAsyncSettlement on Ritual Chain.
    function answerBatchVerified(
        uint256[] calldata profileIds,
        bool[]    calldata knows,
        uint256            ttl
    ) external {
        require(profileIds.length > 0, "No answers");
        require(profileIds.length == knows.length, "Length mismatch");
        require(httpExecutor != address(0), "HTTP executor not set");
        require(ttl > 0 && ttl <= 500, "TTL must be 1-500 blocks");

        // 1. Store all answers on-chain first.
        for (uint256 i = 0; i < profileIds.length; i++) {
            _answer(profileIds[i], knows[i], msg.sender);
        }

        // 2. Call HTTP precompile — fetch block number from Ritual RPC as
        //    a TEE-verified timestamp proof of when this batch was submitted.
        //
        //    POST https://rpc.ritualfoundation.org
        //    Body: {"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}
        //
        //    This is a short-running async call. The block builder creates a
        //    TxAsyncCommitment, the TEE executor fetches the block number,
        //    and TxAsyncSettlement delivers the result — all visible on the
        //    Ritual explorer.

        string memory rpcUrl  = "https://rpc.ritualfoundation.org";
        string memory rpcBody = '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}';

        string[] memory hk = new string[](1);
        string[] memory hv = new string[](1);
        hk[0] = "Content-Type";
        hv[0] = "application/json";

        bytes memory httpInput = abi.encode(
            httpExecutor,        // executor (from TEEServiceRegistry)
            new bytes[](0),      // encryptedSecrets (none)
            ttl,                 // TTL in blocks (1–500)
            new bytes[](0),      // secretSignatures (none)
            bytes(""),           // userPublicKey (plaintext response)
            rpcUrl,              // url
            uint8(2),            // method: POST
            hk,                  // headerKeys
            hv,                  // headerValues
            bytes(rpcBody),      // body
            uint256(0),          // dkmsKeyIndex (not using dKMS)
            uint8(0),            // dkmsKeyFormat
            false                // piiEnabled
        );

        (bool ok, bytes memory rawOutput) = HTTP_PRECOMPILE.call(httpInput);
        require(ok, "HTTP precompile call failed");

        // 3. Decode the async envelope: (bytes simmedInput, bytes actualOutput)
        //    During simulation actualOutput is empty — that's fine.
        //    When settled, actualOutput contains the HTTP response.
        (, bytes memory actualOutput) = abi.decode(rawOutput, (bytes, bytes));

        bytes32 responseHash;
        if (actualOutput.length > 0) {
            // Decode HTTP response: (uint16 status, string[] hk, string[] hv, bytes body, string err)
            (, , , bytes memory body,) = abi.decode(
                actualOutput, (uint16, string[], string[], bytes, string)
            );
            responseHash = keccak256(body);
        } else {
            // Simulation path — hash the raw output as placeholder.
            responseHash = keccak256(rawOutput);
        }

        // 4. Store verification hash and emit event.
        lastVerificationHash[msg.sender] = responseHash;
        emit VerificationCompleted(msg.sender, profileIds.length, responseHash);
    }

    // ─── Read functions ────────────────────────────────────────────────────────
    function getProfile(uint256 profileId)
        external
        view
        profileExists(profileId)
        returns (
            string  memory xUsername,
            string  memory displayName,
            string  memory avatarURI,
            string  memory metadataURI,
            bytes32        metadataHash,
            uint256        knowCount,
            uint256        doNotKnowCount
        )
    {
        Profile storage p = profiles[profileId];
        return (p.xUsername, p.displayName, p.avatarURI, p.metadataURI,
                p.metadataHash, p.knowCount, p.doNotKnowCount);
    }

    function getAnswer(uint256 profileId, address voter)
        external
        view
        profileExists(profileId)
        returns (RecognitionAnswer)
    {
        return answers[profileId][voter];
    }

    // ─── Internal ──────────────────────────────────────────────────────────────
    function _answer(uint256 profileId, bool knows, address voter)
        internal
        profileExists(profileId)
    {
        require(
            answers[profileId][voter] == RecognitionAnswer.Unanswered,
            "Already answered"
        );

        if (knows) {
            profiles[profileId].knowCount += 1;
            answers[profileId][voter] = RecognitionAnswer.Know;
        } else {
            profiles[profileId].doNotKnowCount += 1;
            answers[profileId][voter] = RecognitionAnswer.DoNotKnow;
        }

        emit AnswerSubmitted(profileId, voter, knows);
    }
}
