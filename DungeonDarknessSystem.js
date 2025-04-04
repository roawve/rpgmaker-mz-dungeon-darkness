/*:
 * @plugindesc v1.1 Creates proper darkness with soft light radius around player
 * @author roawve
 *
 * @param DefaultLightRadius
 * @desc Player's default light radius (pixels).
 * @default 100
 * @type number
 *
 * @param DefaultDarknessOpacity
 * @desc How dark the overlay is (0=clear, 255=black).
 * @default 245
 * @type number
 * 
 * @param DefaultEnableOnStartup
 * @desc Start with darkness enabled? (true/false)
 * @default false
 * @type boolean
 *
 * @param GradientSize
 * @desc How soft the light edge is (pixels). Larger = softer fade.
 * @default 40
 * @type number
 *
 * @command toggleDarkness
 * @text Toggle Darkness
 * @desc Turns the darkness system ON or OFF.
 * @arg enabled
 * @type boolean
 * @text Enable Darkness
 * @desc Turn darkness ON (true) or OFF (false)?
 * @default true
 *
 * @command setLightRadius
 * @text Set Light Radius
 * @desc Change the player's light radius on the fly.
 * @arg radius
 * @type number
 * @min 10
 * @max 300
 * @text Light Radius (px)
 * @desc New size for the light area.
 * @default 100
 * 
 * @command setDarknessLevel
 * @text Set Darkness Level
 * @desc Change the darkness opacity.
 * @arg opacity
 * @type number
 * @min 0
 * @max 255
 * @text Darkness Opacity
 * @desc New darkness level (0-255).
 * @default 245
 *
 * @command setGradientSize
 * @text Set Gradient Size
 * @desc Change the softness of the light edge.
 * @arg size
 * @type number
 * @min 0
 * @max 100
 * @text Gradient Size (px)
 * @desc How many pixels the fade effect covers.
 * @default 40
 *
 * @help 
 * Dungeon Darkness System v1.1 by roawve
 * 
 * Creates a 'Fear & Hunger' style darkness effect with a soft light
 * around the player. Everything is controllable via Plugin Parameters
 * for defaults and Plugin Commands during gameplay.
 * 
 * Plugin Commands (Use event command -> Plugin Command...):
 *   - Toggle Darkness: Turn the effect on or off.
 *   - Set Light Radius: Change how big the light circle is.
 *   - Set Darkness Level: Make it darker or lighter overall.
 *   - Set Gradient Size: Adjust the edge softness.
 */

(() => {
    'use strict';
    
    const pluginName = "DungeonDarknessSystem"; // Consistent name
    
    // Helper to grab parameters
    const params = PluginManager.parameters(pluginName);
    
    // Central place for our plugin's settings
    const DungeonDarkness = {
        enabled: params.DefaultEnableOnStartup === 'true',
        lightRadius: Number(params.DefaultLightRadius || 100),
        darknessOpacity: Number(params.DefaultDarknessOpacity || 245),
        gradientSize: Number(params.GradientSize || 40),
        // --- Dev Settings ---
        debug: false // Set true to show console logs
    };
    
    // --- Plugin Command Registration (MZ) ---
    
    PluginManager.registerCommand(pluginName, "toggleDarkness", args => {
        if (DungeonDarkness.debug) console.log(`${pluginName}: toggleDarkness`, args);
        DungeonDarkness.enabled = args.enabled === "true";
        if (DungeonDarkness.debug) console.log(`${pluginName}: Darkness state: ${DungeonDarkness.enabled}`);
    });
    
    PluginManager.registerCommand(pluginName, "setLightRadius", args => {
        if (DungeonDarkness.debug) console.log(`${pluginName}: setLightRadius`, args);
        DungeonDarkness.lightRadius = Number(args.radius);
    });
    
    PluginManager.registerCommand(pluginName, "setDarknessLevel", args => {
        if (DungeonDarkness.debug) console.log(`${pluginName}: setDarknessLevel`, args);
        DungeonDarkness.darknessOpacity = Number(args.opacity);
    });
    
    PluginManager.registerCommand(pluginName, "setGradientSize", args => {
        if (DungeonDarkness.debug) console.log(`${pluginName}: setGradientSize`, args);
        DungeonDarkness.gradientSize = Number(args.size);
    });
    
    //-----------------------------------------------------------------------------
    // DarknessOverlay (using PIXI.Graphics)
    // This handles drawing the actual darkness effect.
    //-----------------------------------------------------------------------------
    function DarknessOverlay() {
        this.initialize(...arguments);
    }
    
    // Inherit from PIXI.Container so we can add it to the stage
    DarknessOverlay.prototype = Object.create(PIXI.Container.prototype);
    DarknessOverlay.prototype.constructor = DarknessOverlay;
    
    DarknessOverlay.prototype.initialize = function() {
        PIXI.Container.call(this);
        
        // We use PIXI.Graphics for drawing shapes
        this._darknessSprite = new PIXI.Graphics();
        this.addChild(this._darknessSprite);
        
        // Initial draw
        this.update(); 
    };
    
    // Called every frame by Spriteset_Map
    DarknessOverlay.prototype.update = function() {
        // Don't do anything if disabled
        if (!DungeonDarkness.enabled) {
            // If it was previously enabled, clear the drawing
            if (!this._darknessSprite.geometry.graphicsData.length === 0) { // Check if it has drawing commands
                 this._darknessSprite.clear();
            }
            return;
        }
        
        // Get player's current screen coordinates
        const playerX = $gamePlayer.screenX();
        const playerY = $gamePlayer.screenY() - 24; // Adjust Y pos towards character's head/lantern
        
        // Redraw the darkness effect
        this._createSoftLightMask(playerX, playerY);
    };
    
    // The core drawing logic
    DarknessOverlay.prototype._createSoftLightMask = function(playerX, playerY) {
        const gfx = this._darknessSprite; // Shortcut
        gfx.clear(); // Clear previous frame's drawing
        
        // Calculate radii for the gradient effect
        const outerRadius = DungeonDarkness.lightRadius;
        const innerRadius = Math.max(0, outerRadius - DungeonDarkness.gradientSize); // Ensure inner radius isn't negative
        
        // 1. Draw the full darkness layer first
        gfx.beginFill(0x000000, DungeonDarkness.darknessOpacity / 255);
        gfx.drawRect(0, 0, Graphics.width, Graphics.height);
        gfx.endFill();
        
        // 2. Create the soft edge using multiple circles with decreasing alpha
        // More steps = smoother gradient, but potentially slower. 10 is usually fine.
        const numSteps = 10; 
        for (let i = numSteps; i >= 0; i--) { // Loop backwards (outer->inner)
            const ratio = i / numSteps;
            // currentRadius goes from outerRadius down to innerRadius
            const currentRadius = innerRadius + (outerRadius - innerRadius) * ratio; 
            // Alpha fades from nearly transparent at the edge to fully dark inside the gradient band
            const alpha = (1 - ratio) * (DungeonDarkness.darknessOpacity / 255); 
            
            gfx.beginFill(0x000000, alpha); // Use black with varying alpha
            gfx.drawCircle(playerX, playerY, currentRadius);
            gfx.endFill();
        }
        
        // 3. Punch a fully transparent hole in the center for the main light area
        gfx.beginHole();
        gfx.drawCircle(playerX, playerY, innerRadius);
        gfx.endHole();
    };

    
    //-----------------------------------------------------------------------------
    // Spriteset_Map Integration
    // Hook into RPG Maker's map rendering to add our overlay.
    //-----------------------------------------------------------------------------
    
    // Alias the method that creates HUD elements, weather, etc.
    const _Spriteset_Map_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
    Spriteset_Map.prototype.createUpperLayer = function() {
        _Spriteset_Map_createUpperLayer.call(this); // Run original method first
        this.createDarknessOverlay(); // Then add our overlay
        if (DungeonDarkness.debug) console.log(`${pluginName}: Darkness overlay added to Spriteset_Map`);
    };
    
    // Method to actually create the overlay object
    Spriteset_Map.prototype.createDarknessOverlay = function() {
        this._darknessOverlay = new DarknessOverlay();
        this.addChild(this._darknessOverlay); // Add it to the stage
    };
    
    // Alias the main update method for the map spriteset
    const _Spriteset_Map_update = Spriteset_Map.prototype.update;
    Spriteset_Map.prototype.update = function() {
        _Spriteset_Map_update.call(this); // Run original update
        if (this._darknessOverlay) {
            this._darknessOverlay.update(); // Update our overlay every frame
        }
    };
    
    //-----------------------------------------------------------------------------
    // Optional: Scene_Map Hook (Can be useful for init logic)
    //-----------------------------------------------------------------------------
    const _Scene_Map_onMapLoaded = Scene_Map.prototype.onMapLoaded;
    Scene_Map.prototype.onMapLoaded = function() {
        _Scene_Map_onMapLoaded.call(this);
        // Good place to log initial state if needed
        if (DungeonDarkness.debug) console.log(`${pluginName}: Map loaded. Initial darkness state: ${DungeonDarkness.enabled}`);
    };
    
    //-----------------------------------------------------------------------------
    // Make settings accessible globally (e.g., via console F8/F12 for tweaking)
    window.DungeonDarkness = DungeonDarkness; 
    
    if (DungeonDarkness.debug) console.log(`${pluginName} loaded successfully.`);

})(); // End of IIFE