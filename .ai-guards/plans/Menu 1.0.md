### 📱 EM TELAS PEQUENAS (Mobile/Tablet até 768px)

#### ✅ Sugestão de layout empilhado (stacked):

```plaintext
[ TÍTULO: Planejamentos ]
[ SUBTÍTULO: Gerencie todos... ]

[ + Novo Planejamento ]   ← botão centrado ou colado no topo direito com margem
────────────────────────────
[ 🔍 Pesquisar...        ]
[ Status ▼ ] [ Clientes ▼ ]
[ Nenhum filtro ativo    ]
```

#### 🔎 Por que isso funciona?

* Em mobile, **tudo empilhado** facilita o toque.
* A busca fica **bem visível**, e o botão pode ficar **acima ou abaixo**, mas sempre com espaçamento consistente.
* O botão "+ Novo Planejamento" **pode ser fixado na base da tela** em mobile, como um FAB (Floating Action Button), se quiser um toque mais moderno.

---

### 💻 EM TELAS MÉDIAS E GRANDES (≥ 1024px)

#### ✅ Sugestão otimizada em **layout de 2 colunas horizontais**:

```plaintext
┌──────────────────────────────────────────────┬─────────────────────────────┐
│ Planejamentos                                │  + Novo Planejamento        │
│ Gerencie todos os seus planejamentos...      │                             │
├──────────────────────────────────────────────┴─────────────────────────────┤
│ 🔍 Pesquisar...   [Status ▼]  [Clientes ▼]  ⟳ Resetar                       │
│ 4 planejamentos encontrados | Nenhum filtro ativo                          │
```

#### 🔎 Justificativas:

* Colocar **título + botão** em linha evita desperdício vertical.
* Abaixo deles, vem a **barra de busca e filtros horizontalmente**, reforçando a lógica de “filtrar antes de listar”.
* **Evita que o botão fique "isolado demais"** visualmente.
* Se o botão "+ Novo Planejamento" for muito isolado à direita, sem alinhamento claro com a barra ou o conteúdo abaixo, ele perde o impacto.

---

### 🔄 Alternativas de Agrupamento

Se quiser deixar os elementos ainda mais coesos:

1. **Agrupar filtros e busca com fundo sutil** (por ex. um container com `#171818`, padding e borda sutil):

   ```plaintext
   ┌───────────────────────────────┐
   │ 🔍 Pesquisar...               │
   │ [Status ▼] [Clientes ▼] ⟳     │
   └───────────────────────────────┘
   ```

   Isso ajuda a delimitar a função daquela área.

2. **Colocar o botão "+ Novo Planejamento" logo abaixo do título em mobile**, mas **alinhado com os filtros em desktop**:

   * Ou até integrá-lo como um botão dentro do container de filtros, com `float:right` ou `grid-column: 2/-1`.