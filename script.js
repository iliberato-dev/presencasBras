/**
 * script.js - Lógica de frontend para o controle de presença.
 * Este script se comunica com o backend no Render, que por sua vez,
 * atua como proxy para o Google Apps Script.
 */

// ------------------------------------------------------
// CONFIGURAÇÃO GLOBAL
// ------------------------------------------------------
// URL base do seu serviço de backend hospedado no Render.
// O frontend fará requisições para este URL.
const BACKEND_URL = "https://presencasbras.onrender.com"; 

// ------------------------------------------------------
// ELEMENTOS DO DOM
// Captura referências aos elementos HTML da página.
// ------------------------------------------------------
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

// ------------------------------------------------------
// VARIÁVEIS DE ESTADO
// Armazenam os dados dos membros e o resultado dos filtros.
// ------------------------------------------------------
let allMembersData = []; // Todos os dados dos membros carregados
let filteredMembers = []; // Membros após a aplicação dos filtros

/**
 * Exibe uma mensagem de status para o usuário em uma área designada.
 * @param {string} message A mensagem a ser exibida.
 * @param {'info'|'success'|'error'|'warning'} type O tipo da mensagem para estilização.
 */
function showMessage(message, type = "info") {
    // Verifica se o elemento da área de mensagem existe no DOM.
    if (!messageArea) { 
        console.warn("Elemento messageArea não encontrado no HTML. Mensagem: " + message);
        return;
    }
    // Evita exibir mensagens de carregamento repetidas que o spinner já indica.
    if (message === "Carregando dados dos membros...") return;

    messageArea.textContent = message;
    messageArea.className = "message-box show"; // Estilo base para exibir a caixa
    messageArea.classList.remove("hidden"); // Garante que a caixa está visível

    // Adiciona classes de estilização com base no tipo da mensagem.
    if (type === "success") {
        messageArea.classList.add("message-success");
    } else if (type === "error") {
        messageArea.classList.add("message-error");
    } else if (type === "warning") {
        messageArea.classList.add("bg-yellow-100", "text-yellow-800"); // Exemplo de estilo para warning
    } else {
        messageArea.classList.add("bg-blue-100", "text-blue-800"); // Estilo padrão 'info'
    }

    // Esconde a mensagem após 5 segundos.
    setTimeout(() => {
        messageArea.classList.remove("show"); // Inicia transição para esconder
        setTimeout(() => messageArea.classList.add("hidden"), 500); // Esconde completamente após a transição
    }, 5000);
}

/**
 * Carrega os dados de todos os membros do backend.
 * Atualiza o estado global 'allMembersData' e as opções dos filtros.
 * @returns {Promise<Array>} Um array de objetos de membros.
 */
async function fetchMembers() {
    // Exibe um spinner de carregamento no contêiner dos cards.
    if (!membersCardsContainer) {
        console.error("Erro: Elemento membersCardsContainer não encontrado no HTML ao buscar membros.");
        showMessage("Erro interno: contêiner de membros não encontrado.", "error");
        return []; // Retorna array vazio para evitar erros subsequentes.
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
    showMessage("Carregando dados dos membros...");

    try {
        // Faz a requisição GET para o endpoint de membros no backend.
        const response = await fetch(`${BACKEND_URL}/get-membros`); 
        if (!response.ok) {
            // Se a resposta não for bem-sucedida (status 2xx), lança um erro.
            throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
        }
        const data = await response.json(); // Converte a resposta para JSON.
        // O backend deve retornar um objeto com a propriedade 'membros'.
        console.log("fetchMembers: Dados de membros recebidos do backend:", data.membros); // NOVO LOG
        return data.membros || []; 
    } catch (error) {
        console.error("Erro ao carregar membros:", error);
        showMessage(`Erro ao carregar membros: ${error.message}`, "error");
        membersCardsContainer.innerHTML = `<div class="col-span-full text-center py-4 text-red-600">Falha ao carregar dados dos membros. Verifique o console para detalhes.</div>`;
        return []; // Retorna um array vazio em caso de erro.
    }
}

/**
 * Aplica os filtros atuais aos dados de todos os membros e atualiza a exibição.
 * Esta função é chamada sempre que um filtro é alterado.
 */
function applyFilters() {
    // Captura os valores dos campos de filtro, tratando casos onde o elemento pode não existir.
    const nameFilter = filterNameInput ? filterNameInput.value.toLowerCase().trim() : "";
    const periodoFilter = filterPeriodoSelect ? filterPeriodoSelect.value.toLowerCase().trim() : "";
    const liderFilter = filterLiderInput ? filterLiderInput.value.toLowerCase().trim() : "";
    const gapeFilter = filterGapeInput ? filterGapeInput.value.toLowerCase().trim() : "";

    // Filtra 'allMembersData' com base nos valores dos filtros.
    filteredMembers = allMembersData.filter((member) => {
        // Converte os valores do membro para minúsculas para comparação case-insensitive.
        const memberName = String(member.Nome || "").toLowerCase();
        const memberPeriodo = String(member.Periodo || "").toLowerCase();
        const memberLider = String(member.Lider || "").toLowerCase();
        const memberGape = String(member.GAPE || "").toLowerCase();

        // Verifica se o membro corresponde a cada filtro.
        const matchesName = nameFilter === "" || memberName.includes(nameFilter);
        const matchesPeriodo =
            periodoFilter === "" || memberPeriodo.includes(periodoFilter);
        const matchesLider =
            liderFilter === "" || memberLider.includes(liderFilter);
        const matchesGape = gapeFilter === "" || memberGape.includes(gapeFilter);

        // Retorna true se o membro corresponder a TODOS os filtros.
        return matchesName && matchesPeriodo && matchesLider && matchesGape;
    });

    // Chama a função para exibir os membros filtrados.
    displayMembers(filteredMembers);
}

/**
 * Exibe os membros na tela como cards individuais, incluindo um checkbox de presença.
 * @param {Array<Object>} members Array de objetos de membros a serem exibidos.
 */
async function displayMembers(members) {
    const container = document.getElementById("membersCardsContainer");
    if (!container) {
        console.error("Erro: Elemento membersCardsContainer não encontrado no HTML para displayMembers.");
        return;
    }
    container.innerHTML = ""; // Limpa o conteúdo atual do contêiner.

    // Busca as contagens de presença totais para cada membro para exibir nos cards.
    const presencasTotaisPorMembro = await getPresencasTotal(); 

    if (members.length === 0) {
        // Exibe uma mensagem se nenhum membro for encontrado após os filtros.
        container.innerHTML = `<div class="col-span-full text-center py-4 text-gray-500">Nenhum membro encontrado com os filtros aplicados.</div>`;
        return;
    }

    // Itera sobre os membros e cria um card HTML para cada um.
    members.forEach((member, idx) => {
        const memberNameKey = (member.Nome || "").trim();
        const presencas = presencasTotaisPorMembro[memberNameKey] || 0; 

        const card = document.createElement("div");
        card.className = "fade-in-row bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 relative";
        card.style.animationDelay = `${idx * 0.04}s`; // Adiciona um pequeno atraso para animação em cascata.
        card.innerHTML = `
            <div class="font-bold text-lg text-gray-800">${member.Nome || "N/A"}</div>
            <div class="text-sm text-green-700 font-bold"><b>Presenças totais:</b> <span class="presencas-mes">${presencas}</span></div>
            <div class="text-sm text-gray-600"><b>Período:</b> ${member.Periodo || "N/A"}</div>
            <div class="text-sm text-gray-600"><b>Líder:</b> ${member.Lider || "N/A"}</div>
            <div class="text-sm text-gray-600"><b>GAPE:</b> ${member.GAPE || "N/A"}</div>
            <label class="flex items-center gap-2 mt-2">
                <input type="checkbox" class="h-5 w-5 text-blue-600 rounded focus:ring-blue-500 presence-checkbox" data-member-name="${member.Nome}">
                <span class="text-sm text-gray-700">Presente</span>
            </label>
            <button class="btn-confirm-presence w-full mt-2 hidden confirm-presence-btn">Confirmar Presença</button>
            <div class="text-xs text-green-700 mt-1 hidden presence-info"></div>
        `;
        container.appendChild(card);

        // Adiciona event listeners para o checkbox e botão de confirmação de presença.
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
                // Envia a requisição POST para registrar a presença no backend.
                const response = await fetch(`${BACKEND_URL}/presenca`, { 
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nome: member.Nome,
                        data: `${dia}/${mes}/${ano}`,
                        hora: `${hora}:${min}:${seg}`,
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

                // Atualiza as contagens de presença nos cards e no dashboard após registrar uma presença.
                const updatedPresencesForMembers = await getPresencasTotal(); 
                const updatedIndividualPresence = updatedPresencesForMembers[(member.Nome || "").trim()] || 0;
                card.querySelector(".presencas-mes").textContent = updatedIndividualPresence;

                await updateDashboardSummary(); // Atualiza o resumo do dashboard.
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
 * Função para obter as contagens de presença totais por cada membro.
 * @returns {Promise<Object>} Um objeto onde as chaves são os nomes dos membros e os valores são as contagens.
 */
async function getPresencasTotal() {
    const url = `${BACKEND_URL}/get-presencas-total`; 
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Erro ao buscar presenças totais por membro: ${res.status}`);
        }
        return await res.json(); 
    } catch (error) {
        console.error("Erro em getPresencasTotal:", error);
        showMessage("Erro ao carregar presenças totais para cards.", "error");
        return {}; 
    }
}

/**
 * Função para obter e atualizar os dados do card de resumo do dashboard.
 * @returns {Promise<Object>} Um objeto com o total de presenças do mês, período, líder e GAPE.
 */
async function updateDashboardSummary() { 
    const url = `${BACKEND_URL}/get-presencas-mes`; 
    try {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`Erro ao buscar resumo do dashboard: ${res.status}`);
        }
        const data = await res.json();
        
        // Atualiza os elementos HTML do card de resumo.
        if (dashboardPresencasMesEl) dashboardPresencasMesEl.textContent = data.presencasMes || 0;
        if (dashboardPeriodoEl) dashboardPeriodoEl.textContent = data.periodo || "N/A";
        if (dashboardLiderEl) dashboardLiderEl.textContent = data.lider || "N/A";
        if (dashboardGapeEl) dashboardGapeEl.textContent = data.gape || "N/A";

        return data; // Retorna os dados para quem chamou (se necessário).
    } catch (error) {
        console.error("Erro em updateDashboardSummary:", error);
        showMessage("Erro ao carregar resumo do dashboard.", "error");
        return { presencasMes: 0, periodo: "N/A", lider: "N/A", gape: "N/A" };
    }
}

/**
 * Preenche dinamicamente as opções dos selects de filtros (Líder e GAPE)
 * com base nos dados dos membros carregados.
 */
function fillSelectOptions() {
    // Extrai líderes únicos e os ordena.
    const lideres = [...new Set(allMembersData.map((m) => m.Lider).filter(Boolean))].sort();
    // NOVO LOG: Verifique quais líderes foram extraídos
    console.log("fillSelectOptions: Líderes únicos extraídos:", lideres); 
    
    // Extrai GAPEs únicos e os ordena.
    const gapes = [...new Set(allMembersData.map((m) => m.GAPE).filter(Boolean))].sort();
    // NOVO LOG: Verifique quais GAPEs foram extraídos
    console.log("fillSelectOptions: GAPEs únicos extraídos:", gapes); 

    // Popula o select de Líder.
    if (filterLiderInput) {
        filterLiderInput.innerHTML = '<option value="">Todos</option>' + lideres.map((l) => `<option value="${l}">${l}</option>`).join("");
    } else {
        console.warn("Elemento filterLiderInput não encontrado.");
    }

    // Popula o select de GAPE.
    if (filterGapeInput) {
        filterGapeInput.innerHTML = '<option value="">Todos</option>' + gapes.map((g) => `<option value="${g}">${g}</option>`).join("");
    } else {
        console.warn("Elemento filterGapeInput não encontrado.");
    }
}

/**
 * Limpa todos os campos de filtro e reaplica os filtros, exibindo todos os membros novamente.
 */
function clearFilters() {
    showMessage("Limpando filtros...", "info");
    if (filterNameInput) filterNameInput.value = "";
    if (filterPeriodoSelect) filterPeriodoSelect.value = "";
    if (filterLiderInput) filterLiderInput.value = "";
    if (filterGapeInput) filterGapeInput.value = "";
    applyFilters();
}

/**
 * Função auxiliar para aplicar filtros com uma mensagem de feedback.
 */
function applyFiltersWithMessage() {
    showMessage("Aplicando filtros...", "info");
    applyFilters();
}

// ------------------------------------------------------
// INICIALIZAÇÃO DA APLICAÇÃO (Após o DOM estar completamente carregado)
// ------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Adiciona event listeners aos botões e campos de filtro.
    // Verificações 'if (element)' para evitar erros se o HTML não tiver os elementos.
    if (applyFiltersBtn) applyFiltersBtn.addEventListener("click", applyFiltersWithMessage);
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearFilters);

    if (filterNameInput) filterNameInput.addEventListener("input", applyFilters);
    if (filterPeriodoSelect) filterPeriodoSelect.addEventListener("change", applyFilters);
    if (filterLiderInput) filterLiderInput.addEventListener("change", applyFilters);
    if (filterGapeInput) filterGapeInput.addEventListener("change", applyFilters);

    /**
     * Função assíncrona principal para inicializar toda a aplicação.
     * Ela carrega os dados dos membros, popula filtros, exibe cards e atualiza o dashboard.
     */
    async function initializeApp() {
        try {
            // 1. Carrega todos os membros do backend e os armazena globalmente.
            allMembersData = await fetchMembers(); 
            
            // 2. Preenche as opções dos selects de filtro com base nos dados carregados.
            fillSelectOptions();
            
            // 3. Aplica os filtros (isso resultará na chamada de displayMembers).
            // displayMembers é async e também chamará getPresencasTotal()
            applyFilters(); 
            
            // 4. Atualiza o card de resumo do dashboard.
            // Esta chamada é redundante se displayMembers já está chamando,
            // mas garante que o dashboard seja populado mesmo se não houver membros para displayMembers.
            await updateDashboardSummary(); 

            // Exibe uma mensagem de sucesso ou informação sobre a quantidade de membros.
            if (allMembersData.length > 0) {
                showMessage(`Membros carregados com sucesso! Total: ${allMembersData.length}`, "success");
            } else {
                 showMessage("Nenhum membro encontrado ou dados vazios.", "info");
            }

        } catch (error) {
            console.error("Erro na inicialização da aplicação:", error);
            showMessage(`Erro crítico na inicialização: ${error.message}`, "error");
        }
    }

    // Chama a função de inicialização quando o DOM estiver pronto.
    initializeApp();
});
