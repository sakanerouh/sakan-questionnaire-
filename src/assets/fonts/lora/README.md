# Lora landing-page font

The bundled WOFF2 is the unmodified Latin variable font supplied by Google Fonts
for Lora, normal style, weights 400–500. It preserves the landing page's font while
avoiding the `next/font/google` URL-parsing failure reported in production.

- CSS source: <https://fonts.googleapis.com/css2?family=Lora:wght@400..500&display=swap>
- Font source: <https://fonts.gstatic.com/s/lora/v37/0QIvMX1D_JOuMwr7Iw.woff2>
- License source: <https://github.com/google/fonts/blob/main/ofl/lora/OFL.txt>
- License: SIL Open Font License 1.1, included in `OFL.txt`.

`LandingPage.tsx` loads this file with `next/font/local`; no Lora download is
required during builds or page visits. Arabic typography continues to use Amiri.
