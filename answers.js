// Modifie ce fichier pour personnaliser les questions et leurs réponses.
// Chaque jour peut avoir plusieurs réponses acceptées (album, variante, etc.).
// Les réponses sont visibles dans le code source du site : ce jeu est conçu pour un usage convivial, pas anti-triche.
window.QUIZ = Array.from({length:24}, (_,i)=>({
  day:i+1,
  question:"Quel est cet album ?",
  note:"Observe la pochette sur ta carte et écris le nom de l’album.",
  answers:[], // Exemple : ["Random Access Memories", "RAM"]
  success:"Bravo, tu as trouvé ! 🎶"
}));
