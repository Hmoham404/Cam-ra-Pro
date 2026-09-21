# Production Sheet Reader

Application française de lecture de fiches de production. Next.js, React, TypeScript, Tailwind CSS, Tesseract.js, jsPDF et IndexedDB. Aucun compte, backend, service OCR distant ou variable d’environnement.

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Node.js 20.9 minimum. `postinstall` copie le worker OCR, les fichiers WebAssembly et les modèles français/anglais dans `public/ocr`. Ils sont servis depuis le même hébergement ; aucune image n’est transmise.

## Vérification et déploiement

```bash
npm run typecheck
npm test
npm run build
```

Le build produit un site entièrement statique dans `out/`. Importer le dépôt dans Vercel avec le preset Next.js et la commande `npm run build`. Aucun secret ni service de données à configurer. Pour servir le build localement, utiliser un serveur de fichiers statiques. `next start` ne convient pas à cet export.

Avec Google Chrome installé et le serveur de développement actif sur le port 3000, `npm run test:browser` vérifie le véritable OCR, le PDF, l’historique, les préférences et la navigation mobile. Les captures et le PDF de test sont placés dans `test-results/`.

## Utilisation

1. Choisir le département et le type de fiche.
2. Cliquer sur **Prendre une photo** pour ouvrir la webcam du PC ou la caméra du téléphone. Autoriser la caméra, capturer puis valider la photo (ou la reprendre). L’import JPG, PNG ou WEBP (20 Mo max) reste disponible.
3. Corriger l’orientation puis cliquer sur **Analyser et créer le PDF**. Le rapport est généré et sauvegardé localement dès la fin de l’analyse, sans formulaire intermédiaire ni validation obligatoire.
4. Consulter le PDF directement dans l’application : pages, zoom, plein écran. Le lecteur PDF.js utilise uniquement des ressources locales et ne dépend pas du lecteur PDF intégré au navigateur.
5. Renommer avec le crayon, télécharger ou partager le fichier. Cliquer sur **Nouvelle fiche** pour l’image suivante ; chaque image produit un rapport distinct.

Le rapport contient le titre, les données détectées, les tableaux structurés quand ils sont reconnus, la transcription complète et la photo originale sur une page dédiée. Il porte la mention « Lecture OCR automatique » : il n’affirme pas que les données ont été validées par une personne.

La caméra utilise `getUserMedia` (vidéo uniquement, aucun microphone). Elle nécessite HTTPS ou localhost et l’autorisation du navigateur. Le flux s’arrête à la capture ou à la fermeture. `npm run test:camera` teste la capture et les rapports avec une webcam simulée par Chrome, sans accéder à la caméra physique. Voir la [documentation de l’accès caméra](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

Le nom automatique suit `Rapport_[Departement]_[AAAAMMJJ]_[HHMMSS]_[identifiant].pdf`, en heure locale de l’appareil. Exemple : `Rapport_Injection_20260921_140709_a1b2c3.pdf`. La date du document n’est ajoutée que si elle est détectée. Le renommage depuis la lecture ou l’historique met à jour le fichier local sauvegardé.

## Téléphone, Mac et Telegram

- Interface responsive, commandes tactiles et lecteur PDF local compatibles avec les navigateurs modernes Chrome/Safari. La capture native `capture="environment"` est proposée sur mobile en complément de la caméra intégrée.
- L’application doit être publiée en HTTPS pour fonctionner depuis un téléphone. `localhost` désigne le téléphone lui-même lorsqu’il est ouvert sur le téléphone.
- Le bouton **Partager** utilise le menu de partage du système si les fichiers PDF sont acceptés. L’utilisateur choisit ensuite Telegram ou une autre application. Le code n’envoie jamais automatiquement un fichier à un contact.
- Dans certains navigateurs intégrés à Telegram, la caméra, le téléchargement des URL Blob ou le partage peuvent être limités. L’aperçu local reste disponible ; le guide recommande d’ouvrir l’application dans Safari/Chrome en cas de blocage.
- Aucun bot Telegram, token ou envoi serveur n’est configuré. Une intégration avec un logiciel nommé « MyC » nécessite d’identifier ce logiciel et son format d’échange.
- Le [partage de fichiers dépend des capacités du navigateur](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share). La méthode de téléchargement d’une [Mini App Telegram](https://core.telegram.org/bots/webapps) attend une URL HTTPS de fichier ; les PDF privés de cette application restent des fichiers locaux.

L’historique conserve au plus 50 fiches avec leurs PDF. Le dashboard utilise exclusivement cet historique. Le taux de rebut moyen est la moyenne arithmétique des taux par fiche. Les défauts sont classés par nombre de fiches qui les mentionnent.

## Limites et confidentialité

- Le parseur reconnaît les lignes `Heure Quantité OK NOK Observation` et les tableaux réguliers séparés par espaces multiples, tabulations ou `|`, avec en-tête et au moins deux lignes. La reconstitution de tableaux complexes n’est pas garantie ; la transcription et la photo restent dans le PDF.
- Rotation manuelle par quarts de tour ; pas de correction automatique de perspective.
- Les types de fiches partagent le parseur générique. `registerParser(department, type, parser)` permet des adaptations par atelier et format dans `lib/parser.ts`.
- Le moteur et ses langues sont des ressources statiques servies avec le site. Le fonctionnement entièrement hors ligne n’est pas garanti (pas de service worker).
- Les images originales restent en mémoire et une copie redimensionnée (1 800 px maximum) est intégrée au PDF local. Les PDF et les données sont stockés dans IndexedDB, sans chiffrement applicatif.
- L’effacement des données du navigateur supprime l’historique. Télécharger les PDF importants.
- La capture mobile dépend du navigateur et de l’appareil. L’import de fichiers reste disponible.

## Organisation

`app/` : lecture, dashboard, historique, paramètres, guide. `components/` : composants d’interface. `lib/` : OCR, traitement d’image, parseur extensible, calculs, PDF et stockage. `types/` : modèles de données. `tests/` : tests des calculs, du parseur et du stockage local.

L’export statique suit la [documentation Next.js](https://nextjs.org/docs/app/guides/static-exports). L’installation locale du moteur suit la [documentation Tesseract.js](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md).
