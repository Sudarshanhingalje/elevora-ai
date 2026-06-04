# /public/assets/

Place your media files here. The product cards in `src/routes/index.tsx` reference:

| File          | Used by         | Type  |
|---------------|-----------------|-------|
| `clinic.mp4`  | Dental AI card  | Video (autoplay, loop, muted) |
| `gym.gif`     | Gym AI card     | GIF (auto-animates) |
| `sass_v.mp4`  | CRM AI card     | Video (autoplay, loop, muted) |

## How to add your files

1. Copy your video/GIF files into this folder (`public/assets/`)
2. The paths in `index.tsx` are already set to `/assets/clinic.mp4` etc.
3. Vite serves the `public/` folder at `/` automatically — no import needed.

## Supported formats
- **Videos:** `.mp4` recommended (best browser support). Use H.264 codec.
- **GIFs:** `.gif` works out of the box. For better performance, consider `.webp`.

## Tips
- Keep videos under 5MB for fast load times
- Use `ffmpeg` to compress: `ffmpeg -i input.mp4 -vcodec h264 -acodec aac output.mp4`
