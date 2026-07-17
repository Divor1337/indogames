// Все изменяемые данные собраны здесь.
const CONFIG = {
  gameUrl: "https://lkmn.cc/6728",
  registerUrl: "https://lkmn.cc/6728",
  promoCode: "PIXEL4",
  bonus: "+500%"
};

function withCurrentQuery(baseUrl) {
  const url = new URL(baseUrl, window.location.href);
  const currentParams = new URLSearchParams(window.location.search);

  currentParams.forEach((value, key) => {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  });

  return url.toString();
}

document.querySelectorAll("[data-game-link]").forEach((link) => {
  link.href = withCurrentQuery(CONFIG.gameUrl);
});

document.querySelectorAll("[data-register-link]").forEach((link) => {
  link.href = withCurrentQuery(CONFIG.registerUrl);
});

document.querySelectorAll("[data-promo-code]").forEach((element) => {
  element.textContent = CONFIG.promoCode;
});

document.querySelectorAll("[data-bonus]").forEach((element) => {
  element.textContent = CONFIG.bonus;
});

const guideDialog = document.getElementById("guideDialog");
const guideOpeners = document.querySelectorAll("[data-open-guide]");
const guideClosers = document.querySelectorAll("[data-close-guide]");

guideOpeners.forEach((button) => {
  button.addEventListener("click", () => {
    if (typeof guideDialog.showModal === "function") {
      guideDialog.showModal();
    } else {
      guideDialog.setAttribute("open", "");
    }
  });
});

guideClosers.forEach((button) => {
  button.addEventListener("click", () => guideDialog.close());
});

guideDialog.addEventListener("click", (event) => {
  if (event.target === guideDialog) guideDialog.close();
});

const copyToast = document.getElementById("copyToast");
let toastTimer;

async function copyPromoCode() {
  try {
    await navigator.clipboard.writeText(CONFIG.promoCode);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = CONFIG.promoCode;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }

  document.querySelectorAll("[data-copy-label]").forEach((label) => {
    label.textContent = "복사됨 ✓";
  });

  copyToast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    copyToast.classList.remove("is-visible");
    document.querySelectorAll("[data-copy-label]").forEach((label) => {
      label.textContent = label.closest(".modal-promo") ? "복사하기" : "복사";
    });
  }, 2200);
}

document.querySelectorAll("[data-copy-code]").forEach((button) => {
  button.addEventListener("click", copyPromoCode);
});

document.querySelectorAll(".instruction-media img").forEach((image) => {
  const media = image.closest(".instruction-media");

  if (image.complete && image.naturalWidth > 0) {
    media.classList.add("has-image");
  }

  image.addEventListener("load", () => media.classList.add("has-image"));
  image.addEventListener("error", () => media.classList.remove("has-image"));
});
