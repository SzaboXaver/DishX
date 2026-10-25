// A letöltött GeoJSON fájl helye (a HTML oldalhoz képest értendő!)
const GEOJSON_URL = "../scripts/data.geojson";

// Escapes text before it goes into innerHTML / popups
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

// Keresésre egységesítés: kisbetű + ékezetek nélkül ("Pécs" == "pecs")
const norm = (s) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const nameInput = document.getElementById("nameInput");
const cityInput = document.getElementById("cityInput");
const netSelect = document.getElementById("netSelect");
const statusEl = document.getElementById("resultStatus");

// ---------- Map ----------

const map = L.map("map").setView([47.1625, 19.5033], 7); // Magyarország

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const markers = L.markerClusterGroup();
map.addLayer(markers);

// ---------- GeoJSON feldolgozása ----------

// Egy pont (lat/lon) bármilyen geometriából: pontnál maga a pont, területnél a csúcsok átlaga
function getLatLon(geom) {
  if (!geom) return null;

  let pts;
  switch (geom.type) {
    case "Point":
      return { lat: geom.coordinates[1], lon: geom.coordinates[0] };
    case "LineString":
      pts = geom.coordinates;
      break;
    case "Polygon":
      pts = geom.coordinates[0];
      break;
    case "MultiPolygon":
      pts = geom.coordinates[0]?.[0];
      break;
    default:
      return null;
  }
  if (!pts?.length) return null;

  let lon = 0;
  let lat = 0;
  for (const [x, y] of pts) {
    lon += x;
    lat += y;
  }
  return { lat: lat / pts.length, lon: lon / pts.length };
}

// Egy feature -> egyszerű étterem objektum (vagy null, ha nem használható)
function toRestaurant(feature) {
  // Overpass Turbo exportnál a címkék közvetlenül a properties-ben vannak,
  // más exportnál a properties.tags alatt
  const p = feature.properties?.tags ?? feature.properties ?? {};

  // Csak azokat tartjuk meg, amiknek ismerjük a címét (város + utca kell)
  const city = p["addr:city"];
  const street = p["addr:street"];
  if (!city || !street) return null;

  const pos = getLatLon(feature.geometry);
  if (!pos || !Number.isFinite(pos.lat) || !Number.isFinite(pos.lon)) return null;

  const name = p.name || "Unnamed restaurant";

  return {
    name,
    city,
    street,
    housenumber: p["addr:housenumber"] || "",
    postcode: p["addr:postcode"] || "",
    cuisine: p.cuisine || "",
    openingHours: p.opening_hours || "",
    phone: p.phone || p["contact:phone"] || "",
    website: p.website || p["contact:website"] || "",
    hasNet: ["wlan", "wired", "yes"].includes(p.internet_access),
    netFee: p["internet_access:fee"] === "yes",
    nameKey: norm(name),
    cityKey: norm(city),
    lat: pos.lat,
    lon: pos.lon,
  };
}

// ---------- Megjelenítés ----------

function popupHtml(r) {
  const address = [r.postcode, r.city + ",", r.street, r.housenumber]
    .filter(Boolean)
    .join(" ");

  // Csak http(s) linket engedünk be
  const safeSite = /^https?:\/\//i.test(r.website) ? r.website : "";

  return `
    <div class="popup-title">${esc(r.name)}</div>
    <div class="popup-line">${esc(address)}</div>
    ${r.cuisine ? `<div class="popup-line">Cuisine: ${esc(r.cuisine.replace(/;/g, ", "))}</div>` : ""}
    ${r.openingHours ? `<div class="popup-line">Open: ${esc(r.openingHours)}</div>` : ""}
    ${r.phone ? `<div class="popup-line">Phone: ${esc(r.phone)}</div>` : ""}
    <div class="popup-line">Internet: ${r.hasNet ? (r.netFee ? "yes (paid)" : "yes") : "unknown / no"}</div>
    ${safeSite ? `<div class="popup-line"><a href="${esc(safeSite)}" target="_blank" rel="noopener">Website</a></div>` : ""}
  `;
}

function render(list) {
  markers.clearLayers();

  const layers = list.map((r) =>
    L.marker([r.lat, r.lon]).bindPopup(popupHtml(r)),
  );
  markers.addLayers(layers);

  if (layers.length > 0) {
    map.fitBounds(markers.getBounds().pad(0.1), { maxZoom: 16 });
    statusEl.textContent = `${layers.length} restaurant${layers.length === 1 ? "" : "s"} found`;
  } else {
    statusEl.textContent = "No restaurants found. Try a different name or city.";
  }
}

// ---------- Keresés ----------

let restaurants = [];

function search() {
  const name = norm(nameInput.value);
  const city = norm(cityInput.value);
  const needNet = netSelect.value === "yes";

  // Ha egy mező üres, azt a feltételt kihagyjuk
  const result = restaurants.filter(
    (r) =>
      (!name || r.nameKey.includes(name)) &&
      (!city || r.cityKey.includes(city)) &&
      (!needNet || r.hasNet),
  );

  render(result);
}

document.getElementById("finderForm").addEventListener("submit", (e) => {
  e.preventDefault(); // ne töltse újra az oldalt
  search();
});

netSelect.addEventListener("change", search);

// ---------- Betöltés ----------

async function loadRestaurants() {
  try {
    const res = await fetch(GEOJSON_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const geo = await res.json();

    restaurants = (geo.features ?? []).map(toRestaurant).filter(Boolean);

    console.log(
      `GeoJSON: ${geo.features?.length ?? 0} features, ${restaurants.length} with known address`,
    );

    search(); // először mindent megmutat
  } catch (err) {
    console.error("GeoJSON load error:", err);
    statusEl.textContent =
      "Could not load the restaurant file. Check the file path and open the page through a local server.";
  }
}

await loadRestaurants();