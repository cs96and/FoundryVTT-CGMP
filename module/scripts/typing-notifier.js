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

import { Util } from "./util.js"

const PACKET_HEADER = {
	OTHER: 0,
	TYPING_MESSAGE: 1,
	TYPING_END: 2
}

const REMOTE_TYPING_TIMEOUT = 5000;
const TYPING_EMIT_INTERVAL = 250;

export class TypingNotifier {

	static typingUsers = new Map();

	constructor(chatLogApp, chatLogElement, allowPlayersToSeeTypingNotification) {
		this._lastPacketSent = null;
		this._allowPlayersToSeeTypingNotification = allowPlayersToSeeTypingNotification;

		this._notifySpan = document.createElement("span");
		this._notifySpan.className = "notify-text";

		this._notifyWrapperElement = document.createElement("div");
		this._notifyWrapperElement.id = "cgmp-typing-notify";
		this._notifyWrapperElement.className = "hidden";
		this._notifyWrapperElement.innerHTML = '<span class="dots-cont"><span class="dot dot-1"></span><span class="dot dot-2"></span><span class="dot dot-3"></span></span>';
		this._notifyWrapperElement.appendChild(this._notifySpan);

		// If Mobile Improvements is enabled, then we need to use a wrapper for ChatLog._onChatKeyDown(),
		// as clicking the send button does not generate a keydown event.
		if (game.modules.get("mobile-improvements")?.active && !chatLogApp._original)
			libWrapper.register('CautiousGamemastersPack', 'ChatLog.prototype._onChatKeyDown', this._onChatKeyDownWrapper.bind(this), 'WRAPPER');

		const chatFormElement = chatLogElement.querySelector(Util.isV13() ? ".chat-form" : "#chat-form");
		chatFormElement.appendChild(this._notifyWrapperElement);

		if (Util.isV13()) {
			this._chatBox = document.querySelector("#chat-message");
		} else {
			this._chatBox = chatLogElement.querySelector("#chat-message");
		}

		this._chatBox.addEventListener("keydown", this._onChatKeyDown.bind(this));

		this._charsPerLine = this._calcCharsPerLine();

		this._chatBoxResizeObserver = new ResizeObserver(this._onChatBoxResize.bind(this));
		this._chatBoxResizeObserver.observe(this._chatBox);

		this.updateNotice();
	}

	static _calcCharacterWidth(chatBoxStyle)
	{
		// Calculate the width of a single character in the chat box.  This assumes that a monospace font is being used.
		const text = document.createElement("span");

		text.style.font = chatBoxStyle.font;
		text.style.fontFamily = chatBoxStyle.fontFamily;
		text.style.fontSize = chatBoxStyle.fontSize;
		text.style.fontSizeAdjust = chatBoxStyle.fontSizeAdjust;
		text.style.fontStretch = chatBoxStyle.fontStretch;
		text.style.fontStyle = chatBoxStyle.fontStyle;
		text.style.fontWeight = chatBoxStyle.fontWeight;
		text.style.height = 'auto';
		text.style.width = 'auto';
		text.style.position = 'absolute';
		text.style.whiteSpace = 'no-wrap';
		text.innerHTML = 'A';

		document.body.appendChild(text);
		const charWidth = Math.ceil(text.clientWidth);
		document.body.removeChild(text);

		return charWidth;
	}

	static _isV9() {
		return !isNewerVersion("9", game.version ?? game.data.version);
	}

	_calcCharsPerLine() {
		// Calculate the number of monospace chars that will fit on a line of the chat box.
		const chatBoxStyle = getComputedStyle(this._chatBox);
		const characterWidth = TypingNotifier._calcCharacterWidth(chatBoxStyle);

		// Force the scroll-bar to appear before we get the client width of the chat box.
		const oldOverflow = this._chatBox.style.overflow;
		this._chatBox.style.overflow = "scroll";
		const chatBoxWidth = this._chatBox.clientWidth - parseInt(chatBoxStyle.paddingLeft) - parseInt(chatBoxStyle.paddingRight);
		this._chatBox.style.overflow = oldOverflow;

		return Math.floor(chatBoxWidth / characterWidth);
	}

	_onChatBoxResize() {
		// When the chat box gets resized due to the typing notification and the cursor is on the bottom line, the bottom of the
		// chat box will resize upwards and cover it (however it will automatically scroll down again when something is typed).
		// We can try and mitigate against this by monitoring for resize events on the chat box.
		// 1. If the cursor is at the end of the chat box, then scroll down to the bottom.
		// 2. Otherwise, if there are no line endings between the cursor and the end of the text, then work out if the cursor
		//	is on the last line by checking against the number of chars that fit on a line.
		if (this._chatBox.selectionEnd === this._chatBox.selectionStart) {
			if ((this._chatBox.selectionEnd === this._chatBox.value.length) || this._isCursorOnLastLine()) {
				this._chatBox.scrollTop = this._chatBox.scrollHeight;
			}
		}
	}

	_isCursorOnLastLine() {
		// Cursor is on the last line if there are no line breaks between it and the end of the text
		// and we are within the number of chars that can fit on a line.  This is not exact, but it's good enough.
		return ((!this._chatBox.value.includes("\n", this._chatBox.selectionEnd)) &&
				((this._chatBox.value.length - this._chatBox.selectionEnd) <= this._charsPerLine));
	}

	_emitTypingEnd() {
		game.socket.emit('module.CautiousGamemastersPack', {
			header: PACKET_HEADER.TYPING_END,
			user: game.user.id
		});
		this._lastPacketSent = undefined;
	}

	_emitTyping() {
		if (this._lastPacketSent && new Date().getTime - this._lastPacketSent < TYPING_EMIT_INTERVAL) return;
		game.socket.emit('module.CautiousGamemastersPack', {
			header: PACKET_HEADER.TYPING_MESSAGE,
			user: game.user.id
		});
		this._lastPacketSent = new Date().getTime;
	}

	_setVisible(visible) {
		this._notifyWrapperElement?.classList.toggle('hidden', !visible);
	}

	_willDeleteLastChar(key, textArea) {
		if (0 === (textArea.selectionEnd - textArea.selectionStart)) {
			// Nothing selected.  Is there a single char left that will be deleted?
			if (textArea.value.length <= 1) {
				switch (key) {
					case "BACKSPACE":
						return ((0 === textArea.value.length) || (0 !== textArea.selectionStart));

					case "DELETE":
						return ((0 === textArea.value.length) || (textArea.selectionStart !== textArea.value.length));

					default:
						return false;
				}
			} else {
				return false;
			}
		} else {
			// text range selected.  Will all of it be deleted?
			switch (key) {
				case "BACKSPACE":
				case "DELETE":
					return ((textArea.selectionEnd - textArea.selectionStart) >= textArea.value.length);

				default:
					return false;
			}
		}
	}

	_onChatKeyDown(event) {
		const key = (event.key ?? event.code).toUpperCase();
		if (((key === "ENTER") || (key === "NUMPADENTER")) && !event.shiftKey) {
			this._emitTypingEnd();
		} else if (this._willDeleteLastChar(key, event.currentTarget)) {
			this._emitTypingEnd();
		} else {
			this._emitTyping();
		}
	}

	_onChatKeyDownWrapper(wrapper, event) {
		if (event.code === "Enter" && !event.shiftKey) {
			this._emitTypingEnd();
		}
		wrapper(event);
	}

	updateNotice() {
		if (!this._notifyWrapperElement) return;
		const mapSize = TypingNotifier.typingUsers.size;
		if (mapSize === 0) {
			this._setVisible(false);
			return;
		}

		let text = '';
		let cnt = 0;
		let users = [];

		TypingNotifier.typingUsers.forEach((value, key) => {
			users.push(game.users.get(key).name);
			cnt++;
		});

		if (cnt == 1) {
			text = game.i18n.format("cgmp.typing-one", { user: users[0] });
		} else if (cnt == 2) {
			text = game.i18n.format("cgmp.typing-two", { user1: users[0], user2: users[1] });
		} else {
			text = game.i18n.format("cgmp.typing-many", { user1: users[0], user2: users[1], others: cnt - 2 });
		}
		this._notifySpan.innerHTML = text;

		this._setVisible(true);
	}

}

export class TypingNotifierManager {
	constructor(allowPlayersToSeeTypingNotification) {
		this._allowPlayersToSeeTypingNotification = allowPlayersToSeeTypingNotification;
		this._notifiers = [];

		Hooks.on('renderChatLog', (chatLog, html, data) => {
			const element = Util.isV13() ? html : html[0];
			this._notifiers.push(new TypingNotifier(chatLog, element, this._allowPlayersToSeeTypingNotification));
			console.log(this._notifiers);
		});

		game.socket.on('module.CautiousGamemastersPack', this._onRemotePacket.bind(this));
	}

	_onRemoteTypingEnded(id) {
		TypingNotifier.typingUsers.delete(id);
		this.updateNotice();
	}

	updateNotice() {
		for (const notifier of Object.values(this._notifiers)) {
			notifier.updateNotice();
		}
	}

	_onRemotePacket(data) {
		if (!this._allowPlayersToSeeTypingNotification && !game.user.isGM) return;

		const id = data.user;
		if (id === game.user.id) return;

		let debouncedOnRemoteTypingEnded = TypingNotifier.typingUsers.get(id);

		switch (data.header) {
			case PACKET_HEADER.TYPING_MESSAGE:
				if (!debouncedOnRemoteTypingEnded) {
					debouncedOnRemoteTypingEnded = foundry.utils.debounce(() => this._onRemoteTypingEnded(id), REMOTE_TYPING_TIMEOUT);
					TypingNotifier.typingUsers.set(id, debouncedOnRemoteTypingEnded);
					this.updateNotice();
				}

				debouncedOnRemoteTypingEnded();
				break;

			case PACKET_HEADER.TYPING_END:
				this._onRemoteTypingEnded(id);
				break;

			default:
				return;
		}
	}
}
