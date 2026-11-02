/* ToolNova consent runtime.
   Sets Google Consent Mode v2 defaults *before* the AdSense tag loads, then
   loads AdSense, then shows our banner until the visitor makes a choice.
   Ad storage stays denied until explicit consent, so no advertising cookies
   are written on the first visit. */
(function () {
  'use strict';

  var STORE_KEY = 'tn-consent';
  var VERSION = 1;
  var ADSENSE_CLIENT = 'ca-pub-1455389319625277';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function readChoice() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION) return null;
      return parsed;
    } catch (e) { return null; }
  }

  function choiceToSignals(choice) {
    return {
      ad_storage: choice.ads ? 'granted' : 'denied',
      ad_user_data: choice.ads ? 'granted' : 'denied',
      ad_personalization: choice.personalize ? 'granted' : 'denied',
      analytics_storage: choice.analytics ? 'granted' : 'denied'
    };
  }

  function applySignals(choice) {
    gtag('consent', 'update', choiceToSignals(choice));
  }

  /* Defaults must be queued before any Google tag executes. */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  gtag('set', 'ads_data_redaction', true);

  var stored = readChoice();
  if (stored) applySignals(stored);

  /* AdSense tag. Loaded regardless of choice so Google can verify the site and
     so Consent Mode governs whether cookies/personalization are used. */
  (function loadAdSense() {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + ADSENSE_CLIENT;
    s.crossOrigin = 'anonymous';
    document.head.appendChild(s);
  })();

  function save(choice) {
    var record = {
      version: VERSION,
      ads: !!choice.ads,
      personalize: !!choice.personalize,
      analytics: !!choice.analytics,
      updated: new Date().toISOString()
    };
    try { localStorage.setItem(STORE_KEY, JSON.stringify(record)); } catch (e) { /* private mode */ }
    applySignals(record);
    hideBanner();
    document.dispatchEvent(new CustomEvent('tn:consent', { detail: record }));
  }

  var banner = null;
  var prefs = null;

  function showBanner(openPrefs) {
    if (!banner) return;
    banner.hidden = false;
    document.body.classList.add('consent-open');
    if (openPrefs) togglePrefs(true);
    var first = banner.querySelector('[data-consent-action]');
    if (first) first.focus({ preventScroll: true });
  }

  function hideBanner() {
    if (!banner) return;
    banner.hidden = true;
    document.body.classList.remove('consent-open');
  }

  function togglePrefs(open) {
    if (!prefs) return;
    var shouldOpen = open === undefined ? prefs.hidden : open;
    prefs.hidden = !shouldOpen;
    banner.querySelector('[data-consent-preferences-toggle]').setAttribute('aria-expanded', String(shouldOpen));
    if (shouldOpen) {
      var current = readChoice();
      var ads = prefs.querySelector('[data-pref="ads"]');
      var personalize = prefs.querySelector('[data-pref="personalize"]');
      var analytics = prefs.querySelector('[data-pref="analytics"]');
      if (ads) ads.checked = current ? current.ads : false;
      if (personalize) personalize.checked = current ? current.personalize : false;
      if (analytics) analytics.checked = current ? current.analytics : false;
    }
  }

  function init() {
    banner = document.querySelector('[data-consent-banner]');
    prefs = banner ? banner.querySelector('[data-consent-preferences]') : null;

    if (banner) {
      banner.addEventListener('click', function (event) {
        var action = event.target.closest('[data-consent-action]');
        if (action) {
          var kind = action.getAttribute('data-consent-action');
          if (kind === 'accept') save({ ads: true, personalize: true, analytics: true });
          else if (kind === 'reject') save({ ads: false, personalize: false, analytics: false });
          else if (kind === 'save') {
            save({
              ads: prefs.querySelector('[data-pref="ads"]').checked,
              personalize: prefs.querySelector('[data-pref="personalize"]').checked,
              analytics: prefs.querySelector('[data-pref="analytics"]').checked
            });
          } else if (kind === 'preferences') {
            togglePrefs();
          }
          return;
        }
        var toggle = event.target.closest('[data-consent-preferences-toggle]');
        if (toggle) togglePrefs();
      });

      if (!readChoice()) showBanner(false);
    }

    document.querySelectorAll('[data-consent-open]').forEach(function (btn) {
      btn.addEventListener('click', function () { showBanner(true); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.tnConsent = {
    open: function () { showBanner(true); },
    get: readChoice,
    set: save
  };
})();
