import { Inngest } from "inngest";

// Inicializa o cliente Inngest com o ID correto do projeto
export const inngest = new Inngest({ 
  id: "peixaria-ono-app",
  // Força o modo de produção quando estiver na Vercel
  isDev: process.env.NODE_ENV === "development" ? true : false
});
