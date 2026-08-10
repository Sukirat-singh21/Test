# Study Grove sound assets

This folder contains the v1 audio foundation for the planned native Web Audio
engine. The files are intentionally kept separate from `sound.js` so they can
be reviewed, swapped, or remastered without changing the playback code.

## Export profile

- Mono MP3
- 44.1 kHz
- 128 kbps CBR
- Peak target around -3 dBFS after MP3 encoding
- Short fades at the boundaries to avoid clicks

The exact source pages, licenses, trim offsets, and target paths are recorded
in `manifest.json`.

## Current asset map

| Target | Intended use | Source/license |
|---|---|---|
| `grove/wood-click.mp3` | Grove start/theme-change transient | BenjaminNelan, CC0 |
| `grove/wood-creak.mp3` | Grove pause texture | Rudmer_Rotteveel, CC0 |
| `lagoon/water-drop.mp3` | Lagoon start/pause/save texture | paespedro, CC0 |
| `hearth/fire-crackle-short.mp3` | Hearth texture plus warm Grove save feedback | Sadiquecat, CC0 |
| `hearth/fire-crackle-loop.mp3` | Hearth completion/ambient foundation | soundofsong, CC0 |
| `mythic/wind-chimes.mp3` | Mythic achievement layer | InspectorJ, CC BY 4.0; attribution required |
| `shared/kenney-click.mp3` | Optional generic UI click | Kenney UI Audio, CC0 |
| `shared/kenney-toggle.mp3` | Optional generic toggle sound | Kenney UI Audio, CC0 |

The fire loop is a 3.5-second foundation cut from the source's existing loop.
It still needs a seam check when the optional ambient-loop feature is wired.
