const Woodfish = (() => {
  const MERIT_PER_RETHROW = 50;
  let todayCount = 0;
  let lastMeritThreshold = 0;

  const $ = id => document.getElementById(id);

  function getElements() {
    return {
      meritCount: $('meritCount'),
      woodfishBtn: $('woodfishBtn'),
      woodfishRipple: $('woodfishRipple'),
      floatContainer: $('meritFloatContainer'),
      todayWoodfish: $('todayWoodfish'),
      totalWoodfish: $('totalWoodfish'),
      reThrowCount: $('reThrowCount'),
      meritBigCount: $('meritBigCount'),
      penanceBanner: $('penanceBanner'),
      penanceCounter: $('penanceCounter')
    };
  }

  function updatePenanceBanner() {
    const el = getElements();
    if (Divination.isLocked()) {
      const remaining = Divination.getPenanceRemaining();
      el.penanceBanner.classList.remove('hidden');
      if (remaining > 0) {
        el.penanceBanner.classList.remove('penance-done');
        el.penanceCounter.textContent = `還需敲 ${remaining} 下才能再擲筊`;
      } else {
        el.penanceBanner.classList.add('penance-done');
        el.penanceCounter.textContent = '功德圓滿！可以回去再擲筊了';
      }
    } else {
      el.penanceBanner.classList.add('hidden');
    }
  }

  function hit() {
    const el = getElements();

    AudioEngine.warmUp();
    AudioEngine.woodfish();
    AudioEngine.haptic(0.4, 30);

    el.woodfishBtn.classList.add('hit');
    setTimeout(() => el.woodfishBtn.classList.remove('hit'), 80);

    el.woodfishRipple.classList.remove('active');
    void el.woodfishRipple.offsetWidth;
    el.woodfishRipple.classList.add('active');

    const merit = Storage.addMerit(1);
    todayCount++;
    Storage.addWoodfish(1);

    el.meritCount.textContent = merit;
    el.todayWoodfish.textContent = todayCount;
    el.totalWoodfish.textContent = Storage.getTotalWoodfish();
    if (el.meritBigCount) el.meritBigCount.textContent = merit;

    showFloat(el.floatContainer);

    if (Divination.isLocked()) {
      const completed = Divination.onPenanceHit();
      updatePenanceBanner();
      if (completed) {
        App.toast('功德圓滿！可以回去再擲筊了 🔔');
      }
    }

    const newThreshold = Math.floor(merit / MERIT_PER_RETHROW);
    if (newThreshold > lastMeritThreshold) {
      lastMeritThreshold = newThreshold;
      Storage.addReThrow(1);
      el.reThrowCount.textContent = Storage.getReThrows();
      AudioEngine.meritUp();
      if (!Divination.isLocked()) {
        App.toast(`功德圓滿！獲得「再擲一次」機會`);
      }
    }

    checkAchievements(merit);
  }

  function showFloat(container) {
    const float = document.createElement('div');
    float.className = 'merit-float';
    float.textContent = '功德 +1';
    const offsetX = (Math.random() - 0.5) * 60;
    float.style.left = `calc(50% + ${offsetX}px)`;
    container.appendChild(float);
    setTimeout(() => float.remove(), 1000);
  }

  function checkAchievements(merit) {
    if (merit >= 100) Storage.unlockAchievement('merit_100');
    if (merit >= 500) Storage.unlockAchievement('merit_500');
    if (merit >= 1000) Storage.unlockAchievement('merit_1000');
    if (merit >= 9999) Storage.unlockAchievement('merit_9999');
    if (todayCount >= 100) Storage.unlockAchievement('daily_100');
    if (todayCount >= 500) Storage.unlockAchievement('daily_500');
  }

  return {
    MERIT_PER_RETHROW,

    init() {
      const el = getElements();
      const merit = Storage.getMerit();
      lastMeritThreshold = Math.floor(merit / MERIT_PER_RETHROW);

      el.meritCount.textContent = merit;
      el.totalWoodfish.textContent = Storage.getTotalWoodfish();
      el.reThrowCount.textContent = Storage.getReThrows();
      $('meritPerRethrow').textContent = MERIT_PER_RETHROW;

      el.woodfishBtn.addEventListener('click', hit);
      el.woodfishBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        hit();
      }, { passive: false });
    },

    refresh() {
      const el = getElements();
      el.meritCount.textContent = Storage.getMerit();
      el.reThrowCount.textContent = Storage.getReThrows();
      el.totalWoodfish.textContent = Storage.getTotalWoodfish();
      updatePenanceBanner();
    }
  };
})();
