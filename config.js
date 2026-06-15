/* ============================================================
   TappyBird — общий конфиг сайта (клиентская часть)
   Пароль админки и хранилище — на сервере (config.php / api.php).
   ============================================================ */
(function () {
  window.SITE_CONFIG = {
    /* Адрес бэкенда (на том же хостинге). Обычно менять не нужно. */
    apiUrl: "api.php",

    /* --- Видео-инструкция по устройствам ----------------------------
       Поддерживаются два типа ссылок:
         1) Прямой файл .mp4  → красивый плеер прямо на сайте
            (сейчас стоят прямые ссылки Cloudinary)
         2) YouTube / Streamable / Vimeo / Cloudinary-player → iframe
       Если пусто/не распозналось — появится кнопка «СМОТРЕТЬ ВИДЕО»
       с запасной ссылкой ниже.                                        */
    videoPc: "https://res.cloudinary.com/dgo3slzic/video/upload/pc_yn0jcr.mp4",        // версия для ПК
    videoMobile: "https://res.cloudinary.com/dgo3slzic/video/upload/mobile_ewm7a5.mp4", // версия для телефона

    /* Запасные ссылки «открыть в новой вкладке». */
    videoPcFallback: "https://player.cloudinary.com/embed/?cloud_name=dgo3slzic&public_id=pc_yn0jcr",
    videoMobileFallback: "https://player.cloudinary.com/embed/?cloud_name=dgo3slzic&public_id=mobile_ewm7a5",

    /* Кнопки лендинга по умолчанию — показываются мгновенно и как
       запасной вариант, если сервер недоступен. Реальный список
       (редактируемый из админки) приходит из api.php.                 */
    defaultButtons: [
      { id: "play",        label: "ИГРАТЬ НА САЙТЕ",   url: "https://lbgame777.xyz/3m4Fjp", variant: "primary" },
      { id: "instruction", label: "ЧИТАТЬ ИНСТРУКЦИЮ", url: "instruction.html",             variant: "secondary" }
    ]
  };
})();
