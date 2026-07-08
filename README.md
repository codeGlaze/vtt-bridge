<div align="center">
    <br>
    <img src="assets/icon-full.png" alt="Icon" width="200">
    <br>
    <h1>VTT Bridge</h1>
</div>

<div align="center">
    <h4>A browser extension that connects
        <a href="https://www.dungeonmastersvault.com/">Dungeon Master's Vault</a>
        to
        <a href="https://roll20.net/">Roll20</a>.
    </h4>
    <hr>
</div>

<div align="center">
    <a href="https://github.com/codeGlaze/vtt-bridge/actions/workflows/ci.yml">
        <img src="https://github.com/codeGlaze/vtt-bridge/actions/workflows/ci.yml/badge.svg" alt="CI badge">
    </a>
    <a href="https://github.com/codeGlaze/vtt-bridge/blob/main/LICENSE">
        <img src="https://img.shields.io/github/license/codeGlaze/vtt-bridge" alt="License badge">
    </a>
</div>

<div align="center">
  <hr>
  <a href="#about">About</a> •
  <a href="#key-features">Key Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-status">Project Status</a> •
  <a href="#support">Support</a> •
  <a href="#credits">Credits</a> •
  <a href="#privacy">Privacy</a> •
  <a href="#license">License</a>
  <hr>
</div>


<div align="center">
    <img src="assets/screenshot_1920x1080.png" alt="Screenshot">
</div>

## About

Do you play D&D on [Roll20](https://roll20.net), but prefer to manage your characters with [Dungeon Master's Vault](https://www.dungeonmastersvault.com)?

VTT Bridge seamlessly connects your Dungeon Master's Vault character sheet to your Roll20 game.

## Key Features

- Roll ability checks, attack with weapons, cast spells, and more!
- <kbd>Ctrl-Click</kbd> to roll with advantage and <kbd>Shift-Click</kbd> to roll with disadvantage.
- Switch between visible commands (everyone can see) and hidden commands (only you and the GM can see).

## Disclaimer

The use of this tool is meant for use for your own campaigns. It is only meant and should only be used on campaigns with content that you legally possess. The use of this tool may violate the [Roll20 Marketplace Asset EULA](https://wiki.roll20.net/Marketplace_Asset_EULA) or the [Roll20 Terms of Service](https://wiki.roll20.net/Terms_of_Service_and_Privacy_Policy). This tool is not affiliated with Dungeon Master's Vault, Roll20, or Wizards of the Coast.

## Getting Started

Store listings for both browsers are being re-established under VTT Bridge's new home (see [Project Status](#project-status) below). Until then, install the extension from source -- see [DEVELOPERS.md](DEVELOPERS.md) for instructions -- or grab a pre-built zip from the project's [CI runs](https://github.com/codeGlaze/vtt-bridge/actions/workflows/ci.yml) or [Releases](https://github.com/codeGlaze/vtt-bridge/releases).

Once installed:

**Open your Dungeon Master's Vault character sheet** and click the <kbd>www</kbd> link in the top right.

![www link](assets/www.png)

**Launch your Roll20 game** in another tab. You should see a notification appear in both tabs.

![Notification](assets/notification.png)

**Click a button** on your Dungeon Master's Vault character sheet. Your roll will appear in Roll20!

The extension also works against [dev.dungeonmastersvault.com](https://dev.dungeonmastersvault.com/), DMV's beta site, if you want to test it against upcoming DMV releases before they go live.

## Project Status

VTT Bridge has been adopted into the OrcPub / Dungeon Master's Vault family of projects and modernized: it now runs on Manifest V3 and works on current versions of Chrome and Firefox (v2.0.0).

Store listings under the project's new home are being re-established -- see [Getting Started](#getting-started) for how to install in the meantime.

## Support

- To ask for help or give feedback, join the `#vtt-bridge` channel on the [DMV Discord server](https://discord.gg/uv5vXhk).
- To see if a problem has already been reported, or to report a new one, check the [issues tab](https://github.com/codeGlaze/vtt-bridge/issues).

## Credits

- Created by [Avery Crespi](https://github.com/averycrespi), the original author.
- Project inspired by [VTT Enhancement Suite](https://ssstormy.github.io/roll20-enhancement-suite/).
- Logo derived from [dragon by BGBOXXX Design](https://thenounproject.com/term/dragon/1646665/) from the Noun Project.

## Privacy

VTT Bridge does not collect, store, or transmit any data.

## License

[MIT](https://choosealicense.com/licenses/mit/)
