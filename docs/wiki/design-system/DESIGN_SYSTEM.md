# Design System — SR Logística (MobiPro 360)

> Documentação oficial do Design System, arquitetura visual e padrões de interface.

---

## 1. Visão Geral e Princípios

O **Design System do SR Logística** foi projetado para oferecer alta legibilidade, contraste acessível (WCAG AA/AAA) e consistência operacional tanto para motoristas em trânsito quanto para operadores de retaguarda.

### Princípios Norteadores:
1. **Contraste e Legibilidade Instantânea**: Textos nítidos sob luz solar direta (Modo Claro) e conforto visual noturno (Modo Escuro).
2. **Identidade Visual Icônica**: Uso estratégico do Amarelo SR Logística (`#FFC800` / `bg-brand`) como elemento focal e indicativo de ação.
3. **Ergonomia Operacional Mobile-First**: Áreas de toque generosas (mínimo de 44px), botões de ação fixos no rodapé e bottom sheets deslizantes.
4. **Semântica Adaptativa**: Utilização de tokens CSS padronizados (`--bg`, `--surface`, `--text`, `--brand`, `--border`) para alternância instantânea entre temas.

---

## 2. Arquitetura de Temas (Dark & Light Mode)

O tema do aplicativo é controlado por meio da classe `.dark` aplicada no elemento raiz `<html>` e persistido no `localStorage` sob a chave `sr-theme`.

### Variáveis CSS Nativas (`src/app/globals.css`):

```css
:root {
  --bg: #f8fafc;           /* Slate 50 */
  --surface: #ffffff;      /* White Card */
  --surface-card: #ffffff;
  --surface-muted: #f1f5f9;/* Slate 100 */
  --border: #e2e8f0;       /* Slate 200 */
  --text: #0f172a;         /* Slate 900 */
  --text-muted: #64748b;   /* Slate 500 */
  --brand: #eab308;        /* Brand Yellow 500 */
  --brand-strong: #ca8a04; /* Brand Yellow 600 */
  --brand-fg: #0f172a;     /* Dark Slate Text on Brand */
}

.dark {
  --bg: #020617;           /* Slate 950 */
  --surface: #0f172a;      /* Slate 900 */
  --surface-card: #1e293b; /* Slate 800 */
  --surface-muted: #1e293b;
  --border: #334155;       /* Slate 700 */
  --text: #f8fafc;         /* Slate 50 */
  --text-muted: #94a3b8;   /* Slate 400 */
  --brand: #ffc800;        /* Brand Yellow Vibrant */
  --brand-strong: #ffd633;
  --brand-fg: #020617;     /* High Contrast Black */
}
```

---

## 3. Regras Críticas de Contraste e Acessibilidade

> [!IMPORTANT]
> **Regra do Amarelo da Marca (`bg-brand` / `#FFC800`):**
> Nunca utilize texto branco (`text-white`) sobre fundos amarelos! Fundos amarelos exigem obrigatoriamente texto escuro de alto contraste (`text-slate-950` ou `text-dark-950`).

### Exemplos Corretos de Botões e Badges:
- **Botão Primário de Ação:** `bg-brand text-slate-950 font-black hover:bg-brand-400 active:scale-95`
- **Botão de Sucesso / Aceite:** `bg-emerald-600 text-white hover:bg-emerald-700`
- **Botão de Perigo / Recusa:** `bg-red-600 text-white hover:bg-red-700`
- **Cards Padrão:** `bg-white dark:bg-dark-900 border border-slate-200/80 dark:border-dark-700/80`
- **Cabeçalhos Fixos:** `sticky top-0 z-30 border-b border-slate-200/80 dark:border-dark-700/80 bg-white/95 dark:bg-dark-950/90 backdrop-blur-xl`

---

## 4. Componentes Canônicos (`src/components/ui.tsx`)

| Componente | Função | Variantes |
|---|---|---|
| `Card` | Contêiner de conteúdo adaptativo com bordas e sombras | `default`, `compact`, `interactive` |
| `Button` | Botões de ação com feedback tátil | `primary` (brand), `success` (emerald), `danger` (red), `outline` |
| `Badge` | Etiquetas de status e informações compactas | `brand`, `success`, `danger`, `warning`, `neutral` |
| `BottomNav` | Barra de navegação inferior fixa com ícones ativos destacados | Adaptativo com blur em vidro |
| `ThemeToggle` | Alternador de modo escuro/claro | Ícones Sun/Moon com persistência |
