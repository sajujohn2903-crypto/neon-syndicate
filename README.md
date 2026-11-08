# Neon Syndicate — Phase 1

A pixel-art fighting game for the projector. You play it with your iPhones as motion controllers.

- `index.html`: the game screen. Open it on the projector.
- `controller.html`: the phone controller. Phones open it by scanning the QR code on the projector screen.

## 1. Put it online (one-time, about 5 minutes)

iPhones only share motion data with **HTTPS** websites, so the game needs to be hosted. GitHub Pages is free:

1. Create a new public repo on GitHub, for example `neon-syndicate`.
2. Upload everything in this folder to the repo root (Add file → Upload files).
3. Go to Settings → Pages → Source: **Deploy from a branch**, Branch: `main`, folder `/ (root)` → Save.
4. After a minute your game is live at `https://<your-username>.github.io/neon-syndicate/`.

Netlify Drop and Vercel also work. Any HTTPS static host is fine.

## 2. Install on the projector

1. On the Gimbal A1, open Chrome and go to your game URL.
2. Chrome menu (⋮) → **Add to Home screen** / **Install app**. Neon Syndicate now has its own icon.
3. Click the screen once, or press Shift+F on a keyboard, to go fullscreen.

## 3. Play

1. The projector shows a QR code and a 4-letter room code.
2. Each player scans the QR code with the iPhone camera, then taps **ENTER THE FIGHT** and allows motion access.
3. Pick a fighter, test your tilt, then hit **READY**. With only one phone, hit **SOLO vs CPU**.
4. Best of 3 rounds, 60 seconds each. Empty the other player's bar to K.O. them.

### Controls (hold the phone upright in portrait, like you're gripping it)

| Move | How |
|---|---|
| Walk | Tilt left / right |
| Jump | Lift the phone up quickly. Tilt sideways while jumping to jump forward or back |
| Duck | Drop the phone down quickly; lift it back up to stand (you also stand up on your own after 2.5 s). Ducking makes punches miss you |
| Punch | Jab the phone forward |
| Uppercut | Duck + jab. Launches the opponent into the air |
| Kick | KICK button |
| Sweep | Duck + KICK. Knocks them off their feet, but they can jump over it |
| Air attacks | Jab or KICK while jumping |
| Block | Hold BLOCK (duck while blocking for a low block) |
| Special | SPECIAL button when the meter is full. Kira: Volt Dash · Brick: Ground Pound |

**Combos:** once an attack lands, your next press flows straight into the next one. Punch → kick → uppercut → special is the big chain. Presses made while you're busy are remembered for a moment, so tap the next move a little early.

If left/right or up/down feel backwards, flip them in Controls & sensitivity, and use the Low/Med/High setting if moves fire too easily or not enough.

The phone's volume buttons can't be used: iPhone Safari doesn't tell web pages when they're pressed. That would need a native iOS app. **Buttons** mode is there as a fallback.

### Testing without phones (keyboard)

Press **Enter** in the lobby to start a keyboard match, or **C** to fight the CPU.

- P1: A/D move, W jump, S duck, Q block, F punch, G kick, E special
- P2: ←/→ move, ↑ jump, ↓ duck, J block, K punch, L kick, O special

The projector remote's OK button also starts a match from the lobby.

## How it works

- The game draws at 320×180 and scales up with crisp pixels. A 1080p projector shows it at 6×.
- Phones and the projector connect directly over WebRTC (PeerJS). The free PeerJS cloud server only introduces the devices, so you need internet when joining. Inputs then go straight over your Wi-Fi.
- All art is drawn in code from the sprite data in `js/sprites.js`.

## Known limits

- iPhone Safari doesn't let websites vibrate the phone. The controller flashes pink when you're hit and cyan when you block instead.
- Motion gestures can need tuning per person. Use the Low/Med/High sensitivity setting.
- If the room code isn't found, refresh the projector page to get a fresh room.
