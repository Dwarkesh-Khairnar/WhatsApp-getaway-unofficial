### Strucher

    whatsapp-gateway/
    ├── api/                  # Express API Backend (Vercel Serverless compatible)
    │   ├── index.js          # Entry point & Middleware config
    │   ├── config.js         # Environment & DB adapters
    │   ├── sessions.js       # Baileys WhatsApp connection manager
    │   ├── routes.js         # API endpoints (Auth, Sessions, Messages, Webhooks)
    │   └── package.json
    ├── src/                  # React Frontend Dashboard
    │   ├── App.jsx           # Dashboard Core UI
    │   ├── index.css         # Tailwind styling
    │   └── package.json
    ├── package.json          # Workspace root
    └── vercel.json           # Vercel deployment routing mapping