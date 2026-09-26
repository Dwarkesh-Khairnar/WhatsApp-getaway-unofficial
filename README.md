## WhatsApp Gataway Unofficial
- this is not a use unofficial method for work so you risk your number 

## Tech Stacks
   - Frontend
       - React js
       - TailwindCss
         
   - Backend
       - Node js
       - express js
## Strucher

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

## Run and use
 is a two deferent server's so it's need two deferent vps

## Package use
   - @whiskeysockets/baileys

## Privention Needd.....
   try less message (use limits)
