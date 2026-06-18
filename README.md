# JR Modular Systems — strona + konfigurator 3D

Przebudowa strony [jrmodularsystems.pl](https://jrmodularsystems.pl/) — producenta budynków
modułowych (domy, przedszkola, salony samochodowe, biura, gastronomia, hotele, handel,
serwerownie, pawilony eventowe). Czysty, „Apple-owski" layout + interaktywny **konfigurator 3D**,
w którym klient samodzielnie projektuje swój obiekt z modułów kontenerowych.

Wszystkie **zdjęcia, opisy i wideo** zostały zachowane 1:1 z oryginalnej strony.

## Stack

- **React 18 + Vite 5**
- **React Three Fiber + drei + three.js** — konfigurator 3D (modele proceduralne, bez plików GLTF)
- **framer-motion** / IntersectionObserver — animacje wejścia
- **react-router-dom** (HashRouter) — działa na statycznym hostingu (np. GitHub Pages)

## Otwieranie bez serwera (dwuklik)

Po `npm run build` powstaje **jeden samodzielny plik** `dist/index.html` (cały JS i CSS
wbudowany w środku) obok folderu `dist/media/`. Żeby zobaczyć stronę:

1. Wejdź do folderu **`dist`**.
2. Kliknij dwukrotnie **`index.html`** — otworzy się w przeglądarce, bez żadnego serwera.

> Trzymaj `index.html` razem z folderem `media` (zdjęcia i wideo). Cały folder `dist`
> możesz skopiować gdziekolwiek i otwierać `index.html`.
>
> Gdyby przeglądarka pokazała pustą stronę (część przeglądarek blokuje `file://`),
> kliknij dwukrotnie **`URUCHOM-strone.bat`** w głównym folderze — uruchomi lokalny
> podgląd i sam otworzy przeglądarkę.

## Uruchomienie (tryb deweloperski)

```bash
npm install
npm run dev      # http://localhost:5173  (z auto-odświeżaniem)
npm run build    # samodzielny dist/index.html + dist/media
npm run preview  # podgląd builda przez lokalny serwer
```

## Konfigurator 3D (`/#/konfigurator`)

- **Gotowe szablony**: salon samochodowy, dom, przedszkole, biuro, gastronomia, sklep, hotel,
  self storage, serwerownia, sauna, siłownia, inny.
- **Moduły** (warianty kontenera): goły kontener → drzwi → okno → drzwi+okno → dwa okna →
  okna pasmowe → mieszkalny → witryna → przeszklenie → narożnik szklany → lada/bar → brama →
  drzwi 2-skrzydłowe → serwerownia. Każdy w rozmiarze 20' / 30' / 40'.
- **Wykończenie**: 12 elewacji (stal, drewno, panel, tynk), 3 typy dachu (płaski/attyka/dwuspadowy),
  3 standardy (ekonomiczny 1999 / podstawowy+ 2299 / premium 2999 zł/m² — ceny z oryginalnej strony),
  dodatki (taras, zadaszenie, PV, klimatyzacja, SMART…).
- **Szacunkowa wycena** liczona na żywo.
- **Eksport / zapis projektu**: render PNG, podsumowanie PDF (druk → zapis PDF), wysyłka do wyceny
  (mailto z pełną specyfikacją). Projekt jest też autozapisywany w `localStorage`.

## Struktura

```
public/media/          # zdjęcia (97) + wideo (hero loop 1.8MB, pełne 40MB) pobrane z jrmodularsystems.pl
src/
  data/
    content.js         # treści 1:1 (oferta, FAQ, realizacje, kontakty, proces) + mapowanie zdjęć
    configurator.js    # katalog modułów, wariantów, wykończeń, cennik, logika wyceny
  three/
    textures.js        # proceduralne tekstury (stal trapezowa, drewno, szkło, panel, tynk, podłoże)
    ContainerModule.jsx # parametryczny model kontenera (warianty otworów, dachy, narożniki)
    ConfiguratorScene.jsx # scena R3F (światła, environment, cienie, kamera, eksport)
  components/          # Header, Footer, Layout, UI, Reveal, ModuleThumb, ConfigPreview, Icons
  pages/               # Home, OfferIndex, OfferPage, About, Technology, Faq, Realizacje,
                       # UsedContainers, Contact, Configurator, NotFound
```

## Uwagi

- Treści i materiały są własnością JR Modular Systems Sp. z o.o.
- Formularze kontaktowe używają `mailto:` (brak backendu) — przy wdrożeniu warto podłączyć
  usługę typu Formspree / własny endpoint.
- Three.js jest w osobnym chunku (`ConfiguratorScene`) ładowanym dopiero przy wejściu w 3D —
  podstrony treściowe ważą ~75 kB gzip.
