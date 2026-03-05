const Divination = (() => {
  let mode = 'ask';
  let throwCount = 0;
  let holyCount = 0;
  let isAnimating = false;
  let shakeEnabled = false;
  let lastShake = 0;

  const SHAKE_THRESHOLD = 20;
  const SHAKE_COOLDOWN = 2000;
  const RESULT_TYPES = { HOLY: 'holy', LAUGH: 'laugh', ANGRY: 'angry' };

  const $ = id => document.getElementById(id);

  function getElements() {
    return {
      throwArea: $('throwArea'),
      throwProgress: $('throwProgress'),
      blocksContainer: $('blocksContainer'),
      blockLeft: $('blockLeft'),
      blockRight: $('blockRight'),
      throwHint: $('throwHint'),
      btnThrow: $('btnThrow'),
      resultPanel: $('resultPanel'),
      resultIcon: $('resultIcon'),
      resultTitle: $('resultTitle'),
      resultDesc: $('resultDesc'),
      btnRetry: $('btnRetry'),
      btnWoodfish: $('btnWoodfish'),
      btnShare: $('btnShare'),
      questionInput: $('questionInput'),
      optionA: $('optionA'),
      optionB: $('optionB'),
      askInput: $('askInput'),
      chooseInput: $('chooseInput'),
      dots: [$('dot1'), $('dot2'), $('dot3')]
    };
  }

  function randomResult() {
    const r = Math.random();
    if (r < 0.5) return RESULT_TYPES.HOLY;
    if (r < 0.75) return RESULT_TYPES.LAUGH;
    return RESULT_TYPES.ANGRY;
  }

  function resetState() {
    throwCount = 0;
    holyCount = 0;
    const el = getElements();
    el.dots.forEach(d => { d.className = 'dot'; });
    el.resultPanel.classList.add('hidden');
    el.resultPanel.classList.remove('holy', 'unholy');
    el.throwArea.style.display = '';
    el.btnThrow.disabled = false;
    el.throwHint.style.display = '';
    el.blockLeft.classList.remove('throwing', 'delay');
    el.blockRight.classList.remove('throwing', 'delay');
    el.blockLeft.querySelector('.block-inner').className = 'block-inner';
    el.blockRight.querySelector('.block-inner').className = 'block-inner';
    isAnimating = false;
  }

  function performThrow() {
    if (isAnimating) return;
    isAnimating = true;

    const el = getElements();
    el.btnThrow.disabled = true;
    el.throwHint.style.display = 'none';

    const result = randomResult();
    const leftYang = result === RESULT_TYPES.HOLY || result === RESULT_TYPES.LAUGH;
    const rightYang = result === RESULT_TYPES.LAUGH;
    const leftYin = result === RESULT_TYPES.ANGRY;
    const rightYin = result === RESULT_TYPES.HOLY || result === RESULT_TYPES.ANGRY;

    const leftRot = leftYang ? 0 : 180;
    const rightRot = rightYang ? 0 : 180;

    const leftInner = el.blockLeft.querySelector('.block-inner');
    const rightInner = el.blockRight.querySelector('.block-inner');
    leftInner.className = 'block-inner';
    rightInner.className = 'block-inner';

    el.blockLeft.style.setProperty('--final-rot', leftRot + 'deg');
    el.blockRight.style.setProperty('--final-rot', rightRot + 'deg');

    void el.blockLeft.offsetWidth;

    el.blockLeft.classList.add('throwing');
    el.blockRight.classList.add('throwing', 'delay');

    if (navigator.vibrate) navigator.vibrate(100);

    setTimeout(() => AudioEngine.blockLand(), 800);
    setTimeout(() => AudioEngine.blockLand(), 950);

    Storage.addThrow();

    setTimeout(() => {
      el.blockLeft.classList.remove('throwing');
      el.blockRight.classList.remove('throwing', 'delay');
      leftInner.className = 'block-inner ' + (leftYang ? 'show-yang' : 'show-yin');
      rightInner.className = 'block-inner ' + (rightYang ? 'show-yang' : 'show-yin');

      processResult(result);
    }, 1400);
  }

  function processResult(result) {
    const el = getElements();
    throwCount++;

    if (result === RESULT_TYPES.HOLY) {
      holyCount++;
      el.dots[throwCount - 1].classList.add('success');
      AudioEngine.holyResult();

      if (holyCount >= 3) {
        setTimeout(() => showFinalResult(true), 600);
      } else {
        setTimeout(() => {
          isAnimating = false;
          el.btnThrow.disabled = false;
          el.throwHint.style.display = '';
          el.throwHint.querySelector('p').textContent =
            `第 ${holyCount}/3 聖筊，繼續擲！`;
        }, 800);
      }
    } else {
      el.dots[throwCount - 1].classList.add('fail');
      if (result === RESULT_TYPES.LAUGH) {
        AudioEngine.laughResult();
      } else {
        AudioEngine.angryResult();
      }
      setTimeout(() => showFinalResult(false, result), 600);
    }
  }

  function showFinalResult(isTripleHoly, failType) {
    const el = getElements();

    const question = mode === 'ask'
      ? (el.questionInput.value.trim() || '心中默念')
      : `${el.optionA.value.trim() || 'A'} vs ${el.optionB.value.trim() || 'B'}`;

    el.throwArea.style.display = 'none';

    if (isTripleHoly) {
      AudioEngine.tripleHoly();
      celebrate();
      el.resultPanel.classList.remove('hidden', 'unholy');
      el.resultPanel.classList.add('holy');
      el.resultIcon.textContent = '🌟';
      el.resultTitle.textContent = '三聖筊';
      el.btnWoodfish.style.display = 'none';

      if (mode === 'choose') {
        const chosen = el.optionA.value.trim() || 'A';
        el.resultDesc.innerHTML =
          `神明指引：<span class="choice-result">${chosen}</span><br><small>三聖筊確認，選此大吉！</small>`;
      } else {
        el.resultDesc.textContent = '神明允諾！此事大吉，放心去做。';
      }

      Storage.addHistory({ question, result: '三聖筊', mode, holy: true });
      checkAchievements('tripleHoly');
    } else {
      el.resultPanel.classList.remove('hidden', 'holy');
      el.resultPanel.classList.add('unholy');
      el.btnWoodfish.style.display = '';

      if (failType === RESULT_TYPES.LAUGH) {
        el.resultIcon.textContent = '😏';
        el.resultTitle.textContent = '笑筊';
        if (mode === 'choose') {
          const chosen = el.optionB.value.trim() || 'B';
          el.resultDesc.innerHTML =
            `神明示意：<span class="choice-result">${chosen}</span><br><small>笑筊否決了前者，選此更佳。</small>`;
        } else {
          el.resultDesc.textContent = '神明笑而不語，也許問題需要重新思考。';
        }
        Storage.addHistory({ question, result: '笑筊', mode, holy: false });
      } else {
        el.resultIcon.textContent = '😤';
        el.resultTitle.textContent = '怒筊';
        if (mode === 'choose') {
          const chosen = el.optionB.value.trim() || 'B';
          el.resultDesc.innerHTML =
            `神明指引：<span class="choice-result">${chosen}</span><br><small>怒筊否決了前者，選此為宜。</small>`;
        } else {
          el.resultDesc.textContent = '神明不允，此事不宜。建議敲木魚積功德消災祈福。';
        }
        Storage.addHistory({ question, result: '怒筊', mode, holy: false });
      }
    }

    const rethrows = Storage.getReThrows();
    if (rethrows > 0) {
      el.btnRetry.textContent = `再問一次（機會 ×${rethrows}）`;
    } else {
      el.btnRetry.textContent = '再問一次';
    }

    isAnimating = false;
  }

  function celebrate() {
    const container = document.createElement('div');
    container.className = 'celebrate';
    document.body.appendChild(container);

    const colors = ['#ffd700', '#c9a84c', '#ff6666', '#f0d68a', '#cc3333', '#fff'];
    for (let i = 0; i < 40; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 0.8 + 's';
      piece.style.animationDuration = (2 + Math.random()) + 's';
      container.appendChild(piece);
    }
    setTimeout(() => container.remove(), 3500);
  }

  function initShake() {
    if (!window.DeviceMotionEvent) return;

    const startListening = () => {
      window.addEventListener('devicemotion', onDeviceMotion);
      shakeEnabled = true;
    };

    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      document.addEventListener('click', function reqPerm() {
        DeviceMotionEvent.requestPermission().then(state => {
          if (state === 'granted') startListening();
        }).catch(() => {});
        document.removeEventListener('click', reqPerm);
      }, { once: true });
    } else {
      startListening();
    }
  }

  function onDeviceMotion(e) {
    const a = e.accelerationIncludingGravity;
    if (!a) return;
    const force = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z);
    const now = Date.now();

    if (force > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN) {
      lastShake = now;
      const activeView = document.querySelector('.view.active');
      if (activeView && activeView.id === 'viewDivination' && !isAnimating) {
        performThrow();
      }
    }
  }

  function checkAchievements(type) {
    if (type === 'tripleHoly') {
      Storage.unlockAchievement('first_triple');
      const history = Storage.getHistory();
      const triples = history.filter(h => h.holy).length;
      if (triples >= 10) Storage.unlockAchievement('ten_triples');
      if (triples >= 50) Storage.unlockAchievement('fifty_triples');
    }
    const totalThrows = Storage.getTotalThrows();
    if (totalThrows >= 100) Storage.unlockAchievement('throw_100');
    if (totalThrows >= 500) Storage.unlockAchievement('throw_500');
  }

  return {
    init() {
      const el = getElements();

      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          mode = btn.dataset.mode;
          el.askInput.classList.toggle('hidden', mode !== 'ask');
          el.chooseInput.classList.toggle('hidden', mode !== 'choose');
          resetState();
        });
      });

      el.btnThrow.addEventListener('click', performThrow);

      el.btnRetry.addEventListener('click', () => {
        resetState();
      });

      el.btnWoodfish.addEventListener('click', () => {
        document.querySelector('[data-view="viewWoodfish"]').click();
      });

      el.btnShare.addEventListener('click', () => {
        Divination.share();
      });

      initShake();
    },

    reset: resetState,
    getMode: () => mode,

    share() {
      const el = getElements();
      const text = `${el.resultTitle.textContent} | 問筊 App\n${el.resultDesc.textContent}`;
      if (navigator.share) {
        navigator.share({ title: '問筊結果', text }).catch(() => {});
      } else {
        navigator.clipboard.writeText(text).then(() => {
          App.toast('已複製到剪貼板');
        }).catch(() => {});
      }
    }
  };
})();
