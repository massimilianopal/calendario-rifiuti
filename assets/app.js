(function () {
  "use strict";

  var translations = {
    it: {
      loading: "Caricamento degli eventi…",
      loadError:
        "Non è stato possibile caricare gli eventi. Controlla la connessione e riprova tra poco.",
      configError:
        "Il calendario non è ancora configurato. Inserisci la chiave API e gli ID dei calendari in assets/config.js.",
      libraryError:
        "Il calendario non è disponibile in questo momento. Ricarica la pagina per riprovare.",
      noEvents: "Nessuna raccolta prevista per questo periodo."
    },
    en: {
      loading: "Loading events…",
      loadError:
        "Events could not be loaded. Check your connection and try again shortly.",
      configError:
        "The calendar has not been configured yet. Add the API key and calendar IDs to assets/config.js.",
      libraryError:
        "The calendar is not available right now. Reload the page to try again.",
      noEvents: "No collections are scheduled for this period."
    }
  };

  var placeholderValues = [
    "GOOGLE_CALENDAR_API_KEY",
    "GOOGLE_CALENDAR_ID_IT",
    "GOOGLE_CALENDAR_ID_EN"
  ];

  function hasRealValue(value) {
    return (
      typeof value === "string" &&
      value.trim() !== "" &&
      placeholderValues.indexOf(value.trim()) === -1
    );
  }

  function getPageSettings() {
    var pageLanguage = (document.documentElement.lang || "en").toLowerCase();
    var language = pageLanguage.indexOf("it") === 0 ? "it" : "en";

    return {
      language: language,
      calendarLocale: language === "it" ? "it" : "en-gb",
      calendarIdKey:
        language === "it" ? "GOOGLE_CALENDAR_ID_IT" : "GOOGLE_CALENDAR_ID_EN"
    };
  }

  function initialiseCalendar() {
    var calendarElement = document.getElementById("calendar");
    var errorElement = document.getElementById("calendar-error");
    var statusElement = document.getElementById("calendar-status");

    if (!calendarElement || !errorElement || !statusElement) {
      return;
    }

    var settings = getPageSettings();
    var messages = translations[settings.language];
    var config = window.CALENDAR_CONFIG || {};

    function showError(message) {
      errorElement.textContent = message;
      errorElement.hidden = false;
    }

    function hideError() {
      errorElement.textContent = "";
      errorElement.hidden = true;
    }

    function setLoading(isLoading) {
      statusElement.textContent = isLoading ? messages.loading : "";
      statusElement.hidden = !isLoading;
    }

    if (typeof window.FullCalendar === "undefined") {
      showError(messages.libraryError);
      return;
    }

    var apiKey = config.GOOGLE_CALENDAR_API_KEY;
    var calendarId = config[settings.calendarIdKey];

    if (!hasRealValue(apiKey) || !hasRealValue(calendarId)) {
      showError(messages.configError);
      return;
    }

    var narrowScreen = window.matchMedia("(max-width: 699px)");
    var calendar = new window.FullCalendar.Calendar(calendarElement, {
      initialView: narrowScreen.matches ? "listMonth" : "dayGridMonth",
      locale: settings.calendarLocale,
      googleCalendarApiKey: apiKey,
      events: {
        googleCalendarId: calendarId,
        success: function (events) {
          hideError();
          return events;
        },
        failure: function (error) {
          setLoading(false);
          showError(messages.loadError);
          console.error("Google Calendar event loading failed:", error);
        }
      },
      headerToolbar: {
        left: "title",
        center: "",
        right: "prev today next"
      },
      height: "auto",
      fixedWeekCount: false,
      dayMaxEventRows: 3,
      displayEventTime: true,
      displayEventEnd: false,
      eventTimeFormat:
        settings.language === "it"
          ? { hour: "2-digit", minute: "2-digit", hour12: false }
          : { hour: "numeric", minute: "2-digit" },
      noEventsContent: messages.noEvents,
      loading: setLoading,
      eventClick: function (info) {
        info.jsEvent.preventDefault();
      }
    });

    calendar.render();

    function updateResponsiveView(mediaQuery) {
      var requiredView = mediaQuery.matches ? "listMonth" : "dayGridMonth";

      if (calendar.view.type !== requiredView) {
        calendar.changeView(requiredView);
      }
    }

    if (typeof narrowScreen.addEventListener === "function") {
      narrowScreen.addEventListener("change", updateResponsiveView);
    } else {
      narrowScreen.addListener(updateResponsiveView);
    }
  }

  document.addEventListener("DOMContentLoaded", initialiseCalendar);
})();
