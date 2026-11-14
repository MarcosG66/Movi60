# Movi60 — App Check em desenvolvimento local

Este pacote altera somente `src/firebase.js` para inicializar o Firebase App Check no navegador durante o desenvolvimento Expo Web.

## O que foi preservado
- Firebase Authentication e persistência nativa via AsyncStorage.
- Autenticação secundária.
- Cloud Firestore.
- Serviço de IA existente em `src/services/assistant.js`.

## Como testar
1. Extraia este ZIP em uma pasta separada ou faça backup da pasta atual.
2. Abra a pasta do projeto no terminal.
3. Execute `npm install` caso necessário.
4. Execute `npx expo start --web`.
5. Abra o Movi60 no navegador e pressione F12 > Console.
6. Procure a mensagem `AppCheck debug token: "..."`.
7. Copie o token e cadastre-o no Firebase Console:
   App Check > Apps > menu do aplicativo Movi60 > Gerenciar tokens de depuração.
8. Depois de cadastrar, recarregue o Movi60 e teste o assistente.

## Importante
- O token de depuração é privado. Não publique nem envie para repositório público.
- O modo de depuração é habilitado somente quando `__DEV__` está ativo.
- Não adicione `localhost` aos domínios permitidos do reCAPTCHA.
- A configuração incluída é para Expo Web em desenvolvimento. A versão nativa Android/iOS precisa de um provedor App Check nativo antes de usar Firebase AI Logic nesses dispositivos.
- Antes de publicar a versão Web, crie uma chave de site do reCAPTCHA Enterprise e defina `EXPO_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` no ambiente de build. Não publique com a chave `debug-placeholder`.
- O assistente já utiliza `firebase/ai` e `GoogleAIBackend` no arquivo `src/services/assistant.js`; o modelo configurado no projeto é `gemini-3.5-flash-lite`.

Documentação:
- https://firebase.google.com/docs/ai-logic/app-check
- https://firebase.google.com/docs/app-check/web/debug-provider
