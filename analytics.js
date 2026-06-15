/* ============================================================
   TappyBird — сбор статистики (шлёт события на свой api.php).
   Подключается на index.html и instruction.html.
   Уникальность визитов считает СЕРВЕР (по IP+User-Agent),
   поэтому здесь localStorage уже не нужен.
   ============================================================ */
(function () {
  var API = "api.php";

  /* ---------- определение устройства (одно на весь сайт) ---------- */
  function detectMobile() {
    var ua = navigator.userAgent || "";
    var platform = navigator.platform || "";
    var maxTouch = navigator.maxTouchPoints || 0;
    var vw = Math.min(
      window.innerWidth || 9999,
      window.visualViewport ? window.visualViewport.width : 9999
    );
    var smallSide = Math.min(screen.width || 9999, screen.height || 9999);
    var touchFirst = window.matchMedia("(pointer: coarse)").matches || maxTouch > 1;
    var narrow = vw <= 820;
    var mobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    var appleTouch = /MacIntel|Macintosh/i.test(platform) && maxTouch > 1;
    var phoneSized = touchFirst && smallSide <= 820;
    return mobileUA || appleTouch || narrow || phoneSized;
  }

  /* ---------- отправка события ---------- */
  function qs(params) {
    return Object.keys(params).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]);
    }).join("&");
  }

  function track(params) {
    try {
      var img = new Image();
      img.src = API + "?action=track&" + qs(params) + "&t=" + Date.now();
    } catch (e) { /* статистика не должна влиять на сайт */ }
  }

  function trackBeacon(params) {
    try {
      var url = API + "?action=track&" + qs(params);
      if (navigator.sendBeacon) navigator.sendBeacon(url);
      else track(params);
    } catch (e) {}
  }

  function click(key) {
    if (key) track({ e: "click", k: key });
  }

  /* ---------- учёт времени на сайте ---------- */
  function startTimeTracking() {
    var beat = window.setInterval(function () {
      if (document.visibilityState === "visible") track({ e: "time" });
    }, 30000);

    function onLeave() {
      if (window.__tbLeft) return;
      window.__tbLeft = true;
      window.clearInterval(beat);
      var total = Math.round((Date.now() - (window.__tbStart || Date.now())) / 1000);
      var b = total < 30 ? "0_30" : total < 120 ? "30_120" : total < 300 ? "120_300" : "300_plus";
      trackBeacon({ e: "dur", b: b });
    }
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
  }

  /* ---------- клики по элементам [data-track] (через делегирование,
       чтобы ловить и динамически добавленные кнопки) ---------- */
  function bindClicks() {
    document.addEventListener("click", function (ev) {
      var el = ev.target.closest ? ev.target.closest("[data-track]") : null;
      if (el) click(el.getAttribute("data-track"));
    }, true);
  }

  /* ---------- инициализация публичных страниц ---------- */
  function init() {
    window.__tbStart = Date.now();
    var page = document.body.getAttribute("data-page") || "index";
    track({ e: "visit", page: page, device: detectMobile() ? "mobile" : "pc" });
    bindClicks();
    startTimeTracking();
  }

  window.Analytics = {
    isMobile: detectMobile,
    click: click,
    init: init
  };

  if (document.body && document.body.hasAttribute("data-page")) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.body && document.body.hasAttribute("data-page")) init();
    });
  }
})();
