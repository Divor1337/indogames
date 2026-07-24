// Основные значения страницы. Менять ссылку, код и бонус нужно здесь.
const CONFIG = {
  gameUrl: "https://lkmn.cc/6728",
  promoCode: "PIXEL4",
  bonus: "+500%"
};

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "subid",
  "sub1",
  "sub2",
  "sub3",
  "sub4",
  "sub5",
  "click_id",
  "fbclid",
  "gclid",
  "ttclid"
]);

function withCurrentQuery(baseUrl) {
  const destination = new URL(baseUrl, window.location.href);
  const incomingParams = new URLSearchParams(window.location.search);

  incomingParams.forEach((value, key) => {
    if (TRACKING_PARAMS.has(key.toLowerCase()) && !destination.searchParams.has(key)) {
      destination.searchParams.append(key, value);
    }
  });

  return destination.toString();
}

document.querySelectorAll("[data-game-link]").forEach((link) => {
  link.href = withCurrentQuery(CONFIG.gameUrl);
});

document.querySelectorAll("[data-promo-code]").forEach((element) => {
  element.textContent = CONFIG.promoCode;
});

document.querySelectorAll("[data-bonus]").forEach((element) => {
  element.textContent = CONFIG.bonus;
});

const copyToast = document.getElementById("copyToast");
const copyButton = document.querySelector("[data-copy-code]");
const copyLabel = document.querySelector("[data-copy-label]");
let toastTimer;

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.inset = "0 auto auto -9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyPromoCode() {
  let copied = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(CONFIG.promoCode);
      copied = true;
    } else {
      copied = fallbackCopy(CONFIG.promoCode);
    }
  } catch {
    try {
      copied = fallbackCopy(CONFIG.promoCode);
    } catch {
      copied = false;
    }
  }

  copyButton.classList.toggle("is-copied", copied);
  copyButton.classList.toggle("has-error", !copied);
  copyLabel.textContent = copied ? "COPIADO ✓" : "REINTENTAR";
  copyToast.textContent = copied
    ? `Código ${CONFIG.promoCode} copiado`
    : "No se pudo copiar. Mantén pulsado el código.";
  copyToast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    copyButton.classList.remove("is-copied");
    copyButton.classList.remove("has-error");
    copyLabel.textContent = "COPIAR";
    copyToast.classList.remove("is-visible");
    copyToast.textContent = "";
  }, 2200);
}

copyButton.addEventListener("click", copyPromoCode);
