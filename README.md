# Magical Treehouse Village

A warm, low-poly medieval village on a forested cliff. A waterfall drops from the village stream, and hot-air balloons carry residents to the treehouses in a 100-meter oak.

## Explore the village

[Explore Magical Treehouse Village in your browser](https://dongwhfdyer.github.io/magical-village-from-kuhn/).

On a phone, tap **Explore** for destinations, camera settings, your character, and balloon rides. Hold the arrows in the lower left to move and drag the village to look around.

Download [Explore Ambrogio.html](Explore%20Ambrogio.html) using GitHub’s **Download raw file** button, then open it in a modern browser. The viewer works offline. First-time visitors arrive at the market landing in **Walk**. Move with WASD, the arrows, or the touch controls. Hold **Shift** to run. Tap **Space** for a short hop, or hold it while moving for a higher, longer jump. On touchscreens, hold **Run** or **Jump** while steering. Falls cause no damage. The reservoir returns you to the market landing. Drag to look in any direction, including straight up and down. Choose **Behind me**, **Facing me**, or **First person**. Turn on **Follow camera** for mouse-free play. Use **W/S** to move, **A/D** or **←/→** to turn, and **↑/↓** to look up and down. The follow setting is remembered on this browser. This browser remembers your name, outfit, walking location, and camera.

Choose **Lantern Run** to start the parkour course beside the bridge. Jump across seven leaf-marked stones to reach the lantern gate and unlock **Lantern Twirl** in **Character**. The gate is a checkpoint for the eight additional jumps along the gold stones to the temple island. The reward stays in this browser and friends can see the animation.

Open **Character** to choose a coat, headwear and cape, or to **Wave** and **Dance**. Other visitors see your outfit and animations.

Choose **Spawn balloon** outdoors to pilot your own hot-air balloon. Steer with WASD or arrows, drag to turn, and use **R** to rise or **F** to descend. Touch controls include rise and descent. Land beside a balcony or on walkable ground and choose **Step out**. You can board your parked balloon or summon it elsewhere. It disappears when you leave. **Oak crown** takes you to the single shared flying broom. Choose **Ride broom**, use the same flight controls, then **Dismount broom** near a landing. The broom returns to its perch for the next rider.

Walk through the open doorways of the bakery, tavern, smithy, schoolhouse, chapel and canopy cottages. Behind the market landing, the lantern bridge leads to an island of faceted gold mountains. Its stone piers reach the bed of the reservoir 53 meters below the village. Select **Reservoir** for a view of the enclosing dam and waterfall. Climb the sanctuary steps to visit its Buddhist shrine. Choose **Golden island** for an overview.

The shared sky spends **3 minutes 30 seconds in daylight** and **1 minute 30 seconds at night**. At dusk the bridge lanterns light the walkway, and glowing paper lanterns drift above the village.

In the square, a spoon stirs soup while herbs sprinkle themselves in, and a flying tray carries bread from the bakery to the tavern. Look up for winged school letters and swallows, watch the squirrels run along the oak’s bark, or visit the smith at the horned anvil. Villagers and their errands share a clock across multiplayer visits.

Select **Visit Lotus Temple** to arrive at the lantern-lit stair of the lowest treehouse. Walk through the open doors to see the painted Buddha shrine, lotus offerings, and meditation cushions. **Return from temple** takes you back. You can also pilot the balloon to the landing below its steps.

## Edit the scene

Download [Ambrogio.glb](Ambrogio.glb) and import it into Blender as a glTF 2.0 model. The scene includes named meshes for the buildings, villagers, treehouses, and balloons.

After editing the scene, run `python tools/pack_viewer.py` (Pillow and NumPy required) to rebuild the compact scene embedded in the offline viewer.

The viewer bundles Three.js. Its license is included in [THREE-LICENSE.txt](THREE-LICENSE.txt).

## Multiplayer

The hosted viewer supports a shared, anonymous Supabase Realtime room. Set the project URL and **publishable** (or legacy **anon**) key in `multiplayer-config.json` and allow public Realtime channels for that project. These values are public in GitHub Pages. No database tables are required. Open the name and online-count menu to choose your public display name, copy the village link, wave, or select **Meet** beside another visitor to walk together. Names appear above other visitors. Display names are remembered on this device and do not require accounts. Presence handles arrivals and departures, and Broadcast carries movement and balloon rides. Downloaded offline copies run solo.

The viewer’s travelers use Kay Lousberg’s rigged Rogue character and walk cycle from [KayKit Adventurers](https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0), released under CC0. The character and animation are embedded in the offline viewer.
