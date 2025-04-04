# RPG Maker MZ - Dungeon Darkness System Plugin

**Version:** 1.1
**Author:** roawve 
**Engine:** RPG Maker MZ

## Overview

This plugin creates a configurable darkness overlay for RPG Maker MZ maps, featuring a soft, radial gradient light effect centered on the player character. It aims to replicate atmospheric lighting style, enhancing dungeon exploration ambiance.

The darkness level, light radius, and the softness of the light's edge (gradient) are all adjustable via Plugin Parameters and Plugin Commands during gameplay.

## Features

*   Adds a full-screen darkness overlay.
*   Creates a circular light area around the player with a soft, gradient edge.
*   Configurable default light radius, darkness opacity, and gradient size via Plugin Parameters.
*   Control the system dynamically using Plugin Commands:
    *   Toggle darkness ON/OFF.
    *   Set light radius.
    *   Set darkness opacity level.
    *   Set gradient size (edge softness).
*   Written for RPG Maker MZ using JavaScript (ES6+) and PIXI.js Graphics.


## How to Use

1.  Save the `.js` file (e.g., `DungeonDarknessSystem.js`) into your project's `js/plugins` folder.
2.  Open the Plugin Manager in RPG Maker MZ.
3.  Add a new plugin entry and select `DungeonDarknessSystem`.
4.  Configure the **Plugin Parameters** for default settings (initial light radius, opacity, gradient size, and whether it's enabled on startup).
5.  Use **Plugin Commands** within your events to control the darkness effect dynamically during the game (Toggle Darkness, Set Light Radius, etc.). Refer to the plugin's `@help` section for command details.

## Technical Details & Learnings

*   **Language:** JavaScript (ES6+)
*   **Engine/Library:** RPG Maker MZ Plugin System, PIXI.js (via MZ's `Graphics` class)
*   **Key Concepts:**
    *   Leveraged **PIXI.Graphics** for drawing shapes (rectangle for darkness, circles for gradient).
    *   Implemented a **radial gradient** effect manually by drawing multiple concentric circles with varying alpha values.
    *   Utilized `beginFill` and `beginHole` methods to create the transparent light area.
    *   Hooked into the **`Spriteset_Map`** class (`createUpperLayer`, `update`) to integrate the custom visual effect into the map rendering process.
    *   Registered and parsed **Plugin Parameters** and **Plugin Commands** according to MZ specifications.
    *   Managed plugin state (`enabled`, `lightRadius`, etc.) within a dedicated namespace (`DungeonDarkness`).
*   **Challenges:** Getting the gradient effect smooth and performant required iterating on the drawing logic. Ensuring the overlay updated correctly with player movement involved hooking into the right update loop.

## License

This plugin is released under the [MIT License](LICENSE). 
