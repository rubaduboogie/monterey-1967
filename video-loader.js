(() => {
  const sources = {
    hero: "assets/hero-web.mp4",
    promo: "assets/promo-web.mp4"
  };

  function attachPromo(video) {
    if (!video) return;
    video.src = sources.promo;
    video.preload = "none";
    video.load();
  }

  function attachHero(video) {
    if (!video) return;

    video.poster = "assets/hero-poster.jpg";
    video.src = sources.hero;
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.preload = "auto";

    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "hero-play-toggle";
    playButton.textContent = "▶ ВКЛЮЧИТЬ ДВИЖЕНИЕ";
    playButton.hidden = true;
    video.parentElement?.appendChild(playButton);

    const showFallback = () => {
      if (video.paused) playButton.hidden = false;
    };

    const tryPlay = async () => {
      try {
        await video.play();
        playButton.hidden = true;
      } catch (_) {
        showFallback();
      }
    };

    playButton.addEventListener("click", tryPlay);
    video.addEventListener("playing", () => { playButton.hidden = true; });
    video.addEventListener("loadeddata", tryPlay, { once: true });
    video.addEventListener("canplay", tryPlay, { once: true });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) tryPlay();
    });

    setTimeout(showFallback, 1600);
    video.load();
    tryPlay();
  }

  attachHero(document.querySelector('[data-chunked-video="hero"]'));

  const promo = document.querySelector('[data-chunked-video="promo"]');
  if (promo) {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          attachPromo(promo);
        }
      }, { rootMargin: "500px 0px" });
      observer.observe(promo);
    } else {
      attachPromo(promo);
    }
  }
})();