# Silverback

A 1v1 gorilla fight club for VR, where you move with your arms like in Gorilla Tag. This first playable test is the street, the game's main lobby: the alley with the freight elevator and the street it opens onto.

## Play it

1. Put on your Quest and open the Quest browser.
2. Go to **https://bamflics-max.github.io/Silverback-/**
3. Press **Enter VR**.

On a phone or computer the same page lets you look around the street instead.

## Controls

- **Move:** push the ground with your hands. Anything solid works: walls, crates, dumpsters, the fence. A hand that touches something stays put, so pushing it moves you. Let go mid-swing to fly.
- **Turn:** right stick left or right, 45 degrees at a time.
- **Size:** B or Y switches between three sizes: Gorilla Tag size, Big (the default) and Silverback size.
- **Back to the elevator:** press the left stick in.

## What's in it, and what isn't yet

In: the whole street (alley, cosmetics shop, three booths, wall of champions, practice yard, hoop, roof), arm movement, your own gorilla arms, tap sounds that change with the surface (stone, metal, wood, soft, glass), and controller rumble when your hand lands.

Not yet: other players, fighting, voting, and the elevator ride down to the locker room. The gorillas standing around are stand-ins for other players.

## How it's made

- three.js r128 and WebXR, in one page (`index.html`) with no build tools needed to play.
- The movement works like Gorilla Tag's open-source GorillaLocomotion (MIT license, Another Axiom), rewritten in JavaScript for this game. It lives in `src/part4_xr.js`.
- Everything is drawn from code; there are no model or image files.
- `src/` has every part. Run `python3 build_page.py base_preview.html ../index.html fighter.json page_vr.json` inside `src/` to rebuild `index.html`.
- `tests/` has the checks used while building it: the movement by numbers (`xr_sim.js`, `xr_crawl.js`) and a run in an emulated Quest 2 (`xr_iwer.js`, using Meta's IWER). They were written for the machine that built this, so their paths need changing to run elsewhere.
