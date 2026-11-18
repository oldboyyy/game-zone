-- Выполнить в Query Tool pgAdmin, подключившись к gamezone_dev.
SELECT current_database(), current_user, version();
SELECT name, email, role FROM "User" ORDER BY email;
SELECT c.name AS category, count(p.id) AS products
FROM "Category" c LEFT JOIN "Product" p ON p."categoryId" = c.id
GROUP BY c.id, c.name ORDER BY c.name;
SELECT p.name, v.sku, v.price, v.stock
FROM "Product" p JOIN "ProductVariant" v ON v."productId" = p.id
ORDER BY p.name;
SELECT p.name, a.name AS attribute, av.value
FROM "Product" p JOIN "ProductVariant" v ON v."productId" = p.id
JOIN "ProductVariantAttribute" va ON va."variantId" = v.id
JOIN "Attribute" a ON a.id = va."attributeId"
JOIN "AttributeValue" av ON av.id = va."valueId" ORDER BY p.name, a.name;
SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at;
