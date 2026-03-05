const App = (() => {
  const $ = id => document.getElementById(id);
  let toastTimer = null;

  const SHOP_ITEMS = [
    { id: 'rethrow', icon: '🔄', name: '再擲一次', desc: '額外獲得一次擲筊機會', cost: 50, action: 'rethrow' },
    { id: 'golden_blocks', icon: '✨', name: '金色杯筊', desc: '解鎖金色杯筊外觀', cost: 500, action: 'unlock', once: true },
    { id: 'lotus_bg', icon: '🪷', name: '蓮花背景', desc: '解鎖蓮花氛圍效果', cost: 800, action: 'unlock', once: true },
    { id: 'diamond_fish', icon: '💎', name: '水晶木魚', desc: '解鎖水晶木魚外觀', cost: 1200, action: 'unlock', once: true }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_triple', icon: '🎯', name: '初見聖筊', desc: '首次擲出三聖筊' },
    { id: 'ten_triples', icon: '🏆', name: '虔誠信眾', desc: '累計擲出 10 次三聖筊' },
    { id: 'fifty_triples', icon: '👑', name: '神明眷顧', desc: '累計擲出 50 次三聖筊' },
    { id: 'throw_100', icon: '🎲', name: '百擲不懈', desc: '累計擲筊 100 次' },
    { id: 'throw_500', icon: '🔥', name: '擲筊達人', desc: '累計擲筊 500 次' },
    { id: 'merit_100', icon: '📿', name: '初積功德', desc: '累計 100 功德' },
    { id: 'merit_500', icon: '🙏', name: '功德無量', desc: '累計 500 功德' },
    { id: 'merit_1000', icon: '☸️', name: '佛光普照', desc: '累計 1000 功德' },
    { id: 'merit_9999', icon: '🌟', name: '功德圓滿', desc: '累計 9999 功德' },
    { id: 'daily_100', icon: '⚡', name: '日行百善', desc: '一天敲木魚 100 次' },
    { id: 'daily_500', icon: '💫', name: '禪定', desc: '一天敲木魚 500 次' }
  ];

  function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    const view = $(viewId);
    if (view) view.classList.add('active');
    const tab = document.querySelector(`[data-view="${viewId}"]`);
    if (tab) tab.classList.add('active');

    if (viewId === 'viewHistory') Fortune.refreshHistory();
    if (viewId === 'viewMerit') refreshMeritPage();
    if (viewId === 'viewWoodfish') Woodfish.refresh();
    if (viewId === 'viewDivination') Divination.reset();
  }

  function renderShop() {
    const list = $('shopList');
    const unlocked = Storage.getUnlocked();
    const merit = Storage.getMerit();

    list.innerHTML = '';
    SHOP_ITEMS.forEach(item => {
      const owned = item.once && unlocked.includes(item.id);
      const canBuy = merit >= item.cost && !owned;
      const div = document.createElement('div');
      div.className = 'shop-item';
      div.innerHTML = `
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-info">
          <div class="shop-name">${item.name}</div>
          <div class="shop-cost">${owned ? '已擁有' : item.cost + ' 功德'}</div>
        </div>
        <button class="shop-buy" ${canBuy ? '' : 'disabled'}>${owned ? '✓' : '兌換'}</button>
      `;
      if (canBuy) {
        div.querySelector('.shop-buy').addEventListener('click', () => buyItem(item));
      }
      list.appendChild(div);
    });
  }

  function buyItem(item) {
    const merit = Storage.getMerit();
    if (merit < item.cost) return;

    Storage.addMerit(-item.cost);

    if (item.action === 'rethrow') {
      Storage.addReThrow(1);
      App.toast('獲得「再擲一次」機會！');
    } else if (item.action === 'unlock') {
      Storage.addUnlocked(item.id);
      AudioEngine.unlock();
      App.toast(`解鎖了「${item.name}」！`);
    }

    refreshMeritPage();
    Woodfish.refresh();
  }

  function renderAchievements() {
    const list = $('achievementList');
    const achieved = Storage.getAchievements();

    list.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
      const done = !!achieved[ach.id];
      const div = document.createElement('div');
      div.className = 'achievement-item';
      div.style.opacity = done ? '1' : '0.5';
      div.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <div class="ach-name">${ach.name}</div>
          <div class="ach-desc">${ach.desc}</div>
        </div>
        <div class="ach-status ${done ? 'done' : ''}">${done ? '已達成' : '未達成'}</div>
      `;
      list.appendChild(div);
    });
  }

  function refreshMeritPage() {
    $('meritBigCount').textContent = Storage.getMerit();
    renderShop();
    renderAchievements();
  }

  function initSettings() {
    const settings = Storage.getSettings();
    $('settingSound').checked = settings.sound;
    $('settingVolume').value = settings.volume * 100;
    $('settingVibrate').checked = settings.vibrate;
    AudioEngine.setEnabled(settings.sound);
    AudioEngine.setVolume(settings.volume);

    $('btnSettings').addEventListener('click', () => {
      $('settingsModal').classList.remove('hidden');
    });
    $('btnCloseSettings').addEventListener('click', () => {
      $('settingsModal').classList.add('hidden');
    });
    $('settingsModal').addEventListener('click', e => {
      if (e.target === $('settingsModal')) $('settingsModal').classList.add('hidden');
    });

    $('settingSound').addEventListener('change', e => {
      const s = Storage.getSettings();
      s.sound = e.target.checked;
      Storage.saveSettings(s);
      AudioEngine.setEnabled(s.sound);
    });
    $('settingVolume').addEventListener('input', e => {
      const s = Storage.getSettings();
      s.volume = e.target.value / 100;
      Storage.saveSettings(s);
      AudioEngine.setVolume(s.volume);
    });
    $('settingVibrate').addEventListener('change', e => {
      const s = Storage.getSettings();
      s.vibrate = e.target.checked;
      Storage.saveSettings(s);
    });
  }

  return {
    toast(msg, duration = 2000) {
      const t = $('toast');
      t.textContent = msg;
      t.classList.remove('hidden');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.add('hidden'), duration);
    },

    async init() {
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
      });

      initSettings();

      await Fortune.init();
      Divination.init();
      Woodfish.init();

      document.addEventListener('click', () => AudioEngine.init(), { once: true });
      document.addEventListener('touchstart', () => AudioEngine.init(), { once: true });

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
