// js/app.js

/**
 * IIFE (Immediately Invoked Function Expression)
 * Encapsula todo o código para modularização.
 */
(function() {
    let servicos = [];
    let novoServicoID = 1;
    
    // =========================================
    // UTILIDADES DE CÁLCULO
    // =========================================
    
    /**
     * @description Calcula o lucro de um serviço.
     */
    function calcularLucro(servico) {
        const valorServico = parseFloat(servico.valorServico) || 0;
        const custoMateriais = parseFloat(servico.custoMateriais) || 0;
        const custoCombustivel = parseFloat(servico.custoCombustivel) || 0;
        return valorServico - custoMateriais - custoCombustivel;
    }

    /**
     * @description Calcula a duração em dias (incluindo o dia inicial).
     */
    function calcularDuracaoDias(dataInicio, dataFim) {
        if (!dataInicio || !dataFim) return 0;
        const inicio = new Date(dataInicio + 'T00:00:00'); 
        const fim = new Date(dataFim + 'T00:00:00'); 
        const diffTime = Math.abs(fim - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; 
    }

    /**
     * @description Calcula a data de fim prevista no formulário.
     */
    function calcularDataFim() {
        const dataInicioInput = document.getElementById('dataInicio');
        const duracaoDiasInput = document.getElementById('duracaoDias');
        const dataFimInput = document.getElementById('dataFim'); // Referência corrigida para 'dataFim'

        const dataInicio = new Date(dataInicioInput.value + 'T00:00:00'); 
        const duracaoDias = Math.max(1, parseInt(duracaoDiasInput.value) || 1); 

        if (isNaN(dataInicio.getTime())) {
            dataFimInput.value = '';
            return;
        }

        const dataFim = new Date(dataInicio);
        dataFim.setDate(dataFim.getDate() + duracaoDias - 1);

        dataFimInput.value = dataFim.toISOString().split('T')[0];
        
        // Dispara a atualização do preview após calcular a data
        setupPreviewListeners().updatePreview(); 
    }
    
    // =========================================
    // UTILIDADES DE FORMATO E DOM
    // =========================================

    /**
     * @description Exibe uma notificação flutuante.
     */
    function mostrarNotificacao(mensagem, tipo = NOTIFICACAO_TIPO.INFO) {
        const container = document.getElementById('notificacao'); // Corrigido para ID 'notificacao'
        container.textContent = mensagem;
        container.className = `notificacao ${tipo}`;
        container.style.display = 'block';

        setTimeout(() => {
            container.style.display = 'none';
        }, 4000);
    }
    
    function formatarMoeda(valor) {
        const num = parseFloat(valor) || 0;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    }

    function formatarData(data) {
        if (!data) return 'N/A';
        try {
            const dateObj = new Date(data + 'T00:00:00');
            return dateObj.toLocaleDateString('pt-BR');
        } catch (e) {
            return 'Data Inválida';
        }
    }

    function formatarTelefone(telefone) {
        if (!telefone) return 'N/A';
        // Remove tudo que não é dígito
        const cleaned = ('' + telefone).replace(/\D/g, '');
        // Aplica a máscara (11) 99999-9999 ou (11) 9999-9999
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return telefone;
    }
    
    function obterDataHojeISO() {
        return new Date().toISOString().split('T')[0];
    }
    
    function abrirTab(tabId) {
        document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        document.querySelector(`.tab[onclick*="${tabId}"]`).classList.add('active');
        document.getElementById(tabId).classList.add('active');
        
        if (tabId === 'servicos') {
            carregarServicos();
        }
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
    // LÓGICA DE SERVIÇOS (CRUD COMPLETO)
    // =========================================

    function adicionarServico() {
        // Sem evento.preventDefault() aqui, pois é chamado via onclick
        
        const formElements = {
            descricao: document.getElementById('descricaoServico'),
            cliente: document.getElementById('clienteServico'),
            dataInicio: document.getElementById('dataInicio'),
            valorServico: document.getElementById('valorServico'),
            custoMateriais: document.getElementById('custoMateriais'),
            custoCombustivel: document.getElementById('custoCombustivel'),
            telefone: document.getElementById('telefoneCliente'),
            dataFim: document.getElementById('dataFim'),
            duracaoDias: document.getElementById('duracaoDias'),
            status: document.getElementById('statusServico'),
            statusPagamento: document.getElementById('statusPagamento'),
            observacao: document.getElementById('observacaoServico'),
        };
        
        const { descricao, cliente, dataInicio, valorServico, custoMateriais, custoCombustivel, telefone, dataFim, duracaoDias, status, statusPagamento, observacao } = formElements;

        if (!descricao.value || !cliente.value || !dataInicio.value || parseFloat(valorServico.value) <= 0) {
            mostrarNotificacao('Descrição, Cliente, Data Início e Valor do Serviço são obrigatórios.', NOTIFICACAO_TIPO.ERRO);
            return;
        }

        const novoServico = {
            id: Date.now(),
            descricao: descricao.value,
            cliente: cliente.value,
            telefone: telefone.value,
            dataInicio: dataInicio.value,
            dataFim: dataFim.value,
            duracaoDias: parseInt(duracaoDias.value) || 1,
            valorServico: parseFloat(valorServico.value) || 0.00,
            custoMateriais: parseFloat(custoMateriais.value) || 0.00,
            custoCombustivel: parseFloat(custoCombustivel.value) || 0.00,
            status: status.value,
            statusPagamento: statusPagamento.value,
            observacao: observacao.value,
            dataCadastro: obterDataHojeISO(),
        };

        servicos.push(novoServico);
        salvarDados();
        limparFormularioServico();
        carregarServicos();
        atualizarDashboard();
        mostrarNotificacao(`Serviço "${novoServico.descricao}" cadastrado com sucesso!`, NOTIFICACAO_TIPO.SUCESSO);
    }
    
    function salvarEdicaoServico() {
        const id = parseInt(document.getElementById('servicoIdEdicao').value);
        const servicoIndex = servicos.findIndex(s => s.id === id);

        if (servicoIndex !== -1) {
            const formElements = {
                descricao: document.getElementById('descricaoServico'),
                cliente: document.getElementById('clienteServico'),
                dataInicio: document.getElementById('dataInicio'),
                valorServico: document.getElementById('valorServico'),
                custoMateriais: document.getElementById('custoMateriais'),
                custoCombustivel: document.getElementById('custoCombustivel'),
                telefone: document.getElementById('telefoneCliente'),
                dataFim: document.getElementById('dataFim'),
                duracaoDias: document.getElementById('duracaoDias'),
                status: document.getElementById('statusServico'),
                statusPagamento: document.getElementById('statusPagamento'),
                observacao: document.getElementById('observacaoServico'),
            };

            const { descricao, cliente, dataInicio, valorServico, custoMateriais, custoCombustivel, telefone, dataFim, duracaoDias, status, statusPagamento, observacao } = formElements;

            if (!descricao.value || !cliente.value || !dataInicio.value || parseFloat(valorServico.value) <= 0) {
                mostrarNotificacao('Descrição, Cliente, Data Início e Valor do Serviço são obrigatórios.', NOTIFICACAO_TIPO.ERRO);
                return;
            }

            servicos[servicoIndex] = {
                ...servicos[servicoIndex],
                descricao: descricao.value,
                cliente: cliente.value,
                telefone: telefone.value,
                dataInicio: dataInicio.value,
                dataFim: dataFim.value,
                duracaoDias: parseInt(duracaoDias.value) || 1,
                valorServico: parseFloat(valorServico.value) || 0.00,
                custoMateriais: parseFloat(custoMateriais.value) || 0.00,
                custoCombustivel: parseFloat(custoCombustivel.value) || 0.00,
                status: status.value,
                statusPagamento: statusPagamento.value,
                observacao: observacao.value,
            };

            salvarDados();
            limparFormularioServico(true);
            carregarServicos();
            atualizarDashboard();
            mostrarNotificacao(`Serviço #${id} atualizado com sucesso!`, NOTIFICACAO_TIPO.SUCESSO);
        }
    }
    
    function editarServico(id) {
        const servico = servicos.find(s => s.id === id);
        if (!servico) {
            mostrarNotificacao('Serviço não encontrado para edição.', NOTIFICACAO_TIPO.ERRO);
            return;
        }

        // Preenche o formulário
        document.getElementById('descricaoServico').value = servico.descricao || '';
        document.getElementById('clienteServico').value = servico.cliente || '';
        document.getElementById('telefoneCliente').value = servico.telefone || '';
        document.getElementById('dataInicio').value = servico.dataInicio || '';
        document.getElementById('dataFim').value = servico.dataFim || '';
        document.getElementById('duracaoDias').value = servico.duracaoDias || 1;
        document.getElementById('valorServico').value = servico.valorServico || '';
        document.getElementById('custoMateriais').value = servico.custoMateriais || '';
        document.getElementById('custoCombustivel').value = servico.custoCombustivel || '';
        document.getElementById('statusServico').value = servico.status || 'em-andamento';
        document.getElementById('statusPagamento').value = servico.statusPagamento || 'pendente';
        document.getElementById('observacaoServico').value = servico.observacao || '';
        document.getElementById('servicoIdEdicao').value = servico.id;

        // Altera botões e título
        document.getElementById('servicoFormTitle').innerHTML = `<i class="fas fa-edit"></i> Editar Serviço (ID: ${id})`;
        document.getElementById('btnCadastrarServico').style.display = 'none';
        document.getElementById('btnSalvarEdicao').style.display = 'inline-flex';
        document.getElementById('btnCancelarEdicao').style.display = 'inline-flex';
        
        // Garante que o preview seja atualizado
        setupPreviewListeners().updatePreview(); 
        
        // Rola para o topo do formulário
        document.getElementById('servicos').scrollIntoView({ behavior: 'smooth' });

        mostrarNotificacao(`Modo de edição ativado para: ${servico.descricao}`, NOTIFICACAO_TIPO.INFO);
    }

    function limparFormularioServico(cancelandoEdicao = false) {
        document.getElementById('descricaoServico').value = '';
        document.getElementById('clienteServico').value = '';
        document.getElementById('telefoneCliente').value = '';
        document.getElementById('dataInicio').value = obterDataHojeISO();
        document.getElementById('dataFim').value = '';
        document.getElementById('duracaoDias').value = 1;
        document.getElementById('valorServico').value = '';
        document.getElementById('custoMateriais').value = '';
        document.getElementById('custoCombustivel').value = '';
        document.getElementById('statusServico').value = 'em-andamento';
        document.getElementById('statusPagamento').value = 'pendente';
        document.getElementById('observacaoServico').value = '';
        document.getElementById('servicoIdEdicao').value = '';

        // Restaura botões e título para o modo de cadastro
        document.getElementById('servicoFormTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Novo Serviço';
        document.getElementById('btnCadastrarServico').style.display = 'inline-flex';
        document.getElementById('btnSalvarEdicao').style.display = 'none';
        document.getElementById('btnCancelarEdicao').style.display = 'none';
        
        calcularDataFim(); // Recalcula a data de fim para o padrão
        
        if (cancelandoEdicao) {
            mostrarNotificacao('Edição cancelada. Pronto para novo cadastro.', NOTIFICACAO_TIPO.ALERTA);
        }
    }
    
    function carregarServicos() {
        const listaServicos = document.getElementById('listaServicos');
        const filtro = document.getElementById('filtroServicos').value.toLowerCase();
        
        const servicosFiltrados = servicos.filter(servico => 
            servico.cliente.toLowerCase().includes(filtro) || 
            servico.status.toLowerCase().includes(filtro) || 
            servico.descricao.toLowerCase().includes(filtro) || 
            (servico.statusPagamento && servico.statusPagamento.toLowerCase().includes(filtro))
        ).sort((a, b) => b.id - a.id);

        if (servicosFiltrados.length === 0) {
            listaServicos.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum serviço encontrado.</p>';
            return;
        }

        listaServicos.innerHTML = servicosFiltrados.map(servico => {
            const lucro = calcularLucro(servico);
            const statusClass = servico.status;
            const statusText = { 'em-andamento': 'Em Andamento', 'finalizado': 'Finalizado', 'cancelado': 'Cancelado' }[servico.status] || servico.status;
            const pagamentoText = { 'pago': 'Pago', 'pendente': 'Pendente', 'parcial': 'Parcial' }[servico.statusPagamento] || 'Pendente';
            const pagamentoClass = servico.statusPagamento === 'pago' ? 'pagamento-pago' : 'pagamento-pendente';
            const duracao = servico.duracaoDias || calcularDuracaoDias(servico.dataInicio, servico.dataFim);
            const cardClass = servico.statusPagamento === 'pago' ? `${statusClass} pago` : statusClass;

            return `
                <div class="servico-card ${cardClass}" onclick="app.editarServico(${servico.id})">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <h3 style="margin: 0; flex: 1;">${servico.descricao}</h3>
                        <div style="display: flex; flex-direction: column; align-items: end; gap: 4px;">
                            <span class="status-badge status-${servico.status}">${statusText}</span>
                            <span class="pagamento-badge ${pagamentoClass}">${pagamentoText}</span>
                        </div>
                    </div>
                    <p><strong>👤 Cliente:</strong> ${servico.cliente}</p>
                    ${servico.telefone ? `<p><strong>📞 Telefone:</strong> ${formatarTelefone(servico.telefone)}</p>` : ''}
                    <p><strong>💰 Valor:</strong> ${formatarMoeda(servico.valorServico)}</p>
                    <p><strong>💸 Lucro:</strong> <span class="${lucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}">${formatarMoeda(lucro)}</span></p>
                    <p><strong>📅 Início:</strong> ${formatarData(servico.dataInicio)}</p>
                    ${servico.dataFim ? `<p><strong>📅 Fim:</strong> ${formatarData(servico.dataFim)}</p>` : ''}
                    ${duracao > 0 ? `<p class="duracao-info">Duração: ${duracao} dia(s)</p>` : ''}
                </div>
            `;
        }).join('');
        
        carregarServicosRecentes(); // Atualiza a lista lateral de recentes
    }
    
    // =========================================
    // DASHBOARD
    // =========================================
    
    function carregarServicosRecentes() {
        const listaRecentes = document.getElementById('listaServicosRecentes');
        const servicosRecentes = [...servicos]
            .sort((a, b) => b.id - a.id)
            .slice(0, 5); // Apenas os 5 mais recentes

        if (servicosRecentes.length === 0) {
            listaRecentes.innerHTML = '<p style="text-align: center; color: #6b7280;">Nenhum serviço recente.</p>';
            return;
        }

        listaRecentes.innerHTML = servicosRecentes.map(servico => {
            const statusClass = servico.status;
            const statusText = { 'em-andamento': 'Em Andamento', 'finalizado': 'Finalizado', 'cancelado': 'Cancelado' }[servico.status] || servico.status;
            const itemClass = servico.statusPagamento === 'pago' ? `${statusClass} pago` : statusClass;

            return `
                <div class="servico-item ${itemClass}" onclick="app.abrirTab('servicos'); app.editarServico(${servico.id});">
                    <span>#${servico.id} - ${servico.descricao}</span>
                    <span class="status-badge status-${servico.status}">${statusText}</span>
                </div>
            `;
        }).join('');
        
        // Lista de Pendências
        const listaPendencias = document.getElementById('listaPendencias');
        const pendencias = servicos.filter(s => s.statusPagamento !== 'pago' && s.status !== 'cancelado')
             .sort((a, b) => b.id - a.id)
            .slice(0, 5);

        if (pendencias.length === 0) {
            listaPendencias.innerHTML = '<p style="text-align: center; color: var(--success);">Nenhuma pendência de pagamento!</p>';
        } else {
            listaPendencias.innerHTML = pendencias.map(servico => `
                <div class="servico-item cancelado" onclick="app.abrirTab('servicos'); app.editarServico(${servico.id});">
                    <span>Pendente: ${servico.cliente}</span>
                    <span class="pagamento-badge pagamento-pendente">${formatarMoeda(servico.valorServico)}</span>
                </div>
            `).join('');
        }
    }

    function atualizarDashboard() {
        const hoje = new Date();
        const umaSemanaAtras = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000));
        const umMesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, hoje.getDate());
        
        let totalSemana = { receita: 0, custos: 0, lucro: 0 };
        let totalMes = { receita: 0, custos: 0, lucro: 0 };
        let totalGeral = { receita: 0, custos: 0, lucro: 0 };
        
        let servicosFinalizados = 0;
        let servicosAndamento = 0;
        let servicosCancelados = 0;
        let pagamentosPendentes = 0;
        let valorPendente = 0;

        servicos.forEach(servico => {
            const dataFim = new Date(servico.dataFim + 'T00:00:00');
            const lucro = calcularLucro(servico);
            const custos = (parseFloat(servico.custoMateriais) || 0) + (parseFloat(servico.custoCombustivel) || 0);

            totalGeral.receita += (parseFloat(servico.valorServico) || 0);
            totalGeral.custos += custos;
            totalGeral.lucro += lucro;

            // Filtros de tempo (para serviços finalizados no período)
            if (servico.status === 'finalizado') {
                if (dataFim >= umaSemanaAtras) {
                    totalSemana.receita += (parseFloat(servico.valorServico) || 0);
                    totalSemana.custos += custos;
                    totalSemana.lucro += lucro;
                }
                
                if (dataFim >= umMesAtras) {
                    totalMes.receita += (parseFloat(servico.valorServico) || 0);
                    totalMes.custos += custos;
                    totalMes.lucro += lucro;
                }
            }
            
            // Contadores de Status
            if (servico.status === 'finalizado') servicosFinalizados++;
            if (servico.status === 'em-andamento') servicosAndamento++;
            if (servico.status === 'cancelado') servicosCancelados++;

            // Pendências
            if (servico.statusPagamento !== 'pago') {
                pagamentosPendentes++;
                valorPendente += (parseFloat(servico.valorServico) || 0);
            }
        });
        
        // Grid de Resumo Financeiro
        document.getElementById('dashboardGrid').innerHTML = `
            <div class="metric-card" style="border-top-color: var(--success);">
                <h3>LUCRO SEMANAL</h3>
                <div class="value ${totalSemana.lucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}">${formatarMoeda(totalSemana.lucro)}</div>
            </div>
            <div class="metric-card" style="border-top-color: var(--info);">
                <h3>LUCRO MENSAL</h3>
                <div class="value ${totalMes.lucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}">${formatarMoeda(totalMes.lucro)}</div>
            </div>
            <div class="metric-card" style="border-top-color: #667eea;">
                <h3>LUCRO TOTAL</h3>
                <div class="value ${totalGeral.lucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}">${formatarMoeda(totalGeral.lucro)}</div>
            </div>
            <div class="metric-card" style="border-top-color: #764ba2;">
                <h3>RECEITA TOTAL</h3>
                <div class="value">${formatarMoeda(totalGeral.receita)}</div>
            </div>
            <div class="metric-card" style="border-top-color: var(--danger);">
                <h3>CUSTOS TOTAIS</h3>
                <div class="value">${formatarMoeda(totalGeral.custos)}</div>
            </div>
            <div class="metric-card" style="border-top-color: var(--warning);">
                <h3>VALOR PENDENTE</h3>
                <div class="value">${formatarMoeda(valorPendente)}</div>
            </div>
        `;

        // Métricas de Serviços
        document.getElementById('metricasGrid').innerHTML = `
            <div class="metric-card" style="border-top-color: var(--success);">
                <h3>FINALIZADOS</h3>
                <div class="value">${servicosFinalizados}</div>
            </div>
            <div class="metric-card" style="border-top-color: var(--warning);">
                <h3>EM ANDAMENTO</h3>
                <div class="value">${servicosAndamento}</div>
            </div>
            <div class="metric-card" style="border-top-color: var(--danger);">
                <h3>CANCELADOS</h3>
                <div class="value">${servicosCancelados}</div>
            </div>
            <div class="metric-card" style="border-top-color: var(--purple);">
                <h3>PAG. PENDENTES</h3>
                <div class="value">${pagamentosPendentes}</div>
            </div>
        `;
        
        carregarServicosRecentes();
    }
    
    /**
     * @description Configura listeners para o preview de lucro no formulário.
     */
    function setupPreviewListeners() {
        const valorInput = document.getElementById('valorServico');
        const materiaisInput = document.getElementById('custoMateriais');
        const combustivelInput = document.getElementById('custoCombustivel');
        const previewDiv = document.getElementById('previewServico');
        const detalhesDiv = document.getElementById('detalhesPreview');
        
        const updatePreview = () => {
            const valorServico = parseFloat(valorInput.value) || 0;
            const custoMateriais = parseFloat(materiaisInput.value) || 0;
            const custoCombustivel = parseFloat(combustivelInput.value) || 0;

            if (valorServico > 0) {
                const lucro = valorServico - custoMateriais - custoCombustivel;
                const margem = valorServico > 0 ? ((lucro / valorServico) * 100) : 0;

                detalhesDiv.innerHTML = `
                    <p>Valor do Serviço: <strong>${formatarMoeda(valorServico)}</strong></p>
                    <p>Custos Totais: <strong>${formatarMoeda(custoMateriais + custoCombustivel)}</strong></p>
                    <p>Lucro Estimado: <strong class="${lucro >= 0 ? 'lucro-positivo' : 'lucro-negativo'}">${formatarMoeda(lucro)}</strong></p>
                    <p>Margem de Lucro: <strong class="${margem >= 0 ? 'lucro-positivo' : 'lucro-negativo'}">${margem.toFixed(1)}%</strong></p>
                `;
                previewDiv.style.display = 'block';
            } else {
                previewDiv.style.display = 'none';
            }
        };

        // Adiciona listeners para cálculo em tempo real (se ainda não tiver)
        if (!valorInput.hasListener) {
            valorInput.addEventListener('input', updatePreview);
            materiaisInput.addEventListener('input', updatePreview);
            combustivelInput.addEventListener('input', updatePreview);
            valorInput.hasListener = true;
        }
        
        return { updatePreview };
    }
    
    // =========================================
    // DADOS DE TESTE E LIMPEZA
    // =========================================
    
    function criarDadosExemplo() {
        if (!confirm('Isso irá substituir todos os dados atuais por dados de exemplo. Deseja continuar?')) return;
        
        const dataHoje = obterDataHojeISO();
        const servicosExemplo = [
            { id: 1001, descricao: "Instalação de Câmeras de Segurança", cliente: "João Silva", telefone: "11999999999", dataInicio: dataHoje, dataFim: dataHoje, duracaoDias: 1, valorServico: 1200.00, custoMateriais: 450.00, custoCombustivel: 50.00, status: STATUS.FINALIZADO, statusPagamento: 'pago', observacao: "Serviço concluído no prazo." },
            { id: 1002, descricao: "Manutenção de Servidor de Rede", cliente: "Tech Solutions", telefone: "11888888888", dataInicio: '2024-11-10', dataFim: '2024-11-12', duracaoDias: 3, valorServico: 3500.00, custoMateriais: 100.00, custoCombustivel: 200.00, status: STATUS.EM_ANDAMENTO, statusPagamento: 'pendente', observacao: "Aguardando peça de reposição." },
            { id: 1003, descricao: "Cerca Elétrica e Alarme", cliente: "Maria Oliveira", telefone: "11777777777", dataInicio: '2024-10-01', dataFim: '2024-10-05', duracaoDias: 5, valorServico: 250.00, custoMateriais: 1200.00, custoCombustivel: 250.00, status: STATUS.CANCELADO, statusPagamento: 'cancelado', observacao: "Cliente desistiu da execução." },
            { id: 1004, descricao: "Troca de Motor de Portão", cliente: "Roberto Santos", telefone: "11666666666", dataInicio: '2024-11-15', dataFim: '2024-11-15', duracaoDias: 1, valorServico: 400.00, custoMateriais: 120.00, custoCombustivel: 20.00, status: STATUS.FINALIZADO, statusPagamento: 'pendente', observacao: "Emissão de boleto pendente." }
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
    // EXPORTAÇÃO E IMPORTAÇÃO DE DADOS (NOVO BACKUP MANUAL)
    // =========================================

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

    function importarDadosJSON(files) {
        if (files.length === 0) return;

        if (!confirm('ATENÇÃO: Importar substituirá TODOS os seus dados locais atuais. Deseja continuar?')) return;

        const file = files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validação básica da estrutura do arquivo
                if (Array.isArray(importedData)) {
                    // Força a substituição no localStorage
                    localStorage.setItem(STORAGE_KEY, e.target.result); 
                    // Força o recarregamento da página para aplicar os novos dados
                    location.reload(); 
                } else {
                    mostrarNotificacao('Arquivo JSON inválido. Verifique o formato.', NOTIFICACAO_TIPO.ERRO);
                }
            } catch (error) {
                mostrarNotificacao('Erro ao ler o arquivo JSON. Certifique-se de que é um JSON válido.', NOTIFICACAO_TIPO.ERRO);
                console.error(error);
            }
        };
        reader.readAsText(file);
    }

    // =========================================
    // PWA (SERVICE WORKER E INSTALAÇÃO)
    // =========================================

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('[Service Worker] Registrado com sucesso:', reg))
                .catch((err) => console.error('[Service Worker] Erro no registro:', err));
        } else {
            console.warn('Service Workers não são suportados neste navegador.');
        }
    }
    
    let deferredPrompt;
    function setupPWAInstallation() {
        const installButton = document.getElementById('installButton');
        const btnInstalarApp = document.getElementById('btnInstalarApp');
        
        window.addEventListener('beforeinstallprompt', (e) => {
            // Previne que o mini-infobar apareça no mobile
            e.preventDefault();
            deferredPrompt = e;
            
            // Mostra os botões de instalação
            installButton.style.display = 'block';
            if(btnInstalarApp) btnInstalarApp.style.display = 'block'; 
        });

        window.addEventListener('appinstalled', () => {
            mostrarNotificacao('App instalado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
            installButton.style.display = 'none';
            if(btnInstalarApp) btnInstalarApp.style.display = 'none';
            deferredPrompt = null;
        });

        if (installButton) {
            installButton.addEventListener('click', (e) => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted the install prompt');
                        }
                        deferredPrompt = null;
                    });
                }
            });
        }
    }
    
    function instalarApp() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    mostrarNotificacao('App instalado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
                }
                deferredPrompt = null;
            });
        } else {
            mostrarNotificacao('O app já está instalado ou não suporta instalação.', NOTIFICACAO_TIPO.INFO);
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
        obterDataHojeISO,
        calcularDataFim,
        adicionarServico,
        salvarEdicaoServico,
        editarServico,
        limparFormularioServico,
        filtrarServicos: carregarServicos, // Renomeado para consistência
        criarDadosExemplo,
        limparTodosDados,
        getServicos: () => servicos,
        exportarDadosJSON,
        importarDadosJSON,
        instalarApp,
        // Funções de formatação para uso em reports.js
        formatarMoeda,
        formatarData,
        calcularLucro,
        calcularDuracaoDias
    };

    /**
     * Inicializadores (chamados após o DOM estar pronto)
     */
    document.addEventListener('DOMContentLoaded', function() {
        carregarDados();
        carregarServicos();
        atualizarDashboard();
        
        // Configura data inicial e min/max
        const todayISO = obterDataHojeISO();
        document.getElementById('dataInicio').value = todayISO;
        document.getElementById('duracaoDias').value = 1;
        
        // Configura min para inputs de data (do seu código original)
        document.querySelectorAll('input[type="date"]').forEach(input => {
            input.min = todayISO;
        });
        
        calcularDataFim();
        
        // Configura o Service Worker e PWA
        registerServiceWorker(); 
        setupPWAInstallation();

        setupPreviewListeners();
    });

})();
