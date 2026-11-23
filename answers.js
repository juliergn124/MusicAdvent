// Personnalise ici les 24 jours.
// answers : réponses acceptées, sans souci de majuscules/accents/ponctuation.
// albumTitle et artist : révélés seulement après la bonne réponse.
// spotifyTrack : lien Spotify d'UN TITRE (Partager > Copier le lien du titre), pas seulement de l'album.
// Exemple : "https://open.spotify.com/track/IDENTIFIANT"
window.QUIZ = Array.from({ length: 24 }, (_, i) => ({
  day: i + 1,

  // QUESTION 1 : Quel est cet album ?
  answers: ["American garage"],

  // QUESTION 2 : Qui est l'artiste ?
  artistAnswers: [
    "Pat Metheny",
    "Pat Metheny Group",
    "Pat Metheny Group, Lyle Mays",
    "Pat Metheny, Lyle Mays",
    "Pat Metheny, Pat Metheny Group, Lyle Mays"
  ],

  // QUESTION 3 : Donne un titre de l'album !
  trackAnswers: [
    "Heartland",
    "Airstream",
    "The search",
    "American garage",
    "The epic"
  ],

  // QUESTION 4 : Trouve l'année !
  yearAnswers: ["1979"],

  // INFORMATIONS DE L'ALBUM
  albumTitle: "American garage",
  artist: "Pat Metheny, Pat Metheny Group, Lyle Mays",

  // LIEN SPOTIFY D'UN TITRE
  spotifyTrack: "https://open.spotify.com/track/6y7jqkRyKwK42B94iQvQPn?si=BVIjq4LiRm-dNI9H12ydig&utm_source=copy-link"
}));
