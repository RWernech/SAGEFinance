# SAGE Finance 🦉💰

**SAGE Finance** é um aplicativo moderno de controle de gastos e gestão financeira pessoal, desenvolvido para oferecer sabedoria e controle total sobre suas finanças. O app combina uma interface elegante em Jetpack Compose com o poder da infraestrutura AWS.

## 🚀 Funcionalidades

- **Dashboard Financeiro**: Visão clara de Entradas, Saídas, Investimentos e Saldo total.
- **Gráficos de Análise**:
    - Distribuição de gastos por Categoria.
    - Gastos por Meio de Operação (Pix, Crédito, Débito).
    - **Comparativo de Período**: Visualização em barras comparando o desempenho com o mês ou ano anterior, incluindo variação percentual.
- **Gestão de Operações**: CRUD completo (Criar, Listar, Editar e Excluir) de transações.
- **Filtros Avançados**: Navegação por mês/ano e visão de "Ano Todo".
- **Segurança Avançada**:
    - Autenticação Biométrica (Digital/FaceID).
    - Hashing de senhas (PBKDF2) no lado do servidor.
    - Comunicação protegida via API Key.
- **Sessão Persistente**: Login automático via DataStore.
- **Tema Dinâmico**: Suporte total ao Modo Escuro (Dark Mode).

## 🛠️ Stack Tecnológica

### Android (Frontend)
- **Linguagem**: Kotlin
- **Interface**: Jetpack Compose (Material 3)
- **Navegação**: Navigation Compose com Horizontal Pager para análise.
- **Rede**: Retrofit + OkHttp
- **Persistência Local**: DataStore Preferences
- **Segurança**: Biometric KTX

### AWS (Backend)
- **AWS Lambda**: Funções em Python 3.x processando a lógica de negócio.
- **DynamoDB**: Banco de dados NoSQL altamente escalável.
- **Function URL**: Endpoint direto para comunicação segura.
- **GSI (Global Secondary Index)**: Buscas otimizadas por usuário.

## ⚙️ CI/CD

O projeto conta com automação via **GitHub Actions**. Toda vez que um código é enviado para o repositório, um processo de build é iniciado automaticamente para gerar o APK de teste, disponível na aba "Actions" do GitHub.

## 📖 Como configurar a AWS (Resumo)

1. **DynamoDB**:
    - Tabela `Users` (PK: `email`).
    - Tabela `Transactions` (PK: `id`) com um GSI chamado `userEmail-index` (PK: `userEmail`).
2. **Lambda**:
    - Configurar a variável de ambiente `MY_API_KEY`.
    - Habilitar Function URL com Auth `NONE` e configurar o CORS para permitir o App.

---
Desenvolvido com foco em performance e segurança. 🚀
