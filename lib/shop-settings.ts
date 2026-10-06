import { readLatestJson, writeJsonVersion } from "@/lib/blob-json";

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

const BLOB_PREFIX = "shop-settings/";

export async function getShopSettings(): Promise<ShopSettings> {
  const stored = await readLatestJson<Partial<ShopSettings>>(BLOB_PREFIX);
  if (!stored) return DEFAULT_SHOP_SETTINGS;
  // Merge over defaults so a setting added later stays visible until toggled off,
  // and keep only known keys so retired settings don't leak back out.
  const merged = { ...DEFAULT_SHOP_SETTINGS };
  for (const key of SHOP_SETTING_KEYS) {
    if (typeof stored[key] === "boolean") merged[key] = stored[key];
  }
  return merged;
}

export async function updateShopSettings(patch: Partial<ShopSettings>): Promise<ShopSettings> {
  const settings = { ...(await getShopSettings()), ...patch };
  await writeJsonVersion(BLOB_PREFIX, "settings.json", settings);
  return settings;
}
