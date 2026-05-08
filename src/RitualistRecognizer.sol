// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Indonesian Ritualist Recognizer
/// @notice Stores X-based ritualist profiles and one on-chain recognition answer per wallet.
contract RitualistRecognizer {
    enum RecognitionAnswer {
        Unanswered,
        Know,
        DoNotKnow
    }

    struct Profile {
        string xUsername;
        string displayName;
        string avatarURI;
        string metadataURI;
        bytes32 metadataHash;
        uint256 knowCount;
        uint256 doNotKnowCount;
        bool exists;
    }

    address public owner;
    uint256 public nextProfileId = 1;

    mapping(uint256 => Profile) private profiles;
    mapping(uint256 => mapping(address => RecognitionAnswer)) private answers;

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

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier profileExists(uint256 profileId) {
        require(profiles[profileId].exists, "Profile does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function totalProfiles() external view returns (uint256) {
        return nextProfileId - 1;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
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
            xUsername: xUsername,
            displayName: displayName,
            avatarURI: avatarURI,
            metadataURI: metadataURI,
            metadataHash: metadataHash,
            knowCount: 0,
            doNotKnowCount: 0,
            exists: true
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
        profile.xUsername = xUsername;
        profile.displayName = displayName;
        profile.avatarURI = avatarURI;
        profile.metadataURI = metadataURI;
        profile.metadataHash = metadataHash;

        emit ProfileUpdated(profileId, xUsername, displayName, avatarURI, metadataURI, metadataHash);
    }

    function answer(uint256 profileId, bool knows) external profileExists(profileId) {
        require(answers[profileId][msg.sender] == RecognitionAnswer.Unanswered, "Already answered");

        if (knows) {
            profiles[profileId].knowCount += 1;
            answers[profileId][msg.sender] = RecognitionAnswer.Know;
        } else {
            profiles[profileId].doNotKnowCount += 1;
            answers[profileId][msg.sender] = RecognitionAnswer.DoNotKnow;
        }

        emit AnswerSubmitted(profileId, msg.sender, knows);
    }

    function getProfile(uint256 profileId)
        external
        view
        profileExists(profileId)
        returns (
            string memory xUsername,
            string memory displayName,
            string memory avatarURI,
            string memory metadataURI,
            bytes32 metadataHash,
            uint256 knowCount,
            uint256 doNotKnowCount
        )
    {
        Profile storage profile = profiles[profileId];
        return (
            profile.xUsername,
            profile.displayName,
            profile.avatarURI,
            profile.metadataURI,
            profile.metadataHash,
            profile.knowCount,
            profile.doNotKnowCount
        );
    }

    function getAnswer(uint256 profileId, address voter)
        external
        view
        profileExists(profileId)
        returns (RecognitionAnswer)
    {
        return answers[profileId][voter];
    }
}
