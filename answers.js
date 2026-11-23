// Personnalise ici les 24 jours.
// answers : réponses acceptées, sans souci de majuscules/accents/ponctuation.
// albumTitle et artist : révélés seulement après la bonne réponse.
// spotifyTrack : lien Spotify d'UN TITRE (Partager > Copier le lien du titre), pas seulement de l'album.
// Exemple : "https://open.spotify.com/track/IDENTIFIANT"
window.QUIZ = Array.from({ length: 24 }, (_, i) => ({
  day: i + 1,

  // QUESTION 1 : Quel est cet album ?
  answers: [],

  // QUESTION 2 : Qui est l'artiste ?
  artistAnswers: [],

  // QUESTION 3 : Donne un titre de l'album !
  trackAnswers: [],

  // QUESTION 4 : Trouve l'année !
  yearAnswers: [],

  // INFORMATIONS DE L'ALBUM
  albumTitle: "",
  artist: "",

  // LIEN SPOTIFY D'UN TITRE
  spotifyTrack: ""
}));
