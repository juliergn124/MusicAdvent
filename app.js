(() => {
  const quiz = window.QUIZ || [];
  const params = new URLSearchParams(location.search);
  const requested = Number(params.get('jour') || params.get('day') || 1);
  const day = Math.min(24, Math.max(1, Number.isFinite(requested) ? requested : 1));
  const item = quiz.find(q => q.day === day) || quiz[day-1];
  const storageKey = 'adventMusicQuiz_v1';
  const readProgress = () => { try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}} };
  const progress = readProgress();
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const $ = id => document.getElementById(id);
  $('day-label').textContent = `Jour ${day} / 24`;
  $('question-title').textContent = item?.question || 'Question du jour';
  $('question-note').textContent = item?.note || '';
  const accepted = (item?.answers || []).map(norm).filter(Boolean);
  const form = $('answer-form'), input=$('answer'), feedback=$('feedback'), reset=$('reset-day');
  const isDone = () => !!progress[day];
  function setFeedback(text,kind){feedback.textContent=text;feedback.className='feedback '+(kind||'');}
  function render(){
    $('status').textContent=isDone()?'Déjà trouvé ✓':'À découvrir';
    $('progress-count').textContent=`${Object.keys(progress).filter(k=>progress[k]).length} / 24 trouvés`;
    $('progress-fill').style.width=`${Math.min(100,Object.keys(progress).filter(k=>progress[k]).length/24*100)}%`;
    const grid=$('day-grid');grid.innerHTML='';
    for(let d=1;d<=24;d++){
      const a=document.createElement('a');a.className='day'+(d===day?' current':'')+(progress[d]?' done':'');a.href=`?jour=${d}`;a.textContent=progress[d]?'✓':d;a.setAttribute('aria-label',`Jour ${d}${progress[d]?' trouvé':''}`);grid.appendChild(a);
    }
    if(isDone()){input.disabled=true;form.querySelector('button').disabled=true;setFeedback('Déjà validé ! Bravo encore 🎉','good');}
  }
  form.addEventListener('submit',e=>{
    e.preventDefault();if(!accepted.length){setFeedback('Ce jour n’est pas encore configuré. Ajoute la bonne réponse dans answers.js.','bad');return;}
    if(accepted.includes(norm(input.value))){progress[day]=true;localStorage.setItem(storageKey,JSON.stringify(progress));setFeedback(item.success||'Bonne réponse ! 🎉','good');input.disabled=true;form.querySelector('button').disabled=true;render();}
    else setFeedback('Ce n’est pas encore ça… Essaie encore !','bad');
  });
  reset.addEventListener('click',()=>{delete progress[day];localStorage.setItem(storageKey,JSON.stringify(progress));input.disabled=false;form.querySelector('button').disabled=false;input.value='';setFeedback('Tu peux repartir à zéro pour ce jour.','');render();input.focus();});
  render();
})();
