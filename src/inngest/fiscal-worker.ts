import { inngest } from "@/lib/inngest";
import prisma from "@/lib/prisma"; 
import { emitirNFCeFocus, checarStatusFocus } from "@/lib/focus-nfe"; 

export const processFiscalEvents = inngest.createFunction(
  { id: "processar-split-fiscal" },
  { event: "fiscal/processar.venda" },
  async ({ event, step }) => {
    const { saleId } = event.data;

    // 1. Busca todos os eventos pendentes dessa venda no banco
    const pendingEvents = await step.run("buscar-eventos-pendentes", async () => {
      return prisma.fiscalEvent.findMany({ 
        where: { saleId, status: "PENDENTE" } 
      });
    });

    for (const fiscalEvent of pendingEvents) {
      
      // 2. Mudar status para 'PROCESSANDO' para o Web Socket / Polling do PDV atualizar a UI
      await step.run(`marcar-como-processando-${fiscalEvent.id}`, async () => {
        return prisma.fiscalEvent.update({
          where: { id: fiscalEvent.id },
          data: { status: "PROCESSANDO" } 
        });
      });

      // 3. Efetuar Múltiplas Etapas Conforme o Tipo
      if (fiscalEvent.eventType === "VENDA_TERCEIROS" || fiscalEvent.eventType === "VENDA_PROPRIO") {
        
        let apiRef = await step.run(`emitir-nfce-${fiscalEvent.id}`, async () => {
             return await emitirNFCeFocus(fiscalEvent);
        });

        // O SEFAZ às vezes demora. O Inngest espera e recheca o status depois de 3 segundos
        let aprovada = false;
        while (!aprovada) {
            await step.sleep(`esperar-autorizacao-${fiscalEvent.id}`, "3s");
            
            const status = await step.run(`checar-sefaz-${fiscalEvent.id}`, async () => {
                return await checarStatusFocus(apiRef.id);
            });
            
            if (String(status) === 'AUTORIZADO') aprovada = true;
            if (String(status) === 'REJEITADO') {
                throw new Error("A Sefaz rejeitou a nota fiscal."); 
            }
        }

        // 4. Marca EVENTO como Sucesso (AUTORIZADA) no Banco
        await step.run(`marcar-autorizada-${fiscalEvent.id}`, async () => {
          return prisma.fiscalEvent.update({
            where: { id: fiscalEvent.id },
            data: { status: "AUTORIZADA", nfeKey: apiRef.chave_nfe }
          });
        });

      } else if (fiscalEvent.eventType === "RETORNO_DEPOSITO") {
          // Engatilha o Retorno de Depósito (Ono -> Pescador com CFOP 5.906)
          let apiRef = await step.run(`emitir-nfe-retorno-${fiscalEvent.id}`, async () => {
             return await emitirNFCeFocus(fiscalEvent); // Simula igual a NFe
          });

          // Pula as checagens por ser só simulação (igual block acima num ambiente real)
          await step.run(`marcar-autorizada-${fiscalEvent.id}`, async () => {
            return prisma.fiscalEvent.update({
              where: { id: fiscalEvent.id },
              data: { status: "AUTORIZADA", nfeKey: apiRef.chave_nfe }
            });
          });
      }
    }

    return { success: true, message: "Todos os documentos fiscais emitidos com sucesso!" };
  }
);
