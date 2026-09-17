(() => {
  const base = "https://raw.githubusercontent.com/rubaduboogie/monterey-1967/main/assets";
  const sources = {
    hero: `${base}/hero-web.mp4`,
    promo: `${base}/promo-web.mp4`
  };

  function attach(video, key) {
    const src = sources[key];
    if (!video || !src) return;
    video.src = src;
    video.preload = key === "hero" ? "metadata" : "none";
    video.load();

    if (key === "hero") {
      video.addEventListener("canplay", () => {
        video.play().catch(() => {});
      }, { once: true });
    }
  }

  attach(document.querySelector('[data-chunked-video="hero"]'), "hero");

  const promo = document.querySelector('[data-chunked-video="promo"]');
  if (promo) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          attach(promo, "promo");
        }
      }, { rootMargin: "500px 0px" });
      observer.observe(promo);
    } else {
      attach(promo, "promo");
    }
  }
})();
