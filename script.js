// ------------------------------------------------------
// CONFIGURAÇÃO GLOBAL (script.js)
// ------------------------------------------------------
const BACKEND_URL = "https://presencasbras.onrender.com"; // <-- ESTE É SEU PROXY DO RENDER
// Se o Render for apenas host de arquivos estáticos, esta URL precisa ser o URL do seu Apps Script Web App
// Exemplo: const BACKEND_URL = "https://script.google.com/macros/s/SUA_ID_DE_DEPLOYMENT/exec";

// ... (seus outros elementos do DOM e variáveis) ...
let allMembersData = [];
let filteredMembers = [];

const filterNameInput = document.getElementById("filterName");
const filterPeriodoSelect = document.getElementById("filterPeriodo");
const filterLiderInput = document.getElementById("filterLider");
const filterGapeInput = document.getElementById("filterGape");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const membersCardsContainer = document.getElementById("membersCardsContainer");
const messageArea = document.getElementById("messageArea");

const dashboardPresencasMesEl = document.getElementById("dashboardPresencasMes");
const dashboardPeriodoEl = document.getElementById("dashboardPeriodo");
const dashboardLiderEl = document.getElementById("dashboardLider");
const dashboardGapeEl = document.getElementById("dashboardGape");


/**
 * Exibe uma mensagem de status para o usuário.
 */
function showMessage(message, type = "info") {
    if (messageArea) { // Garante que messageArea existe
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
    } else {
        console.log(`Mensagem (sem messageArea): ${message}`);
    }
}

/**
 * Carrega os dados dos membros (via backend).
 */
async function fetchMembers() {
    if (!membersCardsContainer) { // Adicionado check para o container
        console.error("Erro: Elemento membersCardsContainer não encontrado no HTML.");
        showMessage("Erro interno: contêiner de membros não encontrado.", "error");
        return;
    }

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
        // CORRIGIDO: Passando 'path' como parâmetro de consulta
        const response = await fetch(`${BACKEND_URL}?path=get-membros`); 
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

        applyFilters(); // Isso chamará displayMembers que por sua vez chama fetchDashboardSummary e getPresencasTotal
    } catch (error) {
        console.error("Erro ao carregar membros:", error);
        showMessage(`Erro ao carregar membros: ${error.message}`, "error");
        membersCardsContainer.innerHTML = `<div class="col-span-full text-center py-4 text-red-600">Falha ao carregar dados dos membros. Verifique o console para detalhes.</div>`;
    }
}

/**
 * Aplica os filtros aos dados dos membros e atualiza a exibição.
 */
function applyFilters() {
    const nameFilter = filterNameInput.value.toLowerCase().trim();
    const periodoFilter = filterPeriodoSelect.value.toLowerCase().trim();
    const liderFilter = filterLiderInput.value.toLowerCase().trim();
    const gapeFilter = gapeInput.value.toLowerCase().trim(); // Use gapeInput, não filterGapeInput

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
    if (!container) { // Adicionado check para o container
        console.error("Erro: Elemento membersCardsContainer não encontrado no HTML para displayMembers.");
        return;
    }
    container.innerHTML = "";

    // NOVO: Chamada para obter os dados do dashboard (Período, Líder, GAPE, Presenças Mês total)
    // O Apps Script 'presencasMes' retorna esses dados para o dashboard
    const dashboardData = await fetchDashboardSummary(); // CHAMA /get-presencas-mes
    
    // Atualiza os elementos do dashboard principal
    if (dashboardPresencasMesEl) dashboardPresencasMesEl.textContent = dashboardData.presencasMes || 0;
    if (dashboardPeriodoEl) dashboardPeriodoEl.textContent = dashboardData.periodo || "N/A";
    if (dashboardLiderEl) dashboardLiderEl.textContent = dashboardData.lider || "N/A";
    if (dashboardGapeEl) dashboardGapeEl.textContent = dashboardData.gape || "N/A";

    // AGORA: Buscar as presenças TOTAIS por membro (para os cards individuais)
    // Usaremos getPresencasTotal() que retorna { "Nome": count }
    const presencasTotaisPorMembro = await getPresencasTotal(); // CHAMA /get-presencas-total

    if (members.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-4 text-gray-500">Nenhum membro encontrado com os filtros aplicados.</div>`;
        return;
    }

    members.forEach((member, idx) => {
        const memberNameKey = (member.Nome || "").trim();
        // Use presencasTotaisPorMembro para o card individual
        const presencas = presencasTotaisPorMembro[memberNameKey] || 0; 

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
                member.Lider || "N/A" // Este é o líder do membro, que vem do getMembros
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
            
            infoDiv.textContent = `Enviando presença...`;
            infoDiv.classList.remove("hidden");
            confirmBtn.disabled = true;

            try {
                // CORRIGIDO: Passando 'path' como parâmetro de consulta para POST
                const response = await fetch(`${BACKEND_URL}?path=presenca`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nome: member.Nome,
                        data: `${dia}/${mes}/${ano}`,
                        hora: `${hora}:${min}:${seg}`
                        // O 'path' não vai no body, ele vai na URL para o doGet,
                        // mas doPost não usa 'path', usa o próprio corpo.
                        // Seu doPost atual não usa um parâmetro 'sheet', então remova se não for usar:
                        // sheet: "PRESENCAS", 
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json(); 
                    throw new Error(`Erro ao registrar presença: ${response.status} - ${errorData.details || errorData.message || 'Erro desconhecido'}`);
                }

                infoDiv.textContent = `Presença marcada em ${dataHora}`;
                infoDiv.classList.remove("hidden");
                confirmBtn.classList.add("hidden");
                checkbox.disabled = true;

                // ATUALIZAÇÃO: Após registrar presença, você precisa re-chamar as funções de busca de dados
                // para garantir que os números de presença sejam atualizados no card individual e no dashboard.
                
                // 1. Atualiza o número de presenças deste card individual (chama getPresencasTotal)
                const updatedPresencesForMembers = await getPresencasTotal(); // RE-CHAMA /get-presencas-total
                const updatedIndividualPresence = updatedPresencesForMembers[(member.Nome || "").trim()] || 0;
                card.querySelector(".presencas-mes").textContent = updatedIndividualPresence;

                // 2. Atualiza o resumo do dashboard (incluindo o total de presenças no mês)
                await fetchDashboardSummary(); // RE-CHAMA /get-presencas-mes

            } catch (e) {
                console.error("Falha ao enviar presença para o servidor:", e);
                showMessage("Falha ao enviar presença para o servidor. " + e.message, "error");
                infoDiv.textContent = `Erro ao marcar presença!`;
                infoDiv.classList.remove("hidden");
                checkbox.checked = false; 
                confirmBtn.classList.add("hidden"); 
                checkbox.disabled = false; 
            } finally {
                confirmBtn.disabled = false;
            }
        });
    });
}

/**
 * Função para obter as presenças totais por membro.
 * CHAMA: Apps Script -> /get-presencas-total
 */
async function getPresencasTotal() {
    const url = `${BACKEND_URL}?path=get-presencas-total`; // CORRIGIDO: Usando 'path'
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Erro ao buscar presenças totais por membro: ${res.status}`);
        }
        return await res.json(); // Espera { "Nome do Membro": 2, ... }
    } catch (error) {
        console.error("Erro em getPresencasTotal:", error);
        showMessage("Erro ao carregar presenças totais para cards.", "error");
        return {}; // Retorna objeto vazio em caso de erro
    }
}


/**
 * Função para obter os dados do dashboard (Presenças Mês total, Período, Líder, GAPE).
 * CHAMA: Apps Script -> /get-presencas-mes
 */
async function fetchDashboardSummary() {
    const url = `${BACKEND_URL}?path=get-presencas-mes`; // CORRIGIDO: Usando 'path'
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Erro ao buscar resumo do dashboard: ${res.status}`);
        }
        const data = await res.json(); // Espera { presencasMes: X, periodo: Y, lider: Z, gape: W }
        return data;
    } catch (error) {
        console.error("Erro em fetchDashboardSummary:", error);
        showMessage("Erro ao carregar resumo do dashboard.", "error");
        return { presencasMes: 0, periodo: "N/A", lider: "N/A", gape: "N/A" };
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

    // Verificação de existência dos elementos antes de manipular
    if (filterLiderInput) {
        filterLiderInput.innerHTML =
            '<option value="">Todos</option>' +
            lideres.map((l) => `<option value="${l}">${l}</option>`).join("");
    } else {
        console.warn("Elemento filterLiderInput não encontrado.");
    }

    if (filterGapeInput) {
        filterGapeInput.innerHTML =
            '<option value="">Todos</option>' +
            gapes.map((g) => `<option value="${g}">${g}</option>`).join("");
    } else {
        console.warn("Elemento filterGapeInput não encontrado.");
    }
}

// Função para limpar filtros
function clearFilters() {
    showMessage("Limpando filtros...", "info");
    if (filterNameInput) filterNameInput.value = "";
    if (filterPeriodoSelect) filterPeriodoSelect.value = "";
    if (filterLiderInput) filterLiderInput.value = "";
    if (filterGapeInput) filterGapeInput.value = "";
    applyFilters();
}

// Função para aplicar filtros com mensagem
function applyFiltersWithMessage() {
    showMessage("Aplicando filtros...", "info");
    applyFilters();
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
    // Carrega os membros e o dashboard ao iniciar o aplicativo
    fetchMembers(); // Esta função agora lida com o carregamento do dashboard também via displayMembers

    if (applyFiltersBtn) applyFiltersBtn.addEventListener("click", applyFiltersWithMessage);
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearFilters);

    if (filterNameInput) filterNameInput.addEventListener("input", applyFilters);
    if (filterPeriodoSelect) filterPeriodoSelect.addEventListener("change", applyFilters);
    if (filterLiderInput) filterLiderInput.addEventListener("change", applyFilters);
    if (filterGapeInput) filterGapeInput.addEventListener("change", applyFilters);
});
