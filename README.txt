ECOTWIN FRONTEND — EDITORIAL NAV UPDATE

This package contains three replacement files for your existing React + Vite frontend:
- frontend/src/App.jsx
- frontend/src/App.css
- frontend/src/index.css

WHAT CHANGED
- Navigation moved to the top-right, with the EcoTwin wordmark on the left.
- Removed the fixed sidebar, dashboard breadcrumb, and demo/avatar toolbar.
- Added a responsive mobile menu and active navigation underline.
- Shifted the palette toward natural campus greens and warm muted typography, with more restrained borders and shadows.
- Kept the existing five routes and the GSAP home-page scroll animations.

INSTALL INTO YOUR PROJECT
1. Extract this ZIP.
2. Copy the three files inside frontend/src into your existing project folder:
   C:\Users\Prajwal B Shivanagi\OneDrive\Desktop\Eco twin\frontend\src
3. Choose Replace when prompted.
4. Do NOT replace main.jsx, package.json, Python files, or the SQLite database.
5. With the frontend terminal in the frontend folder, run `npm run dev` (if already running, simply save the files and refresh the browser).

NOTE
This is an original EcoTwin layout inspired by the cinematic/immersive direction of Falak, not a pixel-for-pixel copy of their site or assets. Metrics and the schematic campus map are still demo placeholders. The actual Plotly map hover readings will need to be connected to your Python backend in a separate step.
