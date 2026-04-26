# FossFLOW — Édition NoxzRCW

> **FossFLOW** est un outil open-source de création de diagrammes d'infrastructure en isométrie 3D. Cette version est une évolution visuelle et fonctionnelle du projet original, avec un focus sur l'expérience utilisateur moderne et la compatibilité mobile.

---

## 🙏 Remerciements

Cette version repose sur le travail exceptionnel de **Stan Smith** ([@stan-smith](https://github.com/stan-smith)), créateur original de [FossFLOW](https://github.com/stan-smith/FossFLOW), et sur la bibliothèque [Isoflow](https://github.com/markmanx/isoflow) de **Mark Moxon** ([@markmanx](https://github.com/markmanx)).

> *"I truly stand on the shoulders of a giant here 🫡"* — Stan Smith

Toute la logique de diagrammation isométrique, le moteur de rendu et l'architecture de base sont leur œuvre. Cette fork se concentre sur l'amélioration de l'interface et l'accessibilité mobile.

---

## ✨ Nouveautés de cette version

### 🎨 Refonte UI — Dark Mode & Glassmorphism

- **Thème sombre complet** avec palette bleu/violet inspirée de Vercel et Linear
- **Effet glassmorphism** sur les panneaux flottants (éléments UI, dialogues, menus)
- **Typographie Inter** avec échelle de tailles affinée
- **Scrollbars sombres personnalisées**, couleurs de sélection, et animations subtiles
- **Correction des couleurs hardcodées** en mode clair dans tous les composants

### 📱 Responsive Mobile & Touch

- **Compatibilité complète mobile** — fonctionne sur téléphone et tablette tactile
- **Navigation bottom** sur mobile avec menu hamburger en bottom sheet
- **Pinch-to-zoom** et pan à deux doigts sur le canvas
- **Touch targets** de 44px minimum (conforme WCAG)
- **ToolMenu intelligent** — outils essentiels visibles, overflow menu pour les avancés
- **Dialogues convertis en bottom sheets** sur mobile (glisser vers le haut)
- **Désactivation du pull-to-refresh** et du bounce overscroll

### 🎬 Animations de Flux Réseau

- **Animation des connecteurs** — traits animés simulant le transfert de données
- **Effet glow pulsant** sur les lignes de connexion
- **Flèches de direction** avec pulse doux indiquant le flux actif
- **Animation flottante** des nœuds (mouvement vertical subtil)
- **Effet hover** — scale + ombre portée sur les nœuds
- **Respiration des rectangles** — pulse d'opacité sur les zones

### 🐛 Corrections de Bugs

- **Panning tactile erratique** — correction des sauts de coordonnées massifs qui jetaient la vue hors limites
- **TouchEnd envoyant (0,0)** — forwarding des coordonnées `lastSingleTouch` au lieu de zéro
- **isEmptyArea stale** — lecture dynamique depuis `uiStateApi` au lieu d'une référence obsolète

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Développement local

```bash
# Cloner le repo
git clone https://github.com/NoxzRCW/FossFLOW.git
cd FossFLOW

# Installer les dépendances
npm install

# Builder la librairie (nécessaire la première fois)
npm run build:lib

# Lancer le serveur de développement
npm run dev
```

Ouvrir http://localhost:3000 dans le navigateur.

### Docker

```bash
# Docker Compose (recommandé — persistance incluse)
docker compose up

# Ou Docker Hub directement
docker run -p 80:80 -v $(pwd)/diagrams:/data/diagrams stnsmith/fossflow:latest
```

---

## 🏗️ Structure du Projet

Monorepo contenant deux packages :

- **`packages/fossflow-lib`** — Librairie React de diagrammation réseau (Webpack)
- **`packages/fossflow-app`** — PWA qui encapsule la lib (RSBuild)

### Commandes de développement

```bash
npm run dev          # Serveur de dev app
npm run dev:lib      # Watch mode lib
npm run build        # Build lib + app
npm run build:lib    # Build lib uniquement
npm run build:app    # Build app uniquement
npm test             # Tests unitaires
npm run lint         # Linting
```

---

## 📝 Changelog

### v2.1.0-noxz (2026-03-29)

- ✅ Dark mode + glassmorphism
- ✅ Responsive mobile complet
- ✅ Animations de flux réseau
- ✅ Correction bugs tactiles
- ✅ README modernisé

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Voir [CONTRIBUTORS.md](CONTRIBUTORS.md) du projet original pour les guidelines.

---

## 📜 Licence

MIT — comme le projet original.

---

## 🔗 Liens

- **Version originale** : [stan-smith/FossFLOW](https://github.com/stan-smith/FossFLOW)
- **Démo originale** : [stan-smith.github.io/FossFLOW](https://stan-smith.github.io/FossFLOW/)
- **Librairie Isoflow** : [markmanx/isoflow](https://github.com/markmanx/isoflow)
- **Cette version** : [NoxzRCW/FossFLOW](https://github.com/NoxzRCW/FossFLOW)

---

<p align="center">
  <i>Fork maintenu avec ❤️ par <a href="https://github.com/NoxzRCW">NoxzRCW</a></i>
</p>
