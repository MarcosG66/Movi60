# Movi60 — protótipo funcional em React Native + Expo

Projeto acadêmico de extensão da disciplina Desenvolvimento de Plataforma Móvel (Unifor). Construído com base no protótipo fornecido em Figma Make e nas Etapas 1 e 2.

## O que já funciona localmente

- Fluxo de apresentação, login, cadastro e recuperação de senha demonstrativa.
- Perfis de aluno, professor e administrador, com páginas e navegação próprias.
- Cinco abas do aluno: **Início, Treino, Evolução, Agenda, Perfil**.
- Treino do dia, detalhes, execução passo a passo, registro de séries, repetições, carga e observações, conclusão e histórico.
- Indicadores de evolução calculados a partir do histórico, incluindo gráfico semanal.
- Assistente Movi60 com **respostas pré-programadas locais**. **Não é uma IA conectada**.
- Acessibilidade: escala do texto, ícones, botões ampliados, alto contraste e escolha de fonte.
- Professor: busca e consulta dos alunos, cadastro, edição, consulta e exclusão de exercícios e treinos.
- Administrador: consulta de usuários, edição de dados e papéis, exclusão de usuários criados no próprio dispositivo, além de exercício/treino.
- Todas as alterações ficam no **AsyncStorage** do dispositivo. Dados de treino vinculados a um aluno são exibidos apenas para esse aluno na navegação de estudante. Confirmação antes das exclusões.

Os dados são apenas para demonstração, sem autenticação ou controle de acesso real no servidor. **Não usar dados sensíveis ou senhas pessoais.**

## Acessos de teste

| Tipo | E-mail | Senha |
|------|--------|-------|
| Aluno | ana@movi60.com | 123456 |
| Professor | professor@movi60.com | 123456 |
| Administrador | admin@movi60.com | 123456 |

Há botões de acesso rápido na tela inicial. Bruno Dias e Lúcia Costa são usuários de exemplo para a lista administrativa.

**Primeiro login como aluno:** a tela de acessibilidade aparece como configuração inicial. Pressione **Salvar e começar** ou volte para acessar as abas.

## Como executar como projeto Expo no computador

Requisitos: Node.js 22 (recomendado para Expo SDK 57), celular com Expo Go ou simulador, acesso à internet para a primeira instalação.

```bash
npm install
npx expo install --fix
npx expo start
```

Depois, escaneie o QR Code pelo Expo Go (Android) ou câmera/Expo Go (iOS). Também é possível abrir a visualização web pelo terminal ou `npx expo start --web`.

O código principal fica em `src/App.jsx`, as telas reutilizam os componentes de `src/components`, o tema está em `src/styles/theme.js` e a camada de dados local está em `src/services/local.js`.

## Como executar no Expo Snack (sem instalar Node.js)

Um **App.js de arquivo único**, equivalente a este projeto, acompanha a entrega separadamente, com nome `Movi60_Snack_App.js`.

1. Acesse **https://snack.expo.dev** e crie um Snack vazio.
2. Se houver seletor de SDK, escolha **Expo SDK 57**, que corresponde ao projeto recebido no ZIP Figma. Caso a versão não apareça, use a opção mais próxima suportada e veja se as bibliotecas são compatíveis.
3. Abra `Movi60_Snack_App.js` no computador e **copie todo o conteúdo**.
4. No Snack, abra `App.js`, **apague o exemplo** e **cole o código**.
5. Em **Dependencies**, adicione (se o Snack ainda não tiver resolvido automaticamente):
   - `@react-native-async-storage/async-storage`
   - `lucide-react-native`
   - `react-native-svg`
6. Escolha a prévia **Android**, **iOS** ou **Web** e abra o app. Para testar no celular, instale **Expo Go** e leia o QR Code do Snack.
7. Para salvar o projeto no Snack, entre com uma conta Expo e clique em **Save**.

A versão de arquivo único tem os mesmos fluxos e persiste os dados localmente no ambiente de execução. A persistência em uma prévia web pode ser diferente da persistência no Expo Go do celular.

## O que não foi integrado, propositalmente

- **Firebase Authentication**: login e cadastro locais, com credenciais de demonstração.
- **Firebase Firestore**: coleções provisoriamente substituídas por estado React + AsyncStorage.
- **Gemini / IA**: o assistente responde com regras simples e instruções dos exercícios disponíveis. Nenhuma chamada a serviço externo é feita.
- **Fotos definitivas dos exercícios**: o modelo visual mantém o placeholder ilustrado do Figma. No CRUD, é possível informar uma URL de imagem, quando houver internet.

**Importante:** o armazenamento de credenciais locais é exclusivamente didático. Ele não é seguro para ambiente de produção, e o controle de permissões é somente na interface. Para implantação real, usar o Firebase Auth, regras do Firestore e backend para a chamada de IA.

## Possíveis extensões

Na integração futura, substituir as funções de `src/services/local.js` por Auth/Firestore, migrar os registros locais para coleções `usuarios`, `exercicios`, `treinos`, `treino_exercicios`, `historico` e `agenda`, e trocar `src/services/assistant.js` por um serviço de IA protegido via backend.

## Verificação desta entrega

O código foi conferido com parser JavaScript/JSX e as funções de autenticação local foram validadas em testes automatizados. **Não foi possível executar um build Expo Go real neste ambiente**; por isso, eventuais diferenças específicas de versão da plataforma devem ser verificadas no Snack ou no aparelho.


## Separação de perfis — atualização

- **Aluno:** consulta e registra seus próprios treinos. Novos cadastros públicos são de aluno.
- **Professor:** gerencia exercícios, consulta somente alunos vinculados a si e cria/edita/exclui somente seus treinos. Apenas alunos vinculados podem ser selecionados no formulário de treino.
- **Administrador:** gerencia usuários, perfis e a atribuição de professores aos alunos. Seu painel mostra indicadores globais; os CRUDs de treino e exercício não aparecem na navegação administrativa.
- **Dados locais:** o vínculo é o campo `instructorId` no usuário/aluno e `professionalId` no treino. Permissões são de demonstração, não são segurança real; aplicar regras do Firebase na próxima etapa.
- **Cadastro pelo administrador:** escolha perfil e opcionalmente professor; senha provisória `123456` apenas para testes.
- Os usuários de demonstração Ana e Bruno estão vinculados ao professor Carlos por padrão; a administradora pode mudar os vínculos.
