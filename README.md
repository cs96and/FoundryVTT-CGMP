# Cautious Gamemaster's Pack

![GitHub Latest Release](https://img.shields.io/github/release/cs96and/FoundryVTT-CGMP?style=for-the-badge)
![Foundry Version](https://img.shields.io/badge/dynamic/json?label=Foundry%20Version&prefix=v&query=%24.compatibleCoreVersion&url=https%3A%2F%2Fraw.githubusercontent.com%2Fcs96and%2FFoundryVTT-CGMP%2Fmaster%2Fmodule%2Fmodule.json&style=for-the-badge)
![Latest Release Downloads](https://img.shields.io/github/downloads/cs96and/FoundryVTT-CGMP/latest/total?style=for-the-badge)
![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2FCautiousGamemastersPack&colorB=4aa94a&style=for-the-badge)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/C0C057N35)

Offers various simple handy options.

Please note that v0.2.0 was called "Cautious Gamemaster's Pack 2", but since ownership of the original Foundry package has been transferred to me this has now been renamed back to "Cautious Gamemaster's Pack".  ***If you installed v0.2.0 and then upgrade to v0.2.1 you will find you have both "Cautious Gamemaster's Pack" and "Cautious Gamemaster's Pack 2" installed.  You will have to manually remove "Cautious Gamemaster's Pack 2".***

## Settings

![](settings.png)

* **GM speaker mode / Player speaker mode**
  * **Default**: Speakers are not altered.
  * **Disable GM speaking as PC**: If the GM has a PC token selected and types a message in the chat box, this will prevent the message appearing as if it came from that PC.  It will be sent as an out-of-character message instead.
  * **Force in-character**: Chat messages will come from assigned character regardless of whether that token is in the scene, or if `/ooc` chat is specified.
  * **Always out-of-character**: Chat messages will always be sent as out-of-character messages.
  * **Use assigned when in-character**: Chat messages will come from assigned character regardless of whether that token is in the scene, but `/ooc` messages will still be treated as out-of-character.
* **Allow players to use /desc** - Usually only the GM can use the `/desc` command.  This settings also allows the players to use it.
* **Blind rolls made by hidden tokens** - This turns all rolls made by hidden tokens into blind rolls.
* **Notify typing** - Notify whether the other players are typing chat messages...<p>![](notify_typing.gif)</p>
* **Allow players to see typing notification**: when typing notification is enabled, this settings allows players to see the notifications.  If disabled, only the GM can see the typing notifications.
* **Hide scrolling damage text on NPC tokens**: Hides the scrolling text above a token when it takes damage.
* **Hide scrolling healing text on NPC tokens**: Hides the scrolling text above a token when it receives healing.
* **Disable flashing of Dynamic Token Rings**: Disables the Dynamic Token Ring flashing, e.g. when a token is damaged or healed.  Note this option only appears if you are using dnd5e v3.1, or Foundry v12.

## Additional Chat Commands

* Additional chat commands - `/desc` for description and `/as` for in-charactor without tokens...<p>![](additional_chat_commands.png)</p>

---

Version 2 is forked from [ShoyuVanilla's Cautious Gamemaster's Pack](https://github.com/ShoyuVanilla/FoundryVTT-CGMP) and contains a number of enhancements...

1. Added support for FoundryVTT v0.8.x
2. When "Blind chats out of hidden tokens" is enabled, and the GM types a message while a hidden token is selected, this will be sent as a **visible** out-of-character message.  This assumes that the GM wants the message to appear, but forgot to deselect the token.  All rolls etc done by that token will still be hidden.
3. Updated to use [libWrapper](https://foundryvtt.com/packages/lib-wrapper/).
4. Added compatibility with the "[Tabbed Chatlog](https://foundryvtt.com/packages/tabbed-chatlog/)" module.



