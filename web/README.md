# Bork Invaders Web Prototype

This folder contains a browser-portable version of Bork Invaders built with plain HTML/CSS/JavaScript.

## Run Locally

1. Open `web/index.html` directly in a browser, or
2. Run a local server from the project root:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/web/`.

## Controls

- Desktop: `A`/`D` or arrow keys to move, `Space` to shoot, `Enter` to restart after game over
- Mobile: on-screen `LEFT`, `FIRE`, `RIGHT` buttons

## Notes

- This is a clean port baseline focused on gameplay and structure.
- It does not yet reuse original image/audio assets; those can be added incrementally.
