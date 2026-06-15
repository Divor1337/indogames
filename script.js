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

  function asDirectVideo(url) {
    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url) ? url : null;
  }

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

    if (!frame) return;

    const isMobile = isMobileDevice();
    if (label) {
      label.textContent = isMobile ? "모바일 버전" : "PC 버전";
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
    startButton.innerHTML = '<img src="hero.png" alt="" aria-hidden="true"><span>시청 시작</span>';

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

  function renderEmbed(frame, src) {
    frame.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.className = "tutorial-video tutorial-embed";
    iframe.src = src;
    iframe.setAttribute("title", "비디오 설명서");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    iframe.addEventListener("load", trackWatch, { once: true });
    frame.appendChild(iframe);
  }

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
      link.textContent = "동영상 보기";
      link.addEventListener("click", trackWatch);
      wrap.appendChild(link);
    } else {
      const note = document.createElement("p");
      note.className = "video-fallback-note";
      note.textContent = "동영상이 곧 제공됩니다";
      wrap.appendChild(note);
    }
    frame.appendChild(wrap);
  }

  function setupCoins() {
    const birdWraps = document.querySelectorAll(".hero-bird-wrap");
    if (!birdWraps.length || prefersReducedMotion) return;

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
  setupCoins();
})();