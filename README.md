# ChoreQuest ⚔️🧹

**ChoreQuest** is a gamified family chore management Progressive Web App (PWA) designed for parents and children. It transforms household responsibilities into an engaging RPG experience where children complete quests, earn XP, level up, and redeem rewards, while parents retain administrative control via protected authentication.

---

## 🚀 Key Features

- 🎮 **Gamified Quests**: Chores converted into RPG tasks with XP, level progression, and point rewards.
- 📱 **Progressive Web App (PWA)**: Built with Workbox service workers, offline capabilities, and native PWA App Badging.
- 🔐 **Local-First Architecture**: 100% functional offline using Web Crypto AES-GCM encrypted IndexedDB storage.
- ⚡ **Real-Time Cloud Sync**: Seamless multi-device sync via Supabase when online with offline mutation queue replay.
- 🔔 **Device Notifications**: Native PWA notifications for quest assignments, completion approvals, and scheduled evening nudges.
- 🛡️ **Parent Protection**: PIN authentication, security question recovery, and randomized math challenge verification.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **State & Persistence**: Zustand (Sliced pattern), IndexedDB (`idb-keyval`), Web Crypto API (AES-GCM 256-bit)
- **PWA & Offline**: `vite-plugin-pwa`, Workbox Service Worker, PWA Web App Badging API
- **Backend & Sync**: Supabase JS Client (PostgreSQL, Realtime Subscriptions, Row-Level Security)

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 📥 Installation & Local Development

1. **Clone the repository**:

   ```bash
   git clone https://github.com/Stardaus/chore-as-a-game.git
   cd chore-as-a-game
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Build for production**:

   ```bash
   npm run build
   ```

5. **Preview production build locally**:
   ```bash
   npm run preview
   ```

---

## 📂 Project Architecture & Documentation

- [docs/ARCHITECTURE.md](file:///Users/nina/development/projects/chore-as-a-game/docs/ARCHITECTURE.md): Architectural layout and module structure.
- [specs/overview.spec.md](file:///Users/nina/development/projects/chore-as-a-game/specs/overview.spec.md): Spec-Driven Development documentation suite.

---

## 📄 License

MIT License. Developed for families.
