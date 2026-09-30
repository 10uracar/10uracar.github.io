(function () {
  const cfg = window.ANKET_CONFIG || {};
  const endpoint = cfg.RESULTS_ENDPOINT;
  const status = document.getElementById('source-status');

  function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function apply(data) {
    set('participants', data.participants ?? '—');
    set('productivity', data.avgProductivity != null ? `${Number(data.avgProductivity).toFixed(2)} / 5` : '—');
    set('time-saving', data.timeSavingPct != null ? `%${Number(data.timeSavingPct).toFixed(0)}` : '—');
    set('updated', data.updatedAt ? new Date(data.updatedAt).toLocaleString('tr-TR') : '—');
    set('message', data.message || 'Toplu araştırma sonuçları başarıyla yüklendi.');
    if (status) status.textContent = 'Canlı veri';
  }

  function load() {
    if (!endpoint) {
      if (status) status.textContent = 'Kurulum bekleniyor';
      return;
    }

    const callbackName = `onurResearch_${Date.now()}`;
    const script = document.createElement('script');
    let timer = null;

    window[callbackName] = (data) => {
      cleanup();
      if (!data || data.ok === false) {
        if (status) status.textContent = 'Veri alınamadı';
        return;
      }
      apply(data);
    };

    function cleanup() {
      if (timer) window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }

    script.src = `${endpoint}${endpoint.includes('?') ? '&' : '?'}prefix=${encodeURIComponent(callbackName)}`;
    script.async = true;
    script.onerror = () => {
      cleanup();
      if (status) status.textContent = 'Veri alınamadı';
    };

    timer = window.setTimeout(() => {
      cleanup();
      if (status) status.textContent = 'Zaman aşımı';
    }, 10000);

    document.head.appendChild(script);
  }

  load();
  window.setInterval(load, 60_000);
})();
