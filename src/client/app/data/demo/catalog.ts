import { Product } from "@/app/types/productTypes";
import type { FilterValues } from "@/app/(public)/shop/ProductFilters";
import data from "./gaming.json";
export type DemoCategory = { id: string; slug: string; name: string; description: string; images: string[]; products?: { id: string }[] };
export const DEMO_CATEGORIES: DemoCategory[] = data.categories.map(category => ({ ...category, images: [] }));
export const DEMO_PRODUCTS: Product[] = data.products.map((p, i) => ({
 id: `demo-prod-${i+1}`, slug:p.slug, name:p.name, description:p.description,
 category:DEMO_CATEGORIES.find(c=>c.slug===p.category)!, reviews:[],
 isNew:i%3===0, isFeatured:i%4===0, isTrending:i%5===0, isBestSeller:i%3===1,
 averageRating:0, reviewCount:0,
 variants:[{id:`demo-var-${i+1}`,sku:p.slug.toUpperCase(),price:p.price,stock:p.stock,
 images:[],lowStockThreshold:5,barcode:null,warehouseLocation:null,
 attributes:Object.entries(p.attributes).filter(([,v])=>v!==undefined).map(([key,value])=>({
 id:`${p.slug}-${key}`,attribute:{id:key,slug:key,name:data.attributes[key as keyof typeof data.attributes]},
 value:{id:`${key}-${value}`,slug:`${key}-${value}`,value:value!}
 }))}]
}));

export function getDemoProductBySlug(slug: string): Product | undefined {
  return DEMO_PRODUCTS.find((p) => p.slug === slug);
}

export function filterDemoProducts(
  products: Product[],
  filters: FilterValues
): Product[] {
  return products.filter((product) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!product.name.toLowerCase().includes(q)) return false;
    }
    if (filters.categoryId && product.category?.id !== filters.categoryId) {
      return false;
    }
    if (filters.isNew && !product.isNew) return false;
    if (filters.isFeatured && !product.isFeatured) return false;
    if (filters.isTrending && !product.isTrending) return false;
    if (filters.isBestSeller && !product.isBestSeller) return false;

    const price = product.variants[0]?.price ?? 0;
    if (filters.minPrice !== undefined && price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;

    return true;
  });
}

export function paginateDemoProducts(
  products: Product[],
  skip: number,
  first: number
): { products: Product[]; hasMore: boolean; totalCount: number } {
  const slice = products.slice(skip, skip + first);
  return {
    products: slice,
    hasMore: skip + first < products.length,
    totalCount: products.length,
  };
}
