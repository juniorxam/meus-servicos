// js/reports.js

// Este IIFE encapsula a lógica de relatórios
(function() {
    
    // As funções utilitárias (formatarMoeda, calcularLucro, etc) 
    // são acessadas via window.app para manter a modularidade.

    /**
     * @description Gera um relatório detalhado de todos os serviços (PDF).
     */
    function gerarRelatorioCompletoPDF() {
        const servicos = window.app.getServicos();
        if (servicos.length === 0) {
            window.app.mostrarNotificacao('Nenhum serviço para gerar relatório.', NOTIFICACAO_TIPO.ALERTA);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape'); // Formato Paisagem

        // Configuração de Estilo
        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129); // Cor Verde
        doc.text("Relatório Completo - ControlServ", 20, 20);

        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text(`Gerado em: ${window.app.formatarData(window.app.obterDataHojeISO())}`, 20, 26);
        
        let totalReceita = 0, totalCustos = 0, totalLucro = 0;
        servicos.forEach(s => {
             totalReceita += parseFloat(s.valorServico) || 0;
             totalCustos += (parseFloat(s.custoMateriais) || 0) + (parseFloat(s.custoCombustivel) || 0);
             totalLucro += window.app.calcularLucro(s);
        });
        
        // Resumo Financeiro no Topo
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text("RESUMO FINANCEIRO", 20, 36);
        doc.setFontSize(10);
        doc.text(`Receita Total: ${window.app.formatarMoeda(totalReceita)}`, 20, 44);
        doc.text(`Custos Totais: ${window.app.formatarMoeda(totalCustos)}`, 80, 44);
        doc.text(`Lucro Total: ${window.app.formatarMoeda(totalLucro)}`, 140, 44);
        
        // Tabela de Serviços
        const servicosColumns = [
            "ID", "Descrição", "Cliente", "Início", "Fim", "Valor", "Custos", "Lucro", "Status", "Pagamento"
        ];
        
        const servicosData = servicos.map(s => {
            const custos = (parseFloat(s.custoMateriais) || 0) + (parseFloat(s.custoCombustivel) || 0);
            const lucro = window.app.calcularLucro(s);
            
            return [
                s.id,
                s.descricao.substring(0, 30) + (s.descricao.length > 30 ? '...' : ''),
                s.cliente.substring(0, 25) + (s.cliente.length > 25 ? '...' : ''),
                window.app.formatarData(s.dataInicio),
                s.dataFim ? window.app.formatarData(s.dataFim) : 'N/A',
                window.app.formatarMoeda(s.valorServico),
                window.app.formatarMoeda(custos),
                window.app.formatarMoeda(lucro),
                s.status === STATUS.FINALIZADO ? 'Finalizado' : s.status === STATUS.EM_ANDAMENTO ? 'Em Andamento' : 'Cancelado',
                s.statusPagamento === 'pago' ? 'Pago' : 'Pendente',
            ];
        });

        doc.autoTable({
            startY: 50,
            head: [servicosColumns],
            body: servicosData,
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 10 }, // ID
                5: { halign: 'right' }, // Valor
                6: { halign: 'right' }, // Custos
                7: { halign: 'right' }, // Lucro
            }
        });

        doc.save('Relatorio_Completo_ControlServ.pdf');
        window.app.mostrarNotificacao('Relatório Completo gerado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
    }
    
    /**
     * @description Gera um relatório financeiro (PDF) com métricas e top serviços.
     */
    function gerarRelatorioFinanceiroPDF() {
        const servicos = window.app.getServicos();
        if (servicos.length === 0) {
            window.app.mostrarNotificacao('Nenhum serviço para gerar relatório.', NOTIFICACAO_TIPO.ALERTA);
            return;
        }
        
        // As métricas de dashboard já estão prontas no app.js, 
        // mas vamos re-calcular aqui para ser independente.
        let metrics = { receitaTotal: 0, custosTotais: 0, lucroTotal: 0, pagamentosPendentes: 0, valorPendente: 0 };

        servicos.forEach(servico => {
            const valorServico = parseFloat(servico.valorServico) || 0;
            const custos = (parseFloat(servico.custoMateriais) || 0) + (parseFloat(servico.custoCombustivel) || 0);
            const lucro = window.app.calcularLucro(servico);
            
            metrics.receitaTotal += valorServico;
            metrics.custosTotais += custos;
            metrics.lucroTotal += lucro;

            if (servico.statusPagamento !== 'pago') {
                metrics.pagamentosPendentes++;
                metrics.valorPendente += valorServico;
            }
        });
        
        const margemLucro = metrics.receitaTotal > 0 ? (metrics.lucroTotal / metrics.receitaTotal) * 100 : 0;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.setTextColor(59, 130, 246); // Cor Info
        doc.text("Relatório Financeiro", 20, 20);
        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text(`Gerado em: ${window.app.formatarData(window.app.obterDataHojeISO())}`, 20, 26);

        // Métricas financeiras
        doc.setFontSize(12);
        doc.text("MÉTRICAS FINANCEIRAS", 20, 40);
        doc.setFontSize(10);
        let yPos = 50;
        doc.text(`Receita Total: ${window.app.formatarMoeda(metrics.receitaTotal)}`, 20, yPos);
        doc.text(`Custos Totais: ${window.app.formatarMoeda(metrics.custosTotais)}`, 20, yPos + 6);
        doc.text(`Lucro Total: ${window.app.formatarMoeda(metrics.lucroTotal)}`, 20, yPos + 12);
        doc.text(`Margem de Lucro: ${margemLucro.toFixed(1)}%`, 20, yPos + 18);
        doc.text(`Pagamentos Pendentes: ${metrics.pagamentosPendentes}`, 20, yPos + 24);
        doc.text(`Valor Pendente: ${window.app.formatarMoeda(metrics.valorPendente)}`, 20, yPos + 30);
        
        // Serviços mais lucrativos
        const servicosLucrativos = [...servicos]
            .sort((a, b) => window.app.calcularLucro(b) - window.app.calcularLucro(a))
            .slice(0, 5);

        doc.setFontSize(12);
        doc.text("TOP 5 SERVIÇOS MAIS LUCRATIVOS", 20, 100);
        let lucYPos = 110;
        servicosLucrativos.forEach((servico, index) => {
            const lucro = window.app.calcularLucro(servico);
            doc.setFontSize(10);
            doc.text(`${index + 1}. ${servico.descricao}`, 20, lucYPos);
            doc.text(`${window.app.formatarMoeda(lucro)}`, 180, lucYPos, { align: "right" });
            lucYPos += 6;
        });

        doc.save('Relatorio_Financeiro_ControlServ.pdf');
        window.app.mostrarNotificacao('Relatório Financeiro gerado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
    }
    
    /**
     * @description Gera um relatório personalizado por período (PDF).
     */
    function gerarRelatorioPeriodoPDF() {
        const dataInicio = document.getElementById('dataInicioRelatorio').value;
        const dataFim = document.getElementById('dataFimRelatorio').value;
        const allServicos = window.app.getServicos();
        
        if (!dataInicio || !dataFim) {
            window.app.mostrarNotificacao('Selecione as datas de início e fim.', NOTIFICACAO_TIPO.ALERTA);
            return;
        }

        const inicio = new Date(dataInicio + 'T00:00:00');
        const fim = new Date(dataFim + 'T00:00:00');

        const servicosPeriodo = allServicos.filter(s => {
            const dataServico = new Date(s.dataInicio + 'T00:00:00');
            return dataServico >= inicio && dataServico <= fim;
        });
        
        if (servicosPeriodo.length === 0) {
            window.app.mostrarNotificacao(`Nenhum serviço encontrado entre ${window.app.formatarData(dataInicio)} e ${window.app.formatarData(dataFim)}.`, NOTIFICACAO_TIPO.ALERTA);
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape'); 

        doc.setFontSize(14);
        doc.setTextColor(245, 158, 11); // Cor Warning
        doc.text("Relatório por Período Personalizado", 20, 20);
        doc.setFontSize(10);
        doc.setTextColor(40);
        doc.text(`Período: ${window.app.formatarData(dataInicio)} a ${window.app.formatarData(dataFim)}`, 20, 26);
        
        let totalReceita = 0;
        servicosPeriodo.forEach(s => {
             totalReceita += parseFloat(s.valorServico) || 0;
        });
        
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(`Receita Total no Período: ${window.app.formatarMoeda(totalReceita)}`, 20, 36);

        const servicosColumns = ["ID", "Descrição", "Cliente", "Início", "Valor", "Lucro", "Status"];
        const servicosData = servicosPeriodo.map(s => {
            const lucro = window.app.calcularLucro(s);
            return [
                s.id,
                s.descricao.substring(0, 40) + (s.descricao.length > 40 ? '...' : ''),
                s.cliente.substring(0, 30) + (s.cliente.length > 30 ? '...' : ''),
                window.app.formatarData(s.dataInicio),
                window.app.formatarMoeda(s.valorServico),
                window.app.formatarMoeda(lucro),
                s.status === STATUS.FINALIZADO ? 'Finalizado' : 'Em Andamento',
            ];
        });

        doc.autoTable({
            startY: 45,
            head: [servicosColumns],
            body: servicosData,
            theme: 'striped',
            headStyles: { fillColor: [245, 158, 11], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            columnStyles: {
                4: { halign: 'right' }, 
                5: { halign: 'right' }, 
            }
        });

        doc.save(`Relatorio_Periodo_${dataInicio}_a_${dataFim}.pdf`);
        window.app.mostrarNotificacao('Relatório do período gerado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
    }

    /**
     * @description Exporta todos os dados para CSV.
     */
    function gerarRelatorioCSV() {
        window.app.mostrarNotificacao('Exportando dados para CSV...', NOTIFICACAO_TIPO.INFO);
        const servicos = window.app.getServicos();
        
        const headers = [
            "ID", "Descrição", "Cliente", "Telefone", "Data Início", "Data Fim", "Duração (dias)", 
            "Valor Serviço", "Custo Materiais", "Custo Combustível", "Lucro", "Status", "Status Pagamento", "Observações"
        ];
        let csvContent = headers.join(";") + "\n";

        servicos.forEach(servico => {
            const lucro = window.app.calcularLucro(servico);
            const duracao = servico.duracaoDias || window.app.calcularDuracaoDias(servico.dataInicio, servico.dataFim);
            
            const row = [
                servico.id,
                `"${servico.descricao}"`,
                `"${servico.cliente}"`,
                `"${servico.telefone || ''}"`,
                window.app.formatarData(servico.dataInicio),
                servico.dataFim ? window.app.formatarData(servico.dataFim) : '',
                duracao,
                (parseFloat(servico.valorServico) || 0).toFixed(2).replace('.', ','),
                (parseFloat(servico.custoMateriais) || 0).toFixed(2).replace('.', ','),
                (parseFloat(servico.custoCombustivel) || 0).toFixed(2).replace('.', ','),
                lucro.toFixed(2).replace('.', ','),
                servico.status === STATUS.FINALIZADO ? 'Finalizado' : servico.status === STATUS.EM_ANDAMENTO ? 'Em Andamento' : 'Cancelado',
                servico.statusPagamento === 'pago' ? 'Pago' : servico.statusPagamento === 'pendente' ? 'Pendente' : 'Parcial',
                `"${(servico.observacao || '').replace(/"/g, '""')}"`
            ];
            csvContent += row.join(";") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `relatorio_controlserv_${window.app.obterDataHojeISO()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Exposição das funções no escopo global para o HTML acessar via onclick
    window.reports = {
        gerarRelatorioCompletoPDF,
        gerarRelatorioFinanceiroPDF,
        gerarRelatorioPeriodoPDF,
        gerarRelatorioCSV
    };

})();
