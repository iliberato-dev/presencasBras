// ------------------------------------------------------
// CONFIGURAÇÃO GLOBAL (script.js - VOLTANDO AO QUE ESTAVA FUNCIONANDO)
// ------------------------------------------------------
const BACKEND_URL = "https://presencasbras.onrender.com"; // Seu frontend vai chamar o Render

// ... (resto do seu script.js, como nos códigos que você forneceu anteriormente,
// sem '?path=' nas chamadas fetch)

/**
 * Carrega os dados dos membros (via backend).
 */
async function fetchMembers() {
    // ...
    // CHAMADA: /get-membros
    const response = await fetch(`${BACKEND_URL}/get-membros`); 
    // ...
}

/**
 * Exibe os membros...
 */
async function displayMembers(members) {
    // ...
    // CHAMADA: /get-presencas-mes (para o dashboard)
    const dashboardData = await fetchDashboardSummary(); 
    // ...
    // CHAMADA: /get-presencas-total (para presenças individuais)
    const presencasTotaisPorMembro = await getPresencasTotal(); 
    // ...
}

/**
 * Função para obter as presenças totais por membro.
 */
async function getPresencasTotal() {
    // CHAMADA: /get-presencas-total
    const url = `${BACKEND_URL}/get-presencas-total`; 
    // ...
}

/**
 * Função para obter os dados do dashboard.
 */
async function fetchDashboardSummary() {
    // CHAMADA: /get-presencas-mes
    const url = `${BACKEND_URL}/get-presencas-mes`; 
    // ...
}

// Em `confirmBtn.addEventListener("click", ...)`
// CHAMADA: /presenca (POST)
const response = await fetch(`${BACKEND_URL}/presenca`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        nome: member.Nome,
        data: `${dia}/${mes}/${ano}`,
        hora: `${hora}:${min}:${seg}`,
    }),
});
