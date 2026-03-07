# SAGE Finance 🦉💰

**SAGE Finance** é um ecossistema financeiro multiplataforma projetado para oferecer controle total sobre finanças pessoais com foco em segurança, portabilidade e performance. O ecossistema integra um aplicativo **Android Nativo**, uma interface **Web SPA** e um backend **Serverless** na nuvem AWS.

---

## 🏗️ Arquitetura do Sistema

O projeto foi construído seguindo uma arquitetura moderna de microserviços e frontend independente:

*   **Cérebro Único (Backend):** Uma infraestrutura robusta na AWS utilizando Lambdas (Python) e DynamoDB, expondo uma API segura via Function URL.
*   **Android (Nativo):** App construído com Jetpack Compose, priorizando a experiência do usuário e sincronização offline (Single Source of Truth).
*   **Web (SPA):** Dashboard responsivo em React.js para gestão desktop, sincronizado em tempo real com a nuvem.

---

## 🚀 Funcionalidades Principais

-   **Dashboard Inteligente:** Visão consolidada de Entradas, Saídas, Investimentos e Saldo Real.
-   **Análise Visual:** Gráficos dinâmicos de gastos por categoria e por método de pagamento (Operação).
-   **Gestão de Operações:** CRUD completo de transações com suporte a múltiplas categorias e métodos de pagamento.
-   **Sincronização Cloud:** Dados persistidos na AWS com suporte a modo offline no Android através de WorkManager e Room.
-   **Comparativo de Performance:** Indicadores percentuais comparando o período atual com o anterior (Mês vs Mês).

---

## 🛡️ Segurança de Nível Profissional

A segurança foi a prioridade máxima no desenvolvimento deste ecossistema:

*   **Autenticação JWT (JSON Web Token):** Todas as comunicações entre os frontends e o backend são assinadas digitalmente, garantindo que o usuário só acesse seus próprios dados.
*   **Criptografia de Senhas:** Armazenamento seguro utilizando Hashing **PBKDF2 com Salt** no banco de dados.
*   **Segurança Biométrica (Android):** Acesso ao aplicativo protegido por impressão digital ou reconhecimento facial.
*   **Armazenamento Criptografado:** Uso de `EncryptedSharedPreferences` no Android para proteger tokens e credenciais localmente.
*   **Proteção de API:** Restrição de **CORS** por domínio e validação de **API Key** em todas as requisições.

---

## 🛠️ Stack Tecnológica

### **Frontend & Mobile**
| Tecnologia | Utilização |
| :--- | :--- |
| **Kotlin / Jetpack Compose** | UI Nativa Android Moderna |
| **React.js / Vite** | Frontend Web de alta performance |
| **TailwindCSS** | Estilização Web consistente |
| **Retrofit / Axios** | Comunicação com API (Android / Web) |
| **Room Database** | Persistência Local e cache no Android |
| **Recharts** | Visualização de dados e gráficos na Web |

### **Cloud & Backend**
| Tecnologia | Utilização |
| :--- | :--- |
| **AWS Lambda (Python)** | Lógica de negócio Serverless |
| **Amazon DynamoDB** | Banco de dados NoSQL escalável |
| **JWT (PyJWT)** | Autorização e autenticação segura |
| **GitHub Pages** | Hospedagem automatizada da versão Web |

---

## ⚙️ CI/CD

O projeto utiliza **GitHub Actions** para automação de processos e **gh-pages** para deployment contínuo da interface web, garantindo que a versão em produção sempre reflita o código mais estável da branch master.

---
**Desenvolvido por [Rogerio Wernech](https://github.com/RWernech)** 🚀
