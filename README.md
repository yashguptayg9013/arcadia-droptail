# Arcadia — a cinematic tribute

A scroll-driven, film-style page for the Rolls-Royce Arcadia Droptail, the third of four coachbuilt Droptails, built from Rolls-Royce's official press photography and B-roll.

**Live:** https://yashguptayg9013.github.io/arcadia-droptail/

## What's inside

- A loader that draws the clock's 119-facet guilloché, opening onto a hero of falling blossom
- Ten chapters: the "heaven on earth" prologue, an iris that opens from the 2019 sketch onto the finished car, a horizontal form reel, an interactive paint sample whose aluminium and glass flakes catch the light, a letterbox interlude, the wood story with counting figures, a pinned interior sequence, a live clock modelled on Arcadia's dial, the four-year workshop story, and the specification
- A player for the full two-minute official film with chapter shortcuts
- Smooth scrolling, a chapter rail, a cursor ring and a lightbox; all motion is skipped for `prefers-reduced-motion`

## Stack

Plain HTML, CSS and JavaScript with no build step. [GSAP](https://gsap.com) + ScrollTrigger handle the scroll choreography and [Lenis](https://lenis.darkroom.engineering) smooths the wheel, both loaded from a CDN.

Run it locally:

```bash
python3 -m http.server 8770
```

## Disclaimer

Fan-made tribute. Not affiliated with, endorsed by or connected to Rolls-Royce Motor Cars Limited or the BMW Group. Photography and film © Rolls-Royce Motor Cars, from the official [Rolls-Royce PressClub](https://www.press.rolls-roycemotorcars.com/rolls-royce-motor-cars-pressclub/article/detail/T0439958EN/rolls-royce-unveils-arcadia-droptail-a-coachbuilt-haven-of-tranquillity). Facts come from the official press releases.
