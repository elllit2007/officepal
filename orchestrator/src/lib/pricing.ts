import { supabase } from "./supabase.js";

/**
 * "Inget pris genereras fritt av AI — alltid uppslag mot strukturerad, av
 * Nina godkänd data, eller flaggas som offert." (BUILD-CONTRACT.md)
 *
 * Prices never come from the model. They come from tenant.settings.price_list
 * — a plain object of { <normalized description>: unit_price } that Nina
 * (or an admin) maintains via the admin dashboard (Track 4). This is the only
 * source create_invoice_draft is allowed to read a price from; anything not
 * found here must be flagged as a quote instead of guessed.
 */

export function normalizeDescription(description: string): string {
  return description.trim().toLowerCase();
}

export interface PriceList {
  [normalizedDescription: string]: number;
}

function extractPriceList(settings: Record<string, unknown>): PriceList {
  const raw = settings.price_list;
  if (!raw || typeof raw !== "object") return {};

  const list: PriceList = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      list[normalizeDescription(key)] = value;
    }
  }
  return list;
}

export async function getTenantPriceList(tenantId: string): Promise<PriceList> {
  const { data, error } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (error) {
    throw new Error(`pricing: failed to load tenant settings: ${error.message}`);
  }
  if (!data) {
    throw new Error(`pricing: unknown tenant_id ${tenantId}`);
  }

  return extractPriceList(data.settings ?? {});
}

export function lookupUnitPrice(
  priceList: PriceList,
  description: string,
): number | undefined {
  return priceList[normalizeDescription(description)];
}
