# No Plan B: Cuba Web Presentation

Web-based version of `Cuba_Touratech_Almost_Final.pptx`.

Production site:

```text
https://cuba.seattlesafari.com
```

## Open

Use either option:

```bash
cd /Users/donshingler/Documents/Codex/2026-06-15/files-mentioned-by-the-user-cuba/outputs/cuba-web-presentation
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

You can also open `index.html` directly in a browser, but the local server is more reliable for video playback.

If that port is already in use, pick another open port, for example:

```bash
python3 -m http.server 4187
```

## Present

- Right arrow, space, enter, or click: next slide
- Left arrow or backspace: previous slide
- Home / End: first or last slide
- `N`: presenter notes
- `O`: slide grid
- `F`: fullscreen
- Escape: close overlays

## Notes

- The presentation uses real HTML sections, not a simple screenshot export.
- Presenter notes are editable from the `N` panel and save locally in the current browser.
- A speaker bio slide for Don Shingler and Justin Leigh is now slide 1.
- Slide 12 is a full-screen four-panel rotating photo collage using local copies of the provided Google Photos images.
- Source images and videos were extracted from the PPTX and compressed for web use.
- The large crocodile video was converted as an 18-second web highlight to keep the deck responsive.
