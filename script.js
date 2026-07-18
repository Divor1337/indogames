const CONFIG = {
  gameUrl: "https://lkmn.cc/6728",
  promoCode: "PIXEL4",
  bonus: "+500%"
};

function appendCurrentQuery(baseUrl) {
  const destination = new URL(baseUrl, window.location.href);
  const currentParams = new URLSearchParams(window.location.search);

  currentParams.forEach((value, key) => {
    if (!destination.searchParams.has(key)) destination.searchParams.set(key, value);
  });

  return destination.toString();
}

document.querySelectorAll("[data-game-link]").forEach((link) => {
  link.href = appendCurrentQuery(CONFIG.gameUrl);
  link.rel = "nofollow sponsored noopener noreferrer";
});

document.querySelectorAll("[data-promo-code]").forEach((element) => {
  element.textContent = CONFIG.promoCode;
});

document.querySelectorAll("[data-bonus]").forEach((element) => {
  element.textContent = CONFIG.bonus;
});

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = new Date().getFullYear();
});

const bonusDialog = document.getElementById("bonusDialog");

document.querySelectorAll("[data-open-bonus]").forEach((button) => {
  button.addEventListener("click", () => {
    if (typeof bonusDialog.showModal === "function") bonusDialog.showModal();
    else bonusDialog.setAttribute("open", "");
  });
});

document.querySelectorAll("[data-close-bonus]").forEach((button) => {
  button.addEventListener("click", () => bonusDialog.close());
});

bonusDialog.addEventListener("click", (event) => {
  if (event.target === bonusDialog) bonusDialog.close();
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
    label.textContent = "Copiado ✓";
  });

  copyToast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    copyToast.classList.remove("is-visible");
    document.querySelectorAll("[data-copy-label]").forEach((label) => {
      label.textContent = "Copiar";
    });
  }, 2200);
}

document.querySelectorAll("[data-copy-code]").forEach((button) => {
  button.addEventListener("click", copyPromoCode);
});

document.querySelectorAll(".game-media img").forEach((image) => {
  image.addEventListener("error", () => {
    image.closest(".game-media").classList.add("media-error");
    image.remove();
  });
});
