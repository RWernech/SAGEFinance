# SAGE Finance 🦉💰

**SAGE Finance** é um ecossistema financeiro multiplataforma para controle de gastos e gestão pessoal. O projeto conta com um aplicativo Android nativo e uma interface Web independente, ambos consumindo uma infraestrutura serverless na AWS.

## 🚀 Funcionalidades

- **Dashboard Financeiro**: Visão clara de Entradas, Saídas e Saldo total.
- **Gráficos de Análise**: Visualização dinâmica de fluxos e distribuições.
- **Gestão de Operações**: CRUD completo de transações sincronizado em tempo real.
- **Segurança Avançada**: 
    - Android: Autenticação Biométrica e DataStore.
    - Web: Login seguro e interface responsiva.
    - Backend: Hashing de senhas e proteção via API Key.
- **Multiplataforma**: Acesse seus dados pelo celular ou pelo navegador.

## 🛠️ Stack Tecnológica

### Android (Frontend)
- **Linguagem**: Kotlin
- **Interface**: Jetpack Compose (Material 3)
- **Rede**: Retrofit + OkHttp
- **Segurança**: Biometric KTX

### Web (Frontend) - NEW 🌐
- **Framework**: React.js + Vite
- **Estilização**: TailwindCSS
- **Gráficos**: Recharts
- **Deployment**: GitHub Pages (Independente do App Android)

### AWS (Backend) - Cérebro Único 🧠
- **AWS Lambda**: Lógica de negócio em Python.
- **DynamoDB**: Banco de dados NoSQL escalável.
- **Function URL**: Endpoint seguro com suporte a CORS para Web e Android.

## ⚙️ CI/CD

O projeto utiliza **GitHub Actions** para gerar APKs de teste e **GitHub Pages** para hospedar a versão web automaticamente.

---
Desenvolvido com foco em performance, segurança e onipresença. 🚀
