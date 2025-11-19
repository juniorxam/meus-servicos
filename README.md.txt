# ControlServ - Sistema de Gestão de Serviços

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Technology: JS](https://img.shields.io/badge/Tech-VanillaJS-blue.svg)]()

Um sistema simples e eficiente para gestão de ordens de serviço (OS) e clientes, construído com foco em Progressive Web App (PWA), armazenamento local e geração de relatórios.

**Este projeto é ideal para portfólio e uso pessoal, pois não requer configuração de chaves de API externas.**

## 🚀 Funcionalidades

* **CRUD de Serviços:** Cadastro, visualização, edição (simulada via status) e exclusão de serviços.
* **Dashboard:** Visão geral de serviços em andamento, finalizados e receita prevista.
* **Relatórios:** Geração de relatórios em formato **PDF** e **CSV** (via `jspdf`).
* **PWA (Progressive Web App):** Permite a instalação do aplicativo diretamente no desktop ou celular, rodando offline.
* **Backup Manual:** Funções de **Exportação** e **Importação** de dados via arquivo JSON local (Substituto do Google Drive).

## 🛠️ Tecnologias Utilizadas

* HTML5 & CSS3
* JavaScript (Vanilla JS - IIFE Pattern)
* **jspdf** e **jspdf-autotable** para relatórios.

## 💾 Como Executar Localmente

1.  **Clone o Repositório:**
    ```bash
    git clone [https://github.com/seu-usuario/controlserv.git](https://github.com/seu-usuario/controlserv.git)
    cd controlserv
    ```
2.  **Abra o `index.html`:** Simplesmente abra o arquivo `index.html` no seu navegador (ou use uma extensão de servidor local como o Live Server do VS Code).
3.  **Use o PWA:** No Chrome/Edge/Firefox, você pode instalar o aplicativo clicando no ícone de download/instalação na barra de endereço.

## 📥 Backup e Restauração

O ControlServ utiliza o **LocalStorage** do seu navegador para guardar os dados. Para garantir que seus dados não sejam perdidos ou para transferi-los:

1.  Vá para a aba **Configurações**.
2.  Clique em **Exportar Dados (JSON)** para baixar um arquivo de backup para o seu computador.
3.  Use a função **Importar Dados (JSON)** para restaurar os dados de um arquivo exportado anteriormente.

## 🔗 Outros Arquivos

* `manifest.json`: Arquivo de configuração para PWA.
* `.gitignore`: Arquivo para ignorar dependências e logs ao subir para o GitHub.