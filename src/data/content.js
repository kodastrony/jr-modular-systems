/* ============================================================
   Content model — all copy is reused verbatim from
   jrmodularsystems.pl, mapped to the original photos & video.
   ============================================================ */

const IMG = (f) => `media/img/${f}`

export const company = {
  name: 'JR Modular Systems',
  legalName: 'JR Modular Systems Sp. z o.o.',
  nip: '6482792289',
  tagline: 'Budynki modułowe jutra, szyte na miarę XXI wieku',
  hashtag: '#beSMARTbeMODULAR',
  intro:
    'Projektujemy i wykonujemy budynki modułowe, które wykańczamy według Twoich potrzeb. Cechuje nas indywidualne podejście. W połączeniu z ambicją projektantów oraz doświadczeniem zespołu spawaczy i montażystów tworzymy Obiekty, które się wyróżniają i są wizytówką dla właściciela.',
  email: 'biuro@jrmodularsystems.pl',
  phone: '+48 535 901 200',
  phoneHref: '+48535901200',
  hqCity: 'Gliwice',
  address: 'Świętej Elżbiety 6, 41-905 Bytom',
  logo: IMG('JR-modular-LOGO-full.png'),
  logoMark: IMG('cropped-JR-modular-LOGO-3D.png'),
  social: {
    instagram: 'https://www.instagram.com/jrmodularsystems/',
    linkedin: 'https://www.linkedin.com/company/jr-modular-systems/',
    youtube: 'https://www.youtube.com/@jrmodularsystemsbudowadomo9429',
  },
  contacts: [
    { role: 'Zapytania ofertowe', name: 'Biuro JR Modular Systems', email: 'biuro@jrmodularsystems.pl', phone: '+48 535 901 200' },
    { role: 'Obsługa inwestycji', name: 'mgr inż. Jakub Stryjewski', email: 'kubastryjewski@jrmodularsystems.pl', phone: '+48 506 057 727' },
    { role: 'Architektura', name: 'mgr inż. arch. Roman Gliwa', email: 'romangliwa@jrmodularsystems.pl', phone: '+48 695 744 724' },
  ],
}

export const media = {
  heroVideo: 'media/video/jr-web.mp4',
  heroLoop: 'media/video/jr-hero-1080.mp4',
  poster: IMG('video-poster.jpg'),
}

export const heroBadges = ['Indywidualne doradztwo', 'Własna produkcja', 'Trwała konstrukcja stalowa']

/* ---- headline strengths (6) ---- */
export const strengths = [
  {
    title: 'Stalowa konstrukcja nośna, „szyta na miarę"',
    text: 'Dopasowany wymiar do wymagań zagospodarowania terenu, 2 dni od projektu do realizacji konstrukcji oraz ukryte systemowe rozwiązania.',
    icon: 'frame',
  },
  {
    title: 'Indywidualne doradztwo',
    text: 'Nasi doradcy pomagają w ustaleniu Państwa dokładnych potrzeb i dopasowują rozwiązania. Doradzamy telefonicznie, mailowo oraz na miejscu.',
    icon: 'chat',
  },
  {
    title: 'Własna produkcja',
    text: 'Posiadamy własną halę produkcyjną, dzięki czemu wszystkie procesy realizacji odbywają się pod pełną kontrolą jakości oraz czasu.',
    icon: 'factory',
  },
  {
    title: 'Wykwalifikowane ekipy montażowe',
    text: 'Doświadczeni, etatowi pracownicy wykonają szybki i bezproblemowy montaż obiektu.',
    icon: 'team',
  },
  {
    title: 'Serwis 24 h',
    text: 'Odpowiadamy na usterki do 24 h. Świadczymy usługi serwisowe do 7 dni od zgłoszenia, nawet po okresie gwarancyjnym.',
    icon: 'shield',
  },
  {
    title: 'Rozwiązania SMART',
    text: 'Integrujemy nasze budynki modułowe z najnowocześniejszymi rozwiązaniami SMART — efektywnie zarządzane i sterowane, bardziej funkcjonalne oraz ekonomiczne.',
    icon: 'smart',
  },
]

/* ---- 5-step process ---- */
export const processSteps = [
  {
    title: 'Bezpłatne konsultacje',
    text: 'Spotkanie z architektem/doradcą, podczas którego wymieniamy podstawowe informacje – Państwo przekazują nam swoje oczekiwania, a my informujemy o możliwościach, doradzamy, dzielimy się próbkami materiałów. Efektem spotkania jest opracowanie wytycznych.',
  },
  {
    title: 'Wizualizacja',
    text: 'Przygotowujemy dla Państwa serię wizualizacji 3D z różnymi wersjami rozwiązań funkcjonalno-estetycznych. Omawiamy poszczególne warianty przyszłej inwestycji i przedstawiamy wstępną wycenę.',
  },
  {
    title: 'Projekt architektoniczno-budowlany',
    text: 'Ustalamy technologię, typ i jakość materiałów oraz gabaryty pawilonu. Po zawarciu umowy przygotowujemy projekt ogólnobudowlany, na podstawie którego wykonany zostanie Państwa pawilon.',
  },
  {
    title: 'Realizacja konstrukcji',
    text: 'Obiekt powstaje w naszym zakładzie produkcyjnym w oparciu o zasady sztuki budowlanej oraz autorskie rozwiązania projektowe. Gotowy obiekt podlega testom jakościowym, po czym zabezpieczany jest do transportu.',
  },
  {
    title: 'Transport',
    text: 'Obiekt zostaje załadowany na samochód ciężarowy HDS i dostarczony w każde miejsce. Rozładunek następuje przez ramię pneumatyczne HDS, a w razie potrzeby dźwigiem samojezdnym o zasięgu nawet ponad 50 m.',
  },
]

/* ---- offer categories (verbatim copy + original photos) ---- */
export const offer = [
  {
    slug: 'biura-modulowe',
    title: 'Biura modułowe',
    short: 'Kontenery biurowe szyte na miarę – sezonowe i całoroczne, z opcją tarasu i rozwiązań SMART.',
    icon: IMG('sales.png'),
    hero: IMG('biuro-2.jpg'),
    gallery: ['biuro-2.jpg', 'biuro-4.jpg', 'caloroczne-biuro-modulowe-rotated.jpg', 'obiet_biurowy.jpg', 'kontener_biurowy-e1676630577122.jpg'].map(IMG),
    lead: 'Wykonujemy biura modułowe – konstrukcje szyte na miarę konkretnych potrzeb. Projektujemy je od podstaw i dostarczamy rozwiązania zgodne z indywidualnymi oczekiwaniami.',
    sections: [
      {
        heading: 'Biuro modułowe',
        paragraphs: [
          'Wykonujemy biura modułowe. Dostarczamy konstrukcje szyte na miarę konkretnych potrzeb. Zajmujemy się nie tylko samą produkcją nowoczesnych i w najwyższym stopniu funkcjonalnych biur modułowych, ale również od postaw przygotowujemy ich projekty. Zależy nam na tym, by dostarczać rozwiązania zgodne z indywidualnymi oczekiwaniami.',
          'Nie bez przyczyny biura modułowe cieszą się coraz większą popularnością. Wytwarzane przy zastosowaniu zaawansowanych technologii i użyciu najwyższej jakości materiałów odznaczają się wyjątkową trwałością. Przygotowując projekt i przystępując do jego realizacji, mamy jednak na uwadze nie tylko względy funkcjonalne – zdajemy sobie sprawę, jak ważne są walory wizualne, dlatego wszystkie nasze biura z kontenerów odznaczają się nienaganną estetyką.',
        ],
      },
      {
        heading: 'Zalety biur modułowych',
        paragraphs: [
          'Jedną z podstawowych korzyści z wyboru biura modułowego czy też kontenera handlowego są oszczędności finansowe. Budowa biura modułowego wiąże się z niższymi kosztami niż postawienie tradycyjnego budynku. Co więcej, czas wykonania takiego biura jest niezwykle krótki – w zależności od poziomu skomplikowania projektu może zająć to od 2 tygodni do 3 miesięcy.',
          'Bezsprzeczną zaletą budynków biurowych modułowych jest też ich mobilność. Są bardzo proste w transporcie i mogą być z łatwością przenoszone z miejsca na miejsce. Modułowa budowa biura otwiera ogromne możliwości, jeśli chodzi o jego rozbudowę w przyszłości.',
        ],
      },
      {
        heading: 'Dlaczego warto zamówić u nas kontener biurowy?',
        paragraphs: [
          'Przed realizacją zamówienia na biuro modułowe przygotowujemy wizualizacje 3D z możliwymi wariantami funkcjonalnymi. Dzięki temu Klienci mogą zobaczyć, jak dokładnie będzie wyglądał budynek, i na tym etapie dokonać ewentualnych modyfikacji.',
          'Do produkcji kontenerów biurowych wykorzystujemy bardzo dobre gatunkowo materiały, dlatego możemy zagwarantować długą żywotność i świetne parametry użytkowe naszych konstrukcji.',
        ],
      },
    ],
    highlights: ['Oszczędności finansowe', 'Realizacja od 2 tygodni do 3 miesięcy', 'Mobilność i łatwy transport', 'Możliwość rozbudowy', 'Pełna infrastruktura i SMART', 'Kontener biurowy z tarasem'],
  },
  {
    slug: 'przedszkola-modulowe',
    title: 'Przedszkola modułowe',
    short: 'Funkcjonalne placówki oświatowe spełniające normy techniczne i sanitarne – szybkie i bezpieczne.',
    icon: IMG('sportowy.png'),
    hero: IMG('biuro-4.jpg'),
    gallery: ['biuro-4.jpg', 'b2c9a186-1692-48bd-bd24-d1525175ac2e.jpg', 'biuro-2.jpg'].map(IMG),
    lead: 'Przedszkola modułowe spełniające wszelkie obowiązujące normy techniczne i sanitarne – solidne, ciche, ciepłe i estetyczne, wykonane na indywidualne zlecenie.',
    sections: [
      {
        heading: 'Przedszkole modułowe',
        paragraphs: [
          'Oferowane przez nas przedszkola modułowe to konstrukcje spełniające wszelkie obowiązujące normy techniczne i sanitarne. Odznaczają się solidną budową, wysokim poziomem izolacyjności termicznej i dźwiękowej oraz nienaganną estetyką. Naszą specjalnością jest wykonawstwo przedszkoli modułowych na indywidualne zlecenie – zapewniamy fachową pomoc przy stworzeniu projektu.',
          'Do produkcji przedszkoli modułowych wykorzystujemy wyłącznie najwyższej jakości materiały, co przekłada się na bardzo dobre parametry wytrzymałościowe oraz wyjątkową trwałość naszych konstrukcji.',
        ],
      },
      {
        heading: 'Korzyści z wyboru przedszkola modułowego',
        paragraphs: [
          'Krótki czas budowy, niskie koszty inwestycji, wysoka jakość obiektu – to główne zalety przedszkoli modułowych. Tego typu nowoczesne placówki oświatowe zapewniają dzieciom odpowiednie warunki do rozwoju.',
          'Szkoły i przedszkola modułowe to obiekty coraz częściej wybierane zamiast budynków wznoszonych tradycyjnymi metodami – przede wszystkim ze względu na krótki czas realizacji, niższe koszty oraz możliwość elastycznego zwiększania przestrzeni w przyszłości.',
        ],
      },
    ],
    highlights: ['Zgodność z normami sanitarnymi', 'Izolacyjność termiczna i dźwiękowa', 'Krótki czas budowy', 'Niskie koszty inwestycji', 'Możliwość rozbudowy', 'Piękny, bezpieczny design'],
  },
  {
    slug: 'kontenery-handlowe-i-uslugowe',
    title: 'Salony i pawilony handlowe',
    short: 'Modułowe pawilony handlowo-usługowe i salony samochodowe z dużymi przeszkleniami, eksponujące Twój towar.',
    icon: IMG('maly_sklep.png'),
    hero: IMG('biuro-2.jpg'),
    gallery: ['komis-samochodowy-rotated.jpg', 'kontener_sprzedazowy-e1676630665156.jpg', 't-o-ekspozycja-aut.jpg', 't-o-mini-salon.jpg', 'mobilne_obiekty.jpg'].map(IMG),
    lead: 'Jedną z naszych specjalności są modułowe pawilony handlowe i salony sprzedaży – estetyczne, trwałe i ściśle dopasowane do branży. Idealne na sklepy, butiki, a także salony i mini-salony samochodowe.',
    sections: [
      {
        heading: 'Modułowe pawilony handlowe',
        paragraphs: [
          'Jedną z naszych specjalności są modułowe pawilony handlowe. Tworzymy estetyczne i trwałe konstrukcje, ściśle dopasowane do specyfiki konkretnej branży oraz indywidualnych oczekiwań Klienta. Modułowe pawilony handlowe to rozwiązanie, na które stawia coraz więcej przedsiębiorców, którym zależy na szybkim czasie realizacji inwestycji oraz niskich kosztach budowy.',
          'Dzięki zastosowaniu technologii prefabrykowanej oraz wykorzystaniu wysokiej jakości materiałów nasze modułowe pawilony handlowe to budynki łączące funkcjonalność z pięknem.',
        ],
      },
      {
        heading: 'Jakie są zalety kontenerów handlowych?',
        paragraphs: [
          'Szybki czas realizacji i niskie koszty inwestycji – to podstawowe korzyści z wyboru kontenera handlowego. Poszczególne elementy konstrukcyjne tworzone są w hali produkcyjnej, dlatego cały proces jest uniezależniony od warunków terenowo-atmosferycznych.',
          'Zastosowanie kontenerów handlowych jest bardzo szerokie. Można prowadzić w nich salony prasowe, piekarnie, cukiernie, sklepy spożywcze, butiki, salony i ekspozycje samochodowe i wiele innych biznesów. Częstym wyborem są kontenery handlowe z przeszkleniami – prezentują się estetycznie i umożliwiają wyeksponowanie towaru.',
        ],
      },
      {
        heading: 'Co wyróżnia nasze modułowe budynki usługowe?',
        paragraphs: [
          'Wykonywane przez nas modułowe budynki usługowe odznaczają się bardzo dobrymi parametrami izolacyjnymi i wytrzymałościowymi. Podstawowym materiałem konstrukcyjnym jest stal, należycie zabezpieczona przed korozją.',
          'Szczególną wagę przywiązujemy do walorów wizualnych – tworzone przez nas konstrukcje są zróżnicowane pod względem designu, a ich elewacja, kolorystyka i detale ściśle odpowiadają upodobaniom estetycznym naszych Klientów.',
        ],
      },
    ],
    highlights: ['Salony samochodowe i mini-salony', 'Duże przeszklenia', 'Szybki czas realizacji', 'Rozbudowa w poziomie i pionie', 'Stal zabezpieczona przed korozją', 'Nowoczesny design'],
  },
  {
    slug: 'kontenery-gastronomiczne',
    title: 'Kontenery gastronomiczne',
    short: 'Bary, restauracje i sezonowe punkty gastronomiczne z zabudową barową i pełnymi instalacjami.',
    icon: IMG('gastro.png'),
    hero: IMG('gastro-3.jpg'),
    gallery: ['Budynek-gastronomiczny.jpg', 'gastro-3.jpg', 'gastro-5.jpg', 'Modulowa-piekarnia.jpg', 't-o-coffee-bar.jpg'].map(IMG),
    lead: 'Wykonujemy kontenery gastronomiczne w technologii prefabrykacji. Sprawdzają się doskonale w funkcji barów, restauracji czy sezonowych punktów gastronomicznych.',
    sections: [
      {
        heading: 'Kontenery gastronomiczne',
        paragraphs: [
          'Wykonujemy kontenery gastronomiczne przy zastosowaniu nowoczesnej technologii prefabrykacji. Oferowane przez nas rozwiązania sprawdzają się doskonale w funkcji barów, restauracji czy sezonowych punktów gastronomicznych.',
          'Przy projektowaniu kontenera gastronomicznego zapewniamy profesjonalne doradztwo. Zadbamy o to, by wymiary, układ i rozwiązania przestrzenne kontenera były dopasowane do jego przeznaczenia i Państwa indywidualnych oczekiwań.',
        ],
      },
      {
        heading: 'Jakie są zalety kontenerów gastronomicznych?',
        paragraphs: [
          'Podstawową zaletą kontenera gastronomicznego jest bardzo krótki czas jego budowy. Poszczególne moduły przygotowuje się w ściśle kontrolowanych warunkach fabrycznych, a następnie transportuje do docelowej lokalizacji. Można z łatwością wyposażyć go w instalacje elektryczną, grzewczą i wodną oraz zabudowę barową.',
          'Mobilność modułowych obiektów gastronomicznych sprawia, że bez trudu można przewieźć je w inne miejsce. Dostępne są kontenery o minimalistycznej formie i bardziej skomplikowanym układzie – wszystko zależy od oczekiwań Klienta.',
        ],
      },
    ],
    highlights: ['Bary i restauracje', 'Sezonowe punkty gastronomiczne', 'Zabudowa barowa', 'Instalacje: prąd, woda, ogrzewanie', 'Bardzo krótki czas budowy', 'Obiekty całoroczne i wielofunkcyjne'],
  },
  {
    slug: 'hotele-modulowe',
    title: 'Hotele modułowe',
    short: 'Szybkie w montażu, łatwe w rozbudowie – pokoje umeblowane i wyposażone już na etapie produkcji.',
    icon: IMG('hotel.png'),
    hero: IMG('turystyka.jpg'),
    gallery: ['turystyka.jpg', 'IMG_0647.jpg', 'IMG_4385.jpg', 'modulowy-pawilon-pietrowy.jpg'].map(IMG),
    lead: 'Produkujemy hotele modułowe – szybkie w montażu i łatwe w rozbudowie. Pokoje już na etapie produkcji mogą zostać w pełni umeblowane i wyposażone w sprzęt RTV i AGD.',
    sections: [
      {
        heading: 'Hotel modułowy',
        paragraphs: [
          'Zajmujemy się produkcją hoteli modułowych. Możemy zrealizować pomysł przedstawiony przez Klienta albo stworzyć projekt odpowiadający jego oczekiwaniom. Pokoje hotelowe już na etapie produkcji mogą zostać w pełni umeblowane i wyposażone w sprzęt RTV i AGD. Następnie gotowe moduły przewożone są do docelowej lokalizacji i tam montowane.',
          'Budowa hotelu modułowego trwa znacznie krócej niż obiektu stawianego tradycyjnymi metodami, a koszt inwestycji jest o wiele niższy. Hotele modułowe otwierają też ogromne możliwości rozbudowy w przyszłości – wystarczy dostawić kolejne moduły.',
        ],
      },
      {
        heading: 'Co cechuje hotele modułowe?',
        paragraphs: [
          'Nowoczesne hotele modułowe zapewniają mieszkańcom taki sam komfort użytkowania przestrzeni jak budynki wykonywane tradycyjną technologią. Mogą być użytkowane o każdej porze roku – odznaczają się świetnymi parametrami izolacyjnymi.',
          'Do produkcji hoteli modułowych wykorzystujemy przede wszystkim stal, odpowiednio zabezpieczoną przed szkodliwym wpływem czynników atmosferycznych. Tworzymy hotele modułowe na zamówienie o dowolnych wymiarach, układzie i rozwiązaniach konstrukcyjno-funkcjonalnych.',
        ],
      },
    ],
    highlights: ['Szybki montaż', 'Łatwa rozbudowa', 'Świetne parametry izolacyjne', 'Pełne wyposażenie RTV i AGD', 'Konstrukcja stalowa', 'Realizacja na zamówienie'],
  },
  {
    slug: 'pawilony-eventowe',
    title: 'Pawilony eventowe',
    short: 'Stoiska targowe, sceny, drinkbary i punkty informacyjne – mobilne i efektowne.',
    icon: IMG('inne.png'),
    hero: IMG('event.jpg'),
    gallery: ['event.jpg', 't-o-strefa-eventowa.jpg', 't-o-stoisko.jpg', '3.-projekt.jpg'].map(IMG),
    lead: 'Modułowe pawilony eventowe – estetyczne kontenery, które sprawdzają się na targach, akcjach promocyjnych i imprezach. Stoisko, fotobudka, scena, drinkbar, kasa biletowa czy punkt informacyjny.',
    sections: [
      {
        heading: 'Modułowe pawilony eventowe',
        paragraphs: [
          'Wykonywane przez nas modułowe pawilony eventowe to nowoczesne konstrukcje, które doskonale sprawdzają się na różnego rodzaju imprezach. Można zaaranżować je na stoisko targowe, wykorzystać w roli fotobudki, sceny, drinkbaru, kasy biletowej, punktu informacyjnego czy przestrzeni ekspozycyjnej.',
          'Tworzymy kontenery eventowe na zlecenie. Opracowujemy indywidualny projekt zgodny z wytycznymi Inwestora, dbając o to, by wszystkie elementy – wymiary, układ, rozwiązania konstrukcyjne, design, użyte materiały – odpowiadały konkretnym potrzebom.',
        ],
      },
      {
        heading: 'Dlaczego pawilony eventowe cieszą się popularnością?',
        paragraphs: [
          'Zaletą modułowych pawilonów eventowych jest niezwykle szybki czas wykonania – od 2 tygodni do około 3 miesięcy. Ze względu na mobilność po zakończeniu danego eventu można przenieść je w inne miejsce.',
          'Modułowe pawilony eventowe, w tym te z przeszkleniami, często spotyka się na targach branżowych i firmowych imprezach integracyjnych. Nowoczesny design naszych kontenerów sprawia, że prezentują się estetycznie i przyciągają wzrok.',
        ],
      },
    ],
    highlights: ['Stoisko targowe i scena', 'Fotobudka, drinkbar, kasa', 'Mobilność', 'Szybki czas wykonania', 'Pawilony z przeszkleniami', 'Nowoczesny design'],
  },
  {
    slug: 'mobilne-serwerownie-modulowe',
    title: 'Mobilne serwerownie',
    short: 'Kontenerowe data center – odporne na czynniki zewnętrzne, termoizolacyjne, gotowe w kilka tygodni.',
    icon: IMG('serwer.png'),
    hero: IMG('IMG_4424.jpg'),
    gallery: ['IMG_4424.jpg', 'kontener_sanitarny-e1676631137476.jpg', 'mobilne_obiekty.jpg'].map(IMG),
    lead: 'Wykonujemy mobilne serwerownie modułowe – kontenerowe data center odporne na czynniki zewnętrzne i o właściwej termoizolacyjności, łatwe w transporcie i rozbudowie.',
    sections: [
      {
        heading: 'Mobilne serwerownie modułowe',
        paragraphs: [
          'Wykonujemy mobilne serwerownie modułowe. W każdym tego typu pomieszczeniu muszą panować odpowiednie warunki, aby zapewnić ciągłość i bezpieczeństwo pracy infrastruktury informatycznej. Serwerownie powinny być odporne na negatywny wpływ czynników zewnętrznych oraz odznaczać się właściwą termoizolacyjnością. Dostarczane przez nas konstrukcje spełniają wszystkie te kryteria.',
          'Technologia modułowa umożliwia nam bardzo szybką realizację – wykonanie kontenerowego data center zajmuje o wiele mniej czasu niż budowa tradycyjnej serwerowni, zazwyczaj do kilku tygodni.',
        ],
      },
      {
        heading: 'Korzyści z wyboru mobilnej serwerowni modułowej',
        paragraphs: [
          'Za wyborem mobilnej serwerowni modułowej przemawia wiele argumentów. To ekonomiczna i praktyczna alternatywa, jeśli nie ma możliwości stworzenia takiej przestrzeni w istniejącym budynku.',
          'Mobilne serwerownie kontenerowe mogą być posadowione w różnych warunkach terenowych i bez problemu można przenieść je w inne miejsce. Są też proste w rozbudowie – ich układ modyfikuje się poprzez dodanie nowych modułów.',
        ],
      },
    ],
    highlights: ['Kontenerowe data center', 'Odporność na czynniki zewnętrzne', 'Termoizolacyjność', 'Realizacja w kilka tygodni', 'Łatwy transport', 'Prosta rozbudowa'],
  },
  {
    slug: 'kontenery-uzywane',
    title: 'Kontenery używane',
    short: 'Sprawdzone, poleasingowe konstrukcje własnej produkcji – ekonomiczna alternatywa z transportem i montażem.',
    icon: IMG('magazyn.png'),
    hero: IMG('kontener_sprzedazowy-e1676630665156.jpg'),
    gallery: ['kontener_sprzedazowy-e1676630665156.jpg', 'kontener_biurowy-e1676630577122.jpg', 'kontener_sanitarny-e1676631137476.jpg', 'wypozyczalnia_rorowerowa-e1676631046286.jpg'].map(IMG),
    lead: 'Zajmujemy się sprzedażą używanych kontenerów – solidnych i funkcjonalnych konstrukcji idealnych na sklepy, magazyny, biura, punkty gastronomiczne czy placówki oświatowe.',
    sections: [
      {
        heading: 'Kontenery używane',
        paragraphs: [
          'Zajmujemy się sprzedażą używanych kontenerów. Dostarczamy solidne i funkcjonalne konstrukcje idealne do budowy obiektów o najróżniejszym przeznaczeniu – m.in. sklepów, magazynów, biur, punktów gastronomicznych, barów, restauracji, hoteli czy placówek oświatowych.',
          'Oferujemy szeroki wybór kontenerów używanych – zróżnicowanych pod względem wielkości, parametrów technicznych oraz designu. Z przyjemnością pomagamy Klientom przy wyborze optymalnej konstrukcji.',
        ],
      },
      {
        heading: 'Dlaczego warto wybrać nasze używane kontenery?',
        paragraphs: [
          'Budynki modułowe używane z naszego asortymentu to wyłącznie nasza produkcja, zazwyczaj poleasingowa. Bardzo dobra wytrzymałość mechaniczna, szczelność i wysoka odporność na czynniki atmosferyczne to jedne z głównych zalet. Do produkcji wykorzystujemy stal odpowiednio zabezpieczoną przed korozją.',
          'Niekiedy to rozwiązanie znacznie opłacalniejsze od zamówienia nowej konstrukcji. Każdemu Klientowi zapewniamy fachowe doradztwo oraz korzystne ceny, a dodatkowo świadczymy usługi transportu oraz montażu.',
        ],
      },
    ],
    highlights: ['Własna produkcja, poleasingowe', 'Wytrzymałość mechaniczna', 'Stal zabezpieczona przed korozją', 'Korzystne ceny', 'Transport i montaż', 'Długa żywotność'],
  },
]

export const offerBySlug = Object.fromEntries(offer.map((o) => [o.slug, o]))

/* ---- About ---- */
export const about = {
  hero: { headline: 'JR Modular Systems – kim jesteśmy?', sub: 'Specjalnością firmy JR Modular Systems jest budownictwo modułowe/kontenerowe. Całą naszą działalność opieramy na nowoczesnych technologiach, rygorystycznych procedurach kontroli jakości oraz doskonałych gatunkowo materiałach.' },
  paragraphs: [
    'Specjalnością firmy JR Modular Systems jest budownictwo modułowe/kontenerowe. Całą naszą działalność opieramy na nowoczesnych technologiach, rygorystycznych procedurach kontroli jakości oraz doskonałych gatunkowo materiałach.',
    'Chociaż główna siedziba naszej firmy zlokalizowana jest w Gliwicach, obsługujemy Klientów z całej Polski, a także zagranicy.',
  ],
  whyHeading: 'Dlaczego warto nawiązać z nami współpracę?',
  why: [
    'Indywidualne podejście, profesjonalne doradztwo, przejrzyste warunki współpracy – tego mogą spodziewać się Klienci, którzy zdecydują się na skorzystanie z usług naszej firmy.',
    'Zapewniamy najwyższą jakość budynków typu modułowego.',
    'Zapewniamy serwis naszych obiektów w trakcie jak i po gwarancji, a na wszystkie zgłoszenia odpowiadamy najpóźniej do 24 godzin.',
    'Jeżeli poszukują Państwo ekspertów od budownictwa modułowego, zapraszamy do kontaktu.',
  ],
  image: IMG('biuro.jpg'),
  image2: IMG('elewacje-wentylowane-rotated.jpg'),
}

/* ---- Technology ---- */
export const technology = {
  hero: { headline: 'Technologia modułowa', sub: 'Nowa rzeczywistość budowlana na świecie. Nowoczesne budynki w oparciu o innowacyjne, autorskie metody produkcyjne.', image: IMG('mobilne_obiekty.jpg') },
  intro: [
    'Jesteśmy specjalistami od technologii modułowej. Wykonujemy nowoczesne budynki w oparciu o innowacyjne, autorskie metody produkcyjne. Nasz zespół tworzą fachowcy z różnych dziedzin – m.in. projektanci, architekci, inżynierowie, montażyści i spawacze. Dysponujemy własną rozbudowaną halą produkcyjną wyposażoną w zaawansowane technologicznie urządzenia.',
    'Dostarczane przez nas modułowe pawilony handlowe i usługowe, biurowce, placówki oświatowe i medyczne oraz inne budynki to obiekty o bardzo dobrych parametrach użytkowych. Dzięki stosowaniu technologii prefabrykowanej ich wykonanie trwa niezwykle krótko.',
    'Budownictwo prefabrykowane i modułowe to praktyczne i ekonomiczne rozwiązanie. Jako główne zalety można wskazać: krótki czas i niskie koszty budowy, mobilność, energooszczędność, optymalne parametry izolacyjne oraz możliwość ulokowania w trudnych warunkach terenowych.',
  ],
  blocks: [
    {
      heading: 'Konstrukcja',
      text: 'Stal to nasz główny materiał konstrukcyjny. Charakteryzuje się wytrzymałością, estetyką oraz – przy prawidłowym zabezpieczeniu – wyjątkową trwałością w czasie. Wykonujemy moduły spawane lub skręcane. Wszystkie konstrukcje na etapie projektowania poddawane są obliczeniom statycznym oraz modelowaniu 3D.',
      image: IMG('b2c9a186-1692-48bd-bd24-d1525175ac2e.jpg'),
    },
    {
      heading: 'Technologia modułowa',
      text: 'Większość procesu realizacji odbywa się poza miejscem przyszłej lokalizacji budynku. Moduły wykonywane są w zamkniętej hali produkcyjnej w kontrolowanych warunkach, pod ścisłą kontrolą jakości. Wielkość budynku nie jest odgórnie zdeterminowana – obiekt może stanowić zestaw modułów od kilku do nawet kilkudziesięciu sztuk.',
      image: IMG('biuro-4.jpg'),
    },
    {
      heading: 'Konstrukcja przegród',
      text: 'Do wykończeń wewnętrznych i zewnętrznych stosujemy materiały o wysokiej jakości, odpowiadające zamysłowi estetycznemu projektu. Nowoczesne okładziny elewacyjne oraz wysokiej klasy stolarka okienna sprawiają, że gotowy budynek może niczym nie różnić się od budynku wykonanego w technologii murowania.',
      image: IMG('biuro-2.jpg'),
    },
  ],
  advantages: [
    'krótszy czas realizacji nawet o 50%',
    'proces realizacji pod ścisłą kontrolą jakości',
    'łatwość rozbudowy lub zmiany lokalizacji budynku',
    'pozbycie się utrudnień związanych z klasycznym placem budowy',
  ],
}

/* ---- FAQ ---- */
export const faq = [
  { q: 'Konstrukcja stalowa vs. konstrukcja drewniana', a: 'Główna wartość budownictwa modułowego to prefabrykacja, wiąże się jednak ona z załadunkiem, transportem oraz rozładunkiem gotowych obiektów. Konstrukcja stalowa, dzięki właściwościom fizycznym stali, zapewnia znacznie większą sztywność bryły. Obiekt jest mniej narażony na uszkodzenia w trakcie transportu i montażu, a montaż jest zdecydowanie szybszy, łatwiejszy i bezpieczniejszy.' },
  { q: 'Moduły JR Modular Systems vs. kontener morski', a: 'Kontenery morskie zostały zaprojektowane do transportu międzykontynentalnego, głównie drogą morską. Ich konstrukcja jest przewymiarowana, a profile pokryte mocnymi farbami odpornymi na agresywne środowisko morskie. Moduły JR są szyte na miarę i każdorazowo obliczane pod funkcję budynku. Nasze konstrukcje mają większą elastyczność pod względem wymiarów oraz układu pomieszczeń wewnątrz.' },
  { q: 'Cena budownictwa modułowego vs. tradycyjnego', a: 'Technologia prefabrykacji poza szeregiem wartości dodanych może być nawet do 30-50% tańsza od technologii tradycyjnej.' },
  { q: 'Dlaczego budownictwo modułowe to przyszłość?', a: 'Produkcja w kontrolowanych warunkach atmosferycznych, zdecydowanie szybsza oraz pod pełną kontrolą jakości. W świetle zrównoważonego rozwoju ta technologia już wkrótce ograniczy emisję CO2 do minimum oraz umożliwi perfekcyjną gospodarkę odpadami.' },
  { q: 'Czy dach dwuspadowy jest możliwy?', a: 'Zdecydowanie tak. Wszystko opiera się o odpowiedni projekt konstrukcyjny.' },
  { q: 'Jakie są ograniczenia technologii modułowej?', a: 'Jedynym ograniczeniem jest wymiar transportowy. Tworzone są moduły nawet o wymiarach: 18 m długości × 5,5 m szerokości oraz 4,2 m wysokości. Budownictwo modułowe ma swoje realizacje nawet w drapaczach chmur sięgających 100 m wysokości (w połączeniu z technologią tradycyjną).' },
  { q: 'Ile trwa realizacja zlecenia?', a: 'Wszystko zależy od skali projektu. W przypadku prostych rozwiązań nawet do 2 tygodni. Średni czas oczekiwania to do 3 miesięcy.' },
  { q: 'Czy istnieją możliwości finansowania?', a: 'Obiekty modułowe mogą być leasingowane, co jest idealnym rozwiązaniem dla firm.' },
]

/* ---- Realizacje (mapped to real photos where available) ---- */
export const realizacje = [
  { title: 'Biuro modułowe klasy PREMIUM', place: 'Warszawa, Wilanów', img: IMG('biuro-2.jpg') },
  { title: 'Komis samochodowy z warsztatem', place: 'Bytom', img: IMG('komis-samochodowy-rotated.jpg') },
  { title: 'Sezonowy punkt gastronomiczny', place: 'Bielsko-Biała, Dębowiec', img: IMG('gastro-3.jpg') },
  { title: 'Modułowa piekarnia', place: 'Realizacja JR', img: IMG('Modulowa-piekarnia.jpg') },
  { title: 'Obiekt – strefa eventowa', place: 'Warszawa', img: IMG('event.jpg') },
  { title: 'Biuro sprzedaży domów', place: 'Warszawa, Wilanów', img: IMG('biuro-4.jpg') },
  { title: 'Modułowy pawilon piętrowy', place: 'Realizacja JR', img: IMG('modulowy-pawilon-pietrowy.jpg') },
  { title: 'Budynek gastronomiczny', place: 'Realizacja JR', img: IMG('Budynek-gastronomiczny.jpg') },
  { title: 'Wypożyczalnia sportowa', place: 'Zakopane', img: IMG('wypozyczalnia_rorowerowa-e1676631046286.jpg') },
  { title: 'Mini salon samochodowy', place: 'Bielsko-Biała', img: IMG('t-o-mini-salon.jpg') },
  { title: 'Kontener biurowy z tarasem', place: 'Warszawa', img: IMG('obiet_biurowy.jpg') },
  { title: 'Całoroczne biuro modułowe', place: 'Realizacja JR', img: IMG('caloroczne-biuro-modulowe-rotated.jpg') },
  { title: 'Kontener sprzedażowy', place: 'Realizacja JR', img: IMG('kontener_sprzedazowy-e1676630665156.jpg') },
  { title: 'Turystyka i rekreacja', place: 'Beskidy', img: IMG('turystyka.jpg') },
  { title: 'Elewacje wentylowane', place: 'Realizacja JR', img: IMG('elewacje-wentylowane-rotated.jpg') },
  { title: 'Kontenery PREMIUM', place: 'Realizacja JR', img: IMG('kontenery-premium-rotated.jpg') },
  { title: 'Obiekt mobilny', place: 'Realizacja JR', img: IMG('mobilne_obiekty.jpg') },
  { title: 'Realizacja modułowa', place: 'Realizacja JR', img: IMG('IMG_0647.jpg') },
]

export const realizacjeNames = [
  'Biuro Modułowe klasy PREMIUM — Warszawa, Wilanów', 'Modułowy Sklep Rowerowy — Bielsko-Biała, Szyndzielnia',
  'Sklep i Serwis Rowerowy — Bielsko-Biała, Błonia', 'Sklep wielobranżowy — Kraków, Ruczaj',
  'Rewitalizacja istniejącego biura — Bielsko-Biała, Wapienica', 'Pawilon modułowy multifunkcyjny — Międzybrodzie Żywieckie, Żar',
  'Sezonowy Punkt Gastronomiczny — Bielsko-Biała, Dębowiec', 'Biuro sprzedaży domów — Warszawa, Wilanów',
  'Komis samochodowy z warsztatem — Bytom', 'CareBox — punkt epidemiologiczny — Koszalin, Łódź, Starachowice',
  'Sklep Rowerowy — Szczyrk', 'Biuro sprzedaży mieszkań — Żywiec', 'Wypożyczalnia sportowa — Zakopane',
  'Bar letni — Kuźnica, woj. pomorskie', 'Bar Sezonowy — Warszawa, Wisła', 'Mini salon samochodowy — Bielsko-Biała',
  'Obiekt ekspozycyjny — Warszawa', 'Stoisko targowe — Nowy Dwór Mazowiecki', 'Obiekt gospodarczy — Konstancin',
  'MiniSalon 2 — Warszawa', 'Gastronomia na barce — Warszawa, Wisła', 'Kontener gastronomiczny — Szczecin',
  'Obiekt — Strefa eventowa — Warszawa', 'Biuro modułowe — Jastarnia', 'Sauna ogrodowa — Poznań',
  'Biuro Rowerowe — Katowice', 'Kontener biurowy z tarasem — Warszawa',
]

/* ---- clients / partner logos ---- */
export const clients = [
  'Bobby-Burger-logo.png', 'Ingka_Centres_wordmark_Blue_CMYK.png', 'logowolaparkrect2x.png',
  'PKL_.png', 'real.png', 'energy.jpg', 'dl.png', 'pamir-bike-.png', 'bikebuilders.jpeg',
  'pod_debowcem.png', 'skiturowebeskidy.png',
].map(IMG)

/* ---- navigation ---- */
export const nav = [
  { label: 'O nas', to: '/o-nas' },
  {
    label: 'Oferta', to: '/oferta',
    children: offer.map((o) => ({ label: o.title, to: `/oferta/${o.slug}`, icon: o.icon, short: o.short })),
  },
  { label: 'Technologia', to: '/technologia' },
  { label: 'Realizacje', to: '/realizacje' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Kontakt', to: '/kontakt' },
]
