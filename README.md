# RoadBuddy – 24/7 Roadside Assistance

RoadBuddy is an on-demand roadside assistance platform that instantly connects stranded drivers with nearby mechanics and emergency vehicle services.

## Features

- 🚗 **Request Help** — Submit an SOS request with GPS location and vehicle details
- 🔧 **Nearby Mechanics** — Find and connect with nearby service providers in real-time
- 🤝 **Partner Program** — Mechanics and tow truck operators can join as service partners
- 💬 **AI Chatbot** — Get instant help and guidance via the built-in chatbot
- 📍 **Live Dispatch** — Real-time tracking of your assigned service provider

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Maps**: Leaflet + OpenStreetMap
- **Backend**: Supabase (Auth, Database, Edge Functions)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at [http://localhost:8080](http://localhost:8080).

### Build

```bash
npm run build
```

## Project Structure

```
src/
├── assets/         # Static assets (images, etc.)
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── integrations/   # Third-party integrations (Supabase)
├── lib/            # Utility functions
├── pages/          # Page components (Home, Request Help, Join Partner)
└── test/           # Test files
```

## Brand Colors

- **Primary**: Orange (`#FF6B00`)
- **Secondary**: Dark Navy / Black

## License

© 2026 RoadBuddy. All rights reserved.
