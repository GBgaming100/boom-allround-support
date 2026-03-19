const initialState = {
  locations: [
    { id: "loc-1", name: "Stelling A · Plank 1", type: "Stelling", note: "Vaak gebruikte spelmaterialen" },
    { id: "loc-2", name: "Stelling A · Kist 2", type: "Kist", note: "Knutsel en creatief materiaal" },
    { id: "loc-3", name: "Stelling B · Kist 1", type: "Kist", note: "Buitenprogramma en pionierspul" },
    { id: "loc-4", name: "Magazijnhoek · Bak geel", type: "Bak", note: "Reserve en seizoensspullen" }
  ],
  items: [
    { id: "item-1", name: "Scharen", category: "Knutselen", quantity: 24, locationId: "loc-2", status: "Beschikbaar" },
    { id: "item-2", name: "Verfkwasten", category: "Knutselen", quantity: 18, locationId: "loc-2", status: "Aanvullen" },
    { id: "item-3", name: "Pionnen", category: "Spelmateriaal", quantity: 30, locationId: "loc-1", status: "Beschikbaar" },
    { id: "item-4", name: "Touwen", category: "Buiten", quantity: 12, locationId: "loc-3", status: "Beschikbaar" },
    { id: "item-5", name: "Zaklampen", category: "Kamp", quantity: 5, locationId: "loc-4", status: "Controleren" },
    { id: "item-6", name: "Waterjerrycans", category: "Kamp", quantity: 4, locationId: "loc-3", status: "Beschikbaar" }
  ],
  mutations: [
    { id: "mut-1", itemId: "item-3", action: "Aantal geteld", detail: "30 pionnen bevestigd in Stelling A · Plank 1", timestamp: "Vandaag 13:10" },
    { id: "mut-2", itemId: "item-2", action: "Signaal", detail: "Verfkwasten bijna op, aanvulling nodig", timestamp: "Vandaag 12:35" },
    { id: "mut-3", itemId: "item-5", action: "Controle", detail: "Zaklampen moeten op batterijen worden nagekeken", timestamp: "Gisteren 20:15" }
  ]
};

const storageKey = "welpen-inventaris-poc";

const els = {
  statsGrid: document.getElementById("stats-grid"),
  inventoryBody: document.getElementById("inventory-body"),
  itemSelect: document.getElementById("item-select"),
  changeType: document.getElementById("change-type"),
  quantityInput: document.getElementById("quantity-input"),
  locationSelect: document.getElementById("location-select"),
  noteInput: document.getElementById("note-input"),
  mutationForm: document.getElementById("mutation-form"),
  mutationLog: document.getElementById("mutation-log"),
  locationList: document.getElementById("location-list"),
  searchInput: document.getElementById("search-input"),
  resetDemo: document.getElementById("reset-demo"),
  statTemplate: document.getElementById("stat-card-template")
};

let state = loadState();

function loadState() {
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) return structuredClone(initialState);

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function getLocationName(locationId) {
  return state.locations.find((location) => location.id === locationId)?.name ?? "Onbekend";
}

function pillClass(status) {
  if (status === "Beschikbaar") return "ok";
  if (status === "Aanvullen") return "warning";
  return "issue";
}

function renderStats() {
  const categories = new Set(state.items.map((item) => item.category));
  const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = state.items.filter((item) => item.status !== "Beschikbaar").length;
  const stats = [
    { label: "Totaal items", value: state.items.length, note: "Unieke inventarisregels" },
    { label: "Totaal stuks", value: totalQuantity, note: "Alle aantallen samen" },
    { label: "Categorieen", value: categories.size, note: "Logische domeingroepen" },
    { label: "Actie nodig", value: lowStock, note: "Controleren of aanvullen" }
  ];

  els.statsGrid.innerHTML = "";
  stats.forEach((stat) => {
    const fragment = els.statTemplate.content.cloneNode(true);
    fragment.querySelector(".stat-label").textContent = stat.label;
    fragment.querySelector(".stat-value").textContent = stat.value;
    fragment.querySelector(".stat-footnote").textContent = stat.note;
    els.statsGrid.appendChild(fragment);
  });
}

function renderInventory() {
  const query = els.searchInput.value.trim().toLowerCase();
  const filteredItems = state.items.filter((item) => {
    const locationName = getLocationName(item.locationId);
    const haystack = `${item.name} ${item.category} ${item.status} ${locationName}`.toLowerCase();
    return haystack.includes(query);
  });

  els.inventoryBody.innerHTML = filteredItems.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>${getLocationName(item.locationId)}</td>
      <td><span class="pill ${pillClass(item.status)}">${item.status}</span></td>
    </tr>
  `).join("");
}

function renderSelects() {
  els.itemSelect.innerHTML = state.items.map((item) => `
    <option value="${item.id}">${item.name}</option>
  `).join("");

  els.locationSelect.innerHTML = state.locations.map((location) => `
    <option value="${location.id}">${location.name}</option>
  `).join("");
}

function renderLocations() {
  els.locationList.innerHTML = state.locations.map((location) => {
    const itemsAtLocation = state.items.filter((item) => item.locationId === location.id);
    const total = itemsAtLocation.reduce((sum, item) => sum + item.quantity, 0);
    return `
      <article class="location-card">
        <h3>${location.name}</h3>
        <p class="location-meta">${location.type} · ${location.note}</p>
        <p class="location-count">${itemsAtLocation.length} inventarisregels · ${total} stuks</p>
      </article>
    `;
  }).join("");
}

function renderLog() {
  els.mutationLog.innerHTML = state.mutations.map((entry) => `
    <article class="log-entry">
      <strong>${entry.action}</strong>
      <p>${entry.detail}</p>
      <p>${entry.timestamp}</p>
    </article>
  `).join("");
}

function render() {
  renderStats();
  renderInventory();
  renderSelects();
  renderLocations();
  renderLog();
}

function addMutation(itemId, action, detail) {
  state.mutations.unshift({
    id: `mut-${crypto.randomUUID()}`,
    itemId,
    action,
    detail,
    timestamp: new Date().toLocaleString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
  });

  state.mutations = state.mutations.slice(0, 8);
}

function handleMutationSubmit(event) {
  event.preventDefault();

  const itemId = els.itemSelect.value;
  const changeType = els.changeType.value;
  const quantity = Number(els.quantityInput.value);
  const locationId = els.locationSelect.value;
  const note = els.noteInput.value.trim();

  const item = state.items.find((entry) => entry.id === itemId);
  if (!item) return;

  if (changeType === "set") {
    item.quantity = quantity;
    item.status = quantity < 10 ? "Aanvullen" : "Beschikbaar";
    addMutation(item.id, "Aantal ingesteld", `${item.name} staat nu op ${quantity} stuks. ${note}`.trim());
  }

  if (changeType === "add") {
    item.quantity += quantity;
    item.status = item.quantity < 10 ? "Aanvullen" : "Beschikbaar";
    addMutation(item.id, "Aantal verhoogd", `${item.name} verhoogd met ${quantity} stuks. ${note}`.trim());
  }

  if (changeType === "remove") {
    item.quantity = Math.max(0, item.quantity - quantity);
    item.status = item.quantity < 10 ? "Aanvullen" : "Beschikbaar";
    addMutation(item.id, "Aantal verlaagd", `${item.name} verlaagd met ${quantity} stuks. ${note}`.trim());
  }

  if (changeType === "move") {
    item.locationId = locationId;
    addMutation(item.id, "Verplaatst", `${item.name} verplaatst naar ${getLocationName(locationId)}. ${note}`.trim());
  }

  saveState();
  render();
  els.noteInput.value = "";
}

function resetDemo() {
  state = structuredClone(initialState);
  saveState();
  render();
}

els.mutationForm.addEventListener("submit", handleMutationSubmit);
els.searchInput.addEventListener("input", renderInventory);
els.resetDemo.addEventListener("click", resetDemo);

render();
