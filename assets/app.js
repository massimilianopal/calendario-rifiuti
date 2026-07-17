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
      noCollection: "Nessuna raccolta",
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
      noCollection: "No collection",
      noEvents: "No collections are scheduled for this period."
    }
  };

  var placeholderValues = [
    "GOOGLE_CALENDAR_API_KEY",
    "GOOGLE_CALENDAR_ID_IT",
    "GOOGLE_CALENDAR_ID_EN"
  ];

  var allowedParentOrigins = [
    "https://www.trailverdeeilmare.it",
    "https://trailverdeeilmare.it"
  ];

  function getTrustedParentOrigin() {
    if (window.parent === window || !document.referrer) {
      return null;
    }

    try {
      var parentOrigin = new window.URL(document.referrer).origin;
      return allowedParentOrigins.indexOf(parentOrigin) !== -1
        ? parentOrigin
        : null;
    } catch (error) {
      return null;
    }
  }

  function createIframeResizeMessenger(pageShell) {
    var parentOrigin = getTrustedParentOrigin();
    var lastSentHeight = null;
    var resizeScheduled = false;

    function measureAndSendHeight() {
      resizeScheduled = false;

      if (!parentOrigin || !pageShell) {
        return;
      }

      var measuredHeight =
        Math.ceil(pageShell.getBoundingClientRect().height) + 2;

      if (
        !Number.isFinite(measuredHeight) ||
        measuredHeight <= 0 ||
        measuredHeight === lastSentHeight
      ) {
        return;
      }

      lastSentHeight = measuredHeight;
      window.parent.postMessage(
        {
          type: "waste-calendar:resize",
          height: measuredHeight
        },
        parentOrigin
      );
    }

    function requestResize() {
      if (!parentOrigin || !pageShell || resizeScheduled) {
        return;
      }

      resizeScheduled = true;

      if (typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(measureAndSendHeight);
      } else {
        window.setTimeout(measureAndSendHeight, 16);
      }
    }

    if (parentOrigin && pageShell) {
      if (typeof window.ResizeObserver === "function") {
        new window.ResizeObserver(requestResize).observe(pageShell);
      }

      window.addEventListener("resize", requestResize);

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(requestResize, function () {});
      }

      requestResize();
    }

    return {
      request: requestResize
    };
  }

  function isSameLocalDate(firstDate, secondDate) {
    return (
      firstDate.getFullYear() === secondDate.getFullYear() &&
      firstDate.getMonth() === secondDate.getMonth() &&
      firstDate.getDate() === secondDate.getDate()
    );
  }

  function removeEventUrl(eventData) {
    var transformedEvent = Object.assign({}, eventData);
    delete transformedEvent.url;
    return transformedEvent;
  }

  function makeEventInformational(info) {
    var eventElement = info.el;
    var elementsToClean = [eventElement];
    var descendantAnchors = eventElement.querySelectorAll("a");

    Array.prototype.push.apply(elementsToClean, descendantAnchors);

    elementsToClean.forEach(function (element) {
      [
        "href",
        "target",
        "tabindex",
        "rel",
        "role",
        "download",
        "ping",
        "referrerpolicy",
        "draggable",
        "aria-haspopup",
        "aria-expanded"
      ].forEach(function (attributeName) {
        element.removeAttribute(attributeName);
      });
    });
  }

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
    var pageShell = document.querySelector(".page-shell");
    var iframeResizeMessenger = createIframeResizeMessenger(pageShell);

    function requestIframeResize() {
      iframeResizeMessenger.request();
    }

    if (!calendarElement || !errorElement || !statusElement) {
      requestIframeResize();
      return;
    }

    var settings = getPageSettings();
    var messages = translations[settings.language];
    var config = window.CALENDAR_CONFIG || {};

    function showError(message) {
      errorElement.textContent = message;
      errorElement.hidden = false;
      requestIframeResize();
    }

    function hideError() {
      errorElement.textContent = "";
      errorElement.hidden = true;
      requestIframeResize();
    }

    function setLoading(isLoading) {
      statusElement.textContent = isLoading ? messages.loading : "";
      statusElement.hidden = !isLoading;
      requestIframeResize();
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
    var noCollectionEventSource = null;
    var calendar = new window.FullCalendar.Calendar(calendarElement, {
      initialView: narrowScreen.matches ? "listMonth" : "dayGridMonth",
      locale: settings.calendarLocale,
      googleCalendarApiKey: apiKey,
      events: {
        googleCalendarId: calendarId,
        success: function (events) {
          hideError();
          requestIframeResize();
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
      displayEventTime: false,
      displayEventEnd: false,
      noEventsContent: messages.noEvents,
      loading: setLoading,
      eventDataTransform: removeEventUrl,
      eventDidMount: makeEventInformational,
      dayHeaderClassNames: function (info) {
        return calendar.view.type === "listMonth" &&
          isSameLocalDate(info.date, new Date())
          ? ["is-current-list-day"]
          : [];
      },
      eventsSet: requestIframeResize,
      datesSet: requestIframeResize,
      eventClick: function (info) {
        if (!info.jsEvent) {
          return;
        }

        info.jsEvent.preventDefault();

        if (typeof info.jsEvent.stopPropagation === "function") {
          info.jsEvent.stopPropagation();
        }
      }
    });

    function updateResponsiveView(mediaQuery) {
      var isMobile = mediaQuery.matches;
      var requiredView = isMobile ? "listMonth" : "dayGridMonth";

      if (isMobile) {
        if (calendar.view.type !== requiredView) {
          calendar.changeView(requiredView);
        }

        if (!noCollectionEventSource) {
          noCollectionEventSource = calendar.addEventSource([
            {
              title: messages.noCollection,
              daysOfWeek: [6],
              allDay: true,
              classNames: ["no-collection-event"],
              extendedProps: { noCollection: true }
            }
          ]);
        }
      } else {
        if (noCollectionEventSource) {
          noCollectionEventSource.remove();
          noCollectionEventSource = null;
        }

        if (calendar.view.type !== requiredView) {
          calendar.changeView(requiredView);
        }
      }

      requestIframeResize();
    }

    calendar.render();
    requestIframeResize();
    updateResponsiveView(narrowScreen);

    if (typeof narrowScreen.addEventListener === "function") {
      narrowScreen.addEventListener("change", updateResponsiveView);
    } else {
      narrowScreen.addListener(updateResponsiveView);
    }
  }

  document.addEventListener("DOMContentLoaded", initialiseCalendar);
})();
