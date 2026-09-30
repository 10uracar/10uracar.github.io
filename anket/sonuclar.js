(function () {
  const cfg = window.ANKET_CONFIG || {};
  const endpoint = cfg.RESULTS_ENDPOINT;
  const status = document.getElementById('source-status');
  const MIN_DETAILED_N = 10;

  const labels = {
    age: 'Yaş',
    gender: 'Cinsiyet',
    class: 'Sınıf',
    faculty: 'Fakülte',
    gpa: 'Not ortalaması',
    studyHours: 'Haftalık akademik çalışma'
  };

  function set(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setStatus(text, live = false) {
    if (!status) return;
    status.innerHTML = live ? '<span class="status-dot"></span> ' + text : text;
  }

  function apply(data) {
    set('participants', data.participants ?? '—');
    set('productivity', data.avgProductivity != null ? `${Number(data.avgProductivity).toFixed(2)} / 5` : '—');
    set('time-saving', data.timeSavingPct != null ? `%${Number(data.timeSavingPct).toFixed(0)}` : '—');
    set('updated', data.updatedAt ? formatDate(data.updatedAt) : '—');
    set('message', data.message || 'Toplu araştırma sonuçları başarıyla yüklendi.');

    set('top-tool', topLabel(data.distributions?.tools));
    set('top-frequency', topLabel(data.distributions?.frequency));
    set('top-academic-share', topLabel(data.distributions?.academicShare));

    const hasEnoughDetail = Number(data.participants || 0) >= MIN_DETAILED_N;
    renderDemographics(data);
    renderUsage(data, hasEnoughDetail);
    renderLikert('time-chart', hasEnoughDetail ? data.timeItems : null, 'time');
    renderLikert('productivity-chart', hasEnoughDetail ? data.productivityItems : null, 'productivity');
    renderBars('purpose-chart', hasEnoughDetail ? data.distributions?.purposes : null);
    renderBars('style-chart', hasEnoughDetail ? data.distributions?.usageStyle : null);

    const score = data.avgProductivity != null ? Number(data.avgProductivity) : null;
    set('score-ring-value', score != null ? score.toFixed(2) : '—');
    const ring = document.getElementById('score-ring');
    if (ring && score != null) {
      ring.style.setProperty('--score', `${Math.max(0, Math.min(100, score / 5 * 100))}%`);
    }

    setStatus('CANLI VERİ', true);
  }

  function formatDate(value) {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function topLabel(distribution) {
    if (!distribution?.length) return '—';
    return distribution.reduce((best, item) => item.count > best.count ? item : best, distribution[0]).label;
  }

  function renderDemographics(data) {
    const host = document.getElementById('demographic-distributions');
    if (!host) return;

    if ((data.participants || 0) < MIN_DETAILED_N) {
      host.innerHTML = `
        <div class="locked-card">
          <div class="lock-icon">⌁</div>
          <strong>Alt grup dağılımları henüz gösterilmiyor</strong>
          <p>Bu bölüm en az ${MIN_DETAILED_N} katılımcıdan sonra otomatik olarak açılacaktır.</p>
        </div>`;
      return;
    }

    host.innerHTML = '';
    const items = [
      ['age', data.distributions?.age],
      ['gender', data.distributions?.gender],
      ['class', data.distributions?.class],
      ['faculty', data.distributions?.faculty],
      ['gpa', data.distributions?.gpa],
      ['studyHours', data.distributions?.studyHours]
    ];

    for (const [key, dist] of items) {
      host.insertAdjacentHTML('beforeend', renderDistributionCard(labels[key], dist));
    }
  }

  function renderUsage(data, hasEnoughDetail) {
    const host = document.getElementById('usage-distributions');
    if (!host) return;

    if (!hasEnoughDetail) {
      host.innerHTML = `
        <div class="locked-card compact-lock">
          <strong>Kullanım dağılımları ${MIN_DETAILED_N} yanıt sonrasında yayınlanacak.</strong>
          <p>Şu an yalnızca genel, bireysel yanıtları açığa çıkarmayan göstergeler gösteriliyor.</p>
        </div>`;
      return;
    }

    const dist = [
      ['Kullanılan araçlar', data.distributions?.tools],
      ['Kullanım sıklığı', data.distributions?.frequency],
      ['Kullanım süresi', data.distributions?.duration],
      ['Akademik kullanım payı', data.distributions?.academicShare]
    ];

    host.innerHTML = dist.map(([title, values]) => renderDistributionCard(title, values)).join('');
  }

  function renderDistributionCard(title, values) {
    if (!values?.length) {
      return `<div class="distribution-card"><div class="distribution-title">${escapeHtml(title)}</div><div class="empty-line">Veri yok</div></div>`;
    }

    const total = values.reduce((sum, item) => sum + Number(item.count || 0), 0) || 1;
    const rows = values
      .slice()
      .sort((a, b) => b.count - a.count)
      .map(item => {
        const pct = Number((item.count / total * 100).toFixed(1));
        return `<div class="bar-row"><div class="bar-label"><span>${escapeHtml(item.label)}</span><strong>${pct}%</strong></div><div class="bar-track"><span style="width:${pct}%"></span></div></div>`;
      }).join('');

    return `<div class="distribution-card"><div class="distribution-title">${escapeHtml(title)}</div>${rows}</div>`;
  }

  function renderBars(id, values) {
    const host = document.getElementById(id);
    if (!host) return;
    if (!values?.length) {
      host.innerHTML = '<div class="empty-state">Henüz yeterli veri yok.</div>';
      return;
    }

    const max = Math.max(...values.map(item => Number(item.count || 0)), 1);
    host.innerHTML = values
      .slice()
      .sort((a, b) => b.count - a.count)
      .map(item => {
        const width = Number(item.count || 0) / max * 100;
        return `<div class="chart-row"><div class="chart-meta"><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></div><div class="chart-track"><span style="width:${width}%"></span></div></div>`;
      }).join('');
  }

  function renderLikert(id, items, kind) {
    const host = document.getElementById(id);
    if (!host) return;
    if (!items?.length) {
      host.innerHTML = '<div class="empty-state">Henüz yeterli veri yok.</div>';
      return;
    }

    host.innerHTML = items.map(item => {
      const score = Number(item.average || 0);
      const width = Math.max(0, Math.min(100, score / 5 * 100));
      return `<div class="chart-row likert-row ${kind}">
        <div class="chart-meta"><span>${escapeHtml(item.label)}</span><strong>${score.toFixed(2)} / 5</strong></div>
        <div class="chart-track"><span style="width:${width}%"></span></div>
      </div>`;
    }).join('');
  }

  function load() {
    if (!endpoint) {
      setStatus('KURULUM BEKLENİYOR');
      return;
    }

    const callbackName = `onurResearch_${Date.now()}`;
    const script = document.createElement('script');
    let timer = null;

    window[callbackName] = (data) => {
      cleanup();
      if (!data || data.ok === false) {
        setStatus('VERİ ALINAMADI');
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
      setStatus('VERİ ALINAMADI');
    };

    timer = window.setTimeout(() => {
      cleanup();
      setStatus('ZAMAN AŞIMI');
    }, 10000);

    document.head.appendChild(script);
  }

  load();
  window.setInterval(load, 60_000);
})();
