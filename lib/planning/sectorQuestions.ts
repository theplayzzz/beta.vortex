import { SetorPermitido } from './sectorConfig';

export interface Question {
  label: string;
  field: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "number" | "select" | "multiselect" | "toggle";
  options?: string[];
  required?: boolean;
  conditional?: {
    dependsOn: string;
    showWhen: string[];
  };
  placeholder?: string;
  description?: string;
  formatCurrency?: boolean; // Para campos number que precisam de formatação de moeda
}

export const PERGUNTAS_POR_SETOR: Record<SetorPermitido, Question[]> = {
  "Alimentação": [
    {
      label: "Quais pratos, produtos ou linhas de produtos têm maior saída ou lucratividade?",
      field: "alimentacao_produtos_principais",
      type: "multiselect",
      options: ["Pizza Calabresa", "Hambúrguer Artesanal", "Prato Executivo", "Sobremesas", "Bebidas", "Massas", "Carnes", "Frutos do Mar", "Pratos Veganos"],
      required: true,
      placeholder: "Ex: Pizza Calabresa, Hambúrguer Artesanal X, Prato Executivo Y"
    },
    {
      label: "Vocês trabalham com combos, promoções especiais ou sugestões de complementos de venda?",
      field: "alimentacao_combos_promocoes",
      type: "radio",
      options: ["Não costumamos trabalhar com essas estratégias", "Trabalhamos informalmente, dependendo da ocasião", "Temos uma estratégia estruturada de combos, promoções e complementos", "Outro"],
      required: true
    },
    {
      label: "Especifique a estratégia de combos e promoções:",
      field: "alimentacao_combos_promocoes_outro",
      type: "text",
      conditional: {
        dependsOn: "alimentacao_combos_promocoes",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva sua estratégia de combos e promoções"
    },
    {
      label: "A empresa atua principalmente como:",
      field: "alimentacao_tipo_atuacao",
      type: "checkbox",
      options: ["Restaurante/Lanchonete/Bar com atendimento presencial", "Delivery com frota/entregadores próprios", "Delivery terceirizado por aplicativos (ex: iFood, Rappi)", "Indústria de alimentos / Fornecedor para outros estabelecimentos", "Food Truck / Barraca em eventos", "Outro"],
      required: true
    },
    {
      label: "Especifique outro tipo de atuação:",
      field: "alimentacao_tipo_atuacao_outro",
      type: "text",
      conditional: {
        dependsOn: "alimentacao_tipo_atuacao",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva seu tipo de atuação"
    },
    {
      label: "Qual é o ticket médio por cliente/pedido?",
      field: "alimentacao_ticket_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 45.00",
      formatCurrency: true
    },
    {
      label: "Utilizam plataformas de delivery de terceiros (iFood, Rappi, etc.)?",
      field: "alimentacao_delivery_terceiros",
      type: "toggle",
      required: true
    },
    {
      label: "Quais plataformas?",
      field: "alimentacao_plataformas_delivery",
      type: "multiselect",
      options: ["iFood", "Rappi", "Uber Eats", "99Food", "Aiqfome", "James Delivery", "Loggi"],
      conditional: {
        dependsOn: "alimentacao_delivery_terceiros",
        showWhen: ["true"]
      },
      required: true,
      placeholder: "Selecione as plataformas utilizadas"
    },
    {
      label: "Quais estratégias de marketing ou fidelização são mais comuns?",
      field: "alimentacao_estrategias_marketing",
      type: "checkbox",
      options: ["Combos e promoções diárias/semanais", "Programas de fidelização (cartão fidelidade, descontos progressivos)", "Presença ativa em redes sociais", "Anúncios locais (online ou offline)", "Nenhum específico no momento", "Outro"],
      required: true
    },
    {
      label: "Especifique outras estratégias de marketing:",
      field: "alimentacao_estrategias_marketing_outro",
      type: "text",
      conditional: {
        dependsOn: "alimentacao_estrategias_marketing",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva outras estratégias de marketing"
    },
    {
      label: "Quais são os dias ou horários de maior movimento?",
      field: "alimentacao_horarios_movimento",
      type: "textarea",
      required: true,
      placeholder: "Ex: Fins de semana à noite, Horário de almoço durante a semana"
    }
  ],

  "Saúde e Bem-estar": [
    {
      label: "Quais dos serviços ou procedimentos oferecidos têm maior procura ou geram mais lucro?",
      field: "saude_servicos_principais",
      type: "multiselect",
      options: ["Consultas", "Exames de Imagem", "Cirurgias Eletivas", "Tratamentos Estéticos", "Fisioterapia", "Psicologia", "Cardiologia", "Dermatologia"],
      required: true,
      placeholder: "Digite e adicione serviços/procedimentos"
    },
    {
      label: "Sua clínica/consultório oferece outros serviços complementares no mesmo atendimento?",
      field: "saude_servicos_complementares",
      type: "radio",
      options: ["Não costumamos oferecer complementares", "Oferecemos ocasionalmente, sem um padrão definido", "Temos práticas frequentes, mas informais", "Temos estratégias estruturadas de serviços complementares", "Outro"],
      required: true
    },
    {
      label: "Especifique os serviços complementares:",
      field: "saude_servicos_complementares_outro",
      type: "text",
      conditional: {
        dependsOn: "saude_servicos_complementares",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva os serviços complementares"
    },
    {
      label: "A empresa atende:",
      field: "saude_tipo_atendimento",
      type: "radio",
      options: ["Apenas particular", "Apenas convênio(s)", "Ambos (particular e convênio(s))"],
      required: true
    },
    {
      label: "Quais especialidades ou principais serviços são oferecidos?",
      field: "saude_especialidades",
      type: "multiselect",
      options: ["Cardiologia", "Dermatologia", "Fisioterapia", "Odontologia Geral", "Psicologia", "Pediatria", "Ginecologia", "Ortopedia", "Neurologia", "Oftalmologia"],
      required: true,
      placeholder: "Selecione especialidades oferecidas"
    },
    {
      label: "Como os pacientes costumam marcar consultas/procedimentos?",
      field: "saude_agendamento",
      type: "checkbox",
      options: ["Telefone", "WhatsApp", "Site próprio / Portal do paciente", "Aplicativos especializados (ex: Doctoralia, BoaConsulta)", "Presencialmente / Recepção", "Outro"],
      required: true
    },
    {
      label: "Especifique outros métodos de agendamento:",
      field: "saude_agendamento_outro",
      type: "text",
      conditional: {
        dependsOn: "saude_agendamento",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva outros métodos de agendamento"
    },
    {
      label: "Existe alguma sazonalidade ou pico de demanda em determinados períodos?",
      field: "saude_sazonalidade",
      type: "radio",
      options: ["Sim, temos períodos específicos com alta procura (Ex: inverno para doenças respiratórias)", "Não, a demanda é relativamente constante ao longo do ano", "Sim, mas é difícil prever"],
      required: true
    },
    {
      label: "Como vocês se comunicam ou se relacionam com os pacientes fora do momento do atendimento?",
      field: "saude_comunicacao_pacientes",
      type: "textarea",
      required: true,
      placeholder: "Ex: Lembretes de consulta, campanhas de prevenção, newsletters, redes sociais com dicas de saúde."
    }
  ],

  "Educação": [
    {
      label: "Quais cursos, programas ou níveis de ensino têm mais procura ou são mais lucrativos?",
      field: "educacao_cursos_principais",
      type: "multiselect",
      options: ["Ensino Fundamental", "Ensino Médio", "Curso de Inglês Avançado", "Pós-graduação em Gestão", "Treinamento Corporativo", "Educação Infantil", "Curso Técnico", "Preparatório para Concursos"],
      required: true,
      placeholder: "Ex: Ensino Fundamental, Curso de Inglês Avançado, Pós-graduação em Gestão"
    },
    {
      label: "Vocês costumam oferecer serviços ou pacotes complementares (ex: material didático extra, aulas de reforço, atividades extracurriculares, eventos)?",
      field: "educacao_servicos_complementares",
      type: "radio",
      options: ["Não oferecemos complementares", "Sim, mas sem uma padronização ou estratégia clara", "Sim, oferecemos de forma estruturada e estratégica", "Outro"],
      required: true
    },
    {
      label: "Especifique os serviços complementares:",
      field: "educacao_servicos_complementares_outro",
      type: "text",
      conditional: {
        dependsOn: "educacao_servicos_complementares",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva os serviços complementares oferecidos"
    },
    {
      label: "A instituição opera predominantemente de forma:",
      field: "educacao_modalidade",
      type: "radio",
      options: ["Presencial", "Online (EAD)", "Híbrida (Presencial e Online)"],
      required: true
    },
    {
      label: "Qual o ticket médio por aluno/matrícula (mensalidade, valor do curso, etc.)?",
      field: "educacao_ticket_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 450.00",
      formatCurrency: true
    },
    {
      label: "Quantos alunos estão ativos atualmente?",
      field: "educacao_alunos_ativos",
      type: "number",
      required: true,
      placeholder: "Número de alunos ativos"
    },
    {
      label: "Como vocês atraem novos alunos hoje? (Principais canais/estratégias)",
      field: "educacao_canais_atracao",
      type: "multiselect",
      options: ["Redes Sociais", "Anúncios Google", "Indicações", "Feiras Educacionais", "Parcerias com Escolas/Empresas", "Marketing de Conteúdo", "Eventos Presenciais"],
      required: true,
      placeholder: "Ex: Redes Sociais, Anúncios Google, Indicações"
    },
    {
      label: "Como a instituição lida com a evasão de alunos?",
      field: "educacao_retencao_alunos",
      type: "radio",
      options: ["Não temos estratégias específicas para retenção/evasão", "Realizamos acompanhamento individualizado e comunicação direta (e-mail, telefone, WhatsApp)", "Temos um plano de retenção estruturado (programas de apoio, tutoria, renegociação, etc.)", "Outro"],
      required: true
    },
    {
      label: "Especifique a estratégia de retenção:",
      field: "educacao_retencao_alunos_outro",
      type: "text",
      conditional: {
        dependsOn: "educacao_retencao_alunos",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva sua estratégia de retenção"
    }
  ],

  "Varejo físico": [
    {
      label: "Quais produtos ou categorias de produtos têm maior giro ou melhor margem de lucro?",
      field: "varejo_produtos_principais",
      type: "multiselect",
      options: ["Roupas e Acessórios", "Eletrônicos", "Casa e Decoração", "Alimentação", "Beleza e Cosméticos", "Esportes", "Livros", "Móveis"],
      required: true,
      placeholder: "Selecione categorias de produtos"
    },
    {
      label: "Sua loja/empresa costuma trabalhar com produtos complementares ou sugestões no atendimento/checkout (upsell/cross-sell)?",
      field: "varejo_upsell_crosssell",
      type: "radio",
      options: ["Não, raramente ou nunca", "Sim, mas de forma informal, dependendo do vendedor/situação", "Sim, temos uma estratégia definida e/ou sistema para isso", "Outro"],
      required: true
    },
    {
      label: "Especifique a estratégia de upsell/cross-sell:",
      field: "varejo_upsell_crosssell_outro",
      type: "text",
      conditional: {
        dependsOn: "varejo_upsell_crosssell",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva sua estratégia de produtos complementares"
    },
    {
      label: "Como sua empresa opera principalmente?",
      field: "varejo_canais_operacao",
      type: "checkbox",
      options: ["Loja Física Própria", "Loja Física Franqueada", "E-commerce (Site próprio)", "Marketplaces (ex: Mercado Livre, Amazon, Magazine Luiza)", "Venda por Redes Sociais / WhatsApp", "Outro"],
      required: true
    },
    {
      label: "Especifique outros canais de operação:",
      field: "varejo_canais_operacao_outro",
      type: "text",
      conditional: {
        dependsOn: "varejo_canais_operacao",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva outros canais de operação"
    },
    {
      label: "Qual é o ticket médio de venda por cliente/pedido?",
      field: "varejo_ticket_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 150.00",
      formatCurrency: true
    },
    {
      label: "Vocês oferecem algum programa de fidelidade ou clube de vantagens?",
      field: "varejo_programa_fidelidade",
      type: "toggle",
      required: true
    },
    {
      label: "Descreva brevemente seu programa de fidelidade:",
      field: "varejo_programa_fidelidade_descricao",
      type: "textarea",
      conditional: {
        dependsOn: "varejo_programa_fidelidade",
        showWhen: ["true"]
      },
      required: true,
      placeholder: "Descreva como funciona seu programa de fidelidade"
    },
    {
      label: "Quais tipos de campanhas de marketing/promoção vocês mais utilizam?",
      field: "varejo_campanhas_marketing",
      type: "multiselect",
      options: ["Promoções Locais (bairro/região)", "Anúncios Digitais (Google/Redes Sociais)", "Email Marketing", "Influenciadores", "Eventos na Loja", "Desconto por Volume", "Liquidações Sazonais"],
      required: true,
      placeholder: "Ex: Promoções Locais, Anúncios Digitais, Email Marketing"
    },
    {
      label: "Existe sistema para acompanhar estoque e/ou comportamento de compra dos clientes (CRM, ERP, plataforma de e-commerce com analytics)?",
      field: "varejo_sistema_gestao",
      type: "toggle",
      required: true
    },
    {
      label: "Quais sistemas/ferramentas vocês utilizam?",
      field: "varejo_sistema_gestao_descricao",
      type: "textarea",
      conditional: {
        dependsOn: "varejo_sistema_gestao",
        showWhen: ["true"]
      },
      required: true,
      placeholder: "Descreva os sistemas que utilizam (CRM, ERP, analytics, etc.)"
    }
  ],

  "E-commerce": [
    {
      label: "Quais categorias de produtos mais vendem ou são mais lucrativas?",
      field: "ecom_categorias_destaque",
      type: "textarea",
      required: true,
      placeholder: "Ex: Eletrônicos, roupas femininas, casa e jardim..."
    },
    {
      label: "Qual é o ticket médio dos pedidos?",
      field: "ecom_ticket_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 85.00"
    },
    {
      label: "Quantos pedidos recebem por dia/mês?",
      field: "ecom_volume_pedidos",
      type: "text",
      required: true,
      placeholder: "Ex: 50 por dia ou 1500 por mês"
    },
    {
      label: "Em quais plataformas vendem?",
      field: "ecom_plataformas",
      type: "checkbox",
      options: ["Site próprio", "Mercado Livre", "Amazon", "Shopee", "Magazine Luiza", "Americanas", "Instagram", "Outro"],
      required: true
    },
    {
      label: "Como fazem a logística?",
      field: "ecom_logistica",
      type: "radio",
      options: ["Correios", "Transportadora própria", "Fulfillment (terceirizado)", "Misto", "Retirada local"],
      required: true
    },
    {
      label: "Fazem cross-sell ou upsell?",
      field: "ecom_upsell",
      type: "radio",
      options: ["Sim, sistematicamente", "Sim, mas sem estrutura", "Não fazemos", "Estamos implementando"],
      required: true
    },
    {
      label: "Qual é o maior desafio do e-commerce?",
      field: "ecom_desafio",
      type: "select",
      options: ["Atrair tráfego", "Converter visitantes", "Gestão de estoque", "Logística", "Atendimento", "Concorrência", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial competitivo?",
      field: "ecom_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Preço, qualidade, entrega rápida, atendimento..."
    }
  ],

  "Serviços locais": [
    {
      label: "Qual é o tipo de serviço?",
      field: "local_tipo",
      type: "radio",
      options: ["Beleza (salão, barbearia)", "Automotivo", "Reforma/Construção", "Limpeza", "Manutenção", "Pet shop", "Outro"],
      required: true
    },
    {
      label: "Qual é o valor médio do serviço?",
      field: "local_valor_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 120.00"
    },
    {
      label: "Quantos clientes atendem por semana?",
      field: "local_clientes_semana",
      type: "number",
      required: true,
      placeholder: "Número de clientes por semana"
    },
    {
      label: "O serviço é prestado:",
      field: "local_onde",
      type: "radio",
      options: ["No estabelecimento", "Na casa do cliente", "Ambos", "Depende do serviço"],
      required: true
    },
    {
      label: "Como os clientes agendam?",
      field: "local_agendamento",
      type: "checkbox",
      options: ["Telefone", "WhatsApp", "Aplicativo", "Redes sociais", "Presencialmente", "Site"],
      required: true
    },
    {
      label: "Qual é a área de cobertura?",
      field: "local_area",
      type: "radio",
      options: ["Bairro específico", "Região da cidade", "Cidade toda", "Cidades vizinhas", "Atendimento remoto"],
      required: true
    },
    {
      label: "Qual é o principal desafio?",
      field: "local_desafio",
      type: "select",
      options: ["Conseguir novos clientes", "Fidelizar clientes", "Precificar serviços", "Agenda lotada", "Concorrência", "Marketing", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial do seu serviço?",
      field: "local_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Qualidade, rapidez, preço, atendimento..."
    }
  ],

  "Serviços B2B": [
    {
      label: "Quais são as principais áreas ou tipos de consultoria/serviços B2B oferecidos pela sua empresa?",
      field: "b2b_areas_principais",
      type: "multiselect",
      options: ["Consultoria Financeira", "Consultoria de RH", "Consultoria de Marketing", "Consultoria em TI", "Consultoria Estratégica", "Consultoria Jurídica", "Consultoria Operacional", "Serviços de TI", "Marketing Digital"],
      required: true,
      placeholder: "Ex: Consultoria Financeira, Consultoria de RH, Consultoria de Marketing"
    },
    {
      label: "Sua empresa oferece serviços complementares aos projetos principais (ex: treinamentos, implementação de soluções, acompanhamento)?",
      field: "b2b_servicos_complementares",
      type: "radio",
      options: ["Não, focamos exclusivamente no serviço principal", "Sim, oferecemos pontualmente ou conforme a necessidade do cliente", "Sim, temos um portfólio estruturado de serviços complementares", "Outro"],
      required: true
    },
    {
      label: "Especifique os serviços complementares:",
      field: "b2b_servicos_complementares_outro",
      type: "text",
      conditional: {
        dependsOn: "b2b_servicos_complementares",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva os serviços complementares oferecidos"
    },
    {
      label: "Qual é o perfil predominante dos seus clientes?",
      field: "b2b_perfil_clientes",
      type: "radio",
      options: ["Pequenas empresas (até 20 funcionários)", "Médias empresas (21 a 100 funcionários)", "Grandes empresas (acima de 100 funcionários)", "Pessoas Físicas", "Organizações do Terceiro Setor / ONGs", "Outro"],
      required: true
    },
    {
      label: "Especifique o perfil de clientes:",
      field: "b2b_perfil_clientes_outro",
      type: "text",
      conditional: {
        dependsOn: "b2b_perfil_clientes",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva o perfil dos seus clientes"
    },
    {
      label: "Qual é a duração média de um projeto/contrato?",
      field: "b2b_duracao_projeto",
      type: "select",
      options: ["Até 1 mês", "1 a 3 meses", "3 a 6 meses", "6 meses a 1 ano", "Mais de 1 ano / Contínuo"],
      required: true
    },
    {
      label: "Como sua empresa geralmente precifica os serviços?",
      field: "b2b_modelo_precificacao",
      type: "radio",
      options: ["Hora/Homem", "Pacote fechado por projeto", "Success Fee (Taxa de êxito)", "Mensalidade (retainer)", "Outro"],
      required: true
    },
    {
      label: "Especifique o modelo de precificação:",
      field: "b2b_modelo_precificacao_outro",
      type: "text",
      conditional: {
        dependsOn: "b2b_modelo_precificacao",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva seu modelo de precificação"
    },
    {
      label: "Quais são os principais canais para aquisição de novos clientes?",
      field: "b2b_canais_aquisicao",
      type: "multiselect",
      options: ["Indicações (Networking)", "Prospecção Ativa", "Marketing de Conteúdo", "Eventos e Palestras", "Parcerias Estratégicas", "LinkedIn", "Site próprio"],
      required: true,
      placeholder: "Ex: Indicações (Networking), Prospecção Ativa, Marketing de Conteúdo"
    },
    {
      label: "Qual o maior diferencial da sua empresa em relação aos concorrentes?",
      field: "b2b_diferencial_competitivo",
      type: "textarea",
      required: true,
      placeholder: "Descreva qual é o principal diferencial da sua empresa"
    }
  ],

  "Tecnologia / SaaS": [
    {
      label: "Qual funcionalidade, produto ou plano é mais procurado ou mais rentável?",
      field: "tecnologia_funcionalidade_principal",
      type: "textarea",
      required: true,
      placeholder: "Descreva detalhadamente..."
    },
    {
      label: "Sua empresa oferece planos complementares, módulos adicionais ou upgrades?",
      field: "tecnologia_planos_complementares",
      type: "radio",
      options: ["Não oferecemos", "Sim, pontualmente ou sob demanda", "Sim, temos uma esteira estruturada de upsell/add-ons", "Outro"],
      required: true
    },
    {
      label: "Especifique os planos complementares:",
      field: "tecnologia_planos_complementares_outro",
      type: "text",
      conditional: {
        dependsOn: "tecnologia_planos_complementares",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva seus planos complementares"
    },
    {
      label: "O produto/serviço é voltado para:",
      field: "tecnologia_publico_alvo",
      type: "radio",
      options: ["Empresas (B2B)", "Consumidor final (B2C)", "Ambos"],
      required: true
    },
    {
      label: "Qual o modelo de cobrança principal?",
      field: "tecnologia_modelo_cobranca",
      type: "select",
      options: ["Assinatura mensal/anual", "Licença vitalícia/perpétua", "Freemium (modelo gratuito com recursos pagos)", "Por uso/consumo", "Projeto/Serviço pontual", "Outro"],
      required: true
    },
    {
      label: "Especifique o modelo de cobrança:",
      field: "tecnologia_modelo_cobranca_outro",
      type: "text",
      conditional: {
        dependsOn: "tecnologia_modelo_cobranca",
        showWhen: ["Outro"]
      },
      required: true,
      placeholder: "Descreva seu modelo de cobrança"
    },
    {
      label: "Qual é o canal principal de aquisição de novos clientes?",
      field: "tecnologia_canal_aquisicao",
      type: "multiselect",
      options: ["Marketing de Conteúdo", "Anúncios Pagos (Google/Social)", "Vendas Diretas", "Parcerias", "Indicação", "Eventos"],
      required: true,
      placeholder: "Selecione ou adicione canais de aquisição"
    },
    {
      label: "Existe uma esteira de nutrição para trial, demonstrações ou leads frios?",
      field: "tecnologia_esteira_nutricao",
      type: "radio",
      options: ["Sim, totalmente automatizada (ex: via CRM/e-mail marketing)", "Sim, mas realizada de forma manual ou semi-manual", "Não temos uma esteira de nutrição formal", "Estamos estruturando isso atualmente"],
      required: true
    },
    {
      label: "Como é feito o onboarding (integração) de novos clientes?",
      field: "tecnologia_onboarding",
      type: "textarea",
      required: true,
      placeholder: "Descrever o processo, se é automatizado, manual, com documentação, vídeos, suporte dedicado, etc."
    }
  ],

  "Imobiliário": [
    {
      label: "Qual é o tipo de atuação?",
      field: "imob_tipo",
      type: "radio",
      options: ["Vendas residenciais", "Vendas comerciais", "Locação", "Administração de imóveis", "Incorporação", "Misto", "Outro"],
      required: true
    },
    {
      label: "Quantas transações fazem por mês?",
      field: "imob_transacoes",
      type: "number",
      required: true,
      placeholder: "Número de vendas/locações por mês"
    },
    {
      label: "Qual é o valor médio dos imóveis?",
      field: "imob_valor_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 350000.00"
    },
    {
      label: "Quantos imóveis têm no portfólio?",
      field: "imob_portfolio",
      type: "number",
      required: true,
      placeholder: "Número de imóveis disponíveis"
    },
    {
      label: "Como captam imóveis?",
      field: "imob_captacao",
      type: "checkbox",
      options: ["Indicações", "Prospecção ativa", "Site próprio", "Parcerias", "Anúncios", "Redes sociais", "Outro"],
      required: true
    },
    {
      label: "Como divulgam os imóveis?",
      field: "imob_divulgacao",
      type: "checkbox",
      options: ["Site próprio", "Portais (Viva Real, ZAP)", "Redes sociais", "Placa na rua", "Indicações", "Anúncios", "Outro"],
      required: true
    },
    {
      label: "Qual é o maior desafio?",
      field: "imob_desafio",
      type: "select",
      options: ["Captar imóveis", "Encontrar compradores", "Preços de mercado", "Concorrência", "Documentação", "Marketing", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial da imobiliária?",
      field: "imob_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Atendimento, conhecimento de mercado, portfólio..."
    }
  ],

  "Indústria": [
    {
      label: "Qual é o tipo de indústria?",
      field: "ind_tipo",
      type: "radio",
      options: ["Alimentícia", "Têxtil", "Metalúrgica", "Química", "Automotiva", "Eletrônica", "Móveis", "Outro"],
      required: true
    },
    {
      label: "Qual é o principal produto fabricado?",
      field: "ind_produto",
      type: "textarea",
      required: true,
      placeholder: "Descreva o principal produto ou linha de produtos"
    },
    {
      label: "Qual é a capacidade produtiva mensal?",
      field: "ind_capacidade",
      type: "text",
      required: true,
      placeholder: "Ex: 10.000 unidades/mês"
    },
    {
      label: "Quantos funcionários trabalham na produção?",
      field: "ind_funcionarios",
      type: "number",
      required: true,
      placeholder: "Número de funcionários"
    },
    {
      label: "Quem são os principais clientes?",
      field: "ind_clientes",
      type: "radio",
      options: ["Varejo (B2C)", "Distribuidores", "Outras indústrias (B2B)", "Governo", "Exportação", "Misto"],
      required: true
    },
    {
      label: "Como vendem os produtos?",
      field: "ind_venda",
      type: "checkbox",
      options: ["Venda direta", "Representantes", "Distribuidores", "E-commerce", "Licitações", "Exportação", "Outro"],
      required: true
    },
    {
      label: "Qual é o maior desafio operacional?",
      field: "ind_desafio",
      type: "select",
      options: ["Reduzir custos", "Aumentar produtividade", "Qualidade", "Conseguir clientes", "Matéria-prima", "Logística", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial competitivo?",
      field: "ind_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Tecnologia, qualidade, preço, prazo de entrega..."
    }
  ],

  "Outro": [
    {
      label: "Descreva brevemente o seu negócio:",
      field: "outro_descricao",
      type: "textarea",
      required: true,
      placeholder: "Conte-nos sobre o seu ramo de atividade, produtos/serviços oferecidos..."
    },
    {
      label: "Qual é o seu modelo de receita?",
      field: "outro_modelo_receita",
      type: "textarea",
      required: true,
      placeholder: "Ex: Venda única, assinatura, comissão, royalties..."
    },
    {
      label: "Quem é o seu público-alvo?",
      field: "outro_publico",
      type: "textarea",
      required: true,
      placeholder: "Descreva quem são seus clientes principais..."
    },
    {
      label: "Qual é o valor médio dos seus produtos/serviços?",
      field: "outro_valor_medio",
      type: "number",
      required: true,
      placeholder: "Valor médio em reais"
    },
    {
      label: "Quantos clientes você atende por mês?",
      field: "outro_volume_clientes",
      type: "text",
      required: true,
      placeholder: "Ex: 50 clientes por mês"
    },
    {
      label: "Como você consegue novos clientes?",
      field: "outro_aquisicao",
      type: "textarea",
      required: true,
      placeholder: "Principais canais de aquisição de clientes..."
    },
    {
      label: "Qual é o maior desafio do seu negócio?",
      field: "outro_desafio",
      type: "textarea",
      required: true,
      placeholder: "Principal dificuldade ou obstáculo que enfrenta..."
    },
    {
      label: "Qual é o seu principal diferencial?",
      field: "outro_diferencial",
      type: "textarea",
      required: true,
      placeholder: "O que te diferencia da concorrência..."
    }
  ]
};

/**
 * Obter perguntas para um setor específico
 */
export function getQuestionsForSector(sector: SetorPermitido): Question[] {
  return PERGUNTAS_POR_SETOR[sector] || PERGUNTAS_POR_SETOR["Outro"];
}

/**
 * Obter total de perguntas para um setor
 */
export function getTotalQuestionsForSector(sector: SetorPermitido): number {
  return getQuestionsForSector(sector).length;
}

/**
 * Validar se um campo é obrigatório para um setor
 */
export function isRequiredField(sector: SetorPermitido, field: string): boolean {
  const questions = getQuestionsForSector(sector);
  const question = questions.find(q => q.field === field);
  return question?.required ?? false;
}

/**
 * Obter pergunta específica por campo
 */
export function getQuestionByField(sector: SetorPermitido, field: string): Question | undefined {
  const questions = getQuestionsForSector(sector);
  return questions.find(q => q.field === field);
} 