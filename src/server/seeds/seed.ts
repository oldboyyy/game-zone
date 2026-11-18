import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
const prisma = new PrismaClient();
const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../client/app/data/demo/gaming.json"), "utf8")) as {
 categories: {slug:string;name:string;description:string}[];
 products: {slug:string;name:string;description:string;category:string;price:number;stock:number;attributes:Record<string,string>}[];
 attributes:Record<string,string>;
};
async function main() {
 const admins = ["Санжар", "Батырхан", "Елдар"].map((name,i)=>({name,
 email:process.env[`SEED_ADMIN_${i+1}_EMAIL`] || ["sanzhar@example.com","batyrkhan@example.com","eldar@example.com"][i],
 password:process.env[`SEED_ADMIN_${i+1}_PASSWORD`] || "admin123"}));
 if(process.env.NODE_ENV === "production" && admins.some((a,i)=>!process.env[`SEED_ADMIN_${i+1}_EMAIL`] || a.password === "admin123" || a.password.length < 12))
   throw new Error("Seed остановлен: задайте email и пароли длиной не менее 12 символов для всех администраторов в production.");
 if(new Set(admins.map(a=>a.email.toLowerCase())).size !== 3 || admins.some(a=>a.email.toLowerCase()==="customer@example.com"))
   throw new Error("Email трёх администраторов должны быть уникальными и отличаться от покупателя.");
 await prisma.$transaction(async tx=> {
 const accounts = [...admins.map(a=>({...a,role:"SUPERADMIN" as const})), ...(process.env.NODE_ENV === "production" ? [] : [{name:"Покупатель",email:"customer@example.com",password:"user123",role:"USER" as const}])];
 for(const account of accounts) {
 const {password,...user}=account;
 const record={...user,email:user.email.trim().toLowerCase(),password:await bcrypt.hash(password,12)};
 await tx.user.upsert({where:{email:record.email},create:record,update:record});
 }
 for(const c of data.categories) await tx.category.upsert({where:{slug:c.slug},create:{...c,images:[]},update:c});
 for(const [slug,name] of Object.entries(data.attributes)) await tx.attribute.upsert({where:{slug},create:{slug,name},update:{name}});
 for(const [i,p] of data.products.entries()) {
 const category=await tx.category.findUniqueOrThrow({where:{slug:p.category}});
 const record={name:p.name,description:p.description,categoryId:category.id,isNew:i%3===0,isFeatured:i%4===0,isTrending:i%5===0,isBestSeller:i%3===1};
 const product=await tx.product.upsert({where:{slug:p.slug},create:{slug:p.slug,...record},update:record});
 const v={productId:product.id,price:p.price,stock:p.stock};
 const variant=await tx.productVariant.upsert({where:{sku:p.slug.toUpperCase()},create:{sku:p.slug.toUpperCase(),...v},update:v});
 for(const [key,value] of Object.entries(p.attributes)) {
 const attribute=await tx.attribute.findUniqueOrThrow({where:{slug:key}});
 const slug=`gamezone-${key}-${Buffer.from(value).toString("hex")}`;
 const av=await tx.attributeValue.upsert({where:{slug},create:{slug,value,attributeId:attribute.id},update:{value}});
 const link={variantId:variant.id,attributeId:attribute.id,valueId:av.id};
 await tx.productVariantAttribute.upsert({where:{variantId_attributeId_valueId:link},create:link,update:{}});
 const ca={categoryId:category.id,attributeId:attribute.id};
 await tx.categoryAttribute.upsert({where:{categoryId_attributeId:ca},create:ca,update:{}});
 }
 }
 },{timeout:120000});
 console.log("Созданы или обновлены 54 игровых товара, три SUPERADMIN и покупатель.");
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>prisma.$disconnect());
