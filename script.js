// Dados brutos dos membros (simulado, seriam obtidos do Apps Script)
let allMembersData = [];
// Membros atualmente exibidos após a aplicação dos filtros
let filteredMembers = [];

// Elementos do DOM
const filterNameInput = document.getElementById("filterName");
const filterPeriodoSelect = document.getElementById("filterPeriodo");
const filterLiderInput = document.getElementById("filterLider");
const filterGapeInput = document.getElementById("filterGape");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const membersCardsContainer = document.getElementById("membersCardsContainer");
const messageArea = document.getElementById("messageArea");

// ===> NOVA URL BASE DO BACKEND NO RENDER <===
const BACKEND_URL = "https://presencasbras.onrender.com";

/**
 * Exibe uma mensagem de status para o usuário.
 */
function showMessage(message, type = "info") {
  if (message === "Carregando dados dos membros...") return;
  messageArea.textContent = message;
  messageArea.className = "message-box show";
  messageArea.classList.remove("hidden");

  if (type === "success") {
    messageArea.classList.add("message-success");
  } else if (type === "error") {
    messageArea.classList.add("message-error");
  } else {
    messageArea.classList.add("bg-blue-100", "text-blue-800");
  }
  setTimeout(() => {
    messageArea.classList.remove("show");
    setTimeout(() => messageArea.classList.add("hidden"), 500);
  }, 5000);
}

/**
 * Carrega os dados dos membros (via backend).
 */
async function fetchMembers() {
  membersCardsContainer.innerHTML = `
    <div class="col-span-full flex flex-col justify-center items-center py-8 gap-3">
      <svg class="animate-spin h-8 w-8 text-blue-700 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span class="text-blue-700 text-lg font-semibold animate-pulse">Carregando dados dos membros...</span>
    </div>
  `;

  try {
    // ===> AGORA O FRONTEND CHAMA O BACKEND DO RENDER PARA PEGAR MEMBROS <===
    const response = await fetch(`${BACKEND_URL}/get-membros`);
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    const data = await response.json();
    allMembersData = data.membros || []; // O backend deve retornar { membros: [...] }
    fillSelectOptions();
    if (allMembersData.length === 0) {
      showMessage("Nenhum membro encontrado ou dados vazios.", "info");
    } else {
      showMessage(
        `Membros carregados com sucesso! Total: ${allMembersData.length}`,
        "success"
      );
    }

    applyFilters();
  } catch (error) {
    console.error("Erro ao carregar membros:", error);
    showMessage(`Erro ao carregar membros: ${error.message}`, "error");
    membersCardsContainer.innerHTML = `<div class="col-span-full text-center py-4 text-red-600">Falha ao carregar dados dos membros. Verifique o console para detalhes.</div>`;
  }
}

/**
 * Aplica os filtros aos dados dos membros e atualiza a tabela.
 */
function applyFilters() {
  const nameFilter = filterNameInput.value.toLowerCase().trim();
  const periodoFilter = filterPeriodoSelect.value.toLowerCase().trim();
  const liderFilter = filterLiderInput.value.toLowerCase().trim();
  const gapeFilter = filterGapeInput.value.toLowerCase().trim();

  filteredMembers = allMembersData.filter((member) => {
    const memberName = String(member.Nome || "").toLowerCase();
    const memberPeriodo = String(member.Periodo || "").toLowerCase();
    const memberLider = String(member.Lider || "").toLowerCase();
    const memberGape = String(member.GAPE || "").toLowerCase();

    const matchesName = nameFilter === "" || memberName.includes(nameFilter);
    const matchesPeriodo =
      periodoFilter === "" || memberPeriodo.includes(periodoFilter);
    const matchesLider =
      liderFilter === "" || memberLider.includes(liderFilter);
    const matchesGape = gapeFilter === "" || memberGape.includes(gapeFilter);

    return matchesName && matchesPeriodo && matchesLider && matchesGape;
  });

  displayMembers(filteredMembers);
}

/**
 * Exibe os membros na tela como cards, cada um com seu checkbox de presença.
 * Agora, ao marcar o checkbox, registra a presença com data e hora.
 */
async function displayMembers(members) {
  const container = document.getElementById("membersCardsContainer");
  container.innerHTML = "";

  // Buscar presenças do mês (via backend)
  const presencasMesAtual = await getPresencasMes(); 

  if (members.length === 0) {
    container.innerHTML = `<div class="col-span-full text-center py-4 text-gray-500">Nenhum membro encontrado com os filtros aplicados.</div>`;
    return;
  }

  members.forEach((member, idx) => {
    // Use o nome do membro (limpo) para buscar no objeto de presenças
    const memberNameKey = (member.Nome || "").trim();
    const presencas = presencasMesAtual[memberNameKey] || 0; // Usando presencasMesAtual

    const card = document.createElement("div");
    card.className =
      "fade-in-row bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 relative";
    card.style.animationDelay = `${idx * 0.04}s`;
    card.innerHTML = `
      <div class="font-bold text-lg text-gray-800">${member.Nome || "N/A"}</div>
      <div class="text-sm text-green-700 font-bold"><b>Presenças no mês:</b> <span class="presencas-mes">${presencas}</span></div>
      <div class="text-sm text-gray-600"><b>Período:</b> ${
        member.Periodo || "N/A"
      }</div>
      <div class="text-sm text-gray-600"><b>Líder:</b> ${
        member.Lider || "N/A"
      }</div>
      <div class="text-sm text-gray-600"><b>GAPE:</b> ${
        member.GAPE || "N/A"
      }</div>
      <label class="flex items-center gap-2 mt-2">
          <input type="checkbox" class="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 presence-checkbox" data-member-name="${
            member.Nome
          }">
          <span class="text-sm text-gray-700">Presente</span>
      </label>
      <button class="btn-confirm-presence w-full mt-2 hidden confirm-presence-btn">Confirmar Presença</button>
      <div class="text-xs text-green-700 mt-1 hidden presence-info"></div>
    `;
    container.appendChild(card);

    // Adiciona evento para marcar presença individual
    const checkbox = card.querySelector(".presence-checkbox");
    const infoDiv = card.querySelector(".presence-info");
    const confirmBtn = card.querySelector(".confirm-presence-btn");
    checkbox.addEventListener("change", function () {
      if (this.checked) {
        confirmBtn.classList.remove("hidden");
      } else {
        confirmBtn.classList.add("hidden");
        infoDiv.textContent = "";
        infoDiv.classList.add("hidden");
      }
    });
    confirmBtn.addEventListener("click", async function () {
      const now = new Date();
      const dia = String(now.getDate()).padStart(2, "0");
      const mes = String(now.getMonth() + 1).padStart(2, "0");
      const ano = now.getFullYear();
      const hora = String(now.getHours()).padStart(2, "0");
      const min = String(now.getMinutes()).padStart(2, "0");
      const seg = String(now.getSeconds()).padStart(2, "0");
      const dataHora = `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
      
      infoDiv.textContent = `Enviando presença...`; // Mensagem de feedback
      infoDiv.classList.remove("hidden");
      confirmBtn.disabled = true; // Desabilita o botão enquanto envia

      try {
        // ===> AGORA O FRONTEND CHAMA O BACKEND DO RENDER PARA REGISTRAR PRESENÇA <===
        const response = await fetch(`${BACKEND_URL}/presenca`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome: member.Nome,
            data: `${dia}/${mes}/${ano}`,
            hora: `${hora}:${min}:${seg}`,
            sheet: "PRESENCAS", // 'sheet' pode não ser necessário se o Apps Script não usar
          }),
        });

        if (!response.ok) {
            const errorData = await response.json(); // Backend deve retornar JSON em caso de erro
            throw new Error(`Erro ao registrar presença: ${response.status} - ${errorData.details || errorData.message || 'Erro desconhecido'}`);
        }

        infoDiv.textContent = `Presença marcada em ${dataHora}`;
        infoDiv.classList.remove("hidden");
        confirmBtn.classList.add("hidden");
        checkbox.disabled = true;

        // Atualiza apenas o número de presenças deste card (via backend)
        const presencasMesAtualizado = await getPresencasMes();
        const presencasAtual = presencasMesAtualizado[(member.Nome || "").trim()] || 0; // Use o nome limpo
        card.querySelector(".presencas-mes").textContent = presencasAtual;

      } catch (e) {
        console.error("Falha ao enviar presença para o servidor:", e);
        showMessage("Falha ao enviar presença para o servidor. " + e.message, "error");
        infoDiv.textContent = `Erro ao marcar presença!`;
        infoDiv.classList.remove("hidden");
        checkbox.checked = false; // Desmarca o checkbox em caso de erro
        confirmBtn.classList.add("hidden"); // Esconde o botão
        checkbox.disabled = false; // Reabilita o checkbox
      } finally {
          confirmBtn.disabled = false; // Reabilita o botão em qualquer caso
      }
    });
  });
}

/**
 * Função para obter as presenças do mês (via backend).
 */
async function getPresencasMes() {
  // ===> AGORA O FRONTEND CHAMA O BACKEND DO RENDER <===
  const url = `${BACKEND_URL}/get-presencas-mes`; 
  try {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Erro ao buscar presenças do mês: ${res.status}`);
    }
    return await res.json(); // { "Nome do Membro": 2, ... }
  } catch (error) {
    console.error("Erro em getPresencasMes:", error);
    showMessage("Erro ao carregar presenças do mês.", "error");
    return {}; // Retorna objeto vazio em caso de erro
  }
}

/**
 * Função para obter o total de presenças (via backend).
 */
async function getPresencasTotal() {
  // ===> AGORA O FRONTEND CHAMA O BACKEND DO RENDER <===
  const url = `${BACKEND_URL}/get-presencas-total`; 
  try {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Erro ao buscar presenças totais: ${res.status}`);
    }
    return await res.json(); // { "nome do membro": 2, ... }
  } catch (error) {
    console.error("Erro em getPresencasTotal:", error);
    showMessage("Erro ao carregar presenças totais.", "error");
    return {}; // Retorna objeto vazio em caso de erro
  }
}

// Função para preencher selects de Líder e GAPE dinamicamente
function fillSelectOptions() {
  const lideres = [
    ...new Set(allMembersData.map((m) => m.Lider).filter(Boolean)),
  ].sort();
  const gapes = [
    ...new Set(allMembersData.map((m) => m.GAPE).filter(Boolean)),
  ].sort();

  filterLiderInput.innerHTML =
    '<option value="">Todos</option>' +
    lideres.map((l) => `<option value="${l}">${l}</option>`).join("");

  filterGapeInput.innerHTML =
    '<option value="">Todos</option>' +
    gapes.map((g) => `<option value="${g}">${g}</option>`).join("");
}

// Função para limpar filtros
function clearFilters() {
  showMessage("Limpando filtros...", "info");
  filterNameInput.value = "";
  filterPeriodoSelect.value = "";
  filterLiderInput.value = "";
  filterGapeInput.value = "";
  applyFilters();
}

// Função para aplicar filtros com mensagem
function applyFiltersWithMessage() {
  showMessage("Aplicando filtros...", "info");
  applyFilters();
}

// Event Listeners
applyFiltersBtn.addEventListener("click", applyFiltersWithMessage);
document
  .getElementById("clearFiltersBtn")
  .addEventListener("click", clearFilters);

filterNameInput.addEventListener("input", applyFilters);
filterPeriodoSelect.addEventListener("change", applyFilters);
// CORRIGIDO: Evento 'change' para selects, não 'input'
filterLiderInput.addEventListener("change", applyFilters); 
filterGapeInput.addEventListener("change", applyFilters);

// Carrega os membros ao iniciar o aplicativo
window.onload = fetchMembers;
