(() => {
  const manifests = {
    hero: [
      "assets/chunks/hero-000.txt"
    ],
    promo: [
      "assets/chunks/promo-000.txt",
      "assets/chunks/promo-001.txt",
      "assets/chunks/promo-002.txt"
    ]
  };

  async function buildVideoUrl(parts) {
    const chunks = await Promise.all(parts.map(async (path) => {
      const response = await fetch(path, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Не удалось загрузить ${path}`);
      return (await response.text()).trim();
    }));
    const binary = atob(chunks.join(''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
  }

  async function hydrate(video, key) {
    try {
      video.dataset.loading = 'true';
      const url = await buildVideoUrl(manifests[key]);
      video.src = url;
      video.load();
      video.dataset.loading = 'false';
      video.dataset.ready = 'true';
      if (key === 'hero') {
        try { await video.play(); } catch (_) {}
      }
    } catch (error) {
      console.error('Ошибка загрузки видео', error);
      video.dataset.loading = 'false';
      video.dataset.ready = 'false';
    }
  }

  const hero = document.querySelector('[data-chunked-video="hero"]');
  if (hero) hydrate(hero, 'hero');

  const promo = document.querySelector('[data-chunked-video="promo"]');
  if (promo) {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          hydrate(promo, 'promo');
        }
      }, { rootMargin: '500px 0px' });
      observer.observe(promo);
    } else {
      hydrate(promo, 'promo');
    }
  }
})();
