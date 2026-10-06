import { readDocument, updateDocument } from "@/lib/json-store";

export type ShopSettings = {
  showAvailability: boolean;
  showPriceRange: boolean;
  showCollections: boolean;
};

export const SHOP_SETTING_KEYS = [
  "showAvailability",
  "showPriceRange",
  "showCollections",
] as const satisfies readonly (keyof ShopSettings)[];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  showAvailability: true,
  showPriceRange: true,
  showCollections: true,
};

function merge(stored: Partial<ShopSettings> | null): ShopSettings {
  // Merge over defaults so a setting added later stays visible until toggled off,
  // and keep only known keys so retired settings don't leak back out.
  const merged = { ...DEFAULT_SHOP_SETTINGS };
  for (const key of SHOP_SETTING_KEYS) {
    if (typeof stored?.[key] === "boolean") merged[key] = stored[key];
  }
  return merged;
}

export async function getShopSettings(): Promise<ShopSettings> {
  try {
    return merge(await readDocument<Partial<ShopSettings>>("shop-settings"));
  } catch (error) {
    // Filters are cosmetic: show them all rather than failing the shop page.
    console.error("getShopSettings:", error);
    return DEFAULT_SHOP_SETTINGS;
  }
}

export async function updateShopSettings(patch: Partial<ShopSettings>): Promise<ShopSettings> {
  return updateDocument<ShopSettings>("shop-settings", DEFAULT_SHOP_SETTINGS, (current) => ({
    ...merge(current),
    ...patch,
  }));
}
