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
const globalLoadingIndicator = document.getElementById("globalLoadingIndicator"); // Novo: para o indicador de carregamento global

// Elementos do Dashboard/Resumo
const toggleDashboardBtn = document.getElementById("toggleDashboardBtn");
const dashboardContainer = document.getElementById("dashboardContainer");
const dashboardOpenIcon = document.getElementById("dashboardOpenIcon");
const dashboardCloseIcon = document.getElementById("dashboardCloseIcon");
const dashboardOpenText = document.getElementById("dashboardOpenText");
const dashboardCloseText = document.getElementById("dashboardCloseText");

// Elementos para exibir os dados do resumo
const dashboardPresencasMes = document.getElementById("dashboardPresencasMes");
const dashboardPeriodo = document.getElementById("dashboardPeriodo"); // Mantido, mas não preenchido por get-presencas-mes/total
const dashboardLider = document.getElementById("dashboardLider");     // Mantido, mas não preenchido por get-presencas-mes/total
const dashboardGape = document.getElementById("dashboardGape");       // Mantido, mas não preenchido por get-presencas-mes/total
const totalCountsList = document.getElementById("totalCountsList"); // NOVO: para a lista de presenças totais por membro

/**
 * Exibe/oculta o indicador de carregamento global.
 * @param {boolean} show - true para mostrar, false para ocultar.
 */
function showGlobalLoading(show) {
    if (globalLoadingIndicator) {
        if (show) {
            globalLoadingIndicator.classList.remove("hidden");
        } else {
            globalLoadingIndicator.classList.add("hidden");
        }
    }
}

/**
 * Exibe uma mensagem de status para o usuário.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success'|'error'|'info'} type - O tipo de mensagem (para estilização).
 */
function showMessage(message, type = "info") {
    // Não mostrar mensagem de carregando membros aqui para evitar duplicidade
    if (message === "Carregando dados dos membros...") return;
    messageArea.textContent = message;
    messageArea.className = "message-box show"; // Adiciona animação
    messageArea.classList.remove("hidden");

    // Remove classes de tipo anteriores e adiciona a nova
    messageArea.classList.remove("message-success", "message-error", "bg-blue-100", "text-blue-800");
    if (type === "success") {
        messageArea.classList.add("message-success");
    } else if (type === "error") {
        messageArea.classList.add("message-error");
    } else {
        messageArea.classList.add("bg-blue-100", "text-blue-800"); // Estilo padrão para info
    }

    setTimeout(() => {
        messageArea.classList.remove("show");
        setTimeout(() => messageArea.classList.add("hidden"), 500);
    }, 5000);
}

/**
 * Carrega os dados dos membros.
 * No ambiente real, esta função faria uma requisição ao seu Apps Script implantado.
 */
async function fetchMembers() {
    showGlobalLoading(true); // Mostrar loading global
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
        // --- ATENÇÃO: Substitua a URL abaixo pela URL de implantação do seu Apps Script ---
        // Esta URL deve ser a do seu backend Node.js, que por sua vez se conecta ao Apps Script
        const backendUrl = "https://presencasbras.onrender.com/get-membros"; 

        let data;
        // Se você quiser usar dados mockados para desenvolvimento, descomente o else
        // e comente o bloco if (backendUrl)
        if (backendUrl) {
            const response = await fetch(backendUrl);
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            data = await response.json();
            allMembersData = data.membros || data.data || [];
            fillSelectOptions(); // Preenche selects após carregar dados
            if (allMembersData.length === 0) {
                showMessage("Nenhum membro encontrado ou dados vazios.", "info");
            } else {
                showMessage(
                    `Membros carregados com sucesso! Total: ${allMembersData.length}`,
                    "success"
                );
            }
        } else {
            // Dados mockados para desenvolvimento
            allMembersData = [
                { Nome: "João Silva", Status: "Ativo", Cargo: "Membro", Periodo: "Manhã", RI: "1234", Congregacao: "Sede", Lider: "Líder A", GAPE: "001 - Betel" },
                { Nome: "Maria Oliveira", Status: "Ativo", Cargo: "Diácono", Periodo: "Noite", RI: "5678", Congregacao: "Sede", Lider: "Líder B", GAPE: "002 - Canaã" },
                { Nome: "Pedro Souza", Status: "Ativo", Cargo: "Membro", Periodo: "Tarde", RI: "9012", Congregacao: "Sede", Lider: "Líder A", GAPE: "001 - Betel" },
                { Nome: "Ana Costa", Status: "Aguardando", Cargo: "Membro", Periodo: "Manhã", RI: "3456", Congregacao: "Congregação X", Lider: "Líder C", GAPE: "003 - Gideão" },
                { Nome: "Lucas Pereira", Status: "Ativo", Cargo: "Membro", Periodo: "Noite", RI: "7890", Congregacao: "Sede", Lider: "Líder B", GAPE: "002 - Canaã" },
                { Nome: "Sara Martins", Status: "Ativo", Cargo: "Evangelista", Periodo: "Manhã", RI: "1122", Congregacao: "Sede", Lider: "Líder C", GAPE: "003 - Gideão" },
            ];
            fillSelectOptions(); // Preenche selects após carregar dados mockados
            showMessage("Dados mockados carregados para demonstração.", "info");
        }

        applyFilters(); // Aplica os filtros iniciais (todos os membros)
    } catch (error) {
        console.error("Erro ao carregar membros:", error);
        showMessage(`Erro ao carregar membros: ${error.message}`, "error");
        membersCardsContainer.innerHTML = `<div class="col-span-full text-center py-4 text-red-600">Falha ao carregar dados dos membros. Verifique o console para detalhes.</div>`;
    } finally {
        showGlobalLoading(false); // Esconder loading global
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

        // Aplica todos os filtros cumulativamente
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
function displayMembers(members) {
    const container = document.getElementById("membersCardsContainer");
    container.classList.remove("hidden");
    container.innerHTML = "";

    if (members.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-4 text-gray-500">Nenhum membro encontrado com os filtros aplicados.</div>`;
        return;
    }

    members.forEach((member, idx) => {
        const card = document.createElement("div");
        card.className =
            "fade-in-row bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 relative";
        card.style.animationDelay = `${idx * 0.04}s`;
        card.innerHTML = `
            <div class="font-bold text-lg text-gray-800">${
                member.Nome || "N/A"
            }</div>
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
            <button class="btn-confirm-presence w-full mt-2 hidden bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300">Confirmar Presença</button>
            <div class="text-xs text-green-700 mt-1 hidden presence-info"></div>
        `;
        container.appendChild(card);

        // Adiciona evento para marcar presença individual
        const checkbox = card.querySelector(".presence-checkbox");
        const infoDiv = card.querySelector(".presence-info");
        const confirmBtn = card.querySelector(".btn-confirm-presence"); // Seleciona pelo nome da classe
        
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
            showGlobalLoading(true); // Mostrar loading
            const now = new Date();
            const dia = String(now.getDate()).padStart(2, "0");
            const mes = String(now.getMonth() + 1).padStart(2, "0");
            const ano = now.getFullYear();
            const hora = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");
            const seg = String(now.getSeconds()).padStart(2, "0");
            const dataHora = `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
            
            infoDiv.textContent = `Registrando...`;
            infoDiv.classList.remove("hidden", "text-green-700");
            infoDiv.classList.add("text-blue-700"); // Mudar cor para indicar "registrando"
            confirmBtn.disabled = true; // Desabilita o botão para evitar cliques múltiplos
            checkbox.disabled = true; // Desabilita o checkbox após clicar em confirmar

            try {
                const response = await fetch(
                    "https://presencasbras.onrender.com/presenca", // URL do seu backend intermediário
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nome: member.Nome,
                            data: `${dia}/${mes}/${ano}`,
                            hora: `${hora}:${min}:${seg}`,
                            sheet: "PRESENCAS", // Este 'sheet' pode ser ignorado pelo Apps Script se ele já sabe onde escrever
                        }),
                    }
                );

                const responseData = await response.json(); // Tenta parsear JSON
                
                if (response.ok) {
                    infoDiv.textContent = `Presença marcada em ${dataHora}`;
                    infoDiv.classList.remove("text-blue-700");
                    infoDiv.classList.add("text-green-700");
                    showMessage("Presença registrada com sucesso!", "success");
                } else {
                    // Se a resposta não for OK, exibe o erro do servidor
                    infoDiv.textContent = `Erro: ${responseData.details || responseData.message || "Falha ao registrar"}`;
                    infoDiv.classList.remove("text-blue-700", "text-green-700");
                    infoDiv.classList.add("text-red-600");
                    showMessage(`Erro ao registrar presença: ${responseData.details || responseData.message || "Erro desconhecido"}`, "error");
                    // Re-habilita o botão e checkbox se houver erro para permitir nova tentativa
                    confirmBtn.disabled = false;
                    checkbox.disabled = false;
                }
            } catch (e) {
                console.error("Erro na requisição POST do frontend:", e);
                infoDiv.textContent = "Falha ao enviar presença para o servidor.";
                infoDiv.classList.remove("text-blue-700", "text-green-700");
                infoDiv.classList.add("text-red-600");
                showMessage("Falha ao enviar presença para o servidor. Verifique sua conexão.", "error");
                // Re-habilita o botão e checkbox se houver erro para permitir nova tentativa
                confirmBtn.disabled = false;
                checkbox.disabled = false;
            } finally {
                confirmBtn.classList.add("hidden"); // Oculta o botão de confirmar após a tentativa
                showGlobalLoading(false); // Esconder loading
            }
        });
    });
}

/**
 * Simula a marcação de presença e envia os dados (seria para o Apps Script doPost).
 * NOTA: Esta função não é mais usada para marcação individual, que agora é feita por card.
 * Mantenha-a se tiver um botão "Marcar Todos" ou similar.
 */
async function markAttendance() {
    // Lógica antiga, pode ser removida se não houver um botão "Marcar Todos"
    showMessage("Esta função é para demonstração e não é mais usada para marcação individual.", "info");
}

// Função para preencher selects de Líder e GAPE dinamicamente
function fillSelectOptions() {
    // Extrai valores únicos de Líder e GAPE dos dados
    const lideres = [
        ...new Set(allMembersData.map((m) => m.Lider).filter(Boolean)),
    ].sort();
    const gapes = [
        ...new Set(allMembersData.map((m) => m.GAPE).filter(Boolean)),
    ].sort();

    // Preenche o select de Líder
    filterLiderInput.innerHTML =
        '<option value="">Todos</option>' +
        lideres.map((l) => `<option value="${l}">${l}</option>`).join("");

    // Preenche o select de GAPE
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

// --- FUNÇÃO PARA CARREGAR E EXIBIR O RESUMO DO DASHBOARD ---
async function fetchAndDisplaySummary() {
    showGlobalLoading(true); // Mostrar loading global
    showMessage("Carregando resumo das presenças...", "info");
    try {
        // --- Requisição para Presenças do Mês ---
        const responseMes = await fetch("https://presencasbras.onrender.com/get-presencas-mes");
        if (!responseMes.ok) {
            throw new Error(`Erro ao buscar presenças do mês: ${responseMes.statusText}`);
        }
        const dataMes = await responseMes.json();
        console.log("Dados de presenças do mês:", dataMes);

        // --- Requisição para Presenças Totais (por pessoa) ---
        const responseTotal = await fetch("https://presencasbras.onrender.com/get-presencas-total");
        if (!responseTotal.ok) {
            throw new Error(`Erro ao buscar presenças totais: ${responseTotal.statusText}`);
        }
        const dataTotal = await responseTotal.json();
        console.log("Dados de presenças totais:", dataTotal);

        // --- Atualizar o HTML com os dados ---
        if (dashboardPresencasMes) {
            dashboardPresencasMes.textContent = dataMes.presencasMes || 0;
        }
        // Os campos 'Período', 'Líder', 'GAPE' no seu dashboard HTML
        // não são preenchidos automaticamente por 'presencasMes' ou 'presencasTotal'.
        // Se você quiser preencher com o período/líder/gape do *usuário atual* ou
        // um resumo por *esses filtros*, a lógica precisa ser mais complexa
        // ou você precisaria de rotas GET adicionais no Apps Script.
        // Por enquanto, eles permanecerão como '--' a menos que você adicione lógica para eles.
        // if (dashboardPeriodo) dashboardPeriodo.textContent = dataMes.periodo || "--"; // Exemplo se o Apps Script retornasse
        // if (dashboardLider) dashboardLider.textContent = dataMes.lider || "--";
        // if (dashboardGape) dashboardGape.textContent = dataMes.gape || "--";

        if (totalCountsList) {
            totalCountsList.innerHTML = ''; // Limpa a lista antes de adicionar novos itens
            const sortedCounts = Object.entries(dataTotal).sort(([, countA], [, countB]) => countB - countA); // Ordena decrescentemente por contagem

            if (sortedCounts.length > 0) {
                sortedCounts.forEach(([name, count]) => {
                    const listItem = document.createElement('li');
                    listItem.className = "text-sm text-gray-100"; // Tailwind classes for styling list items
                    listItem.innerHTML = `<span class="font-semibold">${name}:</span> ${count} presenças`;
                    totalCountsList.appendChild(listItem);
                });
            } else {
                const listItem = document.createElement('li');
                listItem.className = "text-sm text-gray-200 text-center";
                listItem.textContent = 'Nenhuma presença total registrada.';
                totalCountsList.appendChild(listItem);
            }
        }

        showMessage("Resumo carregado com sucesso!", "success");

    } catch (error) {
        console.error("Erro ao carregar o resumo:", error);
        showMessage(`Erro ao carregar o resumo: ${error.message}`, "error");
    } finally {
        showGlobalLoading(false); // Esconder loading global
    }
}

// --- LÓGICA DE EXIBIÇÃO/OCULTAÇÃO DO DASHBOARD ---
function toggleDashboardVisibility() {
    const isDashboardVisible = dashboardContainer.classList.contains("max-h-screen");

    if (isDashboardVisible) {
        // Ocultar Dashboard
        dashboardContainer.classList.remove("max-h-screen", "opacity-100");
        dashboardContainer.classList.add("max-h-0", "opacity-0");
        dashboardOpenIcon.classList.remove("hidden");
        dashboardOpenText.classList.remove("hidden");
        dashboardCloseIcon.classList.add("hidden");
        dashboardCloseText.classList.add("hidden");
    } else {
        // Exibir Dashboard
        fetchAndDisplaySummary(); // Chamar a função para buscar e exibir os dados
        dashboardContainer.classList.remove("max-h-0", "opacity-0");
        dashboardContainer.classList.add("max-h-screen", "opacity-100");
        dashboardOpenIcon.classList.add("hidden");
        dashboardOpenText.classList.add("hidden");
        dashboardCloseIcon.classList.remove("hidden");
        dashboardCloseText.classList.remove("hidden");
    }
}

// Event Listeners
applyFiltersBtn.addEventListener("click", applyFiltersWithMessage);
document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);

// Aplica filtros ao digitar/mudar seleção para uma experiência mais dinâmica
filterNameInput.addEventListener("input", applyFilters);
filterPeriodoSelect.addEventListener("change", applyFilters);
filterLiderInput.addEventListener("input", applyFilters);
filterGapeInput.addEventListener("input", applyFilters);

// Event Listener para o botão de alternar o Dashboard
if (toggleDashboardBtn) {
    toggleDashboardBtn.addEventListener("click", toggleDashboardVisibility);
}

// Carrega os membros ao iniciar o aplicativo
window.onload = fetchMembers;
