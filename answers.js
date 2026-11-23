// Personnalise ici les 24 jours.
// answers : réponses acceptées, sans souci de majuscules/accents/ponctuation.
// albumTitle et artist : révélés seulement après la bonne réponse.
// spotifyTrack : lien Spotify d'UN TITRE (Partager > Copier le lien du titre), pas seulement de l'album.
// Exemple : "https://open.spotify.com/track/IDENTIFIANT"
window.QUIZ = Array.from({length:24}, (_,i)=>({
  day:i+1,
  question:"Quel est cet album ?",
  note:"Observe la pochette sur ta carte et écris le nom de l’album.",
  answers:[], // Exemple : ["Random Access Memories", "RAM"]
  albumTitle:"",
  artist:"",
  spotifyTrack:"",
  success:"Bravo, tu as trouvé ! 🎶"
}));
