// js/app.js

/**
 * IIFE (Immediately Invoked Function Expression)
 * Encapsula todo o código, protegendo variáveis (como 'servicos') 
 * de conflitos globais, seguindo as boas práticas.
 */
(function() {
    let servicos = [];
    let novoServicoID = 1;

    // =========================================
    // UTILIDADES GERAIS
    // =========================================

    /**
     * @description Abre uma aba de navegação.
     */
    function abrirTab(tabId) {
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`.tab-button[onclick*="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        if (tabId === 'servicos') {
            carregarServicos();
        }
    }

    /**
     * @description Exibe uma notificação flutuante.
     */
    function mostrarNotificacao(mensagem, tipo = NOTIFICACAO_TIPO.INFO) {
        const container = document.getElementById('notification-container');
        const notif = document.createElement('div');
        notif.className = `notification ${tipo}`;
        notif.textContent = mensagem;

        container.appendChild(notif);

        // Força o reflow para a transição funcionar
        void notif.offsetWidth; 
        notif.classList.add('show');

        setTimeout(() => {
            notif.classList.remove('show');
            notif.addEventListener('transitionend', () => notif.remove());
        }, 5000);
    }
    
    /**
     * @description Mostra o overlay de loading.
     */
    function showLoading(mensagem = 'Aguarde...') {
        document.getElementById('loading-message').textContent = mensagem;
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    /**
     * @description Esconde o overlay de loading.
     */
    function hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    /**
     * @description Retorna a data de hoje no formato YYYY-MM-DD.
     */
    function obterDataHojeISO() {
        return new Date().toISOString().split('T')[0];
    }
    
    /**
     * @description Calcula a data de fim prevista.
     */
    function calcularDataFim() {
        const dataInicioInput = document.getElementById('dataInicio');
        const duracaoDiasInput = document.getElementById('duracaoDias');
        const dataFimPrevistaInput = document.getElementById('dataFimPrevista');

        const dataInicio = new Date(dataInicioInput.value + 'T00:00:00'); 
        const duracaoDias = Math.max(1, parseInt(duracaoDiasInput.value) || 1); 

        if (isNaN(dataInicio.getTime())) {
            dataFimPrevistaInput.value = '';
            return;
        }

        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataFim.getDate() + duracaoDias - 1);

        dataFimPrevistaInput.value = dataFim.toISOString().split('T')[0];
    }

    // =========================================
    // LOCALSTORAGE (CRUD BÁSICO)
    // =========================================

    function salvarDados() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(servicos));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
            mostrarNotificacao('Erro ao salvar dados localmente. Tente novamente.', NOTIFICACAO_TIPO.ERRO);
        }
    }

    function carregarDados() {
        const dados = localStorage.getItem(STORAGE_KEY);
        servicos = dados ? JSON.parse(dados) : [];
        const maxId = servicos.reduce((max, s) => Math.max(max, s.id || 0), 0);
        novoServicoID = maxId + 1;
    }

    // =========================================
    // LÓGICA DE SERVIÇOS (CRUD)
    // =========================================

    function adicionarServico(evento) {
        evento.preventDefault();
        
        const form = evento.target;
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const novoServico = {
            id: novoServicoID++,
            descricao: document.getElementById('descricao').value,
            cliente: document.getElementById('cliente').value,
            valorTotal: parseFloat(document.getElementById('valorTotal').value) || 0.00,
            dataCadastro: obterDataHojeISO(),
            dataInicio: document.getElementById('dataInicio').value,
            dataFimPrevista: document.getElementById('dataFimPrevista').value,
            status: STATUS.EM_ANDAMENTO,
            statusPagamento: 'pendente',
            observacao: '',
        };

        servicos.push(novoServico);
        salvarDados();
        carregarServicos();
        atualizarDashboard();
        mostrarNotificacao('Serviço cadastrado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
        form.reset();
        document.getElementById('dataInicio').value = obterDataHojeISO();
        calcularDataFim();
    }
    
    function carregarServicos() {
        const tabelaBody = document.querySelector('#tabelaServicos tbody');
        tabelaBody.innerHTML = '';
        
        const filtro = document.getElementById('filtroServicos').value.toLowerCase();
        
        const servicosFiltrados = servicos.filter(s => 
            s.descricao.toLowerCase().includes(filtro) || 
            s.cliente.toLowerCase().includes(filtro)
        ).sort((a, b) => b.id - a.id);

        servicosFiltrados.forEach(servico => {
            const tr = tabelaBody.insertRow();
            tr.insertCell().textContent = servico.id;
            tr.insertCell().textContent = servico.descricao;
            tr.insertCell().textContent = servico.cliente;
            
            const statusCell = tr.insertCell();
            statusCell.innerHTML = `<span class="badge status-${servico.status}">${servico.status.replace('-', ' ')}</span>`;
            
            const acoesCell = tr.insertCell();
            acoesCell.innerHTML = `
                <button class="small-btn" onclick="app.alterarStatus(${servico.id}, '${STATUS.FINALIZADO}')" title="Finalizar"><i class="fa fa-check"></i></button>
                <button class="small-btn" onclick="app.excluirServico(${servico.id})" title="Excluir"><i class="fa fa-trash"></i></button>
            `;
        });
    }
    
    function alterarStatus(id, novoStatus) {
        const servicoIndex = servicos.findIndex(s => s.id === id);
        if (servicoIndex !== -1) {
            servicos[servicoIndex].status = novoStatus;
            salvarDados();
            carregarServicos();
            atualizarDashboard();
            mostrarNotificacao(`Serviço #${id} atualizado para: ${novoStatus.replace('-', ' ')}`, NOTIFICACAO_TIPO.INFO);
        }
    }
    
    function excluirServico(id) {
        if (!confirm(`Tem certeza que deseja excluir o Serviço #${id}?`)) return;

        servicos = servicos.filter(s => s.id !== id);
        salvarDados();
        carregarServicos();
        atualizarDashboard();
        mostrarNotificacao(`Serviço #${id} excluído com sucesso.`, NOTIFICACAO_TIPO.ALERTA);
    }
    
    // =========================================
    // DASHBOARD
    // =========================================

    function atualizarDashboard() {
        const totalServicos = servicos.length;
        const emAndamento = servicos.filter(s => s.status === STATUS.EM_ANDAMENTO).length;
        const finalizados = servicos.filter(s => s.status === STATUS.FINALIZADO).length;
        
        const receitaPrevista = servicos.reduce((sum, s) => sum + (s.valorTotal || 0), 0).toFixed(2);

        const cardsHTML = `
            <div class="card" style="border-left-color: var(--info);">
                <h3>Total de Serviços</h3>
                <p>${totalServicos}</p>
            </div>
            <div class="card" style="border-left-color: var(--warning);">
                <h3>Em Andamento</h3>
                <p>${emAndamento}</p>
            </div>
            <div class="card" style="border-left-color: var(--success);">
                <h3>Finalizados</h3>
                <p>${finalizados}</p>
            </div>
            <div class="card" style="border-left-color: var(--purple);">
                <h3>Receita Prevista</h3>
                <p>R$ ${receitaPrevista.replace('.', ',')}</p>
            </div>
        `;
        document.getElementById('dashboard-cards').innerHTML = cardsHTML;
    }
    
    // =========================================
    // EXPORTAÇÃO E IMPORTAÇÃO DE DADOS (NOVO BACKUP MANUAL)
    // =========================================

    /**
     * Exporta todos os dados salvos localmente para um arquivo JSON.
     */
    function exportarDadosJSON() {
        const data = JSON.stringify(servicos, null, 2);
        const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `controlserv_backup_${obterDataHojeISO()}.json`;
        a.click();
        
        mostrarNotificacao('Dados exportados para arquivo JSON.', NOTIFICACAO_TIPO.SUCESSO);
    }

    /**
     * Importa dados de um arquivo JSON selecionado pelo usuário.
     */
    function importarDadosJSON(files) {
        if (files.length === 0) return;

        if (!confirm('ATENÇÃO: Importar substituirá TODOS os seus dados locais atuais. Deseja continuar?')) return;

        showLoading('Importando dados...');
        const file = files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validação básica da estrutura do arquivo
                if (Array.isArray(importedData) && importedData.every(item => item.descricao && item.cliente)) {
                    localStorage.setItem(STORAGE_KEY, e.target.result);
                    // Força o recarregamento da página para aplicar os novos dados
                    location.reload(); 
                } else {
                    hideLoading();
                    mostrarNotificacao('Arquivo JSON inválido. Verifique o formato.', NOTIFICACAO_TIPO.ERRO);
                }
            } catch (error) {
                hideLoading();
                mostrarNotificacao('Erro ao ler o arquivo JSON. Certifique-se de que é um JSON válido.', NOTIFICACAO_TIPO.ERRO);
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
    
    // =========================================
    // DADOS DE TESTE E LIMPEZA
    // =========================================
    
    function criarDadosExemplo() {
        const servicosExemplo = [
            { id: 1, descricao: "Manutenção de Servidor", cliente: "Tech Solutions", valorTotal: 300.00, dataCadastro: '2024-01-10', dataInicio: '2024-01-15', dataFimPrevista: '2024-01-16', status: STATUS.FINALIZADO, statusPagamento: "pago", observacao: "Servidor OK." },
            { id: 2, descricao: "Instalação de Rede", cliente: "Fast Foods LTDA", valorTotal: 1500.00, dataCadastro: '2024-02-01', dataInicio: '2024-02-05', dataFimPrevista: '2024-02-10', status: STATUS.EM_ANDAMENTO, statusPagamento: "pendente", observacao: "Aguardando peças." },
            { id: 3, descricao: "Backup e Migração", cliente: "Data Segura S/A", valorTotal: 800.00, dataCadastro: '2024-03-01', dataInicio: '2024-03-10', dataFimPrevista: '2024-03-11', status: STATUS.CANCELADO, statusPagamento: "cancelado", observacao: "Cliente desistiu." }
        ];

        servicos = servicosExemplo;
        salvarDados();
        carregarServicos();
        atualizarDashboard();
        mostrarNotificacao('Dados de exemplo criados com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
    }
    
    function limparTodosDados() {
        if (!confirm('ATENÇÃO: Isso irá APAGAR TODOS os serviços salvos localmente. Tem certeza?')) return;
        localStorage.removeItem(STORAGE_KEY);
        servicos = [];
        carregarServicos();
        atualizarDashboard();
        mostrarNotificacao('Todos os dados locais foram apagados.', NOTIFICACAO_TIPO.ALERTA);
    }

    // =========================================
    // PWA (SERVICE WORKER)
    // =========================================
    
    /**
     * Registra o Service Worker para habilitar o PWA e o modo offline.
     */
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[Service Worker] Registrado com sucesso:', reg))
                .catch((err) => console.error('[Service Worker] Erro no registro:', err));
        } else {
            console.warn('Service Workers não são suportados neste navegador.');
        }
    }


    // =========================================
    // INICIALIZAÇÃO E ESCOPO GLOBAL CONTROLADO
    // =========================================

    /**
     * Objeto global para acesso a funções críticas pelo HTML (onclick)
     */
    window.app = {
        abrirTab,
        mostrarNotificacao,
        showLoading,
        hideLoading,
        obterDataHojeISO,
        calcularDataFim,
        alterarStatus,
        excluirServico,
        criarDadosExemplo,
        limparTodosDados,
        carregarServicos: carregarServicos, 
        getServicos: () => servicos,
        exportarDadosJSON,
        importarDadosJSON
    };

    /**
     * Inicializadores (chamados após o DOM estar pronto)
     */
    document.addEventListener('DOMContentLoaded', function() {
        carregarDados();
        carregarServicos();
        atualizarDashboard();
        
        // ** NOVO **: Registra o Service Worker
        registerServiceWorker(); 

        // Configura data inicial e min/max
        const todayISO = obterDataHojeISO();
        document.getElementById('dataInicio').value = todayISO;
        document.getElementById('duracaoDias').value = 1;
        calcularDataFim();
        
        // Adiciona listener ao formulário de cadastro
        document.getElementById('formCadastro').addEventListener('submit', adicionarServico);
        
        hideLoading(); 
    });

})();
