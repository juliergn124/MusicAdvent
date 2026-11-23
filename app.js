(() => {
  const quiz = window.QUIZ || [];
  const params = new URLSearchParams(location.search);
  const requested = Number(params.get('jour') || params.get('day') || 1);

  const day = Math.min(
    Math.max(1, quiz.length || 24),
    Math.max(1, Number.isFinite(requested) ? requested : 1)
  );

  const item = quiz.find(q => q.day === day) || quiz[day - 1];
  const totalDays = quiz.length || 24;

  const storageKey = 'adventMusicQuiz_v1';

  const readProgress = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch {
      return {};
    }
  };

  const progress = readProgress();

  const norm = s => String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const $ = id => document.getElementById(id);

  const form = $('answer-form');
  const input = $('answer');
  const feedback = $('feedback');
  const reset = $('reset-day');
  const musicReveal = $('music-reveal');
  const skipBonus = $('skip-bonus');

  let spotifyController = null;
  let spotifyApiRequested = false;
  let transitionTimer = null;

  const stages = [
    {
      key: 'album',
      title: 'Quel est cet album ?',
      note: "Observe la pochette et retrouve le nom de l'album.",
      placeholder: "Le nom de l'album…",
      answers: item?.answers || [],
      limit: 10
    },
    {
      key: 'artist',
      title: "Qui est l'artiste ?",
      note: "Retrouve le nom de l'artiste ou du groupe.",
      placeholder: "Le nom de l'artiste…",
      answers: item?.artistAnswers || [],
      limit: 10
    },
    {
      key: 'track',
      title: "Donne un titre de l'album !",
      note: "Cite au moins une chanson présente sur cet album.",
      placeholder: "Le titre d'une chanson…",
      answers: item?.trackAnswers || [],
      limit: null
    },
    {
      key: 'year',
      title: "Trouve l'année !",
      note: "En quelle année cet album est-il sorti ? C'est la question bonus !",
      placeholder: "L'année de sortie…",
      answers: item?.yearAnswers || [],
      limit: null
    }
  ];

  function blankState() {
    return {
      step: 0,
      attempts: {
        album: 0,
        artist: 0,
        track: 0,
        year: 0
      },
      completed: false,
      bonusSkipped: false
    };
  }

  const saved = progress[day];

  let state;

  if (saved === true) {
    state = blankState();
    state.completed = true;
  } else if (saved && typeof saved === 'object') {
    state = {
      ...blankState(),
      ...saved,
      attempts: {
        ...blankState().attempts,
        ...(saved.attempts || {})
      }
    };
  } else {
    state = blankState();
  }

  $('day-label').textContent = `Jour ${day} / ${totalDays}`;

  function saveProgress() {
    progress[day] = state;
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }

  function isDone() {
    return !!state.completed;
  }

  function setFeedback(text, kind) {
    feedback.textContent = text;
    feedback.className = 'feedback ' + (kind || '');
  }

  function acceptedAnswers(stage) {
    return stage.answers.map(norm).filter(Boolean);
  }

  function correctAnswer(stage) {
    if (stage.key === 'album') {
      return item.albumTitle || stage.answers[0] || 'La réponse de ce jour';
    }

    if (stage.key === 'artist') {
      return item.artist || stage.answers[0] || 'La réponse de ce jour';
    }

    if (stage.key === 'track') {
      return stage.answers[0] || 'Un titre de cet album';
    }

    return stage.answers[0] || "L'année de sortie";
  }

  function spotifyTrackUrl(raw) {
    if (!raw) return '';

    const value = String(raw).trim();

    const match = value.match(
      /open\.spotify\.com\/(?:intl-[^/]+\/)?track\/([a-zA-Z0-9]+)/
    );

    if (match) {
      return `https://open.spotify.com/track/${match[1]}`;
    }

    const uri = value.match(/^spotify:track:([a-zA-Z0-9]+)$/);

    return uri
      ? `https://open.spotify.com/track/${uri[1]}`
      : '';
  }

  function showMusicReward() {
    $('reveal-title').textContent = item.albumTitle || 'Album trouvé !';
    $('reveal-artist').textContent = item.artist || '';

    musicReveal.hidden = true;
    $('spotify-player').innerHTML = '';
    $('spotify-fallback').hidden = true;

    const trackUrl = spotifyTrackUrl(item.spotifyTrack);

    if (!trackUrl) {
      $('spotify-fallback').hidden = false;
      $('spotify-fallback').textContent =
        "La réponse est validée ! Le lien Spotify de ce jour sera ajouté dès que tu auras choisi le titre à écouter.";

      musicReveal.hidden = false;
      return;
    }

    musicReveal.hidden = false;

    const player = $('spotify-player');
    const fallback = $('spotify-fallback');

    fallback.hidden = false;
    fallback.innerHTML = '';

    const link = document.createElement('a');
    link.href = trackUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Ouvrir ce titre dans Spotify';

    fallback.appendChild(link);

    if (spotifyController && spotifyController.destroy) {
      spotifyController.destroy();
    }

    player.innerHTML = '<div id="spotify-embed"></div>';

    const createPlayer = (IFrameAPI) => {
      const target = $('spotify-embed');

      if (!target || musicReveal.hidden) return;

      IFrameAPI.createController(
        target,
        {
          width: '100%',
          height: '152',
          url: trackUrl
        },
        (controller) => {
          spotifyController = controller;

          controller.addListener('playback_update', (event) => {
            const data = event.data || {};

            if (!data.isPaused && Number(data.position) >= 60000) {
              controller.pause();
            }
          });
        }
      );
    };

    if (window.SpotifyIframeAPI) {
      createPlayer(window.SpotifyIframeAPI);
    } else {
      window.onSpotifyIframeApiReady = (IFrameAPI) => {
        window.SpotifyIframeAPI = IFrameAPI;
        createPlayer(IFrameAPI);
      };

      if (!spotifyApiRequested) {
        spotifyApiRequested = true;

        const script = document.createElement('script');
        script.src = 'https://open.spotify.com/embed/iframe-api/v1';
        script.async = true;

        document.body.appendChild(script);
      }
    }
  }

  function finishDay() {
    state.completed = true;
    saveProgress();

    input.disabled = true;
    form.querySelector('button').disabled = true;
    skipBonus.hidden = true;

    setFeedback('Bravo ! Tu as terminé le quiz du jour ! 🎉', 'good');

    render();
  }

  function advanceStage() {
    clearTimeout(transitionTimer);

    state.step++;

    if (state.step >= stages.length) {
      finishDay();
      return;
    }

    saveProgress();
    render();
    input.focus();
  }

  function render() {
    const completedCount = Object.entries(progress).filter(
      ([, value]) => value === true || value?.completed
    ).length;

    $('status').textContent = isDone()
      ? 'Déjà trouvé ✓'
      : 'À découvrir';

    $('progress-count').textContent =
      `${completedCount} / ${totalDays} trouvés`;

    $('progress-fill').style.width =
      `${Math.min(100, completedCount / totalDays * 100)}%`;

    const grid = $('day-grid');
    grid.innerHTML = '';

    for (let d = 1; d <= totalDays; d++) {
      const dayData = progress[d];
      const done = dayData === true || !!dayData?.completed;

      const a = document.createElement('a');

      a.className =
        'day' +
        (d === day ? ' current' : '') +
        (done ? ' done' : '');

      a.href = `?jour=${d}`;
      a.textContent = done ? '✓' : d;

      a.setAttribute(
        'aria-label',
        `Jour ${d}${done ? ' trouvé' : ''}`
      );

      grid.appendChild(a);
    }

    if (isDone()) {
      $('quiz-progress').textContent = 'Quiz terminé !';
      $('question-title').textContent = 'Bravo ! 🎉';
      $('question-note').textContent =
        'Tu as terminé les questions obligatoires de cette journée.';

      $('attempt-counter').textContent = '';

      input.disabled = true;
      form.querySelector('button').disabled = true;
      skipBonus.hidden = true;

      showMusicReward();
      return;
    }

    const stage = stages[state.step];

    if (!stage) {
      finishDay();
      return;
    }

    $('quiz-progress').textContent =
      `Question ${state.step + 1} / 4`;

    $('question-title').textContent = stage.title;
    $('question-note').textContent = stage.note;

    input.placeholder = stage.placeholder;
    input.disabled = false;
    input.value = '';

    form.querySelector('button').disabled = false;

    skipBonus.hidden = stage.key !== 'year';

    if (stage.limit !== null) {
      const remaining =
        stage.limit - state.attempts[stage.key];

      $('attempt-counter').textContent =
        `${remaining} essai${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''} sur ${stage.limit}`;
    } else if (stage.key === 'track') {
      $('attempt-counter').textContent = 'Essais illimités';
    } else {
      $('attempt-counter').textContent = 'Question bonus facultative';
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (isDone()) return;

    const stage = stages[state.step];

    if (!stage) return;

    const accepted = acceptedAnswers(stage);

    if (!accepted.length) {
      setFeedback(
        'Cette question n’est pas encore configurée dans answers.js.',
        'bad'
      );
      return;
    }

    const answer = norm(input.value);

    if (!answer) return;

    if (accepted.includes(answer)) {
      setFeedback(
        stage.key === 'year'
          ? 'Bonne réponse ! Tu as trouvé l’année ! ⭐'
          : 'Bonne réponse ! Bravo ! 🎉',
        'good'
      );

      input.disabled = true;
      form.querySelector('button').disabled = true;
      saveProgress();

      transitionTimer = setTimeout(advanceStage, 900);
      return;
    }

    state.attempts[stage.key]++;
    saveProgress();

    if (
      stage.limit !== null &&
      state.attempts[stage.key] >= stage.limit
    ) {
      setFeedback(
        `Dommage ! La bonne réponse était : ${correctAnswer(stage)}. Tu peux passer à la suite !`,
        'bad'
      );

      input.disabled = true;
      form.querySelector('button').disabled = true;

      transitionTimer = setTimeout(advanceStage, 2500);
      return;
    }

    setFeedback(
      'Ce n’est pas encore ça… Essaie encore !',
      'bad'
    );

    render();
    input.focus();
  });

  skipBonus.addEventListener('click', () => {
    if (stages[state.step]?.key !== 'year') return;

    state.bonusSkipped = true;
    setFeedback(
      'Bonus passé ! Voici ta récompense musicale ! 🎶',
      'good'
    );

    input.disabled = true;
    form.querySelector('button').disabled = true;
    skipBonus.hidden = true;

    saveProgress();

    transitionTimer = setTimeout(finishDay, 700);
  });

  reset.addEventListener('click', () => {
    clearTimeout(transitionTimer);

    if (spotifyController && spotifyController.destroy) {
      spotifyController.destroy();
    }

    spotifyController = null;

    state = blankState();

    saveProgress();

    musicReveal.hidden = true;
    $('spotify-player').innerHTML = '';
    $('spotify-fallback').hidden = true;

    setFeedback(
      'Tu peux repartir à zéro pour ce jour. Bonne chance !',
      ''
    );

    render();
    input.focus();
  });

  render();
})();
