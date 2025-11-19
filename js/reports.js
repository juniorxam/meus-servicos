// js/reports.js

(function() {
    // Acessa a classe jspdf do escopo global
    const { jsPDF } = window.jspdf;

    /**
     * @description Gera um relatório de serviços em PDF.
     */
    function gerarPDF() {
        const servicos = window.app.getServicos(); // Acessa os dados
        if (servicos.length === 0) {
            window.app.mostrarNotificacao('Não há serviços para gerar o relatório.', NOTIFICACAO_TIPO.ALERTA);
            return;
        }

        window.app.showLoading('Gerando PDF...');

        try {
            const doc = new jsPDF();
            
            doc.text("Relatório de Serviços - ControlServ", 14, 20);

            const tableColumn = ["ID", "Descrição", "Cliente", "Status", "Valor Total", "Data Início"];
            const tableRows = [];

            servicos.forEach(servico => {
                const servicoData = [
                    servico.id,
                    servico.descricao,
                    servico.cliente,
                    servico.status.replace('-', ' '),
                    `R$ ${(servico.valorTotal || 0).toFixed(2).replace('.', ',')}`,
                    // Converte o formato da data para exibição (se necessário)
                    servico.dataInicio, 
                ];
                tableRows.push(servicoData);
            });

            doc.autoTable(tableColumn, tableRows, { startY: 25 });
            doc.save(`relatorio_controlserv_${window.app.obterDataHojeISO()}.pdf`);
            
            window.app.mostrarNotificacao('Relatório PDF gerado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);
        } catch (e) {
            console.error('Erro ao gerar PDF:', e);
            window.app.mostrarNotificacao('Erro ao gerar relatório PDF. Verifique o console.', NOTIFICACAO_TIPO.ERRO);
        } finally {
            window.app.hideLoading();
        }
    }

    /**
     * @description Gera um relatório de serviços em CSV.
     */
    function gerarCSV() {
        const servicos = window.app.getServicos();
        if (servicos.length === 0) {
            window.app.mostrarNotificacao('Não há serviços para gerar o relatório.', NOTIFICACAO_TIPO.ALERTA);
            return;
        }
        
        window.app.showLoading('Gerando CSV...');

        try {
            const header = ["ID", "Descricao", "Cliente", "Status", "ValorTotal", "DataInicio", "DataFimPrevista", "Observacao"];
            
            const csvRows = servicos.map(s => [
                s.id,
                `"${s.descricao}"`,
                `"${s.cliente}"`,
                s.status,
                (s.valorTotal || 0).toFixed(2).replace('.', ','),
                s.dataInicio,
                s.dataFimPrevista,
                `"${(s.observacao || '').replace(/"/g, '""')}"`
            ].join(','));

            // Adiciona a BOM (\ufeff) para compatibilidade com UTF-8 no Excel
            const csvContent = ["\ufeff", [header.join(','), ...csvRows].join('\n')];
            
            const blob = new Blob(csvContent, { type: 'text/csv;charset=utf-8;' }); 
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = `relatorio_controlserv_${window.app.obterDataHojeISO()}.csv`;
            link.click();
            
            window.app.mostrarNotificacao('Relatório CSV gerado com sucesso!', NOTIFICACAO_TIPO.SUCESSO);

        } catch (e) {
            console.error('Erro ao gerar CSV:', e);
            window.app.mostrarNotificacao('Erro ao gerar relatório CSV. Verifique o console.', NOTIFICACAO_TIPO.ERRO);
        } finally {
            window.app.hideLoading();
        }
    }
    
    /**
     * Expõe funções de relatórios para o escopo global através de window.reports
     */
    window.reports = {
        gerarPDF,
        gerarCSV
    };

})();