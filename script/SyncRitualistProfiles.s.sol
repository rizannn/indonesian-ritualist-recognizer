// SPDX-License-Identifier: MIT
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
        _syncProfile(
            recognizer,
            1,
            unicode"Evoyudhasamael",
            unicode"Evo Yudha Samael",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            2,
            unicode"MarkoStevan19",
            unicode"Marko Stevan (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            3,
            unicode"jepannyaa",
            unicode"jepannyaa (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 4, unicode"johntolxbt", unicode"john (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 5, unicode"orpheuskaze", unicode"orpheuzkaze", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            6,
            unicode"tutubearrr",
            unicode"tutubear (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 7, unicode"rizann67", unicode"rizan (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            8,
            unicode"direumatteul",
            unicode"nat die (! 𝕜𝕒𝕞𝕒𝕝𝕫) | (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            9,
            unicode"Nice_guyyy1",
            unicode"Asceno 🟦 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 10, unicode"basss_eth", unicode"Babasss (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 11, unicode"jen_bobz", unicode"Badebest (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 12, unicode"batagor", unicode"Batagor (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            13,
            unicode"decka_chan",
            unicode"Decka ちゃん (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 14, unicode"Jonathanhnd11", unicode"Jonathan", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 15, unicode"Leckxy_id", unicode"Lecxky (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            16,
            unicode"0xlunabean",
            unicode"Lunabean (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 17, unicode"0xhahawe", unicode"Hahawe (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 18, unicode"0xkaybu", unicode"Kaybu", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer, 19, unicode"mexyy877", unicode"Mexyy (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 20, unicode"hazelnty_", unicode"hazel", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer,
            21,
            unicode"0xMiiceeelll",
            unicode"miiceell🧚🏻‍♀️ (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 22, unicode"NanangN27", unicode"N G (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            23,
            unicode"nostalgiagila",
            unicode"nostalgiagila (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            24,
            unicode"cuanbanyak2016",
            unicode"online (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 25, unicode"NineMay_ID", unicode"Raka (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            26,
            unicode"starknight50x",
            unicode"Star Knight (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 27, unicode"0xWnanta", unicode"Wnanta", unicode"Indonesian Ritual community member.");

        _syncProfile(recognizer, 28, unicode"Wyriium", unicode"Wyrium", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer,
            29,
            unicode"RXwhale",
            unicode"RamaXwhale | (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 30, unicode"nftzella", unicode"ZELLA⨀", unicode"Indonesian Ritual community member.");

        _syncProfile(recognizer, 31, unicode"yourinuu", unicode"yourinuu", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer, 32, unicode"0xyuura", unicode"Yuura (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            33,
            unicode"EvanBucin",
            unicode"VansStrong🐬 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            34,
            unicode"seesac_",
            unicode"S E E S A C (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 35, unicode"0x_kippo", unicode"KippoXBT", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer,
            36,
            unicode"vebrygans5",
            unicode"vebrygans5 base.eth (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 37, unicode"0xtequilaa", unicode"Tequila", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 38, unicode"0x_vibevortex", unicode"VibeVortex", unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 39, unicode"Dndxtzy", unicode"Levy", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer, 40, unicode"saddamovic", unicode"Saddamovic", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            41,
            unicode"Beruanglucu28",
            unicode"bearfunny(❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 42, unicode"KYY_NFT_", unicode"KYY", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer, 43, unicode"Oscarfortunes", unicode"Oscar", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            44,
            unicode"0xKreko",
            unicode"𝕂𝕣𝕖𝕜𝕠 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            45,
            unicode"jelenemae",
            unicode"Absolpii π² (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 46, unicode"ch4laa", unicode"chala (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            47,
            unicode"babysyenaa",
            unicode"BabySyen (evm/acc) (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 48, unicode"Ox6ce4", unicode"0xrumora ❖", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 49, unicode"flylucifer666", unicode"flylucifer", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 50, unicode"Vans_1611", unicode"Vans (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            51,
            unicode"ArokMub",
            unicode"0xark.base.eth (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 52, unicode"0ximbalance", unicode"piktawr", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 53, unicode"Zegnaeth", unicode"Zegna (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 54, unicode"0xTremolo", unicode"Tremolo", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer, 55, unicode"whuanjg", unicode"whuan (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 56, unicode"Oxhiizaaa", unicode"Konad(❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            57,
            unicode"LivreinIsHere",
            unicode"LivreinIsHere(❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            58,
            unicode"MozardGray",
            unicode"MozardGray (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            59,
            unicode"Bas_Basterx",
            unicode"Baster (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 60, unicode"OyengEth", unicode"Oyeng.eth", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 61, unicode"rzstwnn_", unicode"0xRz (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            62,
            unicode"Laysraymond66",
            unicode"Laysraymond (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 63, unicode"Js_Liim", unicode"JsLiim (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 64, unicode"drayvenweb3", unicode"Drayven", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 65, unicode"yetecevm", unicode"yetece (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 66, unicode"qrra_1", unicode"qyiiraaa (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            67,
            unicode"ma60768953",
            unicode"skylaaarrrkkk ❖,❖",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 68, unicode"kenann_szn", unicode"Kenannn!", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            69,
            unicode"kaiclyde447",
            unicode"himmelif (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            70,
            unicode"ba_skraaa",
            unicode"Buzz Claximity (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            71,
            unicode"nadsarmonads",
            unicode"nadsar Lyraffe army ❖,❖",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 72, unicode"justKjaa", unicode"kja", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer,
            73,
            unicode"Marshalahushein",
            unicode"Shen (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 74, unicode"0xjugger", unicode"Juggernaut ❖", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 75, unicode"0xfirless", unicode"firless (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 76, unicode"Rizkyy_028", unicode"Rizzz", unicode"Indonesian Ritual community member.");

        _syncProfile(recognizer, 77, unicode"Giselle20_", unicode"babyD", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer,
            78,
            unicode"orkawell",
            unicode"𝗢𝗥𝗞𝗔 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 79, unicode"takingford", unicode"Taking Tom", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            80,
            unicode"zasswff_",
            unicode"Cheaster Antariksa Zas (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 81, unicode"OnatEth", unicode"Onat.eth", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer, 82, unicode"callmehannnnnnn", unicode"callmehannn", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            83,
            unicode"DhikoKristiyan1",
            unicode"Dhikoo (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 84, unicode"biliebed_", unicode"Biliebed", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 85, unicode"anton_yoww", unicode"THONNN(❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            86,
            unicode"Thins140",
            unicode"🌸 Thins 🌸 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 87, unicode"travisqk", unicode"travis", unicode"Indonesian Ritual community member.");

        _syncProfile(recognizer, 88, unicode"shinjiihhh", unicode"Shin", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer, 89, unicode"Shanixeuu", unicode"Shanix (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(recognizer, 90, unicode"Tinushi71", unicode"pengon", unicode"Indonesian Ritual community member.");

        _syncProfile(
            recognizer,
            91,
            unicode"0xEyesofEtresia",
            unicode"Veyyy (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 92, unicode"lexyour1_", unicode"Suo (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 93, unicode"nomnomkiko", unicode"Kai (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            94,
            unicode"BreakNoLimit123",
            unicode"Violla (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 95, unicode"bramexyz", unicode"Habe (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            96,
            unicode"rikkydwiyanto",
            unicode"Rikky Dwiyanto (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            97,
            unicode"DzaRra234",
            unicode"zarra234 (❖,❖) π² 🍊,💊",
            unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 98, unicode"Shee178", unicode"0shee (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer, 99, unicode"Shromeey", unicode"MeeyVerse", unicode"Indonesian Ritual community member."
        );

        _syncProfile(
            recognizer,
            100,
            unicode"shigurekaicrypt",
            unicode"Shigure Kai (❖,❖)",
            unicode"Indonesian Ritual community member."
        );
    }

    function _resumeProfiles(RitualistRecognizer recognizer) internal {
        _createProfileIfMissing(
            recognizer,
            1,
            unicode"Evoyudhasamael",
            unicode"Evo Yudha Samael",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            2,
            unicode"MarkoStevan19",
            unicode"Marko Stevan (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            3,
            unicode"jepannyaa",
            unicode"jepannyaa (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 4, unicode"johntolxbt", unicode"john (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 5, unicode"orpheuskaze", unicode"orpheuzkaze", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            6,
            unicode"tutubearrr",
            unicode"tutubear (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 7, unicode"rizann67", unicode"rizan (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            8,
            unicode"direumatteul",
            unicode"nat die (! 𝕜𝕒𝕞𝕒𝕝𝕫) | (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            9,
            unicode"Nice_guyyy1",
            unicode"Asceno 🟦 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 10, unicode"basss_eth", unicode"Babasss (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 11, unicode"jen_bobz", unicode"Badebest (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 12, unicode"batagor", unicode"Batagor (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            13,
            unicode"decka_chan",
            unicode"Decka ちゃん (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 14, unicode"Jonathanhnd11", unicode"Jonathan", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 15, unicode"Leckxy_id", unicode"Lecxky (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            16,
            unicode"0xlunabean",
            unicode"Lunabean (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 17, unicode"0xhahawe", unicode"Hahawe (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 18, unicode"0xkaybu", unicode"Kaybu", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 19, unicode"mexyy877", unicode"Mexyy (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 20, unicode"hazelnty_", unicode"hazel", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            21,
            unicode"0xMiiceeelll",
            unicode"miiceell🧚🏻‍♀️ (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 22, unicode"NanangN27", unicode"N G (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            23,
            unicode"nostalgiagila",
            unicode"nostalgiagila (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            24,
            unicode"cuanbanyak2016",
            unicode"online (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 25, unicode"NineMay_ID", unicode"Raka (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            26,
            unicode"starknight50x",
            unicode"Star Knight (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 27, unicode"0xWnanta", unicode"Wnanta", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 28, unicode"Wyriium", unicode"Wyrium", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            29,
            unicode"RXwhale",
            unicode"RamaXwhale | (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 30, unicode"nftzella", unicode"ZELLA⨀", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 31, unicode"yourinuu", unicode"yourinuu", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 32, unicode"0xyuura", unicode"Yuura (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            33,
            unicode"EvanBucin",
            unicode"VansStrong🐬 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            34,
            unicode"seesac_",
            unicode"S E E S A C (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 35, unicode"0x_kippo", unicode"KippoXBT", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            36,
            unicode"vebrygans5",
            unicode"vebrygans5 base.eth (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 37, unicode"0xtequilaa", unicode"Tequila", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 38, unicode"0x_vibevortex", unicode"VibeVortex", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 39, unicode"Dndxtzy", unicode"Levy", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 40, unicode"saddamovic", unicode"Saddamovic", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            41,
            unicode"Beruanglucu28",
            unicode"bearfunny(❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 42, unicode"KYY_NFT_", unicode"KYY", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 43, unicode"Oscarfortunes", unicode"Oscar", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            44,
            unicode"0xKreko",
            unicode"𝕂𝕣𝕖𝕜𝕠 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            45,
            unicode"jelenemae",
            unicode"Absolpii π² (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 46, unicode"ch4laa", unicode"chala (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            47,
            unicode"babysyenaa",
            unicode"BabySyen (evm/acc) (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 48, unicode"Ox6ce4", unicode"0xrumora ❖", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 49, unicode"flylucifer666", unicode"flylucifer", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 50, unicode"Vans_1611", unicode"Vans (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            51,
            unicode"ArokMub",
            unicode"0xark.base.eth (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 52, unicode"0ximbalance", unicode"piktawr", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 53, unicode"Zegnaeth", unicode"Zegna (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 54, unicode"0xTremolo", unicode"Tremolo", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 55, unicode"whuanjg", unicode"whuan (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 56, unicode"Oxhiizaaa", unicode"Konad(❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            57,
            unicode"LivreinIsHere",
            unicode"LivreinIsHere(❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            58,
            unicode"MozardGray",
            unicode"MozardGray (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            59,
            unicode"Bas_Basterx",
            unicode"Baster (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 60, unicode"OyengEth", unicode"Oyeng.eth", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 61, unicode"rzstwnn_", unicode"0xRz (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            62,
            unicode"Laysraymond66",
            unicode"Laysraymond (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 63, unicode"Js_Liim", unicode"JsLiim (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 64, unicode"drayvenweb3", unicode"Drayven", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 65, unicode"yetecevm", unicode"yetece (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 66, unicode"qrra_1", unicode"qyiiraaa (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            67,
            unicode"ma60768953",
            unicode"skylaaarrrkkk ❖,❖",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 68, unicode"kenann_szn", unicode"Kenannn!", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            69,
            unicode"kaiclyde447",
            unicode"himmelif (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            70,
            unicode"ba_skraaa",
            unicode"Buzz Claximity (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            71,
            unicode"nadsarmonads",
            unicode"nadsar Lyraffe army ❖,❖",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 72, unicode"justKjaa", unicode"kja", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            73,
            unicode"Marshalahushein",
            unicode"Shen (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 74, unicode"0xjugger", unicode"Juggernaut ❖", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 75, unicode"0xfirless", unicode"firless (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 76, unicode"Rizkyy_028", unicode"Rizzz", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 77, unicode"Giselle20_", unicode"babyD", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            78,
            unicode"orkawell",
            unicode"𝗢𝗥𝗞𝗔 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 79, unicode"takingford", unicode"Taking Tom", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            80,
            unicode"zasswff_",
            unicode"Cheaster Antariksa Zas (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 81, unicode"OnatEth", unicode"Onat.eth", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 82, unicode"callmehannnnnnn", unicode"callmehannn", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            83,
            unicode"DhikoKristiyan1",
            unicode"Dhikoo (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 84, unicode"biliebed_", unicode"Biliebed", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 85, unicode"anton_yoww", unicode"THONNN(❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            86,
            unicode"Thins140",
            unicode"🌸 Thins 🌸 (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 87, unicode"travisqk", unicode"travis", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 88, unicode"shinjiihhh", unicode"Shin", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 89, unicode"Shanixeuu", unicode"Shanix (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 90, unicode"Tinushi71", unicode"pengon", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            91,
            unicode"0xEyesofEtresia",
            unicode"Veyyy (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 92, unicode"lexyour1_", unicode"Suo (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 93, unicode"nomnomkiko", unicode"Kai (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            94,
            unicode"BreakNoLimit123",
            unicode"Violla (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 95, unicode"bramexyz", unicode"Habe (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            96,
            unicode"rikkydwiyanto",
            unicode"Rikky Dwiyanto (❖,❖)",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            97,
            unicode"DzaRra234",
            unicode"zarra234 (❖,❖) π² 🍊,💊",
            unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 98, unicode"Shee178", unicode"0shee (❖,❖)", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer, 99, unicode"Shromeey", unicode"MeeyVerse", unicode"Indonesian Ritual community member."
        );

        _createProfileIfMissing(
            recognizer,
            100,
            unicode"shigurekaicrypt",
            unicode"Shigure Kai (❖,❖)",
            unicode"Indonesian Ritual community member."
        );
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
        RitualistRecognizer recognizer = RitualistRecognizer(payable(recognizerAddress));

        vm.startBroadcast();
        _syncProfiles(recognizer);
        vm.stopBroadcast();
    }
}

contract ResumeRitualistProfiles is RitualistProfileSync {
    function run() external {
        address recognizerAddress = vm.envAddress("RECOGNIZER_ADDRESS");
        RitualistRecognizer recognizer = RitualistRecognizer(payable(recognizerAddress));

        vm.startBroadcast();
        _resumeProfiles(recognizer);
        vm.stopBroadcast();
    }
}
