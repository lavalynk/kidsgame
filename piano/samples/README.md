# Piano Star's piano notes

13 short recordings of a real grand piano: C, D#, F# and A from C3 up to C6 (one every 3 keys; the
notes in between are played by speeding a recording up or slowing it down a little).

They come from the **Salamander Grand Piano V3** by **Alexander Holm** (a Yamaha C5 grand),
license **CC BY 3.0** (https://creativecommons.org/licenses/by/3.0/), source
https://archive.org/details/SalamanderGrandPianoV3 , via the npm package
`@audio-samples/piano-mp3-velocity8` 1.0.5 (medium-loud recordings).

Changed for the game: each note is cut to its first 3.2 seconds with a soft fade at the end, made mono (the left microphone only),
louder or softer so every recording is equally loud,
32 kHz, 48 kbps (`tools/make_piano_notes.py` does it and writes `piano/notes.js`, the notes as text
the page can load even when opened from the disk). The game only loads `piano/notes.js`; these
.mp3 files are the source.
