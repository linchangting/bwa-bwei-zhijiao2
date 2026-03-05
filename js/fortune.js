const Fortune = (() => {
  let fortunes = [];
  const $ = id => document.getElementById(id);

  const GRADE_MAP = {
    '上上': { cls: 'g-up2', text: '上上籤' },
    '上':   { cls: 'g-up',  text: '上籤' },
    '中':   { cls: 'g-mid', text: '中籤' },
    '下':   { cls: 'g-down', text: '下籤' },
    '下下': { cls: 'g-down2', text: '下下籤' }
  };

  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  function todaySeed() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function getTodayFortune() {
    const saved = Storage.getTodayFortuneId();
    if (saved !== null) return fortunes.find(f => f.id === saved) || fortunes[0];

    const rand = seededRandom(todaySeed());
    const idx = Math.floor(rand() * fortunes.length);
    const fortune = fortunes[idx];
    Storage.setTodayFortuneId(fortune.id);
    return fortune;
  }

  function render(fortune) {
    const g = GRADE_MAP[fortune.grade] || GRADE_MAP['中'];
    $('fortuneNumber').textContent = `第 ${fortune.id} 籤`;
    $('fortuneTitle').textContent = fortune.title;
    $('fortuneSeal').textContent = fortune.grade;
    $('fortuneGrade').textContent = g.text;
    $('fortuneGrade').className = 'fortune-grade ' + g.cls;
    $('fortunePoem').textContent = fortune.poem;
    $('fortuneInterpretation').textContent = fortune.interpretation;

    const tagsEl = $('fortuneTags');
    tagsEl.innerHTML = '';
    (fortune.tags || []).forEach(tag => {
      const span = document.createElement('span');
      span.className = 'fortune-tag';
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
  }

  function renderHistory() {
    const list = $('historyList');
    const history = Storage.getHistory();

    if (history.length === 0) {
      list.innerHTML = '<p class="empty-hint">還沒有記錄，去擲筊吧～</p>';
      return;
    }

    list.innerHTML = '';
    history.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      const time = new Date(item.time);
      const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      const isHoly = item.holy;
      div.innerHTML = `
        <div class="history-info">
          <div class="history-q">${escHtml(item.question || '心中默念')}</div>
          <div class="history-time">${timeStr} · ${item.mode === 'choose' ? '選擇模式' : '問事模式'}</div>
        </div>
        <div class="history-result ${isHoly ? 'holy' : 'unholy'}">${item.result}</div>
      `;
      list.appendChild(div);
    });
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  return {
    async init() {
      try {
        const resp = await fetch('data/fortunes.json');
        fortunes = await resp.json();
      } catch {
        fortunes = [{ id: 1, grade: '中', title: '平安是福', poem: '平安是福\n知足常樂', interpretation: '順其自然，平安就好。', tags: ['綜合'] }];
      }

      render(getTodayFortune());

      $('btnClearHistory').addEventListener('click', () => {
        if (confirm('確定清除所有記錄？')) {
          Storage.clearHistory();
          renderHistory();
        }
      });
    },

    refresh() {
      if (fortunes.length) render(getTodayFortune());
    },

    refreshHistory: renderHistory,

    getFortunes: () => fortunes
  };
})();
