# Ambrogio Magical Village

A warm, low-poly medieval village on a forested cliff. A waterfall drops from the village stream, and hot-air balloons carry residents to the treehouses in a 100-meter oak.

## Explore the village

[Explore Ambrogio in your browser](https://dongwhfdyer.github.io/ambrogio-magical-village/).

Download [Explore Ambrogio.html](Explore%20Ambrogio.html) using GitHub’s **Download raw file** button, then open it in a modern browser. The viewer works offline. Start in **Walk** at the market landing. The default **Behind me** camera follows your character from above. Choose **Facing me** for a front view or **First person** to look through the character’s eyes. Move with WASD, arrow keys, or the on-screen touch controls. Drag to look around. At a landing, select **Ride to** to travel between the square and the canopy. Walk the balconies and connecting bridges, or select an overview camera to orbit and zoom.

## Edit the scene

Download [Ambrogio.glb](Ambrogio.glb) and import it into Blender as a glTF 2.0 model. The scene includes named meshes for the buildings, villagers, treehouses, and balloons.

The viewer bundles Three.js. Its license is included in [THREE-LICENSE.txt](THREE-LICENSE.txt).

## Multiplayer

The hosted viewer supports a shared, anonymous Supabase Realtime room. Set the project URL and **publishable** (or legacy **anon**) key in `multiplayer-config.json` and allow public Realtime channels for that project. These values are public in GitHub Pages. No database tables are required. Open the site on two devices, then walk away from the landing to see each other. Presence handles arrivals and departures, and Broadcast carries movement and balloon rides. Downloaded offline copies run solo.

The viewer’s travelers use Kay Lousberg’s rigged Rogue character and walk cycle from [KayKit Adventurers](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0), released under CC0. The character and animation are embedded in the offline viewer.
