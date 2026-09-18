# 🚨 ResQRoute — Dynamic Emergency Escape & Evacuation Intelligence

> **“Most navigation apps find the fastest route. ResQRoute finds the safest route when the city is in danger.”**

[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-3.6_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet_1.9-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

**ResQRoute** is a mission-critical emergency evacuation decision engine and navigation platform designed for catastrophic scenarios — flash floods, landslides, wildfires, structural hazards, and earthquakes. Instead of conventional shortest-distance algorithms, ResQRoute combines real-time geospatial routing, simulated IoT sensor telemetry, human physiological vulnerability indexing, and **Google Gemini 3.6 Flash** to guide citizens and first responders to verified safe havens.

---

## 🌟 Key Capabilities

### 1. 🤖 Google Gemini 3.6 Flash Integration
- **Contextual Route Scoring**: Evaluates candidate evacuation paths considering environmental danger zones, weather surges, and road clearance to calculate a normalized **0–100 Safety Score**.
- **Live Emergency AI Chat**: Interactive assistant providing real-time triage guidance, survival checklists, and evacuation advisories based on the user's specific location and vulnerabilities.
- **Server-Side Security**: All Gemini API interactions are proxied securely through the backend server, keeping API keys protected.

### 2. 🛰️ Dynamic GPS & Live Infrastructure Discovery
- **Web Geolocation API**: One-tap acquisition of real device GPS coordinates with accuracy telemetry.
- **Live Places API**: Automatically discovers nearest verified emergency shelters, Level-1 trauma hospitals, and community relief centers.
- **Topographic Terrain Presets**: Quick-switch presets for testing diverse disaster geographies (Downtown Metropolis, Riverfront Embankment, Mountain Ridge Pass, Coastal Harbor, Suburban Valley).

### 3. 🗺️ Turn-by-Turn 5-Step Strategic Itinerary
- Condenses raw navigation paths into **5 clear, high-priority strategic milestones**:
  1. **Step 1 (START)**: Verified departure point with active GPS fix.
  2. **Step 2 (JUNCTION)**: Primary arterial merge into the illuminated safe corridor.
  3. **Step 3 (HIGH GROUND)**: Elevated ridge bypass with positive elevation margin (+18m MSL).
  4. **Step 4 (APPROACH)**: Emergency relief perimeter ingress with emergency transit priority.
  5. **Step 5 (SAFE HAVEN)**: Confirmed shelter arrival with capacity and medical post status.
- **Interactive Map Pan**: Clicking any milestone step centers the tactical map directly onto that checkpoint.

### 4. 📶 100% Offline-Ready Vector Tile Engine
- **Offline Map Pack**: Pre-caches vector map tiles and elevation contours into IndexedDB/LocalCache.
- **Simulated Disaster Disconnection**: Test route calculation and GPS navigation when cell towers collapse and internet connection is completely severed.

### 5. 🏎️ In-Transit Driver HUD & Emergency SOS
- **Tactical Head-Up Display (HUD)**: Night/high-contrast driver display with turn previews, speedometer, MSL elevation meter, inundation clearance gap, and remaining travel time.
- **Hazard Reporting & Detour Re-routing**: One-tap obstruction reporting (debris/submerged roads) with dynamic 15ms graph recalculation.
- **One-Tap SOS Broadcast**: Instant location and itinerary broadcast to emergency mesh networks, first responders, and family contacts.

### 6. 🔬 Interdisciplinary Multi-Objective Architecture
- **Bioinformatics & Personalized Risk**: Tailors routing costs to vulnerable members (Elderly: penalizes >8% slopes; Injured: prioritizes ICU hospitals; Children: prioritizes calm low-panic shelters; Disabled: strictly paved roads).
- **Civil Infrastructure Risk**: Penalizes flood plain depressions, bridge overload limits, and slope shear angles.
- **IoT & Sensor Fusion**: Real-time feeds from ultrasonic river gauges, inclinometers, and rain radar feed directly into edge weights.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion, Lucide React
- **Mapping & GIS**: Leaflet, Stadia Maps (Alidade Smooth Dark, Outdoors, Satellite), OSRM Road Routing
- **AI & Reasoning**: Google Gemini 3.6 Flash (`@google/genai` SDK)
- **Backend & Middleware**: Express, Node.js, Vite Middleware / Static Production Bundler
- **Audio & Sensory**: Web Audio API synthesized warning alerts and beacon sirens

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or later)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/aayushtyagi00/resqroute-emergency-escape-planner.git
cd resqroute-emergency-escape-planner
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy the sample environment file:
```bash
cp .env.example .env
```
Open `.env` and add your API credentials:
```env
# Google Gemini API Key (Required for AI Safety Scoring and Advisor Chat)
GEMINI_API_KEY="your_gemini_api_key_here"
GEMINI_MODEL="gemini-3.6-flash"

# Stadia Maps API Key (Optional - for high-resolution vector cartography)
STADIA_MAPS_API_KEY="your_stadia_maps_api_key_here"
```

> [!TIP]
> Get a free Gemini API key at [ai.google.dev](https://ai.google.dev/).

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building for Production

To create an optimized production build and bundle the server:

```bash
npm run build
```

To start the production server:
```bash
npm start
```
The server will bind to `http://0.0.0.0:3000` (or the port specified by the `PORT` environment variable).

---

## 🌐 Deploying to the Web (Free on Render)

1. Push this repository to your GitHub account.
2. Sign in to [Render.com](https://render.com) and click **New + > Web Service**.
3. Connect your `resqroute-emergency-escape-planner` repository.
4. Set the following options:
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
5. In the **Environment Variables** section, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
   - `STADIA_MAPS_API_KEY`: *(Your Stadia Maps API Key)*
6. Click **Deploy Web Service**. Render will build and provide a live public HTTPS URL!

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
