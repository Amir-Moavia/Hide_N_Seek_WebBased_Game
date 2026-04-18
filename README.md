# Shadow Protocol: Tactical Infiltration

A high-stakes, top-down stealth action game built with **React**, **TypeScript**, and **HTML5 Canvas**. Navigate through procedurally generated environments, evade detection from intelligent guards, and survive as long as possible.

![Game Preview](./preview.png)

## 🎮 Features

### 🕵️ Dynamic Stealth Mechanics
*   **Concealment Systems**: Use green bushes and shadows to become hidden. When hidden, your visibility to seekers is drastically reduced.
*   **Acoustic Simulation**: Moving creates sound ripples. Walking is quiet, but sprinting (Shift) creates large ripples that alert nearby guards.
*   **Tactical HUD**: Real-time detection alerts (Chase/Search states) and a survival timer.

### 🧠 Intelligent AI Guards
*   **Patrol State**: Guards follow random paths across the map.
*   **Investigation Phase**: If a guard hears a sound, they will deviate from their path to investigate the source.
*   **High-Speed Chase**: Once spotted, guards will pursue you relentlessly until you lose them in cover.

### 📱 Full Multi-Touch Support
*   **Adaptive Controls**: Dedicated joystick and sprint button for mobile devices with robust pointer-capture logic to prevent input conflicts.
*   **Desktop Ready**: Full keyboard support (WASD/Arrows + Shift) with smooth canvas rendering.

### 🛠️ Procedural Missions
*   Every mission is unique! The map layout, obstacle placement, and enemy start positions are generated fresh for every retry.

## 🚀 Tech Stack

*   **Framework**: React 18 (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Animations**: Framer Motion (motion/react)
*   **Rendering**: HTML5 Canvas API

## 📦 Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/shadow-protocol.git
    cd shadow-protocol
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    ```

## 🕹️ How to Play

*   **Objective**: Survive the infiltration for as long as possible without being apprehended.
*   **Movement**: Use **WASD** or the **On-screen Joystick**.
*   **Sprint**: Hold **Shift** or the **RUN button** to move faster (but you'll be noisier!).
*   **Hiding**: Enter green areas (bushes) to reduce guard visibility. A "HIDDEN" indicator will appear when you are safe.

---
Built by Amir Moavia
