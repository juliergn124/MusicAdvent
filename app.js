(() => {
  const quiz = window.QUIZ || [];
  const params = new URLSearchParams(location.search);
  const requested = Number(params.get('jour') || params.get('day') || 1);
  const day = Math.min(Math.max(1, quiz.length || 24), Math.max(1, Number.isFinite(requested) ? requested : 1));
  const item = quiz.find(q => q.day === day) || quiz[day-1];
  const totalDays = quiz.length || 24;
  const storageKey = 'adventMusicQuiz_v1';
  const readProgress = () => { try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}} };
  const progress = readProgress();
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const $ = id => document.getElementById(id);
  $('day-label').textContent = `Jour ${day} / ${totalDays}`;
  $('question-title').textContent = item?.question || 'Question du jour';
  $('question-note').textContent = item?.note || '';
  const accepted = (item?.answers || []).map(norm).filter(Boolean);
  const form = $('answer-form'), input=$('answer'), feedback=$('feedback'), reset=$('reset-day');
  const musicReveal=$('music-reveal');
  let spotifyController = null;
  let spotifyApiRequested = false;
  let spotifyStopHandler = null;
  const isDone = () => !!progress[day];
  function setFeedback(text,kind){feedback.textContent=text;feedback.className='feedback '+(kind||'');}

  function spotifyTrackUrl(raw) {
    if (!raw) return '';
    const value = String(raw).trim();
    const match = value.match(/open\.spotify\.com\/(?:intl-[^/]+\/)?track\/([a-zA-Z0-9]+)/);
    if (match) return `https://open.spotify.com/track/${match[1]}`;
    const uri = value.match(/^spotify:track:([a-zA-Z0-9]+)$/);
    return uri ? `https://open.spotify.com/track/${uri[1]}` : '';
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
      $('spotify-fallback').textContent = 'La réponse est validée ! Le lien Spotify de ce jour sera ajouté dès que tu auras choisi le titre à écouter.';
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
    if (spotifyController && spotifyController.destroy) spotifyController.destroy();
    player.innerHTML = '<div id="spotify-embed"></div>';
    const createPlayer = (IFrameAPI) => {
      const target = $('spotify-embed');
      if (!target || !musicReveal || musicReveal.hidden) return;
      IFrameAPI.createController(target, {
        width: '100%', height: '152', url: trackUrl
      }, (controller) => {
        spotifyController = controller;
        controller.addListener('playback_update', (event) => {
          const data = event.data || {};
          if (!data.isPaused && Number(data.position) >= 60000) {
            controller.pause();
          }
        });
      });
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

  function render(){
    $('status').textContent=isDone()?'Déjà trouvé ✓':'À découvrir';
    const count=Object.keys(progress).filter(k=>progress[k]).length;
    $('progress-count').textContent=`${count} / ${totalDays} trouvés`;
    $('progress-fill').style.width=`${Math.min(100,count/totalDays*100)}%`;
    const grid=$('day-grid');grid.innerHTML='';
    for(let d=1;d<=totalDays;d++){
      const a=document.createElement('a');a.className='day'+(d===day?' current':'')+(progress[d]?' done':'');a.href=`?jour=${d}`;a.textContent=progress[d]?'✓':d;a.setAttribute('aria-label',`Jour ${d}${progress[d]?' trouvé':''}`);grid.appendChild(a);
    }
    if(isDone()){
      input.disabled=true;form.querySelector('button').disabled=true;
      setFeedback(item.success||'Bonne réponse ! 🎉','good');
      showMusicReward();
    }
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();if(!accepted.length){setFeedback('Ce jour n’est pas encore configuré. Ajoute la bonne réponse dans answers.js.','bad');return;}
    if(accepted.includes(norm(input.value))){
      progress[day]=true;localStorage.setItem(storageKey,JSON.stringify(progress));
      setFeedback(item.success||'Bonne réponse ! 🎉','good');input.disabled=true;form.querySelector('button').disabled=true;
      render();
    } else setFeedback('Ce n’est pas encore ça… Essaie encore !','bad');
  });
  reset.addEventListener('click',()=>{
    delete progress[day];localStorage.setItem(storageKey,JSON.stringify(progress));
    input.disabled=false;form.querySelector('button').disabled=false;input.value='';
    musicReveal.hidden=true;
    if(spotifyController && spotifyController.destroy) spotifyController.destroy();
    spotifyController=null;
    setFeedback('Tu peux repartir à zéro pour ce jour.','');render();input.focus();
  });
  render();
})();
