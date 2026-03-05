const Storage = (() => {
  const PREFIX = 'bwabwei_';

  function key(name) { return PREFIX + name; }

  function get(name, fallback = null) {
    try {
      const raw = localStorage.getItem(key(name));
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }

  function set(name, value) {
    try { localStorage.setItem(key(name), JSON.stringify(value)); } catch {}
  }

  function getMerit() { return get('merit', 0); }
  function addMerit(n = 1) {
    const m = getMerit() + n;
    set('merit', m);
    return m;
  }

  function getReThrows() { return get('rethrows', 0); }
  function addReThrow(n = 1) { const v = getReThrows() + n; set('rethrows', v); return v; }
  function useReThrow() {
    const v = getReThrows();
    if (v <= 0) return false;
    set('rethrows', v - 1);
    return true;
  }

  function getHistory() { return get('history', []); }
  function addHistory(entry) {
    const h = getHistory();
    h.unshift({ ...entry, time: Date.now() });
    if (h.length > 200) h.length = 200;
    set('history', h);
  }
  function clearHistory() { set('history', []); }

  function getAchievements() { return get('achievements', {}); }
  function unlockAchievement(id) {
    const a = getAchievements();
    if (a[id]) return false;
    a[id] = Date.now();
    set('achievements', a);
    return true;
  }

  function getUnlocked() { return get('unlocked', []); }
  function addUnlocked(id) {
    const u = getUnlocked();
    if (!u.includes(id)) { u.push(id); set('unlocked', u); }
  }

  function getTodayFortuneId() {
    const today = new Date().toDateString();
    const saved = get('daily_fortune', {});
    if (saved.date === today) return saved.id;
    return null;
  }
  function setTodayFortuneId(id) {
    set('daily_fortune', { date: new Date().toDateString(), id });
  }

  function getSettings() {
    return get('settings', { sound: true, volume: 0.7, vibrate: true });
  }
  function saveSettings(s) { set('settings', s); }

  function getTotalThrows() { return get('total_throws', 0); }
  function addThrow() { const t = getTotalThrows() + 1; set('total_throws', t); return t; }

  function getTotalWoodfish() { return get('total_woodfish', 0); }
  function addWoodfish(n = 1) { const t = getTotalWoodfish() + n; set('total_woodfish', t); return t; }

  return {
    get, set, getMerit, addMerit,
    getReThrows, addReThrow, useReThrow,
    getHistory, addHistory, clearHistory,
    getAchievements, unlockAchievement,
    getUnlocked, addUnlocked,
    getTodayFortuneId, setTodayFortuneId,
    getSettings, saveSettings,
    getTotalThrows, addThrow,
    getTotalWoodfish, addWoodfish
  };
})();
