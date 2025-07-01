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
 * Carrega os dados dos membros.
 * No ambiente real, esta função faria uma requisição ao seu Apps Script implantado.
 */
async function fetchMembers() {
  // Mostra apenas o loading visual nos cards, sem mensagem duplicada
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
      //AKfycbz8Y5Q18jwAqJ9JY-ruay9TrgQIDNoMBWQqK-OJ2kvAnrljZotJEbEmk-VMgyU8-9VT0A
    // --- ATENÇÃO: Substitua a URL abaixo pela URL de implantação do seu Apps Script ---
    const appsScriptUrl = "https://presencasbras.onrender.com";

    let data;
    if (appsScriptUrl) {
      const response = await fetch(appsScriptUrl);
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
      allMembersData = [
        {
          Nome: "João Silva",
          Status: "Ativo",
          Cargo: "Membro",
          Periodo: "Manhã",
          RI: "1234",
          Congregacao: "Sede",
          Lider: "Líder A",
          GAPE: "001 - Betel",
        },
        {
          Nome: "Maria Oliveira",
          Status: "Ativo",
          Cargo: "Diácono",
          Periodo: "Noite",
          RI: "5678",
          Congregacao: "Sede",
          Lider: "Líder B",
          GAPE: "002 - Canaã",
        },
        {
          Nome: "Pedro Souza",
          Status: "Ativo",
          Cargo: "Membro",
          Periodo: "Tarde",
          RI: "9012",
          Congregacao: "Sede",
          Lider: "Líder A",
          GAPE: "001 - Betel",
        },
        {
          Nome: "Ana Costa",
          Status: "Aguardando",
          Cargo: "Membro",
          Periodo: "Manhã",
          RI: "3456",
          Congregacao: "Congregação X",
          Lider: "Líder C",
          GAPE: "003 - Gideão",
        },
        {
          Nome: "Lucas Pereira",
          Status: "Ativo",
          Cargo: "Membro",
          Periodo: "Noite",
          RI: "7890",
          Congregacao: "Sede",
          Lider: "Líder B",
          GAPE: "002 - Canaã",
        },
        {
          Nome: "Sara Martins",
          Status: "Ativo",
          Cargo: "Evangelista",
          Periodo: "Manhã",
          RI: "1122",
          Congregacao: "Sede",
          Lider: "Líder C",
          GAPE: "003 - Gideão",
        },
      ];
      fillSelectOptions(); // Preenche selects após carregar dados mockados
      showMessage("Dados mockados carregados para demonstração.", "info");
    }

    applyFilters(); // Aplica os filtros iniciais (todos os membros)
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
      infoDiv.textContent = `Presença marcada em ${dataHora}`;
      infoDiv.classList.remove("hidden");
      confirmBtn.classList.add("hidden");
      checkbox.disabled = true;
      try {
        await fetch(
          "https://presencasbras.onrender.com/presenca",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nome: member.Nome,
              data: `${dia}/${mes}/${ano}`,
              hora: `${hora}:${min}:${seg}`,
              sheet: "PRESENCAS",
            }),
          }
        );
      } catch (e) {
        showMessage("Falha ao enviar presença para o servidor.", "error");
      }
    });
  });
}

/**
 * Simula a marcação de presença e envia os dados (seria para o Apps Script doPost).
 */
async function markAttendance() {
  const checkedMembers = Array.from(
    document.querySelectorAll(
      '#membersTableBody input[type="checkbox"]:checked'
    )
  ).map((checkbox) => checkbox.dataset.memberName);

  if (checkedMembers.length === 0) {
    showMessage("Nenhum membro selecionado para marcar presença.", "info");
    return;
  }

  showMessage(
    `Marcando presença para ${checkedMembers.length} membro(s)...`,
    "info"
  );

  // --- Lógica para enviar dados ao Apps Script (exemplo de doPost) ---
  try {
    // Você precisaria de uma função doPost no seu Apps Script para receber e processar esses dados.
    // Exemplo de como você enviaria:
    /*
        const response = await fetch('SUA_URL_DO_APPS_SCRIPT_DOPOST_AQUI', {
            method: 'POST',
            mode: 'no-cors', // Pode ser necessário para evitar CORS issues em Apps Script simples
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date: new Date().toISOString().split('T')[0], // Data atual
                presentMembers: checkedMembers
            }),
        });
        // Note: Com 'no-cors', você não pode ler a resposta do servidor diretamente.
        // Para feedback, o Apps Script teria que retornar um ContentService.createTextOutput.
        */

    showMessage(
      `Presença marcada com sucesso para ${checkedMembers.length} membro(s)! (Simulado)`,
      "success"
    );

    // Opcional: Limpar checkboxes após marcar presença
    document
      .querySelectorAll('#membersTableBody input[type="checkbox"]:checked')
      .forEach((cb) => (cb.checked = false));
  } catch (error) {
    console.error("Erro ao marcar presença:", error);
    showMessage(`Erro ao marcar presença: ${error.message}`, "error");
  }
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

// Modifique fetchMembers para chamar fillSelectOptions após carregar os dados
async function fetchMembers() {
  // Mostra apenas o loading visual nos cards, sem mensagem duplicada
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
    const appsScriptUrl =
      "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLh6Ji04QgkX6sMQVSgqxEG4V6K9Dr9p--hBqGxVz2t0G0vZYfeBFhPXSZuPu_F5hNOAmaLdb1pEh5Y0EkkqmjhlfcSzEruKe4uRk0jxpHOMUhjpYjVqfQ3fTfmePTaLlG3o8mMCjfnpNLDFHkPldCB2o8WBzRJSN2h3v1Hqm4cfVvGWDbJT_4fUsFzS4Ck7UrkVEMqGHpd1VzMXtIzb2Q10bJ_f2hmIXCsEJYMUv9x65Nvh6ohqlbHBziq8c6vqyAj4h3osJkQib8EzDPYDkDLh5Mt-Ug&lib=MNOzUMDSZklwVXJnUkxjSACUCrVfXa6eb";

    let data;
    if (appsScriptUrl) {
      const response = await fetch(appsScriptUrl);
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
      allMembersData = [
        {
          Nome: "João Silva",
          Status: "Ativo",
          Cargo: "Membro",
          Periodo: "Manhã",
          RI: "1234",
          Congregacao: "Sede",
          Lider: "Líder A",
          GAPE: "001 - Betel",
        },
        {
          Nome: "Maria Oliveira",
          Status: "Ativo",
          Cargo: "Diácono",
          Periodo: "Noite",
          RI: "5678",
          Congregacao: "Sede",
          Lider: "Líder B",
          GAPE: "002 - Canaã",
        },
        {
          Nome: "Pedro Souza",
          Status: "Ativo",
          Cargo: "Membro",
          Periodo: "Tarde",
          RI: "9012",
          Congregacao: "Sede",
          Lider: "Líder A",
          GAPE: "001 - Betel",
        },
        {
          Nome: "Ana Costa",
          Status: "Aguardando",
          Cargo: "Membro",
          Periodo: "Manhã",
          RI: "3456",
          Congregacao: "Congregação X",
          Lider: "Líder C",
          GAPE: "003 - Gideão",
        },
        {
          Nome: "Lucas Pereira",
          Status: "Ativo",
          Cargo: "Membro",
          Periodo: "Noite",
          RI: "7890",
          Congregacao: "Sede",
          Lider: "Líder B",
          GAPE: "002 - Canaã",
        },
        {
          Nome: "Sara Martins",
          Status: "Ativo",
          Cargo: "Evangelista",
          Periodo: "Manhã",
          RI: "1122",
          Congregacao: "Sede",
          Lider: "Líder C",
          GAPE: "003 - Gideão",
        },
      ];
      fillSelectOptions(); // Preenche selects após carregar dados mockados
      showMessage("Dados mockados carregados para demonstração.", "info");
    }

    applyFilters(); // Aplica os filtros iniciais (todos os membros)
  } catch (error) {
    console.error("Erro ao carregar membros:", error);
    showMessage(`Erro ao carregar membros: ${error.message}`, "error");
    membersCardsContainer.innerHTML = `<div class="col-span-full text-center py-4 text-red-600">Falha ao carregar dados dos membros. Verifique o console para detalhes.</div>`;
  }
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

// Aplica filtros ao digitar/mudar seleção para uma experiência mais dinâmica
filterNameInput.addEventListener("input", applyFilters);
filterPeriodoSelect.addEventListener("change", applyFilters);
filterLiderInput.addEventListener("input", applyFilters);
filterGapeInput.addEventListener("input", applyFilters);

// Carrega os membros ao iniciar o aplicativo
window.onload = fetchMembers;
