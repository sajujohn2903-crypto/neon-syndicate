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
3. Type your name (up to 8 letters), pick a fighter, test your motion, then hit **READY**. Your name shows on the projector in place of the fighter's name. With only one phone, hit **SOLO vs CPU**.
4. Best of 3 rounds, 60 seconds each. Empty the other player's bar to K.O. them.

### Grip

Pick a grip on the phone before you ready up. Whatever position you're holding the phone in when you tap READY becomes neutral, and it resets every round.

- **Upright:** screen facing you, like holding a remote.
- **Fist:** screen facing the floor, top of the phone pointing at the screen, punching like a real jab. You can't see the screen in this grip, so the buttons become three full-width bands you find by feel: **top = KICK, middle = BLOCK (hold), bottom = SPECIAL**.

- **Thumbs-up (ARMS style):** hold the phone upright in your fist with your thumb on the screen, like a Joy-Con. Lean left/right to move, punch forward, flick up to jump, drop to duck. The whole screen is one thumb pad: **tap = KICK, hold = BLOCK, swipe up = SPECIAL**.

### Controls

| Move | How |
|---|---|
| Walk | Tilt left / right |
| Punch | Thrust the phone forward |
| Jump | Tip the top of the phone up/away (fist grip: raise your knuckles), then back to level before the next jump. Tilt sideways mid-jump to jump forward or back |
| Duck | Drop the phone down quickly; lift it back up to stand (you also stand on your own after 2.5 s). Punches miss you while you're ducking |
| Hook | Twist your wrist as you punch (uses the gyro). Slower, but curls round a block: half the damage gets through and it knocks their guard open |
| Uppercut | Duck + punch. Launches the opponent |
| Kick | KICK button |
| Sweep | Duck + KICK. Knocks them down, but they can jump over it |
| Air attacks | Punch or KICK while jumping |
| Block | Hold BLOCK (duck while blocking for a low block) |
| Special | SPECIAL button when the meter is full. Kira: Volt Dash · Brick: Ground Pound |

**Combos:** once an attack lands, your next press flows straight into the next one. Punch → hook → kick → uppercut → special is the big chain. Presses made while you're busy are remembered for a moment, so tap the next move a little early.

If the left/right tilt or the jump tilt feels backwards, flip it in Controls & sensitivity. Tap **Re-centre jump tilt** if jumps fire on their own (it also re-centres every round), and use the Low/Med/High setting if moves fire too easily or not enough.

The phone's volume buttons can't be used: iPhone Safari doesn't tell web pages when they're pressed. That would need a native iOS app. **Buttons** mode is there as a fallback.

### Testing without phones (keyboard)

Press **Enter** in the lobby to start a keyboard match, or **C** to fight the CPU.

- P1: A/D move, W jump, S duck, Q block, F punch, T hook, G kick, E special
- P2: ←/→ move, ↑ jump, ↓ duck, J block, K punch, U hook, L kick, O special

The projector remote's OK button also starts a match from the lobby.

## How it works

- The game draws at 320×180 and scales up with crisp pixels. A 1080p projector shows it at 6×.
- Phones and the projector connect directly over WebRTC (PeerJS). The free PeerJS cloud server only introduces the devices, so you need internet when joining. Inputs then go straight over your Wi-Fi.
- All art is drawn in code from the sprite data in `js/sprites.js`.

## Known limits

- iPhone Safari doesn't let websites vibrate the phone. The controller flashes pink when you're hit and cyan when you block instead.
- Motion gestures can need tuning per person. Use the Low/Med/High sensitivity setting.
- If the room code isn't found, refresh the projector page to get a fresh room.

## Android app for the projector

`android/` is a small Android app that opens the live game fullscreen. GitHub Actions builds it whenever `android/` changes and posts it as the **apk-latest** release.

Install it on the projector:
1. Install **Downloader** (by AFTVnews) from the projector's Play Store.
2. Open it and enter `https://github.com/sajujohn2903-crypto/neon-syndicate/releases/latest/download/neon-syndicate.apk`.
3. Allow Downloader to install unknown apps when asked, then tap **Install**.

Neon Syndicate then shows up in the app list. The remote's OK button starts a match. The app always loads the newest version of the game, so you only reinstall when the app itself changes. Each build is signed by GitHub's build machine, so if Android refuses to update the app, uninstall the old one first.
