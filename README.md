# GeoBattles

GeoBattles is an open-source interactive geolocation guessing game where players compete to identify locations from Google Street View panoramas.

Experience GeoBattles right away by visiting [geobattles.xyz](https://geobattles.xyz/)!

## 🌍 About the Game

GeoBattles features a **Battle Royale** mode where players can play solo or compete against others to guess locations, with limited lives.

The game offers real-time **multiplayer** functionality, live statistics, and interactive map elements.

### Supports also mobile devices!

GeoBattles is fully responsive and supports mobile devices, allowing players to enjoy the game on smartphones and tablets with an optimized touch interface. It can also be installed as a Progressive Web App (PWA) by adding it to your home screen on iOS and Android devices for a native app-like experience.

# Production setup

To self-host and deploy full game with Docker frontend and backend images see instructions [here](https://github.com/geobattles/geobattles-backend#production-setup).

# Development setup

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm
- Google Maps API key

### Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/geobattles/geobattles-frontend geobattles_frontend
    cd geobattles_frontend
    ```

2. Install dependencies:

    ```bash
    # npm
    npm install

    # pnpm
    pnpm install

    # yarn
    yarn install
    ```

3. Create a `.env` file based on `.env.example` and add your Google Maps API key.

## 🛠️ Development

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev
```

## 🐳 Docker

GeoBattles can also be deployed using Docker for easier setup and consistent environments.

### Running locally with Docker

1. Build the Docker image:

    ```bash
    docker build -t geobattles_frontend .
    ```

2. Run the container:

    ```bash
    docker run -p 3000:3000 \
    -e NUXT_PUBLIC_GMAPS_API=your_api_key \
    -e NUXT_PUBLIC_BACKEND_HOST=your_backend_url \
    geobattles_frontend
    ```
