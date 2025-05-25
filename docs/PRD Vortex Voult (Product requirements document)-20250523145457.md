# PRD Vortex Voult (Product requirements document)

## Vortex Voult

## 1\. Visão Geral do Produto

### 1.1 Descrição do Produto

O Sistema de Planejamento e Gestão com IA é uma plataforma integrada projetada para capacitar usuários a criar, gerenciar e otimizar planejamentos estratégicos, projetos e interações comerciais, tudo com o suporte de inteligência artificial. A plataforma oferece um conjunto robusto de ferramentas para automatizar a criação de documentos, centralizar informações contextuais de clientes de forma progressiva, fornecer insights acionáveis e facilitar a colaboração, operando sob um modelo de consumo baseado em créditos.

### 1.2 Proposta de Valor

*   **Geração Inteligente e Contextualizada**: Redução drástica do tempo e esforço na criação de planejamentos estratégicos, propostas comerciais, e outras interações, utilizando informações contextuais do cliente (progressivamente enriquecidas) e a assistência da IA.
*   **Coleta e Uso Eficiente de Dados do Cliente**: Sistema intuitivo para cadastrar e enriquecer perfis de clientes, com feedback visual sobre a "riqueza" das informações, incentivando a coleta de dados que potencializam as ferramentas de IA.
*   **Experiência de Usuário Fluida**: Salvamento automático de dados em formulários, permitindo que os usuários retomem o trabalho sem perdas, e criação rápida de clientes via pop-up em pontos estratégicos.
*   **Colaboração e Transparência com Clientes**: (Visão de longo prazo) Compartilhamento seletivo de informações de projetos com clientes através de páginas públicas dedicadas, promovendo alinhamento e confiança.
*   **Decisões Orientadas por Dados e Contexto**: Utilização de IA para analisar dados do cliente, fornecer insights, prever resultados e oferecer recomendações para otimizar estratégias e processos comerciais.
*   **Flexibilidade e Controle Financeiro**: Sistema de créditos que permite aos usuários controlar seus gastos e pagar apenas pelos recursos que utilizam, com todas as ferramentas sendo projetadas para futura integração com este sistema.

### 1.3 Público-Alvo

*   Agências de marketing e publicidade
*   Consultorias de negócios e estratégia
*   Profissionais de vendas e equipes comerciais
*   Consultores independentes e freelancers
*   Empresas de pequeno e médio porte com equipes internas de marketing e vendas
*   Gestores de projetos, product owners e líderes de equipe

## 2\. Funcionalidades do Sistema

### 2.1 Cadastro e Contexto do Cliente

*   **Objetivo Principal**: Coletar e armazenar informações detalhadas sobre cada cliente de forma progressiva, servindo de contexto rico e dinâmico para outras funcionalidades da plataforma, especialmente Planejamento Estratégico e o Agente de Conversação IA.
*   **Criação de Perfil do Cliente (Fluxo em Duas Etapas)**:
    *   **Criação Rápida via Pop-up**:
        *   Ao iniciar uma funcionalidade que requer um cliente (ex: novo Planejamento, novo Chat IA) ou ao clicar em "Adicionar Novo Cliente" em um menu ou lista de clientes, um pop-up surgirá.
        *   Este pop-up solicitará informações essenciais e mínimas:
            *   Nome da Empresa/Cliente (obrigatório).
            *   Ramo de Atuação (seleção ou campo aberto, opcional).
            *   Breve descrição do principal Serviço/Produto (campo aberto, opcional).
            *   Objetivo inicial ou problema a ser resolvido (campo aberto, opcional).
        *   Ao preencher e salvar, o cliente é criado no sistema e pode ser imediatamente utilizado pela ferramenta que originou o pop-up.
    *   **Enriquecimento Progressivo do Perfil (Página do Cliente)**:
        *   Após a criação rápida, o usuário é direcionado (ou pode acessar posteriormente através de uma lista de clientes ou link direto) a página completa do perfil do cliente.
        *   Esta página contém seções para adicionar informações detalhadas (similares a um formulário de onboarding), que podem ser preenchidas e atualizadas ao longo do tempo:
            *   **Informações de Contato**: E-mail, telefone, website, endereço.
            *   **Detalhes do Negócio**: Setor específico, histórico da empresa, missão, visão, valores, modelo de negócio detalhado, estrutura organizacional relevante.
            *   **Público-Alvo e Personas**: Descrição detalhada das personas, incluindo dados demográficos, comportamentais, dores, necessidades, canais preferidos.
            *   **Objetivos de Negócio e Marketing**: Objetivos SMART de curto, médio e longo prazo.
            *   **Histórico e Estratégias Atuais**: Detalhamento de campanhas anteriores (marketing, vendas), resultados, aprendizados, ferramentas utilizadas, orçamento.
            *   **Desafios e Oportunidades**: Análise SWOT, percepções do cliente sobre o mercado.
            *   **Concorrentes**: Lista de principais concorrentes, seus pontos fortes e fracos, diferenciais do cliente.
            *   **Recursos e Orçamento**: Orçamento de marketing/vendas, equipe interna/externa, outras ferramentas e recursos.
            *   **Tom de Voz e Identidade da Marca**: Guia de estilo, palavras-chave da marca, exemplos de comunicação.
            *   **Preferências e Restrições**: Canais de comunicação preferidos, restrições legais ou éticas.
*   **Indicador de Riqueza de Informações do Cliente**:
    *   Um indicador visual (ex: barra de progresso, pontuação percentual, ou um sistema de níveis/selos) será exibido de forma proeminente no perfil do cliente e em interfaces onde o cliente é selecionado para uso (ex: modal de seleção de cliente para o Chat IA).
    *   Este indicador reflete o quão completo está o perfil do cliente com base no preenchimento das seções mencionadas acima.
    *   O objetivo é incentivar o usuário a adicionar mais informações, comunicando que um perfil mais rico resultará em outputs de IA mais precisos e personalizados.
    *   _O design deste indicador deve ser pensado para futura integração com o sistema de créditos (ex: maior riqueza pode otimizar o uso de créditos ou desbloquear níveis de IA mais avançados)._
*   **Visualização Consolidada do Cliente**:
    *   A página de perfil do cliente exibirá todas as informações cadastradas e o indicador de riqueza.
    *   Apresentará abas ou seções dedicadas para listar e permitir acesso direto a:
        *   Todos os **Planejamentos Estratégicos (Backlogs)** vinculados a este cliente.
        *   Todas as **Interações com o Agente de Conversação IA (Chats)** vinculadas a este cliente.
        *   Todas as **Tarefas** que foram explicitamente vinculadas a este cliente.
        *   Todas as **Propostas Comerciais** que foram explicitamente vinculadas a este cliente.
*   **Notas e Anexos**: Capacidade de adicionar notas gerais (com editor de rich text) e anexar arquivos relevantes (documentos, imagens, planilhas) ao perfil do cliente.

### 2.2 Planejamento Estratégico com IA

*   **Criação de Planejamentos (Backlogs)**:
    *   **Seleção/Criação do Cliente**: O processo inicia com a **obrigatoriedade de vincular a um cliente existente** (selecionado de uma lista/busca) ou **criar um novo cliente** através do pop-up de criação rápida (2.1.1). As informações contextuais deste cliente (e seu indicador de riqueza) estarão visíveis e disponíveis para a IA.
    *   **Coleta de Informações Adicionais (Formulário Inteligente)**: Formulário estruturado para coletar informações específicas para _este_ planejamento (complementando o que já existe no cadastro do cliente), como objetivos específicos do planejamento, escopo, métricas de sucesso, orçamento alocado para o planejamento, tom de voz desejado para os outputs. A IA pode auxiliar com sugestões durante o preenchimento, usando o contexto do cliente.
    *   **Geração de Estrutura do Planejamento (Sequência Inicial)**: Com base nas informações do cliente e do formulário específico, a IA gera uma estrutura inicial do planejamento, propondo as principais fases, iniciativas ou blocos de trabalho em uma sequência lógica. O usuário pode revisar, editar, adicionar ou remover itens desta estrutura.
    *   **Geração do Planejamento Detalhado (Lista de Tarefas Refinadas)**: A partir da estrutura aprovada, a IA expande cada item em um conjunto detalhado de tarefas acionáveis, compondo o "Planejamento Detalhado". Este planejamento detalhado funciona como um backlog inicial, com cada tarefa incluindo descrição, objetivos, e sugestões de prioridade, esforço e possíveis responsáveis (se houver equipe cadastrada).
*   **Gestão de Backlogs de Planejamento**:
    *   Visualização dos planejamentos criados em formato de grid ou lista, com informações chave (cliente, status, data de criação, progresso geral se vinculado a tarefas).
    *   Filtros por cliente, status, data de criação.
    *   Opções para visualizar detalhes, editar (retornar aos passos de coleta de informação ou edição da estrutura/tarefas), arquivar, duplicar ou excluir planejamentos.
*   _O consumo de créditos para geração de planejamentos será implementado futuramente, considerando a complexidade e o nível de detalhamento solicitado, potencialmente influenciado pela riqueza de informações do cliente._

### 2.3 Agente de Conversação IA (Chat Contextualizado por Cliente)

*   **Interface de Chat**: Uma interface de conversação intuitiva, com campo de entrada para prompts do usuário e área de exibição para as respostas da IA e histórico da conversa.
*   **Seleção/Criação de Contexto do Cliente**: Antes de iniciar uma nova sessão de chat ou ao longo dela, o usuário **deve selecionar um cliente existente** (com seu indicador de riqueza visível) ou **criar um novo cliente** através do pop-up de criação rápida (2.1.1). Este cliente fornecerá o contexto principal para a IA.
*   **Capacidades do Agente**:
    *   Responder a perguntas sobre o cliente, utilizando as informações armazenadas em seu perfil (seção 2.1).
    *   Auxiliar na redação de textos (e-mails, posts para redes sociais, copys de anúncios, etc.) com base no tom de voz e informações do cliente.
    *   Brainstorming de ideias para campanhas, conteúdo ou estratégias específicas para o cliente.
    *   Resumir informações do perfil do cliente ou de planejamentos vinculados.
    *   Auxiliar na execução de pequenas tarefas ou na formulação de passos para tarefas mais complexas (ex: "Crie um rascunho de e-mail de follow-up para a proposta X do cliente Y").
    *   Gerar sugestões de perguntas para aprofundar o conhecimento sobre o cliente durante uma reunião de onboarding.
*   **Armazenamento de Interações (Chats)**:
    *   Cada sessão de chat com o Agente de Conversação é salva automaticamente e vinculada ao cliente selecionado.
    *   O histórico de conversas é pesquisável (dentro do chat e globalmente) e acessível para referência futura.
    *   Possibilidade de nomear/renomear chats para melhor organização.
*   **Navegação**: Os chats podem ser acessados a partir de uma seção dedicada "Agente IA" no menu principal ou diretamente pelo perfil do cliente.
*   _Cada interação ou conjunto de interações com o Agente IA consumirá créditos. O custo pode variar conforme a complexidade da consulta, o modelo de IA utilizado, ou o volume de processamento._

### 2.4 Gestão de Tarefas

*   **Criação de Tarefas**:
    *   **Tarefas Derivadas de Planejamentos**: Geradas automaticamente no "Planejamento Detalhado" (2.2.1.4) e, por consequência, vinculadas ao cliente do planejamento.
    *   **Criação de Tarefas Avulsas ("Soltas")**: Usuários podem criar tarefas individualmente, de forma manual ou com assistência da IA (a partir de descrições informais).
        *   **Vinculação Opcional ao Cliente**: Tarefas avulsas _podem_ ser opcionalmente vinculadas a um cliente específico (existente ou criado via pop-up) durante ou após sua criação.
*   **Detalhamento de Tarefas**: Cada tarefa pode incluir:
    *   Título, descrição detalhada (com editor rich text).
    *   Status (customizável, ex: A Fazer, Em Andamento, Revisão, Concluído, Bloqueado).
    *   Prioridade (Baixa, Média, Alta, Urgente).
    *   Responsável(eis) (usuários da plataforma).
    *   Datas de início e término (estimadas e reais).
    *   Estimativa de esforço/tempo (com sugestões da IA baseadas em tarefas similares).
    *   Subtarefas (com hierarquia).
    *   Anexos e comentários (com menções a usuários).
    *   Tags/Etiquetas para categorização.
*   **Vinculação de Tarefas Avulsas a Planejamentos**: Tarefas criadas de forma "solta" podem ser posteriormente associadas/adicionadas a um "Planejamento Detalhado" existente.
*   **Visualização de Tarefas**:
    *   Listagem de todas as tarefas com filtros avançados (por planejamento, cliente, status, responsável, prazo, tags, etc.).
    *   Visualização em modo Kanban interativo (arrastar e soltar entre colunas de status).
    *   Visualização em calendário (baseada nas datas de término).
*   **Dependências entre Tarefas**: Capacidade de definir e visualizar relações de dependência (ex: "esta tarefa não pode começar antes que a outra termine").
*   _A criação de tarefas assistida por IA (ex: refinar descrição, sugerir subtarefas) pode consumir uma pequena quantidade de créditos._

### 2.5 Módulo de Vendas com IA

*   **Propostas Comerciais**:
    *   Geração assistida por IA de propostas comerciais personalizadas.
    *   **Vinculação Opcional ao Cliente**: Propostas comerciais _podem_ ser opcionalmente vinculadas a um cliente (existente ou criado via pop-up). Se vinculadas, a IA pode usar o contexto do cliente (e seu indicador de riqueza) para personalizar a proposta (ex: linguagem, problemas abordados, soluções sugeridas).
    *   Biblioteca de templates de propostas (pré-definidos e criados pelo usuário).
    *   Armazenamento centralizado, versionamento e histórico de propostas.
    *   Exportação em múltiplos formatos (PDF, DOCX).
    *   Acompanhamento do status da proposta (Rascunho, Enviada, Visualizada, Aceita, Recusada, Negociação).
    *   _A geração de propostas comerciais com IA consumirá créditos, com o custo podendo variar pela complexidade, personalização e volume de conteúdo gerado._
*   **Argumentos de Vendas (Scripts e Objeções)**:
    *   Criação e organização de scripts de vendas para diferentes produtos/serviços e personas de cliente (informações podem ser puxadas do perfil do cliente).
    *   Geração por IA de contra-argumentos para objeções comuns, adaptados ao contexto do produto/serviço e cliente.
    *   Biblioteca de argumentos pesquisável e categorizada.
    *   _A geração de argumentos/contra-argumentos por IA consumirá créditos._
*   **Insights de Reuniões (Prioridade Futura)**:
    *   Ferramenta para upload ou integração com gravações de reuniões de vendas.
    *   Transcrição automática das reuniões.
    *   Análise por IA para extrair pontos-chave, próximos passos, compromissos, sentimento do cliente, oportunidades e riscos.
    *   Geração de resumos e recomendações para follow-up.
    *   _A transcrição e análise de reuniões consumirá créditos._
*   **Aprimoramento de Pitch de Vendas (Prioridade Futura)**:
    *   Análise de apresentações de vendas (slides, scripts) pela IA.
    *   Sugestões para melhorar storytelling, clareza, impacto visual e persuasão, considerando o público-alvo do cliente.
    *   _A análise de pitch por IA consumirá créditos._

### 2.6 Gestão Avançada de Projetos (Prioridade Futura)

*   **Dashboard de Projetos**: Visão consolidada de todos os projetos ativos (um "Planejamento Detalhado" pode evoluir para um projeto), com indicadores de progresso, saúde, prazos, orçamento (se aplicável) e recursos. Filtros por cliente, status, tipo, responsável.
*   **Páginas Públicas de Projetos**: Geração de URLs públicas para compartilhar o progresso de projetos com clientes.
*   **Gestão de Sprints/Ciclos (Metodologias Ágeis)**: Organização de tarefas em sprints, planejamento de capacidade, retrospectivas.
*   **Métricas e Relatórios de Projeto**: Geração de relatórios, KPIs, gráficos de desempenho, previsões de progresso por IA.
    *   _Relatórios avançados ou previsões geradas por IA podem consumir créditos._

### 2.7 Interface do Usuário e Experiência Geral

*   **Salvamento Automático de Formulários**:
    *   Todas as informações inseridas em formulários (cadastro de cliente, criação de planejamento, detalhes de tarefas, propostas, etc.) serão salvas automaticamente em tempo real (ou em intervalos curtos, ex: a cada 5-10 segundos de inatividade ou após cada mudança de campo) no armazenamento local do navegador (localStorage ou IndexedDB para dados maiores).
    *   Se o usuário atualizar a página, fechar a aba/navegador acidentalmente ou sair e voltar, os dados preenchidos no formulário ainda estarão presentes ao reabrir o mesmo formulário/contexto.
    *   Os dados do formulário só serão limpos do armazenamento local após o envio bem-sucedido do formulário (submissão ao backend) ou por uma ação explícita de "cancelar" ou "limpar formulário" confirmada pelo usuário.
    *   Um indicador visual sutil (ex: "Rascunho salvo") pode informar o usuário sobre o salvamento automático.
*   **Dashboard Principal e Navegação**:
    *   Visão Geral Personalizável: Widgets configuráveis (resumos de planejamentos, tarefas, atividades, saldo de créditos).
    *   Insights Automatizados da IA: Recomendações proativas.
    *   Modal de Geração Unificado: Acesso rápido para criar itens com IA.
*   **Sistema de Notificações**: Notificações em tempo real (menções, atribuições, atualizações, feedback, alertas de crédito).
*   **Busca Global Unificada**: Campo de pesquisa para encontrar clientes, planejamentos, tarefas, propostas, chats, etc.

### 2.8 Sistema de Créditos e Monetização

*   **Princípio Fundamental**: Todas as funcionalidades que envolvem processamento significativo por IA (ex: geração de texto longo, análises complexas), armazenamento extensivo de dados gerados por IA (ex: histórico de chats longos) ou que geram valor direto e substancial para o usuário consumirão créditos. Ações básicas de CRUD (criar, ler, atualizar, deletar) em dados inseridos manualmente pelo usuário geralmente não consumirão créditos, a menos que disparem um processamento de IA.
*   **Design Orientado a Créditos**:
    *   Desde a concepção de qualquer nova ferramenta ou funcionalidade, deve-se considerar como ela se integrará ao sistema de créditos (quanto consumirá, qual métrica de uso será usada para o débito).
    *   Deve-se prever "ganchos" ou mecanismos no backend para registrar o uso da funcionalidade (ex: chamadas à API de IA, volume de dados processados, tipo de operação), permitindo a futura contabilização e débito de créditos.
    *   O indicador de riqueza de informações do cliente (2.1.2) também deve ser pensado em sinergia com o sistema de créditos (ex: maior riqueza pode levar a um uso mais eficiente de créditos, desbloquear modelos de IA mais avançados com custo diferenciado, ou os resultados da IA podem ter "qualidade" vinculada à riqueza de dados, impactando o valor percebido dos créditos gastos).
    *   Transparência: O usuário deve ser informado antes de realizar uma ação que consumirá créditos, idealmente com uma estimativa do custo.
*   **Compra de Créditos**: Usuários poderão adquirir pacotes de créditos através de um gateway de pagamento integrado (Clerk).
*   **Gestão de Saldo**: Visualização clara do saldo de créditos disponível e histórico detalhado de consumo (qual ação, quando, quantos créditos).
*   **Recarga Automática e Alertas**: Opção de recarga automática e notificações de saldo baixo ou esgotado.

### 2.9 Gestão de Usuários e Perfil

*   **Autenticação Segura via Clerk**: Login, registro, recuperação de senha, autenticação de dois fatores (MFA).
*   **Gestão de Perfil**: Edição de informações pessoais, foto, configurações de conta, preferências de notificação.
*   **Temas e Personalização**: Opção de modo escuro/claro e outras personalizações de interface.
*   **Atalhos de Teclado**: Para ações comuns.

### 2.10 Administração da Plataforma

*   **Painel de Administração (via Clerk e/ou interface customizada)**:
    *   Gerenciamento de usuários da plataforma (aprovações, visualização de perfis, atribuição de papéis/permissões, bloqueio/desbloqueio).
    *   Monitoramento do uso do sistema (estatísticas de uso de funcionalidades, consumo de IA).
    *   Gestão de planos de créditos e promoções.
    *   Configurações globais da plataforma (ex: limites de API de IA, configurações de e-mail).

## 3\. Arquitetura e Tecnologia

### 3.1 Frontend

*   React com TypeScript
*   Tailwind CSS (ou outra biblioteca de estilização utility-first)
*   Shadcn UI (ou similar para componentes UI pré-construídos e acessíveis, como modais, pop-ups, formulários)
*   React Query (ou TanStack Query) para gerenciamento de estado de servidor, cache e sincronização de dados.
*   Zustand, Jotai ou Context API com useReducer para gerenciamento de estado global/local complexo, incluindo o estado de formulários para salvamento automático.
*   Mecanismos de persistência no navegador (localStorage ou IndexedDB) para o salvamento automático de formulários.

### 3.2 Backend

*   Node.js com Express.js (ou NestJS para uma estrutura mais opinativa e modular).
*   **Supabase (PostgreSQL) como banco de dados principal.**
*   **Prisma ORM como camada de acesso a dados (interação com Supabase).**

### 3.3 Autenticação e Pagamentos

*   **Clerk para autenticação de usuários, gestão de sessões, gerenciamento de perfis de usuário, e como gateway de pagamento para o sistema de créditos.**

### 3.4 Integração com IA

*   SDKs ou chamadas HTTP diretas para APIs de LLMs (ex: OpenAI API, Anthropic API, Google Gemini API).
*   Possível uso de LangChain ou similar para orquestração de chamadas a LLMs e gerenciamento de contexto.
*   APIs de transcrição de áudio (ex: AssemblyAI, OpenAI Whisper API) para insights de reuniões (futuro).
*   Sistema de filas (ex: RabbitMQ, BullMQ, ou serviços de nuvem como AWS SQS) para processamento assíncrono de tarefas de IA demoradas, garantindo que a interface do usuário não fique bloqueada.

### 3.5 Infraestrutura

*   Plataforma de deployment para backend (ex: Replit para desenvolvimento/prototipagem, Vercel, Railway, [Fly.io](http://Fly.io), AWS Elastic Beanstalk, Google Cloud Run para produção).
*   Supabase para infraestrutura de banco de dados e algumas funcionalidades BaaS (ex: real-time subscriptions se necessário).
*   Clerk para infraestrutura de autenticação e pagamentos.
*   WebSockets ou Server-Sent Events (SSE) para atualizações em tempo real (ex: notificações, progresso de tarefas de IA).

## 4\. Considerações Não Funcionais

### 4.1 Desempenho

*   Respostas rápidas da interface (idealmente <200ms para interações comuns).
*   Processamento eficiente de solicitações, especialmente para operações envolvendo IA (com uso de filas para operações longas).
*   Otimização de consultas ao banco de dados (índices, queries eficientes via Prisma).
*   Carregamento otimizado de dados (lazy loading, pagination).
*   O salvamento automático de formulários não deve impactar negativamente o desempenho da digitação ou da interface.

### 4.2 Escalabilidade

*   Arquitetura projetada para suportar um número crescente de usuários, clientes, planejamentos e dados.
*   Capacidade de escalar recursos de backend, banco de dados (Supabase) e IA conforme a demanda.
*   Uso de serviços gerenciados (Clerk, Supabase, APIs de IA) que lidam com escalabilidade.

### 4.3 Segurança

*   Proteção robusta de dados do usuário e do cliente, em conformidade com regulamentações de privacidade (LGPD/GDPR).
*   Autenticação segura e gerenciamento de permissões via Clerk.
*   Validação de entradas no frontend e backend.
*   Prevenção contra vulnerabilidades comuns (XSS, CSRF, SQL Injection - Prisma ajuda com isso).
*   Segurança nas transações de pagamento (responsabilidade do Clerk).
*   Políticas claras sobre o uso de dados pela IA e armazenamento de dados de clientes.

### 4.4 Usabilidade

*   Interface intuitiva, limpa, consistente e fácil de aprender e usar.
*   Fluxos de trabalho lógicos e eficientes, minimizando o número de cliques.
*   Feedback claro ao usuário sobre ações realizadas (sucesso, erro, processamento).
*   Onboarding claro para novos usuários, possivelmente com tours guiados ou dicas contextuais.
*   Design responsivo para acesso em diferentes dispositivos (desktop prioritário, mas com boa visualização em tablets).
*   O indicador de riqueza de informações do cliente deve ser motivador e não punitivo.

### 4.5 Confiabilidade

*   Alta disponibilidade do sistema (minimizar downtime).
*   Mecanismos de backup e recuperação de dados (Supabase oferece isso).
*   Tratamento de erros robusto e informativo no frontend e backend.
*   O salvamento automático de formulários deve ser confiável, evitando perda de dados do usuário.

### 4.6 Manutenibilidade

*   Código bem estruturado, modular, documentado e coberto por testes (unitários, integração, e2e).
*   Arquitetura que facilita atualizações, correções e a adição de novas funcionalidades.
*   Uso de boas práticas de desenvolvimento e design patterns.

### 4.7 Acessibilidade

*   Conformidade com as diretrizes de acessibilidade web (WCAG 2.1 AA) para garantir o uso por pessoas com diversas necessidades (navegação por teclado, contraste de cores, leitores de tela).

## 5\. Métricas de Sucesso (Exemplos)

### 5.1 Métricas de Produto e Engajamento

*   Número de usuários ativos (DAU, MAU).
*   Taxa de criação de perfis de cliente.
*   Nível médio de preenchimento ("riqueza") dos perfis de cliente.
*   Número de planejamentos estratégicos gerados.
*   Número de interações com o Agente de Conversação IA.
*   Número de propostas comerciais geradas.
*   Taxa de adoção de novas funcionalidades.
*   Tempo médio gasto na plataforma por sessão.
*   Taxa de conclusão de formulários (indicador de usabilidade e eficácia do salvamento automático).

### 5.2 Métricas de Negócio (Pós-Implementação de Créditos)

*   Receita total gerada (ARR/MRR).
*   Número de usuários pagantes (convertidos para planos de crédito).
*   Consumo médio de créditos por usuário/mês.
*   Taxa de churn de usuários pagantes.
*   Custo de Aquisição de Cliente (CAC) vs. Lifetime Value (LTV).

### 5.3 Métricas de Qualidade e Desempenho

*   Tempo de resposta da API.
*   Taxa de erro do servidor.
*   Índices de satisfação do usuário (NPS, CSAT) coletados por pesquisas.
*   Número de tickets de suporte relacionados a perda de dados em formulários (deve ser zero ou próximo disso).

## 6\. Conclusão

O Sistema de Planejamento e Gestão com IA está posicionado para ser uma ferramenta transformadora, focada em facilitar a coleta e utilização de **informações contextuais do cliente** para maximizar a eficácia da inteligência artificial e otimizar a experiência do usuário. Com inovações como o cadastro de cliente em duas etapas via pop-up, o salvamento automático robusto em formulários, e um indicador visual de "riqueza de informações", a plataforma visa não apenas aumentar a produtividade, mas também a qualidade dos resultados gerados. Todas as funcionalidades são desenvolvidas com a futura integração do **sistema de créditos** como um pilar central, assegurando um modelo de negócio sustentável e um controle transparente dos recursos utilizados, ao mesmo tempo que se constrói uma base sólida para a adição contínua de valor aos seus usuários.

* * *