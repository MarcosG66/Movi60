import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { app } from "../firebase";

// Assistente com IA real (Gemini) via Firebase AI Logic.
// Requer ativar "AI Logic" (Gemini Developer API) no Console do Firebase.
const MODEL = "gemini-3.5-flash-lite";

const SYSTEM_INSTRUCTION = `Você é o Assistente Movi60, que ajuda pessoas idosas (60+) a fazer exercícios físicos com segurança.
Regras:
- Responda sempre em português do Brasil, com frases curtas, linguagem simples e acolhedora.
- Use no máximo 6 frases ou 5 itens curtos. Não use termos técnicos sem explicar.
- Foque em execução correta, respiração, postura, cuidados e benefícios do exercício.
- Segurança em primeiro lugar: oriente a parar se houver dor, tontura, falta de ar ou mal-estar e a procurar o professor ou um profissional de saúde.
- Nunca faça diagnósticos, não prescreva remédios nem mude cargas, séries ou repetições definidas pelo professor.
- Se a pergunta fugir de exercícios, saúde ou bem-estar, diga com gentileza que só pode ajudar com o treino.`;

let model = null;
function getModel() {
  if (!model) {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    model = getGenerativeModel(ai, { model: MODEL, systemInstruction: SYSTEM_INSTRUCTION });
  }
  return model;
}

function exerciseContext(exercise) {
  if (!exercise) return "O aluno não está vendo um exercício específico.";
  return [
    `Exercício que o aluno está vendo: ${exercise.name}.`,
    exercise.group && `Grupo muscular: ${exercise.group}.`,
    exercise.description && `Descrição cadastrada pelo professor: ${exercise.description}`,
    exercise.instructions && `Instruções cadastradas pelo professor: ${exercise.instructions}`,
  ].filter(Boolean).join("\n");
}

/** Respostas locais usadas apenas se a IA estiver indisponível. */
function localAnswer(question, exercise) {
  const q = question.toLocaleLowerCase("pt-BR");
  const prefix = exercise ? `${exercise.name}: ` : "";
  if (/como|execut|fazer|passo|instruc/.test(q)) return `${prefix}${exercise?.instructions || "Confira as instruções na tela do exercício. Execute os movimentos de maneira controlada e siga as orientações do seu professor."}`;
  if (/cuidado|seguran|dor|limite/.test(q)) return "Antes de começar, peça ajuda ao profissional para ajustar o aparelho. Evite movimentos bruscos e interrompa a atividade se sentir dor ou mal-estar.";
  if (/serve|benef|muscul/.test(q)) return exercise ? `${prefix}${exercise.description} Grupo: ${exercise.group}.` : "Os exercícios são escolhidos pelo professor de acordo com o objetivo do treino. Abra um exercício para ver as orientações cadastradas.";
  return exercise ? `Sobre ${exercise.name}: ${exercise.instructions}` : 'Posso ajudar com instruções de execução e cuidados. Tente perguntar "Como faço esse exercício?".';
}

/**
 * @param {string} question
 * @param {object} [exercise] exercício aberto na tela, usado como contexto
 * @param {{from:string,text:string}[]} [previous] mensagens anteriores da conversa
 */
export async function askAssistant(question, exercise, previous = []) {
  try {
    // O histórico do Gemini precisa começar pelo usuário; descarta a saudação inicial do bot.
    const history = [];
    for (const message of previous.slice(-10)) {
      const role = message.from === "user" ? "user" : "model";
      if (!history.length && role !== "user") continue;
      history.push({ role, parts: [{ text: message.text }] });
    }
    const chat = getModel().startChat({ history });
    const result = await chat.sendMessage(`${exerciseContext(exercise)}\n\nPergunta do aluno: ${question}`);
    const text = result.response.text().trim();
    if (text) return text;
    throw new Error("Resposta vazia da IA");
  } catch (error) {
    console.warn("Assistente IA indisponível, usando resposta local:", error);
    return `${localAnswer(question, exercise)}\n\n(O assistente com IA está indisponível no momento; esta é uma orientação básica.)`;
  }
}
