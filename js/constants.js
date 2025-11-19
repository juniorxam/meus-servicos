// js/constants.js

/**
 * Boas Práticas: Usar constantes para strings repetidas (magic strings)
 * evita erros de digitação e melhora a legibilidade do código.
 */

// Chave do localStorage
const STORAGE_KEY = 'controlServ_servicos';

// Status dos Serviços
const STATUS = {
    EM_ANDAMENTO: 'em-andamento',
    FINALIZADO: 'finalizado',
    CANCELADO: 'cancelado'
};

// Tipos de Notificação
const NOTIFICACAO_TIPO = {
    SUCESSO: 'sucesso',
    ERRO: 'erro',
    INFO: 'info',
    ALERTA: 'alerta'
};

// Exporta as constantes para serem acessadas globalmente
window.STORAGE_KEY = STORAGE_KEY;
window.STATUS = STATUS;
window.NOTIFICACAO_TIPO = NOTIFICACAO_TIPO;