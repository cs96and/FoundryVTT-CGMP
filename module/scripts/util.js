/*
 * Cautious Gamemasters Pack
 * https://github.com/cs96and/FoundryVTT-CGMP
 *
 * Copyright (c) 2020 Shoyu Vanilla - All Rights Reserved.
 * Copyright (c) 2021-2024 Alan Davies - All Rights Reserved.
 *
 * You may use, distribute and modify this code under the terms of the MIT license.
 *
 * You should have received a copy of the MIT license with this file. If not, please visit:
 * https://mit-license.org/
 */

export class Util {
	static isV13() {
		return !foundry.utils.isNewerVersion("13", game.version);
	}

	static isV12() {
		return !foundry.utils.isNewerVersion("12", game.version);
	}

	static get CHAT_MESSAGE_STYLES() {
		return (Util.isV12() ? CONST.CHAT_MESSAGE_STYLES : CONST.CHAT_MESSAGE_TYPES);
	}

	static get chatStyleKeyName() {
		return (Util.isV12() ? "style" : "type");
	}

	static getMessageStyle(message) {
		return message[Util.chatStyleKeyName];
	}

	static getMessageAuthor(message) {
		return (Util.isV12() ? message.author : message.user);
	}
}
