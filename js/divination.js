const Divination = (() => {
  let mode = 'ask';
  let throwCount = 0;
  let holyCount = 0;
  let roundNumber = 1;
  let isAnimating = false;
  let shakeEnabled = false;
  let lastShake = 0;
  let penanceRequired = 0;
  let penanceDone = 0;
  let locked = false;
  let finalLocked = false;

  const MAX_ROUNDS = 3;
  const SHAKE_THRESHOLD = 20;
  const SHAKE_COOLDOWN = 2000;
  const RESULT_TYPES = { HOLY: 'holy', LAUGH: 'laugh', ANGRY: 'angry' };
  const PENANCE_LAUGH = 10;
  const PENANCE_ANGRY = 30;

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

  function randomResult() {
    const r = Math.random();
    if (r < 0.5) return RESULT_TYPES.HOLY;
    if (r < 0.75) return RESULT_TYPES.LAUGH;
    return RESULT_TYPES.ANGRY;
  }

  function fullReset() {
    roundNumber = 1;
    resetRound();
    finalLocked = false;
    const el = getElements();
    el.btnNewQuestion.style.display = 'none';
    updateRoundDisplay();
  }

  function resetRound() {
    throwCount = 0;
    holyCount = 0;
    penanceRequired = 0;
    penanceDone = 0;
    locked = false;
    const el = getElements();
    el.dots.forEach(d => { d.className = 'dot'; });
    el.resultPanel.classList.add('hidden');
    el.resultPanel.classList.remove('holy', 'unholy');
    el.btnRetry.classList.remove('btn-unlocking', 'btn-locked');
    el.btnRetry.style.display = '';
    el.btnNewQuestion.style.display = 'none';
    el.throwArea.style.display = '';
    el.btnThrow.disabled = false;
    el.throwHint.style.display = '';
    el.throwHint.querySelector('p').textContent = '搖晃手機 或 點擊擲筊';
    el.blockLeft.classList.remove('throwing', 'delay');
    el.blockRight.classList.remove('throwing', 'delay');
    el.blockLeft.querySelector('.block-inner').className = 'block-inner';
    el.blockRight.querySelector('.block-inner').className = 'block-inner';
    isAnimating = false;
    updateRoundDisplay();
  }

  function updateRoundDisplay() {
    const el = getElements();
    el.roundText.textContent = `第 ${roundNumber}/${MAX_ROUNDS} 輪`;
    if (roundNumber > 1) {
      el.roundDisplay.classList.add('round-warning');
    } else {
      el.roundDisplay.classList.remove('round-warning');
    }
    if (roundNumber >= MAX_ROUNDS) {
      el.roundDisplay.classList.add('round-final');
    } else {
      el.roundDisplay.classList.remove('round-final');
    }
  }

  function startNextRound() {
    roundNumber++;
    resetRound();
  }

  function performThrow() {
    if (isAnimating || finalLocked) return;
    isAnimating = true;

    AudioEngine.warmUp();

    const el = getElements();
    el.btnThrow.disabled = true;
    el.throwHint.style.display = 'none';

    AudioEngine.haptic(0.8, 80);

    const result = randomResult();
    const leftYang = result === RESULT_TYPES.HOLY || result === RESULT_TYPES.LAUGH;
    const rightYang = result === RESULT_TYPES.LAUGH;

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

    setTimeout(() => AudioEngine.blockLand(), 800);
    setTimeout(() => { AudioEngine.blockLand(); AudioEngine.haptic(0.5, 40); }, 950);

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
        AudioEngine.haptic(1.0, 150);
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
      el.btnRetry.style.display = 'none';
      el.btnNewQuestion.style.display = '';
      el.btnNewQuestion.textContent = '換個問題再問';
      locked = false;
      finalLocked = false;

      if (mode === 'choose') {
        const chosen = el.optionA.value.trim() || 'A';
        el.resultDesc.innerHTML =
          `神明指引：<span class="choice-result">${chosen}</span><br><small>三聖筊確認，選此大吉！</small>`;
      } else {
        el.resultDesc.textContent = '神明允諾！此事大吉，放心去做。';
      }

      Storage.addHistory({ question, result: '三聖筊', round: roundNumber, mode, holy: true });
      checkAchievements('tripleHoly');
    } else {
      el.resultPanel.classList.remove('hidden', 'holy');
      el.resultPanel.classList.add('unholy');

      const isLastRound = roundNumber >= MAX_ROUNDS;

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
        Storage.addHistory({ question, result: '笑筊', round: roundNumber, mode, holy: false });
      } else {
        el.resultIcon.textContent = '😤';
        el.resultTitle.textContent = '怒筊';
        if (mode === 'choose') {
          const chosen = el.optionB.value.trim() || 'B';
          el.resultDesc.innerHTML =
            `神明指引：<span class="choice-result">${chosen}</span><br><small>怒筊否決了前者，選此為宜。</small>`;
        } else {
          el.resultDesc.textContent = '神明不悅，此事不宜。需敲木魚積功德方可再問。';
        }
        Storage.addHistory({ question, result: '怒筊', round: roundNumber, mode, holy: false });
      }

      if (isLastRound) {
        finalLocked = true;
        locked = false;
        el.btnRetry.style.display = 'none';
        el.btnWoodfish.style.display = 'none';
        el.btnNewQuestion.style.display = '';
        el.btnNewQuestion.textContent = '換個問題重新問';

        el.resultDesc.innerHTML =
          `<span class="final-verdict">三輪已盡，神明心意已決。</span><br>` +
          el.resultDesc.innerHTML +
          `<br><small class="final-hint">請尊重神意，換個問題或改日再問。</small>`;
      } else {
        locked = true;
        penanceDone = 0;
        if (failType === RESULT_TYPES.LAUGH) {
          penanceRequired = PENANCE_LAUGH;
        } else {
          penanceRequired = PENANCE_ANGRY;
        }

        el.btnRetry.style.display = '';
        el.btnRetry.disabled = true;
        el.btnRetry.classList.add('btn-locked');
        el.btnRetry.classList.remove('btn-unlocking');
        el.btnRetry.textContent = `需敲木魚 ${penanceRequired} 下（第 ${roundNumber}/${MAX_ROUNDS} 輪）`;

        el.btnWoodfish.style.display = '';
        el.btnWoodfish.textContent = `敲木魚消災（${penanceRequired} 下）`;
        el.btnNewQuestion.style.display = '';
        el.btnNewQuestion.textContent = '換個問題重新問';
      }
    }

    isAnimating = false;
  }

  function onPenanceHit() {
    if (!locked) return false;
    penanceDone++;
    const remaining = penanceRequired - penanceDone;
    const el = getElements();

    if (remaining > 0) {
      el.btnRetry.textContent = `還需敲 ${remaining} 下`;
      return false;
    }

    locked = false;
    el.btnRetry.disabled = false;
    el.btnRetry.classList.remove('btn-locked');
    el.btnRetry.classList.add('btn-unlocking');
    el.btnRetry.textContent = '🔔 功德圓滿，可以再問了！';
    AudioEngine.penanceComplete();
    AudioEngine.haptic(0.7, 100);
    return true;
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
      if (activeView && activeView.id === 'viewDivination' && !isAnimating && !finalLocked) {
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
          fullReset();
        });
      });

      el.btnThrow.addEventListener('click', performThrow);

      el.btnRetry.addEventListener('click', () => {
        if (locked || finalLocked) return;
        startNextRound();
      });

      el.btnNewQuestion.addEventListener('click', () => {
        fullReset();
        const el2 = getElements();
        if (mode === 'ask') {
          el2.questionInput.value = '';
          el2.questionInput.focus();
        } else {
          el2.optionA.value = '';
          el2.optionB.value = '';
          el2.optionA.focus();
        }
      });

      el.btnWoodfish.addEventListener('click', () => {
        document.querySelector('[data-view="viewWoodfish"]').click();
      });

      el.btnShare.addEventListener('click', () => {
        Divination.share();
      });

      initShake();
      updateRoundDisplay();
    },

    reset: fullReset,
    getMode: () => mode,
    isLocked: () => locked,
    onPenanceHit,
    getPenanceRemaining: () => Math.max(0, penanceRequired - penanceDone),

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
