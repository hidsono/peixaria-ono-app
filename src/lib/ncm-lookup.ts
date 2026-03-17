export interface TaxInfo {
    ncm: string;
    cest: string;
}

const FISH_TAX_DATABASE: Record<string, TaxInfo> = {
    "tainha": { ncm: "0302.11.00", cest: "04.001.00" },
    "robalo": { ncm: "0302.89.35", cest: "04.001.00" },
    "corvina": { ncm: "0302.59.90", cest: "04.001.00" },
    "pescada": { ncm: "0302.59.90", cest: "04.001.00" },
    "salmão": { ncm: "0302.14.00", cest: "04.001.00" },
    "tilápia": { ncm: "0302.89.90", cest: "04.001.00" },
    "camarão": { ncm: "0306.36.10", cest: "04.001.00" },
    "lula": { ncm: "0307.43.10", cest: "04.001.00" },
    "polvo": { ncm: "0307.51.00", cest: "04.001.00" },
    "sardinha": { ncm: "0302.43.00", cest: "04.001.00" },
    "bacalhau": { ncm: "0303.63.10", cest: "04.001.00" },
    "anchova": { ncm: "0302.43.00", cest: "04.001.00" },
    "garoupa": { ncm: "0302.89.90", cest: "04.001.00" },
    "cação": { ncm: "0302.81.00", cest: "04.001.00" },
    "namorado": { ncm: "0302.89.90", cest: "04.001.00" },
};

export function lookupTaxInfo(name: string): TaxInfo | null {
    const normalized = name.toLowerCase().trim();
    
    // Busca exata ou que comece com o termo
    for (const [key, value] of Object.entries(FISH_TAX_DATABASE)) {
        if (normalized.includes(key) || key.includes(normalized)) {
            return value;
        }
    }
    
    return null;
}
