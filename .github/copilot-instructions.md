# GitHub Copilot Instructions for GeoBattles

## Project Context

GeoBattles is a geography-based educational game where players compete by identifying locations on a map. It is a multiplayer game. Each client is connected to the server via
websocket. All in game communications go through websockets.

## Technologies

- Nuxt 3 for the frontend framework
- TypeScript for type-safe code
- PrimeVue V4 for UI components
- Tailwind CSS for styling
- Pinia for state management
- WebSockets for real-time communication

## Code Style Guidelines

- Use TypeScript for all new code
- Follow functional programming patterns where possible
- Use descriptive variable names that reflect their purpose
- Include JSDoc comments for all functions and classes
- Use async/await instead of raw Promises when handling asynchronous code

## Architecture Preferences

- Follow component-based architecture for frontend code
- Implement state management using Pinia stores
- Keep components small and focused on a single responsibility

## Error Handling

- Always include comprehensive error handling in all async functions
- Use meaningful error messages that help debugging
- Log errors appropriately before handling them

## Dependencies

- Prefer native solutions over adding new dependencies
- Suggest lightweight alternatives to heavy libraries
- Consider bundle size impact when suggesting new dependencies

## Folder Structure

├── .devcontainer
└── devcontainer.json
├── .dockerignore
├── .env.example
├── .github
├── dependabot.yml
└── workflows
│ └── build-publish.yml
├── .gitignore
├── .prettierignore
├── .prettierrc
├── .vscode
└── settings.json
├── Dockerfile
├── LICENSE
├── README.md
├── app.vue
├── components
├── Gameplay
│ ├── BattleRoyale
│ │ └── LiveStatistics.vue
│ ├── CountryBattle
│ │ └── LiveStatistics.vue
│ ├── GoogleMap.vue
│ ├── GooglePanorama.vue
│ ├── LostConnectionDialog.vue
│ ├── Menu.vue
│ ├── TimerBar.vue
│ ├── TotalStatistics.vue
│ └── Views
│ │ ├── CountdownView.vue
│ │ ├── EndGameView.vue
│ │ ├── GameplayView.vue
│ │ └── MidRoundView.vue
├── Header.vue
├── Helpers
│ └── AnimateScore.vue
├── Lobby
│ ├── DisplaySettings.vue
│ ├── InviteLink.vue
│ ├── Leave.vue
│ ├── ModifySettings.vue
│ ├── PlayerList.vue
│ ├── ScoreVisualizer.vue
│ ├── Settings
│ │ ├── Attempts.vue
│ │ ├── Countries.vue
│ │ ├── GameMode.vue
│ │ ├── MaxPlayers.vue
│ │ ├── Name.vue
│ │ ├── Rounds.vue
│ │ ├── ScoreFactor.vue
│ │ ├── Timer.vue
│ │ └── Toggle.vue
│ └── StartGame.vue
├── Login.vue
├── Socket
│ └── ConnectionStatus.vue
├── Svgs
│ ├── HeartIcon.vue
│ ├── TrophyIcon.vue
│ └── UserIcon.vue
└── Version.vue
├── composables
├── countries.ts
├── index.ts
├── player.ts
├── services
│ ├── UIManager.ts
│ ├── authService.ts
│ ├── lobbyService.ts
│ └── websocket
│ │ ├── heartbeatService.ts
│ │ ├── pingMonitorService.ts
│ │ └── reconnectionService.ts
├── socketHandlers.ts
└── utils
│ ├── lobbyUtils.ts
│ ├── networkUtils.ts
│ ├── parseJwt.ts
│ ├── useCountdown.ts
│ └── useTimer.ts
├── middleware
└── dev.global.ts
├── nuxt.config.ts
├── package-lock.json
├── package.json
├── pages
├── about.vue
├── gameplay-[id].vue
├── index.vue
├── lobby
│ ├── [id].vue
│ ├── join.vue
│ └── list.vue
├── profile.vue
└── signup.vue
├── public
├── gameplay
│ └── map-icons
│ │ └── location.svg
├── images
│ ├── earth.webp
│ └── flags32.webp
└── logo.png
├── server
└── tsconfig.json
├── stores
├── AppStore.ts
├── AuthStore.ts
├── GameMode.ts
├── GoogleStore.ts
├── LobbyStore.ts
├── WebSocketStore.ts
├── gamemodes
│ ├── battleRoyaleStore.ts
│ └── countryBattleStore.ts
├── resultsStore.ts
└── uiManagerStore.ts
├── tsconfig.json
└── types
├── appTypes.ts
└── socketTypes.ts
