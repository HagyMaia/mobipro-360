$wikiPath = "F:\mobipro-360\docs\wiki"

if (-not (Test-Path $wikiPath)) {
    Write-Host ""
    Write-Host "ERRO: A pasta da Wiki nao foi encontrada." -ForegroundColor Red
    Write-Host "Caminho esperado: $wikiPath" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Preencher-Se-Vazio {
    param(
        [string]$Caminho,
        [string[]]$Linhas
    )

    if (-not (Test-Path $Caminho)) {
        New-Item -ItemType File -Path $Caminho -Force | Out-Null
    }

    $conteudoAtual = [System.IO.File]::ReadAllText($Caminho)

    if ([string]::IsNullOrWhiteSpace($conteudoAtual)) {
        $novoConteudo = $Linhas -join [Environment]::NewLine

        [System.IO.File]::WriteAllText(
            $Caminho,
            $novoConteudo + [Environment]::NewLine,
            $utf8NoBom
        )

        Write-Host "Preenchido: $Caminho" -ForegroundColor Green
    }
    else {
        Write-Host "Mantido: $Caminho" -ForegroundColor Yellow
    }
}

function Obter-Titulo {
    param(
        [string]$NomeArquivo
    )

    $titulo = [System.IO.Path]::GetFileNameWithoutExtension($NomeArquivo)
    $titulo = $titulo -replace "_", " "
    $titulo = $titulo -replace "-", " "

    return $titulo
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Preenchendo a Wiki do Mobipro 360" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# README PRINCIPAL DA WIKI
# ============================================================

$readmePath = Join-Path $wikiPath "README.md"

$readmeLinhas = @(
    "# Wiki - Mobipro 360",
    "",
    "> Documentacao tecnica, funcional, operacional e estrategica do projeto Mobipro 360.",
    "",
    "## Sobre o projeto",
    "",
    "O Mobipro 360 e uma plataforma de mobilidade urbana composta por:",
    "",
    "- Aplicativo do Passageiro;",
    "- Aplicativo do Motorista;",
    "- Painel Administrativo;",
    "- Backend de corridas, geolocalizacao, pagamentos e despacho;",
    "- Integracoes com mapas, notificacoes, PIX e documentos.",
    "",
    "---",
    "",
    "## Objetivo da Wiki",
    "",
    "Centralizar as decisoes importantes do projeto:",
    "",
    "- Visao do produto;",
    "- Arquitetura;",
    "- Regras de negocio;",
    "- Funcionalidades;",
    "- Modelagem de dados;",
    "- Pagamentos;",
    "- Seguranca e LGPD;",
    "- Operacao;",
    "- Padroes de desenvolvimento;",
    "- Testes, deploy e monitoramento.",
    "",
    "---",
    "",
    "## Links principais",
    "",
    "- [Visao Geral](./projeto/VISAO_GERAL.md)",
    "- [Objetivos](./projeto/OBJETIVOS.md)",
    "- [Roadmap](./projeto/ROADMAP.md)",
    "- [Arquitetura](./arquitetura/ARQUITETURA.md)",
    "- [Diretorios](./arquitetura/DIRETORIOS.md)",
    "- [Dominio](./dominio/DOMINIO.md)",
    "- [Corridas](./dominio/CORRIDAS.md)",
    "- [App do Passageiro](./funcionalidades/APP_PASSAGEIRO.md)",
    "- [App do Motorista](./funcionalidades/APP_MOTORISTA.md)",
    "- [Painel Administrativo](./funcionalidades/PAINEL_ADMINISTRATIVO.md)",
    "- [Modelo de Dados](./modelagem-dados/MODELO_DADOS.md)",
    "- [Pagamentos](./financeiro/PAGAMENTOS.md)",
    "- [Seguranca](./seguranca-lgpd/SEGURANCA.md)",
    "- [LGPD](./seguranca-lgpd/LGPD.md)",
    "- [Operacao](./operacao/OPERACAO.md)",
    "- [Padroes de Codigo](./padroes/PADROES_DE_CODIGO.md)",
    "- [DevOps](./devops/DEVOPS.md)"
)

Preencher-Se-Vazio -Caminho $readmePath -Linhas $readmeLinhas

# ============================================================
# STACK
# ============================================================

$stackPath = Join-Path $wikiPath "STACK.md"

$stackLinhas = @(
    "# Stack Tecnologica",
    "",
    "## Objetivo",
    "",
    "Registrar as tecnologias utilizadas no Mobipro 360.",
    "",
    "---",
    "",
    "## Camadas da plataforma",
    "",
    "| Camada | Tecnologia | Finalidade |",
    "|---|---|---|",
    "| App Passageiro | A definir | Solicitar e acompanhar corridas |",
    "| App Motorista | A definir | Receber chamadas, GPS e ganhos |",
    "| Painel Administrativo | A definir | Operacao, suporte e financeiro |",
    "| Backend | A definir | Regras de negocio e integracoes |",
    "| Banco principal | PostgreSQL | Dados transacionais |",
    "| Geolocalizacao | PostGIS | Consultas geograficas |",
    "| Cache | Redis | Dados temporarios e presenca |",
    "| Tempo real | WebSocket | Atualizacao de localizacao e status |"
)

Preencher-Se-Vazio -Caminho $stackPath -Linhas $stackLinhas

# ============================================================
# VISAO GERAL
# ============================================================

$visaoGeralPath = Join-Path $wikiPath "projeto\VISAO_GERAL.md"

$visaoGeralLinhas = @(
    "# Visao Geral",
    "",
    "## O que e o Mobipro 360?",
    "",
    "O Mobipro 360 e uma plataforma de mobilidade urbana para conectar passageiros e motoristas de taxi ou transporte local.",
    "",
    "A plataforma deve permitir solicitacao, aceite, acompanhamento, inicio, finalizacao e pagamento de corridas, com atualizacao de localizacao em tempo real.",
    "",
    "---",
    "",
    "## Produtos da plataforma",
    "",
    "| Produto | Publico | Objetivo |",
    "|---|---|---|",
    "| Aplicativo do Passageiro | Clientes | Solicitar, acompanhar e pagar corridas |",
    "| Aplicativo do Motorista | Motoristas parceiros | Receber corridas, navegar e acompanhar ganhos |",
    "| Painel Administrativo | Equipe Mobipro | Gerenciar operacao, suporte e financeiro |",
    "",
    "---",
    "",
    "## Principios",
    "",
    "- Seguranca em primeiro lugar;",
    "- Transparencia de valores;",
    "- Interface simples;",
    "- Boa experiencia para motoristas;",
    "- Operacao confiavel;",
    "- Protecao de dados;",
    "- Conformidade com LGPD."
)

Preencher-Se-Vazio -Caminho $visaoGeralPath -Linhas $visaoGeralLinhas

# ============================================================
# CORRIDAS
# ============================================================

$corridasPath = Join-Path $wikiPath "dominio\CORRIDAS.md"

$corridasLinhas = @(
    "# Corridas",
    "",
    "## Definicao",
    "",
    "Uma corrida representa uma viagem solicitada por um passageiro e atendida por um motorista aprovado.",
    "",
    "---",
    "",
    "## Fluxo principal",
    "",
    "Passageiro solicita corrida",
    "-> Sistema busca motoristas",
    "-> Motorista aceita",
    "-> Motorista vai ao embarque",
    "-> Motorista chega",
    "-> Corrida e iniciada",
    "-> Corrida e finalizada",
    "-> Pagamento e confirmado",
    "-> Passageiro e motorista avaliam a experiencia",
    "",
    "---",
    "",
    "## Status da corrida",
    "",
    "REQUESTED",
    "SEARCHING_DRIVER",
    "DRIVER_ASSIGNED",
    "DRIVER_ARRIVING",
    "DRIVER_ARRIVED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED_BY_PASSENGER",
    "CANCELLED_BY_DRIVER",
    "CANCELLED_BY_SYSTEM",
    "PAYMENT_PENDING",
    "PAYMENT_FAILED",
    "",
    "---",
    "",
    "## Regras importantes",
    "",
    "1. Um motorista nao pode aceitar duas corridas simultaneamente.",
    "2. Toda corrida deve possuir historico de eventos.",
    "3. Cancelamentos devem possuir motivo.",
    "4. Alteracoes administrativas devem possuir auditoria.",
    "5. Pagamentos devem ser registrados separadamente.",
    "6. Corridas concluidas nao devem ser apagadas."
)

Preencher-Se-Vazio -Caminho $corridasPath -Linhas $corridasLinhas

# ============================================================
# APP MOTORISTA
# ============================================================

$appMotoristaPath = Join-Path $wikiPath "funcionalidades\APP_MOTORISTA.md"

$appMotoristaLinhas = @(
    "# Aplicativo do Motorista",
    "",
    "## Objetivo",
    "",
    "Permitir que motoristas parceiros fiquem disponiveis, recebam corridas, naveguem ate passageiros, acompanhem ganhos e acessem suporte.",
    "",
    "---",
    "",
    "## Tela inicial",
    "",
    "- Status online ou offline;",
    "- Mapa com localizacao atual;",
    "- Ganhos do dia;",
    "- Corridas realizadas;",
    "- Tempo online;",
    "- Atalho para ganhos;",
    "- Atalho para historico;",
    "- Notificacoes;",
    "- Suporte;",
    "- Botao SOS.",
    "",
    "---",
    "",
    "## Informacoes antes do aceite",
    "",
    "- Distancia ate o passageiro;",
    "- Tempo estimado de chegada;",
    "- Regiao de embarque;",
    "- Destino aproximado, quando permitido;",
    "- Ganho estimado;",
    "- Forma de pagamento;",
    "- Categoria da corrida;",
    "- Temporizador de aceite."
)

Preencher-Se-Vazio -Caminho $appMotoristaPath -Linhas $appMotoristaLinhas

# ============================================================
# APP PASSAGEIRO
# ============================================================

$appPassageiroPath = Join-Path $wikiPath "funcionalidades\APP_PASSAGEIRO.md"

$appPassageiroLinhas = @(
    "# Aplicativo do Passageiro",
    "",
    "## Objetivo",
    "",
    "Permitir que passageiros solicitem, acompanhem, paguem e avaliem corridas.",
    "",
    "---",
    "",
    "## Funcionalidades principais",
    "",
    "- Cadastro e login;",
    "- Localizacao atual;",
    "- Busca de destino;",
    "- Enderecos favoritos;",
    "- Estimativa de preco;",
    "- Escolha de categoria;",
    "- Escolha de pagamento;",
    "- Solicitacao de corrida;",
    "- Acompanhamento do motorista;",
    "- Historico;",
    "- Avaliacao;",
    "- Suporte;",
    "- Recursos de seguranca."
)

Preencher-Se-Vazio -Caminho $appPassageiroPath -Linhas $appPassageiroLinhas

# ============================================================
# PAGAMENTOS
# ============================================================

$pagamentosPath = Join-Path $wikiPath "financeiro\PAGAMENTOS.md"

$pagamentosLinhas = @(
    "# Pagamentos",
    "",
    "## Objetivo",
    "",
    "Garantir transparencia e rastreabilidade dos valores pagos por passageiros e recebidos por motoristas.",
    "",
    "---",
    "",
    "## Formas de pagamento",
    "",
    "- Dinheiro;",
    "- PIX;",
    "- Cartao de credito;",
    "- Cartao de debito;",
    "- Carteira digital;",
    "- Voucher corporativo;",
    "- Creditos promocionais.",
    "",
    "---",
    "",
    "## Formula inicial de tarifa",
    "",
    "Valor final =",
    "Tarifa base",
    "+ valor por quilometro",
    "+ valor por minuto",
    "+ taxas aplicaveis",
    "+ adicional de demanda, quando existir",
    "- descontos e promocoes",
    "",
    "---",
    "",
    "## Regras",
    "",
    "- Todo pagamento deve possuir transacao registrada;",
    "- PIX e cartao devem ser confirmados por integracao;",
    "- Estornos devem possuir auditoria;",
    "- Ajustes financeiros devem possuir motivo;",
    "- A carteira do motorista deve registrar todas as movimentacoes."
)

Preencher-Se-Vazio -Caminho $pagamentosPath -Linhas $pagamentosLinhas

# ============================================================
# SEGURANCA
# ============================================================

$segurancaPath = Join-Path $wikiPath "seguranca-lgpd\SEGURANCA.md"

$segurancaLinhas = @(
    "# Seguranca",
    "",
    "## Principios",
    "",
    "O Mobipro 360 trata dados pessoais, geolocalizacao, documentos, corridas e pagamentos. Seguranca e requisito fundamental do produto.",
    "",
    "---",
    "",
    "## Requisitos minimos",
    "",
    "- HTTPS obrigatorio;",
    "- Login seguro com OTP;",
    "- Tokens com expiracao;",
    "- Controle de permissoes;",
    "- Rate limit;",
    "- Validacao de dados de entrada;",
    "- Logs sem dados sensiveis;",
    "- Auditoria administrativa;",
    "- Protecao de documentos;",
    "- Backup;",
    "- Monitoramento;",
    "- Botao SOS;",
    "- Compartilhamento de corrida."
)

Preencher-Se-Vazio -Caminho $segurancaPath -Linhas $segurancaLinhas

# ============================================================
# DEMAIS ARQUIVOS MARKDOWN VAZIOS
# ============================================================

$arquivosMarkdown = Get-ChildItem -Path $wikiPath -Recurse -File -Filter "*.md"

foreach ($arquivo in $arquivosMarkdown) {
    $conteudoAtual = [System.IO.File]::ReadAllText($arquivo.FullName)

    if (-not [string]::IsNullOrWhiteSpace($conteudoAtual)) {
        continue
    }

    $titulo = Obter-Titulo -NomeArquivo $arquivo.Name

    $linhasPadrao = @(
        "# $titulo",
        "",
        "> Documento da Wiki do projeto Mobipro 360.",
        "",
        "## Objetivo",
        "",
        "Descrever as regras, decisoes, responsabilidades e informacoes relacionadas a este assunto.",
        "",
        "---",
        "",
        "## Escopo",
        "",
        "Definir o que este documento cobre e quais partes do sistema sao impactadas.",
        "",
        "---",
        "",
        "## Regras e Decisoes",
        "",
        "- Registrar regras de negocio;",
        "- Registrar decisoes tecnicas;",
        "- Documentar dependencias;",
        "- Documentar restricoes;",
        "- Adicionar exemplos quando necessario.",
        "",
        "---",
        "",
        "## Pendencias",
        "",
        "- [ ] Revisar conforme a implementacao real;",
        "- [ ] Adicionar regras especificas;",
        "- [ ] Adicionar exemplos;",
        "- [ ] Adicionar referencias para documentos relacionados."
    )

    Preencher-Se-Vazio -Caminho $arquivo.FullName -Linhas $linhasPadrao
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "Wiki preenchida com sucesso!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""