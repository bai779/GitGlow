# 🌟 GitGlow — Interactive Git Branching Visualizer & Game

GitGlow is an ultra-premium, interactive, game-like web application designed to help developers visualize Git trees and practice Git commands in a sandbox or via structured challenges. 

By typing commands in a mock CLI terminal, users watch a dynamic, glowing SVG graph animate changes in commits, branches, merges, rebases, and resets in real-time.

---

## 🎨 Preview & Aesthetics

*   **Cyber Dark Theme**: A deep-space slate background featuring semi-transparent glassmorphic cards.
*   **Glowing SVG Graph**: Custom Bezier curves connecting neon-glowing commit nodes, with different colors automatically assigned to distinct branches.
*   **Smooth Micro-Animations**: Watch branch pointer labels slide, and checkout nodes pulse when commands are executed.
*   **Win Celebrate Effects**: Confetti bursts shower the screen when you resolve level objectives.

---

## 🚀 Key Features

*   **Interactive Git Simulator Engine**: Runs entirely client-side in the browser. Supports command syntax like `commit`, `checkout`, `switch`, `branch`, `merge`, `rebase`, `cherry-pick`, `reset`, `tag`, `log`, and `status`.
*   **10 Challenge Levels**: Ranging from basic commit mechanics to complex branch combinations (rebase, cherry-pick, detached HEAD, relative references like `HEAD^` and `HEAD~2`).
*   **Sandbox Playground**: A free mode where you can run any arbitrary combination of Git commands without level objectives.
*   **Tabbed Cheat Sheet**: Side-panel for beginners to check commands. Clicking any command automatically inserts it into the terminal.
*   **Undo & Redo Engine**: Run `git undo` or `git redo` to easily step back and forward through your actions.

---

## 🛠️ Technology Stack

*   **Framework**: React 19 (TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Modern Vanilla CSS3 (Custom Variables, Flexbox, Grids, and Keyframes)
*   **Icons**: Lucide React
*   **Celebration Effect**: Canvas-confetti

---

## 💻 Getting Started

Follow these steps to run GitGlow locally on your machine:

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/bai779/GitGlow.git
    cd GitGlow
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start development server**:
    ```bash
    npm run dev
    ```

4.  Open your browser and navigate to the local URL (usually `http://localhost:5173`).

---

## 🎮 Game Play Instructions

1.  Read the **Objective** at the top of the challenge card.
2.  Type commands into the interactive terminal prompt at the bottom (e.g., `git checkout -b bugFix` -> `git commit`).
3.  Watch the commit graph on the center canvas dynamically update.
4.  If you make a mistake, type `git undo` to revert the last command.
5.  Match the target criteria of the level to win!

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
