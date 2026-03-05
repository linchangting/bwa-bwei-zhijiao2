const Divination = (() => {
  const STATE = {
    READY: 'ready',
    MID_ROUND: 'mid_round',
    PENANCE: 'penance',
    UNLOCKED: 'unlocked',
    HOLY: 'holy',
    GAME_OVER: 'game_over'
  };

  let state = STATE.READY;
  let mode = 'ask';
  let throwCount = 0;
  let holyCount = 0;
  let roundNumber = 1;
  let isAnimating = false;
  let shakeEnabled = false;
  let lastShake = 0;
  let penanceRequired = 0;
  let penanceDone = 0;
  let lastFailType = null;

  const MAX_ROUNDS = 3;
  const SHAKE_THRESHOLD = 20;
  const SHAKE_COOLDOWN = 2000;
  const RESULT_TYPES = { HOLY: 'holy', LAUGH: 'laugh', ANGRY: 'angry' };
  const PENANCE_LAUGH = 10;
  const PENANCE_ANGRY = 30;

  const $ = id => document.getElementById(id);

  function el() {
    return {
      throwArea: $('throwArea'),
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
      btnNewQuestion: $('btnNewQuestion'),
      btnShare: $('btnShare'),
      questionInput: $('questionInput'),
      optionA: $('optionA'),
      optionB: $('optionB'),
      askInput: $('askInput'),
      chooseInput: $('chooseInput'),
      roundDisplay: $('roundDisplay'),
      roundText: $('roundText'),
      dots: [$('dot1'), $('dot2'), $('dot3')]
    };
  }

  function canThrow() {
    return (state === STATE.READY || state === STATE.MID_ROUND) && !isAnimating;
  }

  function randomResult() {
    const r = Math.random();
    if (r < 0.5) return RESULT_TYPES.HOLY;
    if (r < 0.75) return RESULT_TYPES.LAUGH;
    return RESULT_TYPES.ANGRY;
  }

  // === Full reset: new question, round 1, clean slate ===
  function fullReset() {
    state = STATE.READY;
    roundNumber = 1;
    throwCount = 0;
    holyCount = 0;
    penanceRequired = 0;
    penanceDone = 0;
    lastFailType = null;
    isAnimating = false;
    renderReadyUI();
  }

  // === Start next round (after penance completed) ===
  function startNextRound() {
    roundNumber++;
    state = STATE.READY;
    throwCount = 0;
    holyCount = 0;
    penanceRequired = 0;
    penanceDone = 0;
    lastFailType = null;
    isAnimating = false;
    renderReadyUI();
  }

  // === UI Renderers ===

  function renderReadyUI() {
    const e = el();
    e.throwArea.style.display = '';
    e.resultPanel.classList.add('hidden');
    e.resultPanel.classList.remove('holy', 'unholy');
    e.btnThrow.disabled = false;
    e.throwHint.style.display = '';
    e.throwHint.querySelector('p').textContent = '搖晃手機 或 點擊擲筊';
    e.dots.forEach(d => { d.className = 'dot'; });
    e.blockLeft.classList.remove('throwing', 'delay');
    e.blockRight.classList.remove('throwing', 'delay');
    e.blockLeft.querySelector('.block-inner').className = 'block-inner';
    e.blockRight.querySelector('.block-inner').className = 'block-inner';
    e.btnRetry.classList.remove('btn-unlocking', 'btn-locked');
    e.btnNewQuestion.style.display = 'none';
    updateRoundBadge();
  }

  function renderResultUI() {
    const e = el();
    e.throwArea.style.display = 'none';
    e.resultPanel.classList.remove('hidden');

    switch (state) {
      case STATE.HOLY:
        e.resultPanel.classList.remove('unholy');
        e.resultPanel.classList.add('holy');
        e.btnRetry.style.display = 'none';
        e.btnWoodfish.style.display = 'none';
        e.btnNewQuestion.style.display = '';
        e.btnNewQuestion.textContent = '換個問題再問';
        break;

      case STATE.PENANCE:
        e.resultPanel.classList.remove('holy');
        e.resultPanel.classList.add('unholy');
        e.btnRetry.style.display = '';
        e.btnRetry.disabled = true;
        e.btnRetry.classList.add('btn-locked');
        e.btnRetry.classList.remove('btn-unlocking');
        e.btnRetry.textContent = `需敲木魚 ${penanceRequired - penanceDone} 下`;
        e.btnWoodfish.style.display = '';
        e.btnWoodfish.textContent = `敲木魚消災（還需 ${penanceRequired - penanceDone} 下）`;
        e.btnNewQuestion.style.display = '';
        e.btnNewQuestion.textContent = '換個問題重新問';
        break;

      case STATE.UNLOCKED:
        e.resultPanel.classList.remove('holy');
        e.resultPanel.classList.add('unholy');
        e.btnRetry.style.display = '';
        e.btnRetry.disabled = false;
        e.btnRetry.classList.remove('btn-locked');
        e.btnRetry.classList.add('btn-unlocking');
        e.btnRetry.textContent = '🔔 功德圓滿，可以再問了！';
        e.btnWoodfish.style.display = 'none';
        e.btnNewQuestion.style.display = '';
        e.btnNewQuestion.textContent = '換個問題重新問';
        break;

      case STATE.GAME_OVER:
        e.resultPanel.classList.remove('holy');
        e.resultPanel.classList.add('unholy');
        e.btnRetry.style.display = 'none';
        e.btnWoodfish.style.display = 'none';
        e.btnNewQuestion.style.display = '';
        e.btnNewQuestion.textContent = '換個問題重新問';
        break;
    }
  }

  function updateRoundBadge() {
    const e = el();
    e.roundText.textContent = `第 ${roundNumber}/${MAX_ROUNDS} 輪`;
    e.roundDisplay.classList.toggle('round-warning', roundNumber > 1);
    e.roundDisplay.classList.toggle('round-final', roundNumber >= MAX_ROUNDS);
  }

  // === Core throw logic ===

  function performThrow() {
    if (!canThrow()) return;
    isAnimating = true;

    AudioEngine.warmUp();

    const e = el();
    e.btnThrow.disabled = true;
    e.throwHint.style.display = 'none';

    AudioEngine.haptic(0.8, 80);

    const result = randomResult();
    const leftYang = result === RESULT_TYPES.HOLY || result === RESULT_TYPES.LAUGH;
    const rightYang = result === RESULT_TYPES.LAUGH;

    const leftRot = leftYang ? 0 : 180;
    const rightRot = rightYang ? 0 : 180;

    const leftInner = e.blockLeft.querySelector('.block-inner');
    const rightInner = e.blockRight.querySelector('.block-inner');
    leftInner.className = 'block-inner';
    rightInner.className = 'block-inner';

    e.blockLeft.style.setProperty('--final-rot', leftRot + 'deg');
    e.blockRight.style.setProperty('--final-rot', rightRot + 'deg');

    void e.blockLeft.offsetWidth;

    e.blockLeft.classList.add('throwing');
    e.blockRight.classList.add('throwing', 'delay');

    setTimeout(() => AudioEngine.blockLand(), 800);
    setTimeout(() => { AudioEngine.blockLand(); AudioEngine.haptic(0.5, 40); }, 950);

    Storage.addThrow();

    setTimeout(() => {
      e.blockLeft.classList.remove('throwing');
      e.blockRight.classList.remove('throwing', 'delay');
      leftInner.className = 'block-inner ' + (leftYang ? 'show-yang' : 'show-yin');
      rightInner.className = 'block-inner ' + (rightYang ? 'show-yang' : 'show-yin');

      processResult(result);
    }, 1400);
  }

  function processResult(result) {
    const e = el();
    throwCount++;

    if (result === RESULT_TYPES.HOLY) {
      holyCount++;
      e.dots[throwCount - 1].classList.add('success');
      AudioEngine.holyResult();

      if (holyCount >= 3) {
        setTimeout(() => finishRound(true), 600);
      } else {
        state = STATE.MID_ROUND;
        setTimeout(() => {
          isAnimating = false;
          e.btnThrow.disabled = false;
          e.throwHint.style.display = '';
          e.throwHint.querySelector('p').textContent =
            `第 ${holyCount}/3 聖筊，繼續擲！`;
        }, 800);
      }
    } else {
      e.dots[throwCount - 1].classList.add('fail');
      lastFailType = result;
      if (result === RESULT_TYPES.LAUGH) {
        AudioEngine.laughResult();
      } else {
        AudioEngine.angryResult();
        AudioEngine.haptic(1.0, 150);
      }
      setTimeout(() => finishRound(false, result), 600);
    }
  }

  function finishRound(isTripleHoly, failType) {
    const e = el();
    isAnimating = false;

    const question = mode === 'ask'
      ? (e.questionInput.value.trim() || '心中默念')
      : `${e.optionA.value.trim() || 'A'} vs ${e.optionB.value.trim() || 'B'}`;

    if (isTripleHoly) {
      state = STATE.HOLY;
      AudioEngine.tripleHoly();
      celebrate();

      e.resultIcon.textContent = '🌟';
      e.resultTitle.textContent = '三聖筊';

      if (mode === 'choose') {
        const chosen = e.optionA.value.trim() || 'A';
        e.resultDesc.innerHTML =
          `神明指引：<span class="choice-result">${chosen}</span><br><small>三聖筊確認，選此大吉！</small>`;
      } else {
        e.resultDesc.textContent = '神明允諾！此事大吉，放心去做。';
      }

      Storage.addHistory({ question, result: '三聖筊', round: roundNumber, mode, holy: true });
      checkAchievements('tripleHoly');
    } else {
      const isLastRound = roundNumber >= MAX_ROUNDS;

      if (failType === RESULT_TYPES.LAUGH) {
        e.resultIcon.textContent = '😏';
        e.resultTitle.textContent = '笑筊';
        if (mode === 'choose') {
          const chosen = e.optionB.value.trim() || 'B';
          e.resultDesc.innerHTML =
            `神明示意：<span class="choice-result">${chosen}</span><br><small>笑筊否決了前者，選此更佳。</small>`;
        } else {
          e.resultDesc.textContent = '神明笑而不語，也許問題需要重新思考。';
        }
        Storage.addHistory({ question, result: '笑筊', round: roundNumber, mode, holy: false });
      } else {
        e.resultIcon.textContent = '😤';
        e.resultTitle.textContent = '怒筊';
        if (mode === 'choose') {
          const chosen = e.optionB.value.trim() || 'B';
          e.resultDesc.innerHTML =
            `神明指引：<span class="choice-result">${chosen}</span><br><small>怒筊否決了前者，選此為宜。</small>`;
        } else {
          e.resultDesc.textContent = '神明不悅，此事不宜。需敲木魚積功德方可再問。';
        }
        Storage.addHistory({ question, result: '怒筊', round: roundNumber, mode, holy: false });
      }

      if (isLastRound) {
        state = STATE.GAME_OVER;
        e.resultDesc.innerHTML =
          `<span class="final-verdict">三輪已盡，神明心意已決。</span><br>` +
          e.resultDesc.innerHTML +
          `<br><small class="final-hint">請尊重神意，換個問題或改日再問。</small>`;
      } else {
        state = STATE.PENANCE;
        penanceDone = 0;
        penanceRequired = failType === RESULT_TYPES.LAUGH ? PENANCE_LAUGH : PENANCE_ANGRY;
      }
    }

    renderResultUI();
  }

  // === Penance system ===

  function onPenanceHit() {
    if (state !== STATE.PENANCE) return false;
    penanceDone++;
    const remaining = penanceRequired - penanceDone;

    if (remaining > 0) {
      const e = el();
      e.btnRetry.textContent = `還需敲 ${remaining} 下`;
      e.btnWoodfish.textContent = `敲木魚消災（還需 ${remaining} 下）`;
      return false;
    }

    state = STATE.UNLOCKED;
    renderResultUI();
    AudioEngine.penanceComplete();
    AudioEngine.haptic(0.7, 100);
    return true;
  }

  // === Tab switch handler ===

  function onViewEnter() {
    if (state === STATE.PENANCE || state === STATE.UNLOCKED) {
      renderResultUI();
    }
  }

  // === Celebrate ===

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

  // === Shake detection ===

  function initShake() {
    if (!window.DeviceMotionEvent) return;
    const startListening = () => {
      window.addEventListener('devicemotion', onDeviceMotion);
      shakeEnabled = true;
    };
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      document.addEventListener('click', function reqPerm() {
        DeviceMotionEvent.requestPermission().then(s => {
          if (s === 'granted') startListening();
        }).catch(() => {});
        document.removeEventListener('click', reqPerm);
      }, { once: true });
    } else {
      startListening();
    }
  }

  function onDeviceMotion(evt) {
    const a = evt.accelerationIncludingGravity;
    if (!a) return;
    const force = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z);
    const now = Date.now();
    if (force > SHAKE_THRESHOLD && now - lastShake > SHAKE_COOLDOWN) {
      lastShake = now;
      const activeView = document.querySelector('.view.active');
      if (activeView && activeView.id === 'viewDivination' && canThrow()) {
        performThrow();
      }
    }
  }

  // === Achievements ===

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

  // === Public API ===

  return {
    init() {
      const e = el();

      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          mode = btn.dataset.mode;
          e.askInput.classList.toggle('hidden', mode !== 'ask');
          e.chooseInput.classList.toggle('hidden', mode !== 'choose');
          fullReset();
        });
      });

      e.btnThrow.addEventListener('click', performThrow);

      e.btnRetry.addEventListener('click', () => {
        if (state === STATE.UNLOCKED) {
          startNextRound();
        }
      });

      e.btnNewQuestion.addEventListener('click', () => {
        fullReset();
        if (mode === 'ask') {
          e.questionInput.value = '';
          e.questionInput.focus();
        } else {
          e.optionA.value = '';
          e.optionB.value = '';
          e.optionA.focus();
        }
      });

      e.btnWoodfish.addEventListener('click', () => {
        document.querySelector('[data-view="viewWoodfish"]').click();
      });

      e.btnShare.addEventListener('click', () => {
        Divination.share();
      });

      initShake();
      updateRoundBadge();
    },

    reset: fullReset,
    onViewEnter,
    getMode: () => mode,
    getState: () => state,
    isLocked: () => state === STATE.PENANCE,
    onPenanceHit,
    getPenanceRemaining: () => Math.max(0, penanceRequired - penanceDone),

    share() {
      const e = el();
      const text = `${e.resultTitle.textContent} | 問筊 App\n${e.resultDesc.textContent}`;
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
