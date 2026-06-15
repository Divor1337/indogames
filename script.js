(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CONFIG = window.SITE_CONFIG || {};

  function isMobileDevice() {
    if (window.Analytics && typeof window.Analytics.isMobile === "function") {
      return window.Analytics.isMobile();
    }
    const ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (window.innerWidth || 9999) <= 820;
  }

  function trackWatch() {
    if (window.Analytics && typeof window.Analytics.click === "function") {
      window.Analytics.click("watch_video");
    }
  }

  /* Прямой видеофайл? (.mp4/.webm/.ogg/.mov, в т.ч. с ?query) */
  function asDirectVideo(url) {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) ? url : null;
  }

  /* Ссылка YouTube/Streamable/Vimeo → URL для встраивания через iframe. */
  function asEmbedUrl(url) {
    let m;
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i))) {
      return "https://www.youtube.com/embed/" + m[1];
    }
    if ((m = url.match(/streamable\.com\/(?:e\/)?([\w-]+)/i))) {
      return "https://streamable.com/e/" + m[1];
    }
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i))) {
      return "https://player.vimeo.com/video/" + m[1];
    }
    return null;
  }

  function setupTutorialVideo() {
    const frame = document.querySelector(".tutorial-video-frame");
    const label = document.querySelector("[data-device-label]");

    if (!frame) {
      return;
    }

    const isMobile = isMobileDevice();
    if (label) {
      label.textContent = isMobile ? "ВЕРСИЯ ДЛЯ ТЕЛЕФОНА" : "ВЕРСИЯ ДЛЯ ПК";
    }

    const primary = (isMobile ? CONFIG.videoMobile : CONFIG.videoPc) || "";
    const fallback = (isMobile ? CONFIG.videoMobileFallback : CONFIG.videoPcFallback) || "";

    const directSrc = asDirectVideo(primary);
    const embedSrc = directSrc ? null : asEmbedUrl(primary);

    if (directSrc) {
      renderNativeVideo(frame, directSrc, isMobile);
    } else if (embedSrc) {
      renderEmbed(frame, embedSrc);
    } else {
      renderFallbackButton(frame, fallback);
    }
  }

  /* --- Нативный плеер (прямой .mp4) — со стартовой кнопкой как раньше --- */
  function renderNativeVideo(frame, src, isMobile) {
    frame.innerHTML = "";

    const video = document.createElement("video");
    video.className = "tutorial-video";
    video.setAttribute("controls", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("preload", "metadata");
    video.setAttribute("poster", "hero.png");
    video.src = src;
    video.dataset.device = isMobile ? "mobile" : "pc";

    const startButton = document.createElement("button");
    startButton.className = "video-start-button";
    startButton.type = "button";
    startButton.innerHTML =
      '<img src="hero.png" alt="" aria-hidden="true"><span>НАЧАТЬ ПРОСМОТР</span>';

    frame.appendChild(video);
    frame.appendChild(startButton);
    video.load();

    const hideStartButton = () => startButton.classList.add("is-hidden");

    startButton.addEventListener("click", () => {
      trackWatch();
      hideStartButton();
      video.play().catch(() => startButton.classList.remove("is-hidden"));
    });

    video.addEventListener("play", hideStartButton);
    video.addEventListener("pause", () => {
      if (video.currentTime === 0 || video.ended) {
        startButton.classList.remove("is-hidden");
      }
    });
    video.addEventListener("ended", () => startButton.classList.remove("is-hidden"));
  }

  /* --- Встроенный плеер (YouTube/Streamable/Vimeo) --- */
  function renderEmbed(frame, src) {
    frame.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.className = "tutorial-video tutorial-embed";
    iframe.src = src;
    iframe.setAttribute("title", "Видео-инструкция TappyBird");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute(
      "allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    );
    iframe.setAttribute("allowfullscreen", "");
    iframe.addEventListener("load", trackWatch, { once: true });
    frame.appendChild(iframe);
  }

  /* --- Фоллбэк: кнопка «Смотреть видео» (открывает ссылку в новой вкладке) --- */
  function renderFallbackButton(frame, url) {
    frame.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "video-fallback";

    if (url) {
      const link = document.createElement("a");
      link.className = "action-button action-primary";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "СМОТРЕТЬ ВИДЕО";
      link.addEventListener("click", trackWatch);
      wrap.appendChild(link);
    } else {
      const note = document.createElement("p");
      note.className = "video-fallback-note";
      note.textContent = "Видео скоро появится";
      wrap.appendChild(note);
    }

    frame.appendChild(wrap);
  }

  /* ---------- Кнопки лендинга (приходят из api.php, редактируются в админке) ---------- */
  function isSafeUrl(url) {
    return !/^\s*(javascript|data|vbscript)\s*:/i.test(url || "");
  }

  function buildButton(b) {
    const a = document.createElement("a");
    a.className = "action-button " + (b.variant === "secondary" ? "action-secondary" : "action-primary");
    a.href = isSafeUrl(b.url) ? b.url : "#";
    a.textContent = b.label;
    a.setAttribute("data-track", "btn_" + b.id);
    return a;
  }

  function renderActionRow(row, buttons) {
    row.innerHTML = "";
    buttons.forEach((b) => row.appendChild(buildButton(b)));
  }

  function setupButtons() {
    const row = document.querySelector(".action-row");
    const cta = document.querySelector("[data-cta-primary]");
    if (!row && !cta) {
      return;
    }

    const defaults = CONFIG.defaultButtons || [];
    if (row) {
      renderActionRow(row, defaults); // мгновенный показ, потом обновим с сервера
    }

    fetch((CONFIG.apiUrl || "api.php") + "?action=buttons", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const list = d && Array.isArray(d.buttons) && d.buttons.length ? d.buttons : defaults;
        if (row) {
          renderActionRow(row, list);
        }
        if (cta) {
          const primary = list.filter((b) => b.variant !== "secondary")[0] || list[0];
          if (primary) {
            cta.href = isSafeUrl(primary.url) ? primary.url : "#";
            cta.textContent = primary.label;
          }
        }
      })
      .catch(() => { /* остаются дефолтные кнопки */ });
  }

  function setupCoins() {
    const birdWraps = document.querySelectorAll(".hero-bird-wrap");

    if (!birdWraps.length || prefersReducedMotion) {
      return;
    }

    const random = (min, max) => Math.random() * (max - min) + min;
    const randomInt = (min, max) => Math.round(random(min, max));

    function createCoin(wrap) {
      const coin = document.createElement("span");
      const drift = Math.random() > 0.5 ? 1 : -1;
      const size = randomInt(16, 30);
      const duration = randomInt(1450, 2750);
      const startX = randomInt(-16, 18);
      const startY = randomInt(-16, 8);
      const midX = randomInt(20, 70) * drift;
      const endX = randomInt(8, 96) * drift;
      const midY = randomInt(34, 78);
      const endY = randomInt(118, 190);
      const rotateStart = randomInt(-45, 45);
      const rotateMid = randomInt(120, 300) * drift;
      const rotateEnd = randomInt(420, 760) * drift;

      coin.className = "coin";
      coin.setAttribute("aria-hidden", "true");
      coin.style.setProperty("--coin-size", `${size}px`);
      coin.style.setProperty("--coin-duration", `${duration}ms`);
      coin.style.setProperty("--coin-start-x", `${startX}px`);
      coin.style.setProperty("--coin-start-y", `${startY}px`);
      coin.style.setProperty("--coin-mid-x", `${midX}px`);
      coin.style.setProperty("--coin-mid-y", `${midY}px`);
      coin.style.setProperty("--coin-end-x", `${endX}px`);
      coin.style.setProperty("--coin-end-y", `${endY}px`);
      coin.style.setProperty("--coin-rotate-start", `${rotateStart}deg`);
      coin.style.setProperty("--coin-rotate-mid", `${rotateMid}deg`);
      coin.style.setProperty("--coin-rotate-end", `${rotateEnd}deg`);
      coin.style.setProperty("--coin-scale", random(0.8, 1.16).toFixed(2));

      wrap.appendChild(coin);
      coin.addEventListener("animationend", () => coin.remove(), { once: true });
    }

    function scheduleCoin(wrap) {
      window.setTimeout(() => {
        createCoin(wrap);

        if (Math.random() > 0.62) {
          window.setTimeout(() => createCoin(wrap), randomInt(80, 210));
        }

        scheduleCoin(wrap);
      }, randomInt(260, 880));
    }

    birdWraps.forEach((wrap) => {
      window.setTimeout(() => createCoin(wrap), randomInt(180, 520));
      scheduleCoin(wrap);
    });
  }

  setupTutorialVideo();
  setupButtons();
  setupCoins();
})();
