# Paleta de Cores e Tokens — SR Logística (MobiPro 360)

> Guia de paleta cromática, tokens Tailwind e regras de contraste visual.

---

## 1. Paleta Principal da Marca (`brand`)

O amarelo SR Logística representa energia, mobilidade urbana e destaque.

| Token | Hex | Aplicação Recomendada |
|---|---|---|
| `brand-50` | `#FFFDF0` | Fundos sutis claros |
| `brand-100` | `#FFF9C2` | Badges e pílulas de destaque claro |
| `brand-200` | `#FFF085` | Hover em elementos claros |
| `brand-300` | `#FFE247` | Acentos secundários |
| `brand-400` | `#FFD214` | Cor de destaque em modo claro |
| `brand-500` (`brand`) | `#FFC800` | Cor oficial principal (Botões, ícones, destaques) |
| `brand-600` | `#E0A300` | Destaque de texto em modo claro |
| `brand-700` | `#B37800` | Textos e ícones sobre superfícies muito claras |
| `brand-800` | `#8C5900` | Bordas e sombras quentes |
| `brand-900` | `#663E00` | Sombras de profundidade |
| `brand-950` | `#3B2000` | Contrastes extremos |

---

## 2. Paleta de Superfície e Escuros (`dark` & `slate`)

| Token | Hex | Aplicação no Modo Escuro |
|---|---|---|
| `dark-950` | `#020617` | Fundo principal (`--bg`) |
| `dark-900` | `#0f172a` | Fundo de Cards e Cabeçalhos (`--surface`) |
| `dark-800` | `#1e293b` | Elementos internos, inputs e subcards |
| `dark-700` | `#334155` | Bordas e divisores (`--border`) |
| `dark-600` | `#475569` | Bordas de foco |
| `dark-500` | `#64748b` | Textos secundários e ícones inativos |

---

## 3. Cores de Estado e Feedback Semântico

| Estado | Token | Hex | Significado Operacional |
|---|---|---|---|
| **Sucesso / Disponível** | `emerald-500` / `emerald-600` | `#10B981` / `#059669` | Corrida aceita, motorista disponível, saldo positivo |
| **Alerta / Pausa** | `amber-500` / `amber-400` | `#F59E0B` / `#FBBF24` | Motorista em pausa, verificação pendente, nota de passageiro |
| **Perigo / SOS** | `red-500` / `red-600` | `#EF4444` / `#DC2626` | Botão SOS de pânico, recusar corrida, cancelar viagem |
| **Informação / Rota** | `blue-500` / `cyan-500` | `#3B82F6` / `#06B6D4` | GPS Waze / Google Maps, rotas e navegação |
| **Suporte / Ajuda** | `violet-500` / `violet-600` | `#8B5CF6` / `#7C3AED` | Central de Ajuda, Ouvidoria e SAC |

---

## 4. Tabela de Conformidade de Contraste (WCAG 2.1)

| Combinação de Cores | Relação de Contraste | Avaliação | Regra de Uso |
|---|---|---|---|
| `#020617` em fundo `#FFC800` | **13.5:1** | **AAA Pass** | **Padrão Obrigatório** em botões amarelos |
| `#FFFFFF` em fundo `#FFC800` | **1.5:1** | **Fail Crítico** | **PROIBIDO** (Texto invisível) |
| `#FFFFFF` em fundo `#059669` (Emerald) | **4.8:1** | **AA Pass** | Aprovado para botões de confirmação |
| `#FFFFFF` em fundo `#DC2626` (Red) | **4.9:1** | **AA Pass** | Aprovado para botões de perigo e SOS |
| `#F8FAFC` em fundo `#020617` (Dark Mode) | **18.2:1** | **AAA Pass** | Aprovado para tipografia base noturna |
| `#0F172A` em fundo `#F8FAFC` (Light Mode) | **17.8:1** | **AAA Pass** | Aprovado para tipografia base diurna |
