import { Inngest } from "inngest";

// Inicializa o cliente Inngest com o ID correto do projeto
export const inngest = new Inngest({ 
  id: "peixaria-ono-app",
  // Força o modo de produção (Cloud) para aceitar conexões externas
  isDev: false
});
