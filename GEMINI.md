# GEMINI.md — Ficha Interativa de RPG

> Documento de definições do projeto. Referência obrigatória antes de qualquer implementação.

---

## 📌 Sobre o Projeto

Ficha de personagem interativa e online para o sistema de RPG narrativo customizado baseado em 2d10, sem atributos numéricos, com foco em Traços narrativos, Proficiências e um subsistema divino de Peso/Saturação/Integração.

---

## 🛠️ Stack Técnico

| Decisão          | Escolha                                   |
| ---------------- | ----------------------------------------- |
| **Framework**    | Vite + React                              |
| **Estilização**  | Tailwind CSS v3                           |
| **Persistência** | localStorage + export/import JSON         |
| **Idioma da UI** | Português Brasileiro (PT-BR)              |
| **Hospedagem**   | Nenhuma definida por enquanto (dev local) |

---

## 🎯 Escopo e Funcionalidades

### Modo de Uso

- **Individual** — não há sincronização entre jogadores/mestre.
- Cada jogador gerencia sua própria ficha localmente.

### Tipos de Ficha

1. **Ficha Completa** — Para personagens jogáveis e NPCs importantes. Inclui todas as seções: Identidade, Vitalidade, Capacidades, Painel Divino (condicional), Inventário e História.
2. **Ficha Simplificada** — Para NPCs genéricos (Guarda, Infante, etc.). Template reduzido com campos essenciais.

### Rolador de Dados

- **Embutido na ficha** — Rolagem de 2d10 (normal), 3d10 mantendo 2 maiores (Vantagem) e 3d10 mantendo 2 menores (Desvantagem).
- **Sem animação** a princípio — exibe apenas os resultados numéricos e a faixa de sucesso (Falha / Sucesso com Custo / Sucesso Pleno).

### Persistência

- **Auto-save** no `localStorage` a cada alteração.
- **Exportar** ficha como arquivo `.json` para backup/compartilhamento.
- **Importar** ficha a partir de arquivo `.json`.

---

## 🎨 Design

### Tema

- Dark mode como padrão (temática sombria do setting).
- Paleta baseada em tons escuros com acentos dourados e roxos.

### Paleta de Cores (referência)

| Elemento             | Cor       | Uso                              |
| -------------------- | --------- | -------------------------------- |
| Background principal | `#0a0a0f` | Fundo geral                      |
| Background cards     | `#12121a` | Painéis e cards                  |
| Acento primário      | `#c9a84c` | Títulos, bordas ativas (dourado) |
| Acento divino        | `#6b3fa0` | Elementos místicos (roxo)        |
| Texto principal      | `#e8e0d0` | Corpo (tom de pergaminho)        |
| Estresse livre       | `#3a3a4a` | Bolinha vazia                    |
| Estresse gasto       | `#c9a84c` | Bolinha preenchida               |
| Estresse corrompido  | `#8b1a1a` | Bolinha corrompida               |
| Lesão Leve           | `#d4a843` | Amarelo dourado                  |
| Lesão Grave          | `#c44f2e` | Vermelho-alaranjado              |
| Lesão Crítica        | `#8b1a1a` | Vermelho sangue                  |

### Tipografia

- **Títulos:** Cinzel (Google Fonts)
- **Corpo:** Inter (Google Fonts)

---

## 📐 Seções da Ficha (UI)

### Ficha Completa

1. **Identidade** — Nome, Idade, Alinhamento, Ranque de Poder, Caminho Divino
2. **Vitalidade** — Barra de Estresse (3 estados), Lesões (Física/Mental/Espiritual)
3. **Capacidades** — Proficiências, Traços (cards expansíveis por tipo)
4. **Painel Divino** _(condicional: só se Ranque ≥ Desperto)_ — Peso Divino, Saturação, Integração, Persona, Âncoras
5. **Inventário** — Equipamentos, Itens Notáveis
6. **História** — Backstory, Frases de Experiência, Objetivos, Notas

### Ficha Simplificada

- Versão condensada com: Nome, Ranque, Estresse, Lesões, Proficiências, Traços (resumidos), Equipamentos.

---

## 🔧 Mecânicas Auto-Calculadas

O sistema deve derivar automaticamente os seguintes valores a partir do **Ranque de Poder**:

| Ranque        | Estresse Máx. | Lesões Leves | Lesões Graves | Lesões Críticas |
| ------------- | ------------- | ------------ | ------------- | --------------- |
| Humano        | 6             | 6            | 3             | 1               |
| Desperto      | 8             | 7            | 4             | 1               |
| Ascendido     | 12            | 8            | 5             | 2               |
| Transcendente | 18            | 10           | 6             | 3               |

---

## 📦 Estrutura de Pastas (prevista)

```
RPG/Ficha Interativa/
├── GEMINI.md              ← Este arquivo
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
├── public/
│   └── fonts/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── StressBar.jsx
│   │   ├── InjuryTracker.jsx
│   │   ├── ProficiencyList.jsx
│   │   ├── TraitCard.jsx
│   │   ├── DivinePanel.jsx
│   │   ├── AnchorCard.jsx
│   │   ├── InventoryList.jsx
│   │   ├── DiceRoller.jsx
│   │   └── SimplifiedSheet.jsx
│   ├── hooks/
│   │   ├── useLocalStorage.js
│   │   └── useCharacter.js
│   ├── utils/
│   │   ├── rankData.js
│   │   ├── diceRoller.js
│   │   └── exportImport.js
│   └── data/
│       └── defaultCharacter.js
└── README.md
```

---
