/*
 * Cautious Gamemasters Pack
 * https://github.com/cs96and/FoundryVTT-CGMP
 *
 * Copyright (c) 2020 Shoyu Vanilla - All Rights Reserved.
 * Copyright (c) 2021-2025 Alan Davies - All Rights Reserved.
 *
 * You may use, distribute and modify this code under the terms of the MIT license.
 *
 * You should have received a copy of the MIT license with this file. If not, please visit:
 * https://mit-license.org/
 */

import { CGMPSettings, CGMP_OPTIONS } from "./settings.js";
import { ChatResolver } from "./chat-resolver.js";
import { TypingNotifierManager } from "./typing-notifier.js";
import { Util } from "./util.js"

class CautiousGamemastersPack {

	_scrollingTextRegex = null;

	static async _onScrollingText(wrapper, point, content, ...args) {
		// "this" is an InterfaceCanvasGroup here...

		// Find all tokens that have "point" at their centre.
		const tokens = this.tokens.objects.children.filter((tkn) => {
			return ((point.x === tkn.center.x) && (point.y === tkn.center.y));
		});

		// If any of the tokens are NPCs, then don't display the scrolling text if the relevant option is set.
		if (tokens.every(tkn => tkn.document.hasPlayerOwner) || !CautiousGamemastersPack._scrollingTextRegex.test(content))
			wrapper(point, content, ...args);
	}

	static {
		Hooks.once('setup', () => {
			CGMPSettings.registerSettings();
			game.cgmp = {};

			if (CGMPSettings.getSetting(CGMP_OPTIONS.NOTIFY_TYPING))
				game.cgmp.typingNotifier = new TypingNotifierManager(CGMPSettings.getSetting(CGMP_OPTIONS.ALLOW_PLAYERS_TO_SEE_TYPING_NOTIFICATION));

			Hooks.on('chatMessage', ChatResolver.onChatMessage);
			Hooks.on('preCreateChatMessage', ChatResolver.onPreCreateChatMessage);
			Hooks.on('renderChatMessage', ChatResolver.onRenderChatMessage);

			const hideNpcDamage = CGMPSettings.getSetting(CGMP_OPTIONS.HIDE_NPC_DAMAGE_TEXT);
			const hideNpcHealing = CGMPSettings.getSetting(CGMP_OPTIONS.HIDE_NPC_HEALING_TEXT);

			if (!game.user.isGM && game.modules.get('lib-wrapper')?.active && (hideNpcDamage || hideNpcHealing)) {
				CautiousGamemastersPack._scrollingTextRegex = new RegExp(`^[${hideNpcDamage ? "-" : ""}${hideNpcHealing ? "+" : ""}]\\d+$`);

				libWrapper.register('CautiousGamemastersPack', 'InterfaceCanvasGroup.prototype.createScrollingText',
					CautiousGamemastersPack._onScrollingText, "MIXED");
			}

			if (Util.isV12() || CONFIG.Token.ringClass) {
				const disableDynamicTokenRingFlash = CGMPSettings.getSetting(CGMP_OPTIONS.DISABLE_DYNAMIC_TOKEN_RING_FLASH);
				if (game.modules.get('lib-wrapper')?.active && disableDynamicTokenRingFlash) {
					const ringClass = Util.isV12() ? "foundry.canvas.tokens.TokenRing" : "CONFIG.Token.ringClass";
					libWrapper.register('CautiousGamemastersPack', `${ringClass}.prototype.flashColor`, ()=>{}, "OVERRIDE");
				}
			}
		});

		Hooks.once('ready', () => {
			if(!game.modules.get('lib-wrapper')?.active && game.user.isGM)
				ui.notifications.error("Cautious GameMaster's Pack requires the 'libWrapper' module. Please install and activate it.", { permanent: true });
		});
	}
}
