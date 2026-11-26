# Silverback

A 1v1 gorilla fight club for VR, where you move with your arms like in Gorilla Tag. This playable test is the street, the game's main lobby: the alley with the freight elevator, the street it opens onto, and every roof around them.

## Play it

1. Put on your Quest and open the Quest browser.
2. Go to **https://bamflics-max.github.io/Silverback-/**
3. Press **Enter VR**.

On a phone or computer the same page lets you look around the street instead.

## Controls

- **Move:** push the ground with your hands. Anything solid works: walls, ladders, crates, dumpsters, the fence. A hand that touches something stays put, so pushing it moves you. Let go mid-swing to fly. Walls can be climbed hand over hand, so every roof can be reached by climbing.
- **Grab and throw:** close your whole fist (grip and trigger together) on a bottle, a can, the basketball, a trash bag or the boombox. Open your hand to let go; swing first to throw.
- **Turn:** right stick left or right, 45 degrees at a time.
- **Ground too far or too close:** push the left stick up or down. The game remembers your setting.
- **Back to the elevator:** press the left stick in.

Everyone has the same body size, so fights are fair. Your real height only changes how far your arms stretch, so the ground is in reach for everyone.

## What's in it, and what isn't yet

In: the whole street (alley, cosmetics shop, three booths, wall of champions, practice yard, hoop), roofs on every building with ladders, stair huts and a few places to sit, arm movement, your own gorilla arms and hands, things you can knock over, pick up and throw (glass bottles smash and come back later; the ball goes through the hoop), the elevator's call button, and a boombox you can carry and play. Tap sounds change with the surface (stone, metal, wood, soft, glass), and the controllers rumble when your hand lands.

Not yet: other players, fighting, voting, and the elevator ride down to the locker room. The gorillas standing around are stand-ins for other players.

## Music for the boombox

The boombox plays whatever is in the `music` folder. Put audio files there (MP4, M4A or MP3 all work in the Quest browser) and list them in `music/list.json`, for example:

```json
["first beat.mp4", "second beat.m4a"]
```

They play in that order and loop round. Press the red key on the boombox's top to start and stop it.

## How it's made

- three.js r128 and WebXR, in one page (`index.html`) with no build tools needed to play.
- The movement works like Gorilla Tag's open-source GorillaLocomotion (MIT license, Another Axiom), rewritten in JavaScript for this game. It lives in `src/part4_xr.js`. The loose things have their own small physics in `src/part5_props.js`, and the roofs are in `src/part2e_roofs.js`.
- Everything is drawn from code; there are no model or image files.
- `src/` has every part. Run `python3 build_page.py base_preview.html ../index.html fighter.json page_vr.json` inside `src/` to rebuild `index.html`.
- `tests/` has the checks used while building it: the movement by numbers (`xr_sim.js`, `xr_crawl.js`), the loose things (`xr_props.js`) and runs in an emulated Quest 2 (`xr_iwer.js`, `xr_roofs.js`, using Meta's IWER). They were written for the machine that built this, so their paths need changing to run elsewhere.
