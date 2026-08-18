# Portfolio Monorepo (React + Vite)

Unified root repository for the full MERN-stack personal portfolio application, consisting of the public user-facing portfolio website, an administrative dashboard, and a shared Express/MongoDB backend API — all powered by **React + Vite**.

---

## 📁 Repository Structure

```text
Portfolio/
│
├── user/                             # Public User Portfolio Website (React + Vite)
│   ├── index.html                    # Root Vite entry HTML
│   ├── vite.config.js                # Vite configuration (Port 3000)
│   ├── public/
│   ├── src/
│   │   ├── components/               # Header, Hero, About, Skills, Projects, Contact, Footer
│   │   └── App.js
│   ├── package.json
│   └── README.md
│
├── admin/                            # Administrative Control System
│   ├── client/                       # Admin Frontend Dashboard (React + Vite)
│   │   ├── index.html                # Root Vite entry HTML
│   │   ├── vite.config.js            # Vite configuration (Port 3001)
│   │   ├── public/
│   │   ├── src/
│   │   └── package.json
│   │
│   └── server/                       # Backend Express REST API (Node.js & MongoDB)
│       ├── Models/                   # Mongoose Schemas
│       ├── index.js                  # Main server entrypoint (Port 3002)
│       ├── .env.example              # Environment variable template
│       └── package.json
│
├── .gitignore                        # Global repository gitignore
├── package.json                      # Unified root npm scripts
└── README.md                         # Monorepo documentation
```

---

## 🚀 Getting Started & Execution

### 1. Install Dependencies

Install dependencies for all sub-projects:

```bash
# Install Public User Website dependencies
cd user
npm install

# Install Admin Frontend dependencies
cd ../admin/client
npm install

# Install Admin Server dependencies
cd ../server
npm install
```

### 2. Run Applications (Development Mode)

From the repository root (`Portfolio/`), run each service using Vite dev servers:

* **Start Backend API Server** (Port `3002`):
  ```bash
  npm run server
  ```

* **Start Public Portfolio Website** (Vite Dev Server - Port `3000`):
  ```bash
  npm run user
  ```

* **Start Admin Dashboard Client** (Vite Dev Server - Port `3001`):
  ```bash
  npm run admin
  ```

---

## 🛠️ Production Build & Preview Commands

Build static frontend production bundles using Vite (`dist/` output):

```bash
# Build User Public Website
npm run user:build

# Preview User Website Build
npm run user:preview

# Build Admin Dashboard Frontend
npm run admin:build

# Preview Admin Dashboard Build
npm run admin:preview
```
