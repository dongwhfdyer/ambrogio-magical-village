# Magical Treehouse Village

A warm, low-poly medieval village on a forested cliff. A waterfall drops from the village stream, and hot-air balloons carry residents to the treehouses in a 100-meter oak.

## Explore the village

[Explore Magical Treehouse Village in your browser](https://dongwhfdyer.github.io/ambrogio-magical-village/).

Download [Explore Ambrogio.html](Explore%20Ambrogio.html) using GitHub’s **Download raw file** button, then open it in a modern browser. The viewer works offline. First-time visitors start in **Walk** at the market landing. On the same browser, a small local save restores your traveler, location, camera and parked or airborne balloon. Select **Waterfall** for a view of the flowing river, falling curtain, spray and pool. The default **Behind me** camera follows your character from above. Choose **Facing me** for a front view or **First person** to look through the character’s eyes. Move with WASD, arrow keys, or the on-screen touch controls. Drag to look around. Select **Pilot balloon** at the market basket. Steer with WASD or arrows, drag to turn, and use **R** to rise or **F** to descend. Touch devices have rise and descent buttons. Release the controls to hover. Descend beside a balcony or the walkable ground until **Step out** becomes available. The balloon stays where you leave it. Walk the balconies and connecting bridges, or select an overview camera to orbit and zoom.

In the square, a spoon stirs soup while herbs sprinkle themselves in, and a flying tray carries bread from the bakery to the tavern. Look up for broom couriers and winged school letters, or follow the swallows toward the squirrels in the oak. Villagers and their errands share a clock across multiplayer visits.

Select **Visit Lotus Temple** to arrive at the lantern-lit stair of the lowest treehouse. Walk through the open doors to see the painted Buddha shrine, lotus offerings, and meditation cushions. **Return from temple** takes you back. You can also pilot the balloon to the landing below its steps.

## Edit the scene

Download [Ambrogio.glb](Ambrogio.glb) and import it into Blender as a glTF 2.0 model. The scene includes named meshes for the buildings, villagers, treehouses, and balloons.

The viewer bundles Three.js. Its license is included in [THREE-LICENSE.txt](THREE-LICENSE.txt).

## Multiplayer

The hosted viewer supports a shared, anonymous Supabase Realtime room. Set the project URL and **publishable** (or legacy **anon**) key in `multiplayer-config.json` and allow public Realtime channels for that project. These values are public in GitHub Pages. No database tables are required. Open the name and online-count menu to choose your public display name, copy the village link, wave, or select **Meet** beside another visitor to walk together. Names appear above other visitors. Display names are remembered on this device and do not require accounts. Presence handles arrivals and departures, and Broadcast carries movement and balloon rides. Downloaded offline copies run solo.

The viewer’s travelers use Kay Lousberg’s rigged Rogue character and walk cycle from [KayKit Adventurers](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0), released under CC0. The character and animation are embedded in the offline viewer.
