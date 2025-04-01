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

import { Util } from "./util.js"

export const CGMP_OPTIONS = {
	ALLOW_PLAYERS_TO_USE_DESC: "allowPlayersToUseDesc",
	BLIND_HIDDEN_TOKENS: "blindHiddenTokens",
	GM_SPEAKER_MODE: "gmSpeakerMode",
	HIDE_NPC_DAMAGE_TEXT: "hideNpcDamageText",
	HIDE_NPC_HEALING_TEXT: "hideNpcHealingText",
	DISABLE_DYNAMIC_TOKEN_RING_FLASH: "disableDynamicTokenRingFlash",
	NOTIFY_TYPING: "notifyTyping",
	ALLOW_PLAYERS_TO_SEE_TYPING_NOTIFICATION: "allowPlayersToSeeTypingNotification",
	PLAYER_SPEAKER_MODE: "playerSpeakerMode"
};

const CGMP_LEGACY_OPTIONS = {
	DISABLE_GM_AS_PC: "disableGMAsPC",
	SPEAKER_MODE: "speakerMode"
};

export const CGMP_SPEAKER_MODE = {
	DEFAULT: 0,
	DISABLE_GM_AS_PC: 1,
	FORCE_IN_CHARACTER: 2,
	ALWAYS_OOC: 3,
	IN_CHARACTER_ALWAYS_ASSIGNED: 4
};

export class CGMPSettings {
	static registerSettings() {

		Hooks.on("renderSettingsConfig", CGMPSettings._onRenderSettingsConfig.bind(this));

		const gmSpeakerModeChoices = {
			[CGMP_SPEAKER_MODE.DEFAULT]: game.i18n.localize("cgmp.speaker-mode.default-s"),
			[CGMP_SPEAKER_MODE.DISABLE_GM_AS_PC]: game.i18n.localize("cgmp.speaker-mode.disable-gm-as-pc-s"),
			[CGMP_SPEAKER_MODE.FORCE_IN_CHARACTER]: game.i18n.localize("cgmp.speaker-mode.force-in-character-s"),
			[CGMP_SPEAKER_MODE.ALWAYS_OOC]: game.i18n.localize("cgmp.speaker-mode.always-ooc-s"),
			[CGMP_SPEAKER_MODE.IN_CHARACTER_ALWAYS_ASSIGNED]: game.i18n.localize("cgmp.speaker-mode.in-character-always-assigned-s"),
		};

		const playerSpeakerModeChoices = foundry.utils.deepClone(gmSpeakerModeChoices);
		delete playerSpeakerModeChoices[CGMP_SPEAKER_MODE.DISABLE_GM_AS_PC];

		// Legacy settings, no longer accessible via UI.
		// Left here so they can be read and converted to the new Speaker Modes on startup.
		game.settings.register("CautiousGamemastersPack", CGMP_LEGACY_OPTIONS.DISABLE_GM_AS_PC, {
			scope: "world",
			config: false,
			default: false,
			type: Boolean
		});

		game.settings.register("CautiousGamemastersPack", CGMP_LEGACY_OPTIONS.SPEAKER_MODE, {
			scope: "world",
			config: false,
			default: (CGMPSettings.getSetting(CGMP_LEGACY_OPTIONS.DISABLE_GM_AS_PC) ? CGMP_SPEAKER_MODE.DISABLE_GM_AS_PC : CGMP_SPEAKER_MODE.DEFAULT),
			type: Number,
			choices: gmSpeakerModeChoices
		});

		// Active settings...

		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.GM_SPEAKER_MODE, {
			name: "cgmp.gm-speaker-mode-s",
			hint: "cgmp.gm-speaker-mode-l",
			scope: "world",
			config: true,
			default: CGMPSettings.convertGmSpeakerModeLegacySetting(),
			type: Number,
			choices: gmSpeakerModeChoices
		});

		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.PLAYER_SPEAKER_MODE, {
			name: "cgmp.player-speaker-mode-s",
			scope: "world",
			config: true,
			default: CGMPSettings.convertPlayerSpeakerModeLegacySetting(),
			type: Number,
			choices: playerSpeakerModeChoices
		});

		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.ALLOW_PLAYERS_TO_USE_DESC, {
			name: "cgmp.allow-players-to-use-desc-s",
			hint: "cgmp.allow-players-to-use-desc-l",
			scope: "world",
			config: true,
			default: false,
			type: Boolean
		});

		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.BLIND_HIDDEN_TOKENS, {
			name: "cgmp.blind-hidden-tokens-s",
			hint: "cgmp.blind-hidden-tokens-l",
			scope: "world",
			config: true,
			default: false,
			type: Boolean
		});
		
		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.NOTIFY_TYPING, {
			name: "cgmp.notify-typing-s",
			hint: "cgmp.notify-typing-l",
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
			requiresReload: true
		});

		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.ALLOW_PLAYERS_TO_SEE_TYPING_NOTIFICATION, {
			name: "cgmp.allow-players-to-see-typing-notification-s",
			hint: "cgmp.allow-players-to-see-typing-notification-l",
			scope: "world",
			config: true,
			default: true,
			type: Boolean,
			requiresReload: true
		});

		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.HIDE_NPC_DAMAGE_TEXT, {
			name: "cgmp.hide-npc-damage-text-s",
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
			requiresReload: true
		});

		game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.HIDE_NPC_HEALING_TEXT, {
			name: "cgmp.hide-npc-healing-text-s",
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
			requiresReload: true
		});

		if (Util.isV12() || CONFIG.Token.ringClass) {
			game.settings.register("CautiousGamemastersPack", CGMP_OPTIONS.DISABLE_DYNAMIC_TOKEN_RING_FLASH, {
				name: "cgmp.disable-dynamic-token-ring-flash-s",
				scope: "world",
				config: true,
				default: false,
				type: Boolean,
				requiresReload: true
			});
		}
	}

	static convertGmSpeakerModeLegacySetting() {
		const legacySpeakerMode = CGMPSettings.getSetting(CGMP_LEGACY_OPTIONS.SPEAKER_MODE);
		return legacySpeakerMode ?? (CGMPSettings.getSetting(CGMP_LEGACY_OPTIONS.DISABLE_GM_AS_PC) ? CGMP_SPEAKER_MODE.DISABLE_GM_AS_PC : CGMP_SPEAKER_MODE.DEFAULT);
	}

	static convertPlayerSpeakerModeLegacySetting() {
		return ((CGMP_SPEAKER_MODE.FORCE_IN_CHARACTER === CGMPSettings.getSetting(CGMP_LEGACY_OPTIONS.SPEAKER_MODE)) ?
			CGMP_SPEAKER_MODE.FORCE_IN_CHARACTER : CGMP_SPEAKER_MODE.DEFAULT);
	}

	static getSetting(option) {
		return game.settings.get("CautiousGamemastersPack", option);
	}

	/**
	 * Handle the "renderSettingsConfig" hook.
	 * This is fired when Foundry's settings window is opened.
	 * Enable / disable interaction with various settings, depending on whether "Notify Typing" is enabled.
	 */
	 static _onRenderSettingsConfig(settingsConfig, html, user) {
		const formGroups = html[0].querySelectorAll('div.form-group');

		// Disable "Allow players to see typing notification" if typing notification is disabled.
		const playerSpecificDivs = [...formGroups].filter(fg => {
			return !!fg.querySelector(`input[name="CautiousGamemastersPack.${CGMP_OPTIONS.ALLOW_PLAYERS_TO_SEE_TYPING_NOTIFICATION}"]`);
		});
		CGMPSettings._toggleDivs(playerSpecificDivs, CGMPSettings.getSetting(CGMP_OPTIONS.NOTIFY_TYPING));

		const typingNotificationCheckbox = html[0].querySelector(`input[name="CautiousGamemastersPack.${CGMP_OPTIONS.NOTIFY_TYPING}"]`);

		if (typingNotificationCheckbox) {
			// Handle the allowPlayerView checkbox being toggled.
			typingNotificationCheckbox.addEventListener("change", (event) => {
				CGMPSettings._toggleDivs(playerSpecificDivs, event.target.checked);
			});
		}
	}

	/**
	 * Enable / disable inputs in a set of divs.
	 */
	static _toggleDivs(divs, enabled) {
		for (const div of divs) {
			// Disable all inputs in the divs (checkboxes and dropdowns)
			div.querySelectorAll("input,select").forEach(i => i.disabled = !enabled);
			// Disable TidyUI's on click events for the labels.
			div.querySelectorAll("label>span").forEach(l => l.style.pointerEvents = (enabled ? "auto" : "none"));
		}
	}
}
