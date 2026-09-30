/* Onur Acar — personal-site ile aynı tema/renk tercihlerini kullanır. */
(function () {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const colorToggle = document.getElementById('color-toggle');
  const colorPanel = document.getElementById('color-panel');
  const colorOptions = document.querySelectorAll('.color-option');
  const colorThemes = ['galaxy', 'gold', 'mint', 'sky'];

  function applyTheme(theme) {
    const isLight = theme === 'light';
    body.classList.toggle('light-mode', isLight);
    if (themeToggle) themeToggle.textContent = isLight ? '☀' : '☾';
  }

  function applyColor(color) {
    const selected = colorThemes.includes(color) ? color : 'galaxy';
    body.classList.remove('color-galaxy', 'color-gold', 'color-mint', 'color-sky');
    body.classList.add(`color-${selected}`);

    colorOptions.forEach(option => {
      const active = option.dataset.color === selected;
      option.classList.toggle('active', active);
      option.setAttribute('aria-pressed', String(active));
    });
  }

  function closeColorPanel() {
    if (!colorPanel || !colorToggle) return;
    colorPanel.classList.remove('is-open');
    colorPanel.setAttribute('aria-hidden', 'true');
    colorToggle.setAttribute('aria-expanded', 'false');
  }

  function openColorPanel() {
    if (!colorPanel || !colorToggle) return;
    colorPanel.classList.add('is-open');
    colorPanel.setAttribute('aria-hidden', 'false');
    colorToggle.setAttribute('aria-expanded', 'true');
  }

  // Yerel görselleri animasyonla göster; kısmi/progressive yükleme görünmez.
  document.querySelectorAll('img.image-reveal').forEach(img => {
    const reveal = () => img.classList.add('is-loaded');
    if (img.complete) {
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {}).finally(reveal);
      } else {
        reveal();
      }
    } else {
      img.addEventListener('load', reveal, { once: true });
      img.addEventListener('error', reveal, { once: true });
    }
  });

  applyTheme(localStorage.getItem('theme') || 'dark');
  applyColor(localStorage.getItem('color') || 'galaxy');

  themeToggle?.addEventListener('click', () => {
    const next = body.classList.contains('light-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });

  colorToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    if (colorPanel?.classList.contains('is-open')) closeColorPanel();
    else openColorPanel();
  });

  colorOptions.forEach(option => {
    option.addEventListener('click', (event) => {
      event.stopPropagation();
      const color = option.dataset.color || 'galaxy';
      localStorage.setItem('color', color);
      applyColor(color);
      closeColorPanel();
    });
  });

  document.addEventListener('click', event => {
    if (colorPanel?.classList.contains('is-open') && !colorPanel.contains(event.target) && event.target !== colorToggle) {
      closeColorPanel();
    }
  });
})();
