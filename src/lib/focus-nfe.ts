// lib/focus-nfe.ts
import prisma from "./prisma";

async function getFiscalConfig() {
  const config = await (prisma as any).globalFiscalConfig.findUnique({
    where: { id: 'global' }
  });
  return config; // Pode ser null ou sem token
}

const BASE_URLS = {
  homologacao: "https://homologacao.focusnfe.com.br/v2",
  producao: "https://api.focusnfe.com.br/v2"
};

export async function emitirNFCeFocus(fiscalEvent: any) {
  const config = await getFiscalConfig();
  
  // MODO SIMULAÇÃO (Se não houver token configurado)
  if (!config?.focusToken) {
    console.log(`[Focus NFe] SIMULAÇÃO ATIVA - Gerando nota fake para evento ${fiscalEvent.id}`);
    return {
      id: fiscalEvent.id,
      chave_nfe: `352403${Math.random().toString().slice(2, 14)}00010000000012345678`,
      status: "autorizado",
      caminho_xml_nota_fiscal: "#",
      caminho_danfe: "#"
    };
  }

  const baseUrl = config.environment === 'producao' ? BASE_URLS.producao : BASE_URLS.homologacao;
  
  // 1. Buscar detalhes da venda e itens para montar o JSON real
  const sale = await (prisma as any).sale.findUnique({
    where: { id: fiscalEvent.saleId },
    include: {
      items: {
        include: {
          batch: {
            include: { product: true }
          }
        }
      }
    }
  });

  if (!sale) throw new Error("Venda não encontrada para emissão fiscal.");

  // O reference deve ser único. Usamos o ID do nosso evento fiscal.
  const reference = fiscalEvent.id;
  
  const nfeData: any = {
    data_emissao: new Date().toISOString(),
    natureza_operacao: fiscalEvent.eventType === 'VENDA_PROPRIO' ? 'Venda de Peixe' : 'Venda de Terceiros',
    tipo_documento: 1, // Saída
    finalidade_emissao: 1, // Normal
    presenca_comprador: 1, // Operação presencial
    cnpj_emitente: config.cnpj.replace(/\D/g, ''),
    items: sale.items.map((item: any, index: number) => ({
      numero_item: index + 1,
      codigo_produto: item.batch.product?.barcode || item.batch.id,
      descricao: item.batch.product?.name || item.batch.species,
      ncm: item.batch.product?.ncm || '03021100', // NCM genérico de peixe se não houver
      unidade_comercial: 'kg',
      quantidade_comercial: item.weight_kg,
      valor_unitario_comercial: item.pricePerKg,
      valor_bruto: item.subtotal,
      icms_situacao_tributaria: '102', // Simples Nacional - Sem permissão de crédito
      pis_situacao_tributaria: '07',
      cofins_situacao_tributaria: '07'
    }))
  };

  // Se houver CPF do cliente
  if (sale.customerCpf) {
    nfeData.cliente = {
      cpf: sale.customerCpf.replace(/\D/g, ''),
      nome_completo: "Consumidor Final"
    };
  }

  const endpoint = fiscalEvent.cfop === '65' ? '/nfce' : '/nfe'; 

  const response = await fetch(`${baseUrl}${endpoint}?ref=${reference}`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(config.focusToken + ":").toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(nfeData)
  });

  const data = await response.json();
  
  if (!response.status.toString().startsWith('2')) {
    console.error("[Focus NFe] Erro na emissão:", data);
    throw new Error(data.mensagem || "Erro ao comunicar com FocusNFe");
  }

  return {
    id: reference,
    chave_nfe: data.chave_nfe,
    status: data.status,
    caminho_xml_nota_fiscal: data.caminho_xml_nota_fiscal,
    caminho_danfe: data.caminho_danfe
  };
}

export async function checarStatusFocus(reference: string) {
  const config = await getFiscalConfig();
  const baseUrl = config.environment === 'producao' ? BASE_URLS.producao : BASE_URLS.homologacao;

  const response = await fetch(`${baseUrl}/nfce/${reference}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${Buffer.from(config.focusToken + ":").toString("base64")}`
    }
  });

  const data = await response.json();
  
  if (data.status === 'autorizado') return 'AUTORIZADO';
  if (data.status === 'erro_autorizacao') return 'REJEITADO';
  if (data.status === 'processando_autorizacao') return 'PROCESSANDO_SEFAZ';
  
  return data.status;
}
