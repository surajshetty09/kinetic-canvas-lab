# Kinetic Canvas Lab

Three interactive generative-art systems for curious hands, built with plain HTML, CSS, and JavaScript.

## Systems

- **Field Notes** — a particle flow field that bends around your pointer.
- **Soft Signal** — elastic waveforms that can be tuned and struck.
- **Orbit Garden** — a tiny gravity simulation where clicks plant new suns.

Every system includes adjustable energy, three color palettes, pause/reset controls, and one-click PNG export. Keyboard controls: `1`–`3` switch systems, `Space` pauses, `R` resets, and `S` saves the current frame.

## Run locally

No build step or dependencies are required.

```bash
python3 -m http.server 8080
```

Then open <http://localhost:8080>.

## Design notes

The interface combines an editorial control-room layout with a deliberately restrained palette. All animation is rendered on a single Canvas 2D surface; the rest of the experience remains semantic, responsive, and keyboard accessible.

## License

[MIT](LICENSE)
