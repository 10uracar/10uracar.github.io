const SHEET_ID = '1NlWIQ7GL5nwAcAUkcUhnhAH5p0LSMRzkGXYuuurT7Js';
const MIN_DETAILED_N = 10;

function doGet(e) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const result = buildResults_(data);
  const callback = e && e.parameter ? e.parameter.prefix : '';
  const payload = JSON.stringify(result);

  if (callback && /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${payload});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}

function buildResults_(data) {
  if (!data || data.length <= 1) {
    return {
      ok: true,
      participants: 0,
      avgProductivity: null,
      timeSavingPct: null,
      timeItems: [],
      productivityItems: [],
      distributions: {},
      message: 'Henüz yanıt bulunmuyor.',
      updatedAt: new Date().toISOString()
    };
  }

  const headers = data[0].map(String);
  const rows = data.slice(1).filter(row =>
    row.some(cell => String(cell).trim() !== '')
  );

  const q = {
    age: findColumn_(headers, 'Yaşınız nedir'),
    gender: findColumn_(headers, 'Cinsiyetiniz nedir'),
    class: findColumn_(headers, 'Öğrenim gördüğünüz sınıf'),
    faculty: findColumn_(headers, 'Hangi fakülte'),
    gpa: findColumn_(headers, 'Genel not ortalamanız'),
    studyHours: findColumn_(headers, 'Bir haftada ders, ödev, araştırma ve sınav hazırlığı dahil'),
    aiTools: findColumn_(headers, 'Hangi üretken yapay zekâ araçlarını kullanıyorsunuz'),
    frequency: findColumn_(headers, 'Üretken yapay zekâ araçlarını ne sıklıkta kullanıyorsunuz'),
    duration: findColumn_(headers, 'Üretken yapay zekâ araçlarını yaklaşık ne kadar süredir kullanıyorsunuz'),
    academicShare: findColumn_(headers, 'Üretken yapay zekâ kullanımınızın yaklaşık ne kadarı akademik amaçlıdır'),
    purposes: findColumn_(headers, 'Üretken yapay zekâyı akademik amaçlarla hangi faaliyetlerde kullanıyorsunuz'),
    usageStyle: findColumn_(headers, 'Üretken yapay zekâ kullanırken çoğunlukla hangi kullanım biçimini tercih ediyorsunuz')
  };

  const timeQuestions = [
    'Üretken yapay zekâ kullanmak akademik görevleri tamamlamak için harcadığım süreyi azaltıyor',
    'Üretken yapay zekâ kullanmak bilgi araştırmak için harcadığım zamanı azaltıyor',
    'Üretken yapay zekâ kullanmak yazma ve düzenleme işlemlerini daha kısa sürede tamamlamamı sağlıyor',
    'Üretken yapay zekâ sayesinde aynı akademik görevi daha kısa sürede tamamlayabiliyorum',
    'Üretken yapay zekâ sayesinde kazandığım zamanı başka akademik faaliyetlere ayırabiliyorum'
  ];

  const productivityQuestions = [
    'Üretken yapay zekâ kullanımı akademik çalışmalarımı daha verimli yapmamı sağlıyor',
    'Üretken yapay zekâ kullanımı ders konularını anlamamı kolaylaştırıyor',
    'Üretken yapay zekâ kullanımı akademik çalışmalarımın kalitesini artırıyor',
    'Üretken yapay zekâ kullanarak aynı sürede daha fazla akademik iş yapabiliyorum',
    'Üretken yapay zekâ kullanımı akademik görevlerimi yerine getirirken zamanımı daha etkin kullanmamı sağlıyor',
    'Üretken yapay zekâ kullanımı akademik çalışmalardaki gereksiz zaman kayıplarını azaltıyor',
    'Üretken yapay zekâ kullanımı araştırma ve bilgiye ulaşma sürecimi kolaylaştırıyor',
    'Üretken yapay zekâ kullanımı akademik hedeflerime ulaşmamı kolaylaştırıyor',
    'Genel olarak üretken yapay zekâ kullanımının akademik verimliliğimi artırdığını düşünüyorum'
  ];

  const timeItems = aggregateLikertItems_(rows, headers, timeQuestions);
  const productivityItems = aggregateLikertItems_(rows, headers, productivityQuestions);
  const generalProductivityIndex = qIndexSafe_(headers, productivityQuestions[productivityQuestions.length - 1]);
  const generalProductivityScores = [];
  if (generalProductivityIndex !== -1) {
    rows.forEach(row => {
      const score = likertScore_(row[generalProductivityIndex]);
      if (score !== null) generalProductivityScores.push(score);
    });
  }
  const avgProductivity = generalProductivityScores.length
    ? Number((sum_(generalProductivityScores) / generalProductivityScores.length).toFixed(2))
    : null;
  const timeSavingPct = percent_(rows, qIndexSafe_(headers, timeQuestions[0]), [4, 5]);

  const distributions = {
    age: distribution_(rows, q.age),
    gender: distribution_(rows, q.gender),
    class: distribution_(rows, q.class),
    faculty: distribution_(rows, q.faculty),
    gpa: distribution_(rows, q.gpa),
    studyHours: distribution_(rows, q.studyHours),
    tools: multiDistribution_(rows, q.aiTools),
    frequency: distribution_(rows, q.frequency),
    duration: distribution_(rows, q.duration),
    academicShare: distribution_(rows, q.academicShare),
    purposes: multiDistribution_(rows, q.purposes),
    usageStyle: distribution_(rows, q.usageStyle)
  };

  // Gizlilik: alt grup dağılımlarını yeterli örneklem olmadan yayımlama.
  if (rows.length < MIN_DETAILED_N) {
    delete distributions.age;
    delete distributions.gender;
    delete distributions.class;
    delete distributions.faculty;
    delete distributions.gpa;
    delete distributions.studyHours;
  }

  return {
    ok: true,
    participants: rows.length,
    avgProductivity: avgProductivity,
    timeSavingPct: timeSavingPct,
    timeItems: timeItems,
    productivityItems: productivityItems,
    distributions: distributions,
    message: 'Toplu araştırma sonuçları başarıyla yüklendi.',
    updatedAt: new Date().toISOString()
  };
}

function aggregateLikertItems_(rows, headers, questions) {
  return questions.map(question => {
    const index = qIndexSafe_(headers, question);
    const scores = [];
    if (index !== -1) {
      rows.forEach(row => {
        const score = likertScore_(row[index]);
        if (score !== null) scores.push(score);
      });
    }
    return {
      label: question,
      average: scores.length ? Number((sum_(scores) / scores.length).toFixed(2)) : 0,
      count: scores.length
    };
  }).filter(item => item.count > 0);
}

function qIndexSafe_(headers, question) {
  const target = normalize_(question);
  return headers.findIndex(header => normalize_(header).includes(target));
}

function distribution_(rows, index) {
  if (index === -1 || index == null) return [];
  const map = {};
  rows.forEach(row => {
    const value = clean_(row[index]);
    if (!value) return;
    map[value] = (map[value] || 0) + 1;
  });
  return Object.keys(map).map(label => ({ label: label, count: map[label] }));
}

function multiDistribution_(rows, index) {
  if (index === -1 || index == null) return [];
  const map = {};
  rows.forEach(row => {
    const value = clean_(row[index]);
    if (!value) return;
    splitMulti_(value).forEach(item => {
      if (!item) return;
      map[item] = (map[item] || 0) + 1;
    });
  });
  return Object.keys(map).map(label => ({ label: label, count: map[label] }));
}

function splitMulti_(value) {
  return String(value)
    .split(/\s*,\s*|\s*;\s*|\n+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function percent_(rows, index, acceptedScores) {
  if (index === -1 || index == null) return null;
  let count = 0;
  let accepted = 0;
  rows.forEach(row => {
    const score = likertScore_(row[index]);
    if (score !== null) {
      count++;
      if (acceptedScores.indexOf(score) !== -1) accepted++;
    }
  });
  return count ? Number((accepted / count * 100).toFixed(1)) : null;
}

function likertScore_(value) {
  const text = String(value).toLowerCase().trim();
  if (!text) return null;
  if (text.includes('kesinlikle katılmıyorum')) return 1;
  if (text.includes('katılmıyorum') && !text.includes('kesinlikle')) return 2;
  if (text.includes('kararsızım')) return 3;
  if (text.includes('katılıyorum') && !text.includes('kesinlikle')) return 4;
  if (text.includes('kesinlikle katılıyorum')) return 5;
  const number = Number(text.replace(',', '.'));
  return number >= 1 && number <= 5 ? number : null;
}

function average_(values) {
  if (!values.length) return null;
  return Number((sum_(values) / values.length).toFixed(2));
}

function sum_(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0);
}

function findColumn_(headers, question) {
  const target = normalize_(question);
  return headers.findIndex(header => normalize_(header).includes(target));
}

function normalize_(text) {
  return String(text).toLowerCase().trim().replace(/\s+/g, ' ');
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}
