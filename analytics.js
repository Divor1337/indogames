(function () {
  function detectMobile() {
    var ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (window.innerWidth || 9999) <= 820;
  }

  window.Analytics = {
    isMobile: detectMobile,
    click: function(key) {},
    init: function() {}
  };
})();