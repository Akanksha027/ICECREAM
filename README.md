# Sundae & Co. — 3D Ice Cream & Cookie Brand Site

Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion,
and a light Three.js (react-three-fiber) ambient scene.

## Signature interaction

The hero section is pinned for the height of 4 viewport-heights. As you
scroll, each flavor's product image flies in from the right with a 3D
perspective rotation (`rotateY` + depth scale), settles center-screen, then
exits left as the next flavor enters — the flavor name, description, tag,
and background color all crossfade in sync with the same scroll progress.
This is done with Framer Motion's `useScroll` / `useTransform` against a
sticky container, which is the standard, performant way to build this kind
of GLTF/Three.js-style "item flies onto a locked stage" effect without
needing to ship real 3D product models.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Structure

- `app/layout.tsx` — fonts (Fraunces, Plus Jakarta Sans, Caveat) + global shell
- `app/page.tsx` — assembles the page sections
- `components/Hero.tsx` — the pinned 3D scroll flavor reel (signature element)
- `components/AmbientScene.tsx` — react-three-fiber floating blobs behind the hero
- `components/Ticker.tsx` — infinite marquee strip
- `components/FlavorWheel.tsx` — circular flavor picker with an animated scoop
- `components/Showcase.tsx` — big wordmark + product moment (berry section)
- `components/MenuGrid.tsx` — polaroid-style product cards with cursor tilt
- `components/IngredientsStrip.tsx` — sourcing/eco callouts
- `components/Footer.tsx` — contact + giant background wordmark

## Colors

All colors are wired into `tailwind.config.ts` under their brief names
(`blush`, `cream`, `brown`, `coral`, `mint`, `yellow`, `berry`, `raspberry`,
`bright-raspberry`, `gold`, `ticker`, `muted-brown`, `border`, `polaroid`,
`highlight`), so any future section should pull from `bg-berry`,
`text-muted-brown`, etc. rather than introducing new hex values.

## Swapping in real product photography

`Hero.tsx`, `Showcase.tsx`, and `MenuGrid.tsx` currently use Unsplash stock
photos as placeholders. Replace the `image` URLs / `src` values with your
own product shots (ideally square, 1200px+, consistent lighting) — no
other code changes are needed.
