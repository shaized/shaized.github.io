# Blueprint film recorder

The four `film-*.mp4` files and their `film-*.webp` posters in the repository root are recordings of the diagrams in `blueprints.html`. This folder holds the recorder. The website does not load anything from here.

## Re-record after changing a diagram

From the repository root:

```sh
node dev/films/record.mjs            # all four
node dev/films/record.mjs lifecycle  # one
```

It needs Node 22 or later, Google Chrome, Python 3, and `ffmpeg` with libx264. Set `CHROME` or `FFMPEG` if they are not in the default locations, `OUT` to write somewhere other than the repository root, and `STEP_MS` to change how long each step stays on screen.

## How it works

`film.html` is a 1280×720 stage that reads one diagram and its captions directly from `blueprints.html`, so a film always matches the page it was recorded from. `record.mjs` opens the stage in headless Chrome, captures the screen while the steps play, and encodes the frames to H.264 MP4 with the poster taken from the final frame.

After recording, update the transcript under each video in `blueprints.html` and `playbooks.html` if the captions changed, then run the site checks.
