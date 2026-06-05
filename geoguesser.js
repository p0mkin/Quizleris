/**
 * geoguesser.js — GeoGuesser game mode for Quizleris
 * Uses Google Maps JavaScript API (Street View + Maps)
 */

import { renderStartMenu } from "./menu.js";

// ─── Constants ─────────────────────────────────────────────────────────────
const ROUNDS_PER_GAME = 5;
const MAX_SCORE_PER_ROUND = 5000;
const SCORE_DECAY_KM = 2000; // km at which score drops to ~13%

// ─── State ──────────────────────────────────────────────────────────────────
let googleMapsLoaded = false;
let panorama = null;
let guessMap = null;
let guessMarker = null;
let revealOverlay = null;
let currentRound = 0;
let roundScores = [];
let currentLocation = null;
let guessSubmitted = false;

// ─── Curated Location Pool (200+ global coords) ─────────────────────────────
const LOCATIONS = [
    // EUROPE
    { lat: 48.8584, lng: 2.2945, label: "Paris, France" },
    { lat: 51.5007, lng: -0.1246, label: "London, UK" },
    { lat: 41.9028, lng: 12.4964, label: "Rome, Italy" },
    { lat: 40.4168, lng: -3.7038, label: "Madrid, Spain" },
    { lat: 52.5200, lng: 13.4050, label: "Berlin, Germany" },
    { lat: 59.9139, lng: 10.7522, label: "Oslo, Norway" },
    { lat: 55.6761, lng: 12.5683, label: "Copenhagen, Denmark" },
    { lat: 60.1699, lng: 24.9384, label: "Helsinki, Finland" },
    { lat: 47.3769, lng: 8.5417, label: "Zurich, Switzerland" },
    { lat: 48.2082, lng: 16.3738, label: "Vienna, Austria" },
    { lat: 50.0755, lng: 14.4378, label: "Prague, Czech Republic" },
    { lat: 47.4979, lng: 19.0402, label: "Budapest, Hungary" },
    { lat: 52.2297, lng: 21.0122, label: "Warsaw, Poland" },
    { lat: 59.4370, lng: 24.7536, label: "Tallinn, Estonia" },
    { lat: 54.6872, lng: 25.2797, label: "Vilnius, Lithuania" },
    { lat: 56.9460, lng: 24.1059, label: "Riga, Latvia" },
    { lat: 37.9838, lng: 23.7275, label: "Athens, Greece" },
    { lat: 41.0082, lng: 28.9784, label: "Istanbul, Turkey" },
    { lat: 44.8176, lng: 20.4633, label: "Belgrade, Serbia" },
    { lat: 43.8563, lng: 18.4131, label: "Sarajevo, Bosnia" },
    { lat: 64.1355, lng: -21.8954, label: "Reykjavik, Iceland" },
    { lat: 38.7223, lng: -9.1393, label: "Lisbon, Portugal" },
    { lat: 45.4654, lng: 9.1859, label: "Milan, Italy" },
    { lat: 43.2965, lng: 5.3698, label: "Marseille, France" },
    { lat: 53.3498, lng: -6.2603, label: "Dublin, Ireland" },
    { lat: 55.9533, lng: -3.1883, label: "Edinburgh, Scotland" },
    { lat: 50.8503, lng: 4.3517, label: "Brussels, Belgium" },
    { lat: 52.3676, lng: 4.9041, label: "Amsterdam, Netherlands" },

    // ASIA
    { lat: 35.6762, lng: 139.6503, label: "Tokyo, Japan" },
    { lat: 37.5665, lng: 126.9780, label: "Seoul, South Korea" },
    { lat: 39.9042, lng: 116.4074, label: "Beijing, China" },
    { lat: 31.2304, lng: 121.4737, label: "Shanghai, China" },
    { lat: 22.3193, lng: 114.1694, label: "Hong Kong" },
    { lat: 1.3521, lng: 103.8198, label: "Singapore" },
    { lat: 13.7563, lng: 100.5018, label: "Bangkok, Thailand" },
    { lat: 21.0285, lng: 105.8542, label: "Hanoi, Vietnam" },
    { lat: 10.8231, lng: 106.6297, label: "Ho Chi Minh City, Vietnam" },
    { lat: 3.1390, lng: 101.6869, label: "Kuala Lumpur, Malaysia" },
    { lat: 28.6139, lng: 77.2090, label: "New Delhi, India" },
    { lat: 19.0760, lng: 72.8777, label: "Mumbai, India" },
    { lat: 12.9716, lng: 77.5946, label: "Bangalore, India" },
    { lat: 23.8103, lng: 90.4125, label: "Dhaka, Bangladesh" },
    { lat: 33.6938, lng: 73.0652, label: "Islamabad, Pakistan" },
    { lat: 33.8869, lng: 9.5375, label: "Tunis, Tunisia" },
    { lat: 25.2048, lng: 55.2708, label: "Dubai, UAE" },
    { lat: 24.4539, lng: 54.3773, label: "Abu Dhabi, UAE" },
    { lat: 29.3117, lng: 47.4818, label: "Kuwait City, Kuwait" },
    { lat: 35.6892, lng: 51.3890, label: "Tehran, Iran" },
    { lat: 33.3152, lng: 44.3661, label: "Baghdad, Iraq" },
    { lat: 31.7683, lng: 35.2137, label: "Jerusalem" },
    { lat: 32.0853, lng: 34.7818, label: "Tel Aviv, Israel" },
    { lat: 33.5731, lng: 36.2921, label: "Damascus, Syria" },
    { lat: 43.2220, lng: 76.8512, label: "Almaty, Kazakhstan" },
    { lat: 41.2995, lng: 69.2401, label: "Tashkent, Uzbekistan" },
    { lat: 47.9077, lng: 106.8832, label: "Ulaanbaatar, Mongolia" },

    // AMERICAS
    { lat: 40.7128, lng: -74.0060, label: "New York, USA" },
    { lat: 34.0522, lng: -118.2437, label: "Los Angeles, USA" },
    { lat: 41.8781, lng: -87.6298, label: "Chicago, USA" },
    { lat: 29.7604, lng: -95.3698, label: "Houston, USA" },
    { lat: 33.4484, lng: -112.0740, label: "Phoenix, USA" },
    { lat: 47.6062, lng: -122.3321, label: "Seattle, USA" },
    { lat: 37.7749, lng: -122.4194, label: "San Francisco, USA" },
    { lat: 45.5051, lng: -122.6750, label: "Portland, USA" },
    { lat: 36.1627, lng: -86.7816, label: "Nashville, USA" },
    { lat: 32.7767, lng: -96.7970, label: "Dallas, USA" },
    { lat: 25.7617, lng: -80.1918, label: "Miami, USA" },
    { lat: 45.4215, lng: -75.6972, label: "Ottawa, Canada" },
    { lat: 43.6532, lng: -79.3832, label: "Toronto, Canada" },
    { lat: 45.5017, lng: -73.5673, label: "Montreal, Canada" },
    { lat: 49.2827, lng: -123.1207, label: "Vancouver, Canada" },
    { lat: 19.4326, lng: -99.1332, label: "Mexico City, Mexico" },
    { lat: 20.9674, lng: -89.6237, label: "Mérida, Mexico" },
    { lat: 14.6349, lng: -90.5069, label: "Guatemala City, Guatemala" },
    { lat: 9.9281, lng: -84.0907, label: "San José, Costa Rica" },
    { lat: 8.9936, lng: -79.5197, label: "Panama City, Panama" },
    { lat: 4.7110, lng: -74.0721, label: "Bogotá, Colombia" },
    { lat: -0.1807, lng: -78.4678, label: "Quito, Ecuador" },
    { lat: -12.0464, lng: -77.0428, label: "Lima, Peru" },
    { lat: -16.5000, lng: -68.1500, label: "La Paz, Bolivia" },
    { lat: -22.9068, lng: -43.1729, label: "Rio de Janeiro, Brazil" },
    { lat: -23.5505, lng: -46.6333, label: "São Paulo, Brazil" },
    { lat: -34.9011, lng: -56.1645, label: "Montevideo, Uruguay" },
    { lat: -34.6037, lng: -58.3816, label: "Buenos Aires, Argentina" },
    { lat: -33.4489, lng: -70.6693, label: "Santiago, Chile" },
    { lat: -25.2867, lng: -57.6470, label: "Asunción, Paraguay" },
    { lat: 10.4806, lng: -66.9036, label: "Caracas, Venezuela" },
    { lat: 18.4655, lng: -66.1057, label: "San Juan, Puerto Rico" },
    { lat: 23.1136, lng: -82.3666, label: "Havana, Cuba" },

    // AFRICA
    { lat: -33.9249, lng: 18.4241, label: "Cape Town, South Africa" },
    { lat: -26.2041, lng: 28.0473, label: "Johannesburg, South Africa" },
    { lat: -1.2921, lng: 36.8219, label: "Nairobi, Kenya" },
    { lat: -6.7924, lng: 39.2083, label: "Dar es Salaam, Tanzania" },
    { lat: 5.5600, lng: -0.1969, label: "Accra, Ghana" },
    { lat: 6.5244, lng: 3.3792, label: "Lagos, Nigeria" },
    { lat: 9.0579, lng: 7.4951, label: "Abuja, Nigeria" },
    { lat: 14.7167, lng: -17.4677, label: "Dakar, Senegal" },
    { lat: 12.3647, lng: -1.5353, label: "Ouagadougou, Burkina Faso" },
    { lat: 30.0444, lng: 31.2357, label: "Cairo, Egypt" },
    { lat: 36.8065, lng: 10.1815, label: "Tunis, Tunisia" },
    { lat: 33.9716, lng: -6.8498, label: "Rabat, Morocco" },
    { lat: 36.7372, lng: 3.0868, label: "Algiers, Algeria" },
    { lat: 32.8872, lng: 13.1913, label: "Tripoli, Libya" },
    { lat: 15.5007, lng: 32.5599, label: "Khartoum, Sudan" },
    { lat: 2.0469, lng: 45.3182, label: "Mogadishu, Somalia" },
    { lat: 9.0320, lng: 38.7469, label: "Addis Ababa, Ethiopia" },
    { lat: -4.4419, lng: 15.2663, label: "Kinshasa, DRC" },
    { lat: -18.9249, lng: 47.5185, label: "Antananarivo, Madagascar" },
    { lat: -4.0383, lng: 21.7587, label: "Mbuji-Mayi, DRC" },

    // OCEANIA & PACIFIC
    { lat: -33.8688, lng: 151.2093, label: "Sydney, Australia" },
    { lat: -37.8136, lng: 144.9631, label: "Melbourne, Australia" },
    { lat: -27.4698, lng: 153.0251, label: "Brisbane, Australia" },
    { lat: -31.9505, lng: 115.8605, label: "Perth, Australia" },
    { lat: -36.8485, lng: 174.7633, label: "Auckland, New Zealand" },
    { lat: -41.2866, lng: 174.7756, label: "Wellington, New Zealand" },
    { lat: -9.4438, lng: 160.0185, label: "Honiara, Solomon Islands" },
    { lat: -17.7333, lng: 168.3220, label: "Port Vila, Vanuatu" },
    { lat: -18.1416, lng: 178.4419, label: "Suva, Fiji" },
    { lat: 21.3069, lng: -157.8583, label: "Honolulu, Hawaii" },
    { lat: -14.2756, lng: -170.7020, label: "Pago Pago, American Samoa" },

    // SCENIC / INTERESTING PLACES
    { lat: 27.9881, lng: 86.9250, label: "Mount Everest Base Camp, Nepal" },
    { lat: -13.1631, lng: -72.5450, label: "Machu Picchu, Peru" },
    { lat: -22.9519, lng: -43.2105, label: "Christ the Redeemer, Brazil" },
    { lat: 48.8738, lng: 2.2950, label: "Eiffel Tower, France" },
    { lat: 27.1751, lng: 78.0421, label: "Taj Mahal, India" },
    { lat: 51.1789, lng: -1.8262, label: "Stonehenge, UK" },
    { lat: 37.9716, lng: 23.7260, label: "Acropolis, Greece" },
    { lat: 29.9792, lng: 31.1342, label: "Pyramids of Giza, Egypt" },
    { lat: 43.7230, lng: 10.3966, label: "Leaning Tower of Pisa, Italy" },
    { lat: -13.5183, lng: -71.9784, label: "Cusco, Peru" },
    { lat: 64.9200, lng: -19.0200, label: "Geysir, Iceland" },
    { lat: 36.0544, lng: -112.1401, label: "Grand Canyon, USA" },
    { lat: -25.3444, lng: 131.0369, label: "Uluru, Australia" },
    { lat: 46.5197, lng: 7.7323, label: "Interlaken, Switzerland" },
    { lat: -41.2706, lng: -72.0680, label: "Patagonia, Chile" },
    { lat: 6.1275, lng: 1.2255, label: "Lomé coastal road, Togo" },
    { lat: -4.3278, lng: 15.2218, label: "Congo River, DRC" },
    { lat: 5.8520, lng: 95.3382, label: "Banda Aceh coast, Indonesia" },
    { lat: 34.6736, lng: 135.5023, label: "Osaka castle district, Japan" },
    { lat: 22.2988, lng: 114.1722, label: "Kowloon, Hong Kong" },
    { lat: 55.7558, lng: 37.6176, label: "Red Square, Moscow, Russia" },
    { lat: 59.9311, lng: 30.3609, label: "St. Petersburg, Russia" },
    { lat: -45.0312, lng: 168.6626, label: "Queenstown, New Zealand" },
    { lat: 36.4617, lng: 28.2270, label: "Rhodes, Greece" },
    { lat: 39.6534, lng: 2.7267, label: "Mallorca, Spain" },
];

// ─── Haversine Distance (km) ─────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Score formula ───────────────────────────────────────────────────────────
function calcScore(distKm) {
    return Math.round(MAX_SCORE_PER_ROUND * Math.exp(-distKm / SCORE_DECAY_KM));
}

// ─── API Key Management ───────────────────────────────────────────────────────
function getApiKey() {
    return localStorage.getItem('gmaps_api_key') || '';
}
function saveApiKey(key) {
    localStorage.setItem('gmaps_api_key', key.trim());
}

// ─── Load Maps API dynamically ────────────────────────────────────────────────
function loadMapsApi(apiKey) {
    return new Promise((resolve, reject) => {
        if (googleMapsLoaded && window.google?.maps) { resolve(); return; }
        const existing = document.getElementById('gmaps-script');
        if (existing) existing.remove();
        const script = document.createElement('script');
        script.id = 'gmaps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
        script.async = true;
        script.onload = () => { googleMapsLoaded = true; resolve(); };
        script.onerror = () => reject(new Error('Failed to load Google Maps API. Check your API key.'));
        document.head.appendChild(script);
    });
}

// ─── API Key Setup Modal ──────────────────────────────────────────────────────
function showApiKeyModal(container, onSubmit) {
    container.innerHTML = `
        <div class="gg-api-modal">
            <div class="gg-api-card">
                <div class="gg-api-icon">🗺️</div>
                <h2 class="gg-api-title">GeoGuesser Setup</h2>
                <p class="gg-api-desc">
                    GeoGuesser uses Google Maps Street View.<br>
                    Enter your Google Maps API key to get started.<br>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color:var(--accent);">
                        Get a free key →
                    </a>
                </p>
                <div class="gg-api-steps">
                    <div class="gg-step"><span>1</span> Create a Google Cloud project</div>
                    <div class="gg-step"><span>2</span> Enable <strong>Maps JavaScript API</strong></div>
                    <div class="gg-step"><span>3</span> Create an API key under Credentials</div>
                    <div class="gg-step"><span>4</span> Restrict key to your domain</div>
                </div>
                <input id="gg-key-input" type="text" placeholder="AIza..." class="gg-key-input" autocomplete="off" spellcheck="false"/>
                <div style="display:flex;gap:12px;width:100%;">
                    <button id="gg-key-submit" class="gg-key-btn">🚀 Launch GeoGuesser</button>
                    <button id="gg-key-back" class="gg-key-btn-secondary">← Back</button>
                </div>
                <p id="gg-key-error" style="color:#ef4444;font-size:0.85rem;margin-top:8px;display:none;"></p>
            </div>
        </div>
    `;

    const input = document.getElementById('gg-key-input');
    const saved = getApiKey();
    if (saved) input.value = saved;

    document.getElementById('gg-key-submit').onclick = () => {
        const key = input.value.trim();
        if (!key.startsWith('AIza')) {
            const err = document.getElementById('gg-key-error');
            err.textContent = 'Google Maps API keys start with "AIza..."';
            err.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return;
        }
        saveApiKey(key);
        onSubmit(key);
    };
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('gg-key-submit').click();
    });

    document.getElementById('gg-key-back').onclick = () => {
        renderStartMenu();
    };
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────
export function renderGeoGuesserPage() {
    // Reset game state
    currentRound = 0;
    roundScores = [];
    guessSubmitted = false;
    panorama = null;
    guessMap = null;
    guessMarker = null;

    // Hide normal quiz UI
    const quizHeader = document.querySelector('.quiz-header');
    const quizMain = document.querySelector('.quiz-main');
    const startMenu = document.getElementById('start-menu');
    if (quizHeader) quizHeader.style.display = 'none';
    if (quizMain) quizMain.style.display = 'none';
    if (startMenu) startMenu.style.display = 'flex';

    // Create or reuse the GeoGuesser root container
    let ggRoot = document.getElementById('gg-root');
    if (!ggRoot) {
        ggRoot = document.createElement('div');
        ggRoot.id = 'gg-root';
        document.body.appendChild(ggRoot);
    }
    ggRoot.style.display = 'flex';
    ggRoot.innerHTML = '';

    // Hide app-root while we're in full-screen mode
    const appRoot = document.getElementById('app-root');
    if (appRoot) appRoot.style.display = 'none';

    const apiKey = getApiKey();
    if (!apiKey) {
        showApiKeyModal(ggRoot, (key) => startGame(ggRoot, key));
    } else {
        startGame(ggRoot, apiKey);
    }
}

async function startGame(container, apiKey) {
    container.innerHTML = `<div class="gg-loading"><div class="gg-spinner"></div><p>Loading Street View…</p></div>`;

    try {
        await loadMapsApi(apiKey);
    } catch (e) {
        container.innerHTML = `
            <div class="gg-api-modal">
                <div class="gg-api-card">
                    <div class="gg-api-icon">❌</div>
                    <h2>API Key Error</h2>
                    <p style="color:var(--muted);">${e.message}</p>
                    <button onclick="localStorage.removeItem('gmaps_api_key');location.reload();" class="gg-key-btn">Reset API Key</button>
                </div>
            </div>`;
        return;
    }

    currentRound = 0;
    roundScores = [];
    loadRound(container);
}

// ─── Round Logic ──────────────────────────────────────────────────────────────
function getRandomLocation() {
    return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

function loadRound(container) {
    guessSubmitted = false;
    guessMarker = null;
    currentLocation = getRandomLocation();

    container.innerHTML = `
        <div class="gg-game">
            <!-- Top HUD -->
            <div class="gg-hud">
                <div class="gg-rounds">
                    ${Array.from({ length: ROUNDS_PER_GAME }, (_, i) => `
                        <div class="gg-round-dot ${i < currentRound ? 'done' : i === currentRound ? 'active' : ''}"></div>
                    `).join('')}
                </div>
                <div class="gg-hud-score">
                    Round <strong>${currentRound + 1}</strong> of ${ROUNDS_PER_GAME}
                </div>
                <button class="gg-exit-btn" id="gg-exit">✕ Exit</button>
            </div>

            <!-- Street View -->
            <div id="gg-sv" class="gg-sv"></div>

            <!-- Mini-map panel -->
            <div class="gg-map-panel" id="gg-map-panel">
                <div class="gg-map-header">
                    <span>📍 Click to place your guess</span>
                    <button class="gg-collapse-btn" id="gg-collapse-btn" title="Collapse map">−</button>
                </div>
                <div id="gg-map" class="gg-map"></div>
                <button class="gg-submit-btn" id="gg-submit-btn" disabled>
                    Submit Guess
                </button>
            </div>

            <!-- Collapsed state -->
            <button class="gg-map-expand-btn" id="gg-map-expand" style="display:none;" title="Show map">🗺️</button>
        </div>
    `;

    document.getElementById('gg-exit').onclick = exitToMenu;

    // Street View
    const svContainer = document.getElementById('gg-sv');
    panorama = new google.maps.StreetViewPanorama(svContainer, {
        position: { lat: currentLocation.lat, lng: currentLocation.lng },
        addressControl: false,
        showRoadLabels: false,
        fullscreenControl: false,
        enableCloseButton: false,
        clickToGo: false,         // no walking — keeps it fair
        scrollwheel: true,
        panControl: true,
        zoomControl: true,
        motionTracking: false,
    });

    // Mini guess-map
    const mapEl = document.getElementById('gg-map');
    guessMap = new google.maps.Map(mapEl, {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: 'roadmap',
        styles: [{ featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'on' }] }]
    });

    guessMap.addListener('click', (e) => {
        if (guessSubmitted) return;
        if (guessMarker) guessMarker.setMap(null);
        guessMarker = new google.maps.Marker({
            position: e.latLng,
            map: guessMap,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#6366f1',
                fillOpacity: 1,
                strokeColor: '#fff',
                strokeWeight: 2,
            },
            animation: google.maps.Animation.DROP,
        });
        document.getElementById('gg-submit-btn').disabled = false;
    });

    // Submit
    document.getElementById('gg-submit-btn').onclick = () => {
        if (!guessMarker || guessSubmitted) return;
        guessSubmitted = true;
        const guessPos = guessMarker.getPosition();
        submitGuess(guessPos.lat(), guessPos.lng(), container);
    };

    // Collapse / expand mini-map
    const panel = document.getElementById('gg-map-panel');
    const collapseBtn = document.getElementById('gg-collapse-btn');
    const expandBtn = document.getElementById('gg-map-expand');
    collapseBtn.onclick = () => {
        panel.style.display = 'none';
        expandBtn.style.display = 'block';
    };
    expandBtn.onclick = () => {
        panel.style.display = 'flex';
        expandBtn.style.display = 'none';
    };
}

// ─── Submit Guess & Reveal ────────────────────────────────────────────────────
function submitGuess(guessLat, guessLng, container) {
    const distKm = haversine(guessLat, guessLng, currentLocation.lat, currentLocation.lng);
    const score = calcScore(distKm);
    roundScores.push(score);

    const realPos = { lat: currentLocation.lat, lng: currentLocation.lng };
    const guessPos = { lat: guessLat, lng: guessLng };

    // Expand the mini-map for reveal
    const panel = document.getElementById('gg-map-panel');
    const expandBtn = document.getElementById('gg-map-expand');
    panel.style.display = 'flex';
    expandBtn.style.display = 'none';
    panel.classList.add('gg-map-panel--reveal');

    // Draw real location marker
    new google.maps.Marker({
        position: realPos,
        map: guessMap,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3,
        },
        title: 'Actual location',
        animation: google.maps.Animation.DROP,
    });

    // Draw a dotted line between guess and reality
    const line = new google.maps.Polyline({
        path: [guessPos, realPos],
        geodesic: true,
        strokeColor: '#6366f1',
        strokeOpacity: 0,
        strokeWeight: 3,
        icons: [{
            icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
            offset: '0', repeat: '20px',
        }],
        map: guessMap,
    });

    // Pan & fit bounds
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(guessPos);
    bounds.extend(realPos);
    guessMap.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });

    // Show result overlay over Street View
    setTimeout(() => showRoundResult(distKm, score, container), 600);
}

// ─── Round Result Overlay ─────────────────────────────────────────────────────
function showRoundResult(distKm, score, container) {
    const overlay = document.createElement('div');
    overlay.className = 'gg-result-overlay';

    const distText = distKm < 1
        ? `${Math.round(distKm * 1000)} m away`
        : `${distKm >= 1000 ? (distKm / 1000).toFixed(1) + ' thousand km' : distKm.toFixed(0) + ' km'} away`;

    const isLast = currentRound + 1 >= ROUNDS_PER_GAME;

    overlay.innerHTML = `
        <div class="gg-result-card">
            <div class="gg-result-location">📍 ${currentLocation.label}</div>
            <div class="gg-result-dist">${distText}</div>
            <div class="gg-result-score-wrap">
                <div class="gg-result-score" id="gg-score-counter">0</div>
                <div class="gg-result-score-label">points</div>
            </div>
            <div class="gg-result-bar-wrap">
                <div class="gg-result-bar" id="gg-score-bar"></div>
            </div>
            <button class="gg-next-btn" id="gg-next-btn">
                ${isLast ? '🏁 See Final Score' : '▶ Next Round'}
            </button>
        </div>
    `;

    // Append overlay inside game container
    const game = container.querySelector('.gg-game');
    game.appendChild(overlay);

    // Animate score counter
    let n = 0;
    const step = Math.ceil(score / 60);
    const counter = document.getElementById('gg-score-counter');
    const bar = document.getElementById('gg-score-bar');
    const timer = setInterval(() => {
        n = Math.min(n + step, score);
        counter.textContent = n.toLocaleString();
        bar.style.width = `${(n / MAX_SCORE_PER_ROUND) * 100}%`;
        if (n >= score) clearInterval(timer);
    }, 16);

    document.getElementById('gg-next-btn').onclick = () => {
        overlay.remove();
        currentRound++;
        if (currentRound >= ROUNDS_PER_GAME) {
            showFinalScore(container);
        } else {
            loadRound(container);
        }
    };
}

// ─── Final Score Screen ───────────────────────────────────────────────────────
function showFinalScore(container) {
    const total = roundScores.reduce((a, b) => a + b, 0);
    const maxPossible = MAX_SCORE_PER_ROUND * ROUNDS_PER_GAME;
    const pct = Math.round((total / maxPossible) * 100);

    let medal = '🌍';
    let verdict = 'Explorer';
    if (pct >= 90) { medal = '🏆'; verdict = 'World Expert'; }
    else if (pct >= 70) { medal = '🥇'; verdict = 'Geo Master'; }
    else if (pct >= 50) { medal = '🥈'; verdict = 'Navigator'; }
    else if (pct >= 25) { medal = '🥉'; verdict = 'Traveller'; }

    container.innerHTML = `
        <div class="gg-final">
            <div class="gg-final-card">
                <div class="gg-final-medal">${medal}</div>
                <h1 class="gg-final-verdict">${verdict}</h1>
                <div class="gg-final-total">
                    <span class="gg-final-pts" id="gg-final-pts">0</span>
                    <span class="gg-final-pts-label">/ ${maxPossible.toLocaleString()} pts</span>
                </div>

                <div class="gg-final-rounds">
                    ${roundScores.map((s, i) => `
                        <div class="gg-final-round">
                            <span class="gg-final-round-num">Round ${i + 1}</span>
                            <div class="gg-final-round-bar-wrap">
                                <div class="gg-final-round-bar" style="width:${(s / MAX_SCORE_PER_ROUND) * 100}%"></div>
                            </div>
                            <span class="gg-final-round-pts">${s.toLocaleString()}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="gg-final-actions">
                    <button class="gg-final-play-again" id="gg-play-again">🔄 Play Again</button>
                    <button class="gg-final-home" id="gg-final-home">🏠 Main Menu</button>
                </div>
            </div>
        </div>
    `;

    // Animate total counter
    let n = 0;
    const step = Math.ceil(total / 80);
    const el = document.getElementById('gg-final-pts');
    const t = setInterval(() => {
        n = Math.min(n + step, total);
        el.textContent = n.toLocaleString();
        if (n >= total) clearInterval(t);
    }, 16);

    document.getElementById('gg-play-again').onclick = () => {
        currentRound = 0;
        roundScores = [];
        loadRound(container);
    };

    document.getElementById('gg-final-home').onclick = exitToMenu;
}

// ─── Exit ─────────────────────────────────────────────────────────────────────
function exitToMenu() {
    const ggRoot = document.getElementById('gg-root');
    if (ggRoot) { ggRoot.style.display = 'none'; ggRoot.innerHTML = ''; }
    const appRoot = document.getElementById('app-root');
    if (appRoot) appRoot.style.display = '';
    googleMapsLoaded = false; // force reload on next visit to reuse same key
    renderStartMenu();
}
