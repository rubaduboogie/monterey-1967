(() => {
  const sources = {
    hero: "assets/hero-web.mp4",
    promo: "assets/promo-web.mp4"
  };

  const hero = document.querySelector('[data-chunked-video="hero"]');
  const heroTitle = document.querySelector('.hero h1');

  if (heroTitle) {
    heroTitle.innerHTML = '<span class="hero-title-main">ПОПАДИ В ЭПИЗОД 3</span><span class="hero-title-accent">ПРО ДЖИМИ ХЕНДРИКСА</span>';
  }

  const style = document.createElement('style');
  style.textContent = `
    .hero-title-main,.hero-title-accent{display:block}
    .hero-title-accent{color:var(--orange);text-shadow:2px 2px 0 rgba(20,16,12,.96),0 2px 18px rgba(0,0,0,.48)}
    .hero h1{text-shadow:0 2px 18px rgba(0,0,0,.34)}
    .hero-shade{background:linear-gradient(0deg,rgba(20,16,12,.91),rgba(20,16,12,.27) 72%,rgba(20,16,12,.18))}
    .hero-play-toggle{position:absolute;z-index:4;right:18px;bottom:18px;border:2px solid var(--paper);background:rgba(20,16,12,.78);color:var(--paper);font:700 13px Oswald,sans-serif;letter-spacing:.1em;padding:10px 13px;box-shadow:3px 3px 0 var(--orange)}
    .hero-play-toggle[hidden]{display:none}
    @media(max-width:600px){
      .hero h1{font-size:clamp(42px,13.5vw,60px);line-height:.91;letter-spacing:-.025em}
      .hero-title-accent{margin-top:.06em}
      .hero-copy{padding-top:40px}
    }
  `;
  document.head.appendChild(style);

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
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = "auto";

    const playButton = document.createElement('button');
    playButton.type = 'button';
    playButton.className = 'hero-play-toggle';
    playButton.textContent = '▶ ВКЛЮЧИТЬ ДВИЖЕНИЕ';
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

    playButton.addEventListener('click', tryPlay);
    video.addEventListener('playing', () => { playButton.hidden = true; });
    video.addEventListener('loadeddata', tryPlay, { once: true });
    video.addEventListener('canplay', tryPlay, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
    setTimeout(showFallback, 1600);
    video.load();
    tryPlay();
  }

  attachHero(hero);

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
