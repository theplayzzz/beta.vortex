import { SetorPermitido } from './sectorConfig';

export interface Question {
  label: string;
  field: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "number" | "select";
  options?: string[];
  required?: boolean;
  conditional?: {
    dependsOn: string;
    showWhen: string[];
  };
  placeholder?: string;
  description?: string;
}

export const PERGUNTAS_POR_SETOR: Record<SetorPermitido, Question[]> = {
  "Alimentação": [
    {
      label: "O negócio é:",
      field: "alim_tipo_negocio",
      type: "radio",
      options: ["Restaurante", "Lanchonete", "Food truck", "Delivery", "Indústria de alimentos", "Outro"],
      required: true
    },
    {
      label: "Qual é o ticket médio por pedido?",
      field: "alim_ticket_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 25.00"
    },
    {
      label: "Quantos clientes vocês atendem por dia/semana?",
      field: "alim_volume_clientes",
      type: "text",
      required: true,
      placeholder: "Ex: 100 por dia"
    },
    {
      label: "Qual é o principal diferencial do seu negócio?",
      field: "alim_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Ingredientes orgânicos, receita familiar..."
    },
    {
      label: "Vocês fazem delivery próprio?",
      field: "alim_delivery",
      type: "radio",
      options: ["Sim, com equipe própria", "Sim, via apps (iFood, Uber)", "Não fazemos delivery", "Estamos considerando"],
      required: true
    },
    {
      label: "Qual é o horário de funcionamento?",
      field: "alim_horario",
      type: "text",
      required: true,
      placeholder: "Ex: Seg a Sex 8h-18h, Sáb 8h-14h"
    },
    {
      label: "Quem é o seu público principal?",
      field: "alim_publico",
      type: "textarea",
      required: true,
      placeholder: "Ex: Famílias, executivos, jovens..."
    },
    {
      label: "Qual é a sua principal dificuldade no negócio?",
      field: "alim_dificuldade",
      type: "select",
      options: ["Atrair novos clientes", "Fidelizar clientes", "Controlar custos", "Gestão de estoque", "Marketing", "Concorrência", "Outro"],
      required: true
    }
  ],

  "Saúde e Bem-estar": [
    {
      label: "Qual é a área de atuação?",
      field: "saude_area",
      type: "radio",
      options: ["Clínica médica", "Odontologia", "Psicologia", "Fisioterapia", "Nutrição", "Estética", "Academia/Fitness", "Outro"],
      required: true
    },
    {
      label: "Quantos profissionais trabalham no negócio?",
      field: "saude_profissionais",
      type: "number",
      required: true,
      placeholder: "Número de profissionais"
    },
    {
      label: "Qual é o valor médio de uma consulta/sessão?",
      field: "saude_valor_consulta",
      type: "number",
      required: true,
      placeholder: "Ex: 150.00"
    },
    {
      label: "Quantos pacientes/clientes atendem por dia?",
      field: "saude_volume_pacientes",
      type: "text",
      required: true,
      placeholder: "Ex: 20 por dia"
    },
    {
      label: "Trabalham com convênios médicos?",
      field: "saude_convenios",
      type: "radio",
      options: ["Sim, a maioria dos pacientes", "Sim, alguns convênios", "Não, só particular", "Estamos considerando"],
      required: true
    },
    {
      label: "Como os pacientes agendam consultas?",
      field: "saude_agendamento",
      type: "checkbox",
      options: ["Telefone", "WhatsApp", "Site próprio", "Aplicativo", "Presencialmente", "Redes sociais"],
      required: true
    },
    {
      label: "Qual é o principal desafio do negócio?",
      field: "saude_desafio",
      type: "select",
      options: ["Agendar mais consultas", "Reduzir faltas", "Atrair novos pacientes", "Fidelizar pacientes", "Gestão financeira", "Marketing", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial do seu atendimento?",
      field: "saude_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Tecnologia avançada, atendimento humanizado..."
    }
  ],

  "Educação": [
    {
      label: "Qual é o tipo de instituição?",
      field: "edu_tipo",
      type: "radio",
      options: ["Escola particular", "Curso técnico", "Ensino superior", "Curso de idiomas", "Cursos livres", "EAD", "Outro"],
      required: true
    },
    {
      label: "Quantos alunos vocês atendem?",
      field: "edu_numero_alunos",
      type: "number",
      required: true,
      placeholder: "Número de alunos ativos"
    },
    {
      label: "Qual é a faixa etária principal dos alunos?",
      field: "edu_faixa_etaria",
      type: "radio",
      options: ["Infantil (0-6 anos)", "Fundamental (7-14 anos)", "Médio (15-17 anos)", "Adultos (18+ anos)", "Todas as idades"],
      required: true
    },
    {
      label: "Qual é a mensalidade média?",
      field: "edu_mensalidade",
      type: "number",
      required: true,
      placeholder: "Ex: 450.00"
    },
    {
      label: "Como os alunos conhecem a instituição?",
      field: "edu_aquisicao",
      type: "checkbox",
      options: ["Indicação", "Redes sociais", "Site", "Anúncios online", "Marketing local", "Parcerias", "Outro"],
      required: true
    },
    {
      label: "Qual é a principal metodologia de ensino?",
      field: "edu_metodologia",
      type: "textarea",
      required: true,
      placeholder: "Ex: Montessori, tradicional, híbrida..."
    },
    {
      label: "Qual é o maior desafio da instituição?",
      field: "edu_desafio",
      type: "select",
      options: ["Captar novos alunos", "Reduzir evasão", "Melhorar qualidade", "Competir com preços", "Marketing", "Gestão financeira", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial competitivo?",
      field: "edu_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Professores especializados, infraestrutura moderna..."
    }
  ],

  "Varejo físico": [
    {
      label: "Qual é o tipo de loja?",
      field: "varejo_tipo",
      type: "radio",
      options: ["Roupas e acessórios", "Eletrônicos", "Casa e decoração", "Alimentação", "Farmácia", "Supermercado", "Outro"],
      required: true
    },
    {
      label: "Quantos metros quadrados tem a loja?",
      field: "varejo_tamanho",
      type: "number",
      required: true,
      placeholder: "Metros quadrados"
    },
    {
      label: "Qual é o ticket médio de venda?",
      field: "varejo_ticket_medio",
      type: "number",
      required: true,
      placeholder: "Ex: 75.00"
    },
    {
      label: "Quantos clientes atendem por dia?",
      field: "varejo_clientes_dia",
      type: "number",
      required: true,
      placeholder: "Número de clientes por dia"
    },
    {
      label: "A loja fica em:",
      field: "varejo_localizacao",
      type: "radio",
      options: ["Shopping center", "Rua comercial", "Bairro residencial", "Centro da cidade", "Galeria", "Outro"],
      required: true
    },
    {
      label: "Vocês vendem online também?",
      field: "varejo_online",
      type: "radio",
      options: ["Sim, temos e-commerce", "Sim, via redes sociais", "Não, só físico", "Estamos implementando"],
      required: true
    },
    {
      label: "Como controlam o estoque?",
      field: "varejo_estoque",
      type: "radio",
      options: ["Sistema integrado", "Planilhas", "Anotações manuais", "Sistema simples", "Não controlamos"],
      required: true
    },
    {
      label: "Qual é o principal desafio do varejo?",
      field: "varejo_desafio",
      type: "select",
      options: ["Aumentar vendas", "Controlar estoque", "Atrair clientes", "Competir com online", "Gestão financeira", "Marketing local", "Outro"],
      required: true
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
      label: "Qual é o tipo de serviço B2B?",
      field: "b2b_tipo",
      type: "radio",
      options: ["Consultoria", "Marketing/Publicidade", "Tecnologia", "Contabilidade", "Jurídico", "RH", "Logística", "Outro"],
      required: true
    },
    {
      label: "Qual é o valor médio dos contratos?",
      field: "b2b_valor_contrato",
      type: "number",
      required: true,
      placeholder: "Ex: 5000.00"
    },
    {
      label: "Qual é a duração média dos contratos?",
      field: "b2b_duracao",
      type: "radio",
      options: ["Projeto único", "1-3 meses", "6 meses", "1 ano", "Mais de 1 ano", "Contrato recorrente"],
      required: true
    },
    {
      label: "Quantos clientes atendem simultaneamente?",
      field: "b2b_clientes_ativos",
      type: "number",
      required: true,
      placeholder: "Número de clientes ativos"
    },
    {
      label: "Como captam novos clientes?",
      field: "b2b_captacao",
      type: "checkbox",
      options: ["Indicações", "Networking", "LinkedIn", "Site próprio", "Anúncios online", "Eventos", "Cold email", "Outro"],
      required: true
    },
    {
      label: "Qual é o porte dos clientes?",
      field: "b2b_porte_clientes",
      type: "radio",
      options: ["Micro empresas", "Pequenas empresas", "Médias empresas", "Grandes empresas", "Todos os portes"],
      required: true
    },
    {
      label: "Qual é o maior desafio no B2B?",
      field: "b2b_desafio",
      type: "select",
      options: ["Prospectar clientes", "Fechar vendas", "Manter clientes", "Precificar serviços", "Competir", "Escalar negócio", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial competitivo?",
      field: "b2b_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Especialização, resultados, metodologia..."
    }
  ],

  "Tecnologia / SaaS": [
    {
      label: "Qual é o tipo de produto/serviço?",
      field: "tech_tipo",
      type: "radio",
      options: ["SaaS (Software como Serviço)", "Desenvolvimento personalizado", "Consultoria em TI", "E-commerce/Marketplace", "App mobile", "Outro"],
      required: true
    },
    {
      label: "Qual é o modelo de receita?",
      field: "tech_modelo",
      type: "radio",
      options: ["Assinatura mensal", "Assinatura anual", "Licença única", "Freemium", "Por projeto", "Comissão", "Outro"],
      required: true
    },
    {
      label: "Qual é o valor médio mensal por cliente?",
      field: "tech_valor_cliente",
      type: "number",
      required: true,
      placeholder: "Ex: 299.00"
    },
    {
      label: "Quantos clientes/usuários têm atualmente?",
      field: "tech_usuarios",
      type: "number",
      required: true,
      placeholder: "Número de clientes/usuários ativos"
    },
    {
      label: "Qual é o perfil dos clientes?",
      field: "tech_perfil_clientes",
      type: "radio",
      options: ["Pessoas físicas", "Micro empresas", "Pequenas empresas", "Médias empresas", "Grandes empresas", "Misto"],
      required: true
    },
    {
      label: "Como adquirem novos clientes?",
      field: "tech_aquisicao",
      type: "checkbox",
      options: ["Inbound marketing", "Anúncios online", "Parcerias", "Vendas diretas", "Indicações", "Trial gratuito", "Outro"],
      required: true
    },
    {
      label: "Qual é o maior desafio?",
      field: "tech_desafio",
      type: "select",
      options: ["Adquirir usuários", "Reduzir churn", "Precificação", "Desenvolvimento", "Competição", "Escalabilidade", "Outro"],
      required: true
    },
    {
      label: "Qual é o diferencial técnico/de mercado?",
      field: "tech_diferencial",
      type: "textarea",
      required: true,
      placeholder: "Ex: Tecnologia proprietária, UX superior, integração..."
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