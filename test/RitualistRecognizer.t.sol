// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/RitualistRecognizer.sol";

contract RitualistRecognizerTest is Test {
    RitualistRecognizer public recognizer;

    address public owner = address(1);
    address public voter = address(2);
    address public secondVoter = address(3);

    function setUp() public {
        vm.prank(owner);
        recognizer = new RitualistRecognizer();
    }

    function testOwnerCanCreateProfile() public {
        vm.startPrank(owner);
        uint256 profileId =
            recognizer.createProfile("budi_x", "Budi Santoso", "ipfs://avatar123", "ipfs://metadata123", bytes32(0));
        vm.stopPrank();

        (
            string memory xUsername,
            string memory displayName,
            string memory avatarURI,
            string memory metadataURI,
            bytes32 metadataHash,
            uint256 knowCount,
            uint256 doNotKnowCount
        ) = recognizer.getProfile(profileId);

        assertEq(profileId, 1);
        assertEq(xUsername, "budi_x");
        assertEq(displayName, "Budi Santoso");
        assertEq(avatarURI, "ipfs://avatar123");
        assertEq(metadataURI, "ipfs://metadata123");
        assertEq(metadataHash, bytes32(0));
        assertEq(knowCount, 0);
        assertEq(doNotKnowCount, 0);
        assertEq(recognizer.totalProfiles(), 1);
    }

    function testOwnerCanUpdateProfile() public {
        uint256 profileId = createSampleProfile();

        vm.prank(owner);
        recognizer.updateProfile(profileId, "rizan67", "rizan", "https://unavatar.io/x/rizann67", "", bytes32(0));

        (string memory xUsername, string memory displayName, string memory avatarURI,,,,) =
            recognizer.getProfile(profileId);

        assertEq(xUsername, "rizan67");
        assertEq(displayName, "rizan");
        assertEq(avatarURI, "https://unavatar.io/x/rizann67");
    }

    function testOnlyOwnerCanUpdateProfile() public {
        uint256 profileId = createSampleProfile();

        vm.expectRevert("Only owner");
        vm.prank(voter);
        recognizer.updateProfile(profileId, "rizan67", "rizan", "https://unavatar.io/x/rizann67", "", bytes32(0));
    }

    function testVoterCanAnswerKnow() public {
        uint256 profileId = createSampleProfile();

        vm.prank(voter);
        recognizer.answer(profileId, true);

        (,,,,, uint256 knowCount, uint256 doNotKnowCount) = recognizer.getProfile(profileId);

        assertEq(knowCount, 1);
        assertEq(doNotKnowCount, 0);

        RitualistRecognizer.RecognitionAnswer voterAnswer = recognizer.getAnswer(profileId, voter);
        assertTrue(voterAnswer == RitualistRecognizer.RecognitionAnswer.Know);
    }

    function testVoterCanAnswerDoNotKnow() public {
        uint256 profileId = createSampleProfile();

        vm.prank(voter);
        recognizer.answer(profileId, false);

        (,,,,, uint256 knowCount, uint256 doNotKnowCount) = recognizer.getProfile(profileId);

        assertEq(knowCount, 0);
        assertEq(doNotKnowCount, 1);

        RitualistRecognizer.RecognitionAnswer voterAnswer = recognizer.getAnswer(profileId, voter);
        assertTrue(voterAnswer == RitualistRecognizer.RecognitionAnswer.DoNotKnow);
    }

    function testVoterCannotAnswerSameProfileTwice() public {
        uint256 profileId = createSampleProfile();

        vm.prank(voter);
        recognizer.answer(profileId, true);

        vm.expectRevert("Already answered");
        vm.prank(voter);
        recognizer.answer(profileId, false);
    }

    function testVoterCanAnswerBatch() public {
        uint256 firstProfileId = createSampleProfile();
        uint256 secondProfileId = createSampleProfile();
        uint256 thirdProfileId = createSampleProfile();

        uint256[] memory profileIds = new uint256[](3);
        profileIds[0] = firstProfileId;
        profileIds[1] = secondProfileId;
        profileIds[2] = thirdProfileId;

        bool[] memory knows = new bool[](3);
        knows[0] = true;
        knows[1] = false;
        knows[2] = true;

        vm.prank(voter);
        recognizer.answerBatch(profileIds, knows);

        (,,,,, uint256 firstKnowCount, uint256 firstDoNotKnowCount) = recognizer.getProfile(firstProfileId);
        (,,,,, uint256 secondKnowCount, uint256 secondDoNotKnowCount) = recognizer.getProfile(secondProfileId);
        (,,,,, uint256 thirdKnowCount, uint256 thirdDoNotKnowCount) = recognizer.getProfile(thirdProfileId);

        assertEq(firstKnowCount, 1);
        assertEq(firstDoNotKnowCount, 0);
        assertEq(secondKnowCount, 0);
        assertEq(secondDoNotKnowCount, 1);
        assertEq(thirdKnowCount, 1);
        assertEq(thirdDoNotKnowCount, 0);
        assertTrue(recognizer.getAnswer(firstProfileId, voter) == RitualistRecognizer.RecognitionAnswer.Know);
        assertTrue(recognizer.getAnswer(secondProfileId, voter) == RitualistRecognizer.RecognitionAnswer.DoNotKnow);
        assertTrue(recognizer.getAnswer(thirdProfileId, voter) == RitualistRecognizer.RecognitionAnswer.Know);
    }

    function testBatchRequiresMatchingLengths() public {
        uint256[] memory profileIds = new uint256[](1);
        profileIds[0] = createSampleProfile();

        bool[] memory knows = new bool[](0);

        vm.expectRevert("Length mismatch");
        vm.prank(voter);
        recognizer.answerBatch(profileIds, knows);
    }

    function testBatchCannotIncludeAlreadyAnsweredProfile() public {
        uint256 firstProfileId = createSampleProfile();
        uint256 secondProfileId = createSampleProfile();

        vm.prank(voter);
        recognizer.answer(firstProfileId, true);

        uint256[] memory profileIds = new uint256[](2);
        profileIds[0] = firstProfileId;
        profileIds[1] = secondProfileId;

        bool[] memory knows = new bool[](2);
        knows[0] = false;
        knows[1] = true;

        vm.expectRevert("Already answered");
        vm.prank(voter);
        recognizer.answerBatch(profileIds, knows);
    }

    function testDifferentVotersCanAnswerSameProfile() public {
        uint256 profileId = createSampleProfile();

        vm.prank(voter);
        recognizer.answer(profileId, true);

        vm.prank(secondVoter);
        recognizer.answer(profileId, false);

        (,,,,, uint256 knowCount, uint256 doNotKnowCount) = recognizer.getProfile(profileId);

        assertEq(knowCount, 1);
        assertEq(doNotKnowCount, 1);
    }

    function testOnlyOwnerCanCreateProfile() public {
        vm.expectRevert("Only owner");
        vm.prank(voter);
        recognizer.createProfile("budi_x", "Budi Santoso", "ipfs://avatar123", "ipfs://metadata123", bytes32(0));
    }

    function createSampleProfile() internal returns (uint256 profileId) {
        vm.prank(owner);
        profileId =
            recognizer.createProfile("budi_x", "Budi Santoso", "ipfs://avatar123", "ipfs://metadata123", bytes32(0));
    }
}
