// =======================================================================
// CONFIGURAÇÃO DE URLS (AJUSTE AQUI)
// =======================================================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzF1bKzZoIImSjpirToSYzGWKhG-uTTY49MtY-VEIUhu0ph72KYBYM8_tI1SK56zT4e/exec";
const API_URL = window.location.hostname.includes('localhost')
  ? "http://localhost:3000"
  : "https://presencasbras.onrender.com";

// =======================================================================
// SHORTCUTS PARA DOM
// =======================================================================
const dom = {
  filterName:   document.getElementById("filterName"),
  filterPer:    document.getElementById("filterPeriodo"),
  filterLid:    document.getElementById("filterLider"),
  filterGape:   document.getElementById("filterGape"),
  applyBtn:     document.getElementById("applyFiltersBtn"),
  clearBtn:     document.getElementById("clearFiltersBtn"),
  cards:        document.getElementById("membersCardsContainer"),
  messageArea:  document.getElementById("messageArea")
};

// =======================================================================
// ESTADOS GLOBAIS
// =======================================================================
let allMembers = [];
let filteredMembers = [];

// =======================================================================
// UTIL: EXIBE MENSAGENS
// =======================================================================
function showMessage(text, type = "info") {
  const { messageArea } = dom;
  messageArea.textContent = text;
  messageArea.className = `message-box show ${
    type === "success" ? "message-success" :
    type === "error"   ? "message-error" : ""
  }`;
  // remove após 3,5s
  setTimeout(() => messageArea.classList.remove("show"), 3500);
}

// =======================================================================
// UTIL: FETCH AO GAS (GET)
// =======================================================================
async function fetchGAS(tipo) {
  const res = await fetch(`${API_URL}/presenca?tipo=${tipo}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}


// =======================================================================
// 1) CARREGA MEMBROS (GET getMembros)
// =======================================================================
async function loadMembers() {
  dom.cards.innerHTML = `<p class="text-center py-8">Carregando membros…</p>`;
  try {
    const payload = await fetchGAS("getMembros");
    allMembers = payload.membros || payload.data || [];
    showMessage(`Carregados ${allMembers.length} membros`, "success");
  } catch (err) {
    console.error("Erro ao carregar membros:", err);
    allMembers = [];
    showMessage("Erro ao carregar membros", "error");
  }
  populateFilters();
  applyFilters();
}

// =======================================================================
// 2) POPULA FILTROS (Líder e GAPE)
// =======================================================================
function populateFilters() {
  const unique = arr => [...new Set(arr)].sort();
  const lideres = unique(allMembers.map(m => m.Lider).filter(Boolean));
  const gapes   = unique(allMembers.map(m => m.GAPE).filter(Boolean));

  dom.filterLid.innerHTML = `<option value="">Todos Líderes</option>` +
    lideres.map(l => `<option>${l}</option>`).join("");
  dom.filterGape.innerHTML = `<option value="">Todos GAPE</option>` +
    gapes.map(g => `<option>${g}</option>`).join("");
}

// =======================================================================
// 3) APLICA FILTROS E RE-RENDERIZA
// =======================================================================
function applyFilters() {
  const qName = dom.filterName.value.toLowerCase().trim();
  const qPer  = dom.filterPer.value.toLowerCase().trim();
  const qLid  = dom.filterLid.value.toLowerCase().trim();
  const qGape = dom.filterGape.value.toLowerCase().trim();

  filteredMembers = allMembers.filter(m => {
    const n = (m.Nome   || "").toLowerCase();
    const p = (m.Periodo|| "").toLowerCase();
    const l = (m.Lider  || "").toLowerCase();
    const g = (m.GAPE   || "").toLowerCase();
    return (!qName || n.includes(qName))
        && (!qPer  || p === qPer)
        && (!qLid  || l === qLid)
        && (!qGape || g === qGape);
  });

  showMessage(`Encontrados ${filteredMembers.length}`, "info");
  renderCards();
}

// =======================================================================
// 4) RENDERIZA CARDS E LÓGICA DE PRESENÇA
// =======================================================================
async function renderCards() {
  dom.cards.innerHTML = "";
  if (!filteredMembers.length) {
    dom.cards.innerHTML = `
      <p class="text-center py-8 text-gray-500">
        Nenhum membro encontrado.
      </p>`;
    return;
  }

  // busca presenças do mês UMA VEZ
  let presencasMes = {};
  try {
    presencasMes = await fetchGAS("presencasMes");
  } catch {
    console.warn("Falha ao buscar presenças do mês");
  }

  filteredMembers.forEach((m, i) => {
    const nome = m.Nome || "—";
    const count = presencasMes[nome] || 0;

    // cria card
    const card = document.createElement("div");
    card.className = "fade-in-row bg-white rounded-xl shadow-md p-4";
    card.style.animationDelay = `${i * 0.04}s`;
    card.innerHTML = `
      <h3 class="font-bold text-lg mb-1">${nome}</h3>
      <p class="text-sm text-green-700 mb-2">
        <strong>Presenças no mês:</strong> 
        <span class="presencas-mes">${count}</span>
      </p>
      <p class="text-sm"><strong>Período:</strong> ${m.Periodo||"—"}</p>
      <p class="text-sm"><strong>Líder:</strong> ${m.Lider||"—"}</p>
      <p class="text-sm"><strong>GAPE:</strong> ${m.GAPE||"—"}</p>
      <label class="flex items-center gap-2 mt-3">
        <input type="checkbox" class="presence-checkbox"/>
        <span>Presente</span>
      </label>
      <button class="btn-confirm-presence btn-confirm-presence mt-2 hidden">
        Confirmar Presença
      </button>
      <p class="presence-info text-xs text-green-700 mt-1 hidden"></p>
    `;
    dom.cards.appendChild(card);

    // elementos
    const checkbox = card.querySelector(".presence-checkbox");
    const btn      = card.querySelector(".btn-confirm-presence");
    const info     = card.querySelector(".presence-info");
    const countEl  = card.querySelector(".presencas-mes");

    // exibe botão ao marcar checkbox
    checkbox.addEventListener("change", () => {
      btn.classList.toggle("hidden", !checkbox.checked);
    });

    // ao confirmar presença
    btn.addEventListener("click", async () => {
      const now = new Date();
      const [date, time] = now.toLocaleString("pt-BR").split(" ");
      // feedback UI imediato
      info.textContent = `Marcado em ${date} ${time}`;
      info.classList.remove("hidden");
      checkbox.disabled = true;
      btn.classList.add("hidden");

      // envia ao backend Node -> Apps Script
      try {
        await fetch(`${API_URL}/presenca`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome,
            data: date,
            hora: time,
            sheet: "PRESENCAS"
          })
        });
        // re-fetch só para atualizar este contador
        const updated = await fetchGAS("presencasMes");
        countEl.textContent = updated[nome] || count + 1;
        showMessage(`Presença de ${nome} registrada!`, "success");
      } catch (err) {
        console.error("Erro ao enviar presença:", err);
        showMessage("Falha ao registrar presença.", "error");
      }
    });
  });
}

// =======================================================================
// 5) EVENTOS DE FILTROS & INÍCIO
// =======================================================================
dom.applyBtn.addEventListener("click", applyFilters);
dom.clearBtn.addEventListener("click", () => {
  dom.filterName.value = "";
  dom.filterPer.value  = "";
  dom.filterLid.value  = "";
  dom.filterGape.value = "";
  applyFilters();
});
["input","change"].forEach(evt => {
  dom.filterName.addEventListener(evt, applyFilters);
  dom.filterPer .addEventListener(evt, applyFilters);
  dom.filterLid.addEventListener(evt, applyFilters);
  dom.filterGape.addEventListener(evt, applyFilters);
});

// carrega tudo após DOM pronto
window.addEventListener("DOMContentLoaded", loadMembers);
