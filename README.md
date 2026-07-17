# Calendario raccolta rifiuti

Sito statico bilingue per mostrare due calendari pubblici Google Calendar con
FullCalendar 6.1.21. Non richiede npm, framework, bundler o una fase di build.

## Configurazione

1. Rendi pubblici i due calendari da Google Calendar. Nelle impostazioni di
   condivisione, gli eventi devono essere visibili e non limitati al solo stato
   libero/occupato.
2. In Google Cloud crea o seleziona un progetto, abilita **Google Calendar API**
   e genera una chiave API per applicazioni web.
3. Recupera l'ID di ciascun calendario dalla sezione **Integra calendario**
   delle impostazioni di Google Calendar.
4. Apri `assets/config.js` e sostituisci i tre valori segnaposto:

   ```js
   window.CALENDAR_CONFIG = Object.freeze({
     GOOGLE_CALENDAR_API_KEY: "la-tua-chiave-api",
     GOOGLE_CALENDAR_ID_IT: "calendario-italiano@group.calendar.google.com",
     GOOGLE_CALENDAR_ID_EN: "calendario-inglese@group.calendar.google.com"
   });
   ```

La chiave API è necessariamente visibile nel browser perché il sito è statico.
In Google Cloud è quindi consigliato limitarla alla sola Google Calendar API e
agli HTTP referrer usati dal sito, per esempio
`https://username.github.io/calendario-rifiuti/*`.

## Prova in locale

È preferibile usare un piccolo server HTTP invece di aprire i file con
`file://`. Dalla cartella del progetto, se Python è installato, esegui:

```text
python -m http.server 8000
```

Poi visita `http://localhost:8000/`. La pagina iniziale reindirizza a `/it/`;
la versione inglese è disponibile in `/en/`.

Per autorizzare la prova locale con una chiave limitata per referrer, aggiungi
temporaneamente `http://localhost:8000/*` alle restrizioni della chiave.

## Pubblicazione su GitHub Pages

1. Crea un repository GitHub, per esempio `calendario-rifiuti`, e carica questi
   file nel branch `main`.
2. Nel repository apri **Settings → Pages**.
3. In **Build and deployment**, scegli **Deploy from a branch**.
4. Seleziona il branch `main`, la cartella `/(root)` e salva.
5. Attendi il completamento del deployment e apri l'indirizzo indicato da
   GitHub, per esempio
   `https://username.github.io/calendario-rifiuti/`.

Tutti i collegamenti interni e gli asset usano percorsi relativi: il sito
funziona quindi anche quando GitHub Pages lo pubblica sotto il nome del
repository, senza dover impostare un URL base.

## Integrazione Divi con altezza automatica

Il calendario invia alla pagina contenitore soltanto la propria altezza, senza
includere configurazione o dati degli eventi. Il messaggio viene inviato solo
quando l'iframe è incorporato su `trailverdeeilmare.it`, con o senza `www`.

Incolla il blocco seguente in un modulo **Codice** della pagina italiana di
Divi:

```html
<div class="waste-calendar-embed">
  <iframe
    id="waste-calendar-frame-it"
    class="waste-calendar-frame"
    src="https://massimilianopal.github.io/calendario-rifiuti/it/"
    title="Calendario raccolta rifiuti"
    loading="lazy"
    scrolling="no"
  ></iframe>
</div>

<style>
  .waste-calendar-embed {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .waste-calendar-frame {
    display: block;
    width: 100%;
    height: 700px;
    border: 0;
    overflow: hidden;
  }
</style>

<script>
  (function () {
    "use strict";

    var iframe = document.getElementById("waste-calendar-frame-it");

    if (!iframe) {
      return;
    }

    window.addEventListener("message", function (event) {
      if (
        event.origin !== "https://massimilianopal.github.io" ||
        event.source !== iframe.contentWindow ||
        !event.data ||
        event.data.type !== "waste-calendar:resize"
      ) {
        return;
      }

      var height = Number(event.data.height);

      if (!Number.isFinite(height) || height < 200 || height > 10000) {
        return;
      }

      iframe.style.height = Math.ceil(height) + "px";
    });
  })();
</script>
```

Incolla questo secondo blocco nel modulo **Codice** della pagina inglese di
Divi:

```html
<div class="waste-calendar-embed">
  <iframe
    id="waste-calendar-frame-en"
    class="waste-calendar-frame"
    src="https://massimilianopal.github.io/calendario-rifiuti/en/"
    title="Waste collection calendar"
    loading="lazy"
    scrolling="no"
  ></iframe>
</div>

<style>
  .waste-calendar-embed {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .waste-calendar-frame {
    display: block;
    width: 100%;
    height: 700px;
    border: 0;
    overflow: hidden;
  }
</style>

<script>
  (function () {
    "use strict";

    var iframe = document.getElementById("waste-calendar-frame-en");

    if (!iframe) {
      return;
    }

    window.addEventListener("message", function (event) {
      if (
        event.origin !== "https://massimilianopal.github.io" ||
        event.source !== iframe.contentWindow ||
        !event.data ||
        event.data.type !== "waste-calendar:resize"
      ) {
        return;
      }

      var height = Number(event.data.height);

      if (!Number.isFinite(height) || height < 200 || height > 10000) {
        return;
      }

      iframe.style.height = Math.ceil(height) + "px";
    });
  })();
</script>
```

L'altezza iniziale di `700px` è soltanto un fallback: dopo il caricamento viene
sostituita automaticamente con l'altezza reale del calendario. Non servono
regole diverse per desktop e mobile.

## Struttura

```text
index.html          Reindirizzamento alla versione italiana
it/index.html       Pagina italiana
en/index.html       Pagina inglese
assets/app.js       Logica condivisa e inizializzazione FullCalendar
assets/config.js    Chiave API e ID dei calendari
assets/style.css    Stili condivisi mobile-first
README.md           Configurazione e pubblicazione
```

Sotto i 700 px il calendario usa la vista mensile a elenco (`listMonth`); da
700 px in su usa la griglia mensile (`dayGridMonth`).
