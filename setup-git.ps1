# Configura o Git local para o repositório Academic_Atelier.
# Execute no PowerShell, na pasta do projeto: .\setup-git.ps1
#
# Requisito: Git for Windows — https://git-scm.com/download/win
# Depois de instalar, feche e abra o Cursor para o PATH atualizar.

$ErrorActionPreference = "Stop"
$repoUrl = "https://github.com/MatheusCab4al/Academic_Atelier.git"
$branchDev = "develop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git nao encontrado. Instale em: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Set-Location $PSScriptRoot

if (Test-Path .git) {
    Write-Host "Repositorio Git ja existe nesta pasta." -ForegroundColor Yellow
} else {
    git init -b $branchDev
    Write-Host "Repositorio criado com branch padrao: $branchDev" -ForegroundColor Green
}

$remotes = git remote 2>$null
if ($remotes -match "origin") {
    git remote set-url origin $repoUrl
    Write-Host "Remote 'origin' atualizado." -ForegroundColor Yellow
} else {
    git remote add origin $repoUrl
    Write-Host "Remote 'origin' adicionado." -ForegroundColor Green
}

Write-Host ""
Write-Host "Proximos passos (quando tiver permissao no GitHub):" -ForegroundColor Cyan
Write-Host "  1. git add ."
Write-Host "  2. git commit -m `"Sua mensagem de commit`""
Write-Host "  3. git push -u origin $branchDev"
Write-Host ""
Write-Host "Trabalhe sempre na branch '$branchDev' para nao atualizar o site em producao (main)." -ForegroundColor Cyan
Write-Host "So faca merge em 'main' quando quiser publicar no Vercel." -ForegroundColor Cyan
