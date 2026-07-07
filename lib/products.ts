import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type Product = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  createdAt: number;
};

const DATA_FILE = path.join(process.cwd(), "data", "products.json");

async function readAll(): Promise<Product[]> {
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as Product[];
}

async function writeAll(products: Product[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), "utf-8");
}

export async function getProducts(): Promise<Product[]> {
  const products = await readAll();
  return products.sort((a, b) => a.createdAt - b.createdAt);
}

export type NewProduct = {
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
};

export async function addProduct(input: NewProduct): Promise<Product> {
  const products = await readAll();
  const product: Product = {
    id: randomUUID(),
    title: input.title.trim(),
    subtitle: input.subtitle.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl.trim(),
    createdAt: Date.now(),
  };
  products.push(product);
  await writeAll(products);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const products = await readAll();
  await writeAll(products.filter((p) => p.id !== id));
}
