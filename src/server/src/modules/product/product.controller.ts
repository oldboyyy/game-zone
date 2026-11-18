import { Request, Response } from "express";
import asyncHandler from "@/shared/utils/asyncHandler";
import sendResponse from "@/shared/utils/sendResponse";
import { ProductService } from "./product.service";
import slugify from "@/shared/utils/slugify";
import { makeLogsService } from "../logs/logs.factory";
import { uploadToCloudinary } from "@/shared/utils/uploadToCloudinary";
import AppError from "@/shared/errors/AppError";

export class ProductController {
  private logsService = makeLogsService();
  constructor(private productService: ProductService) {}

  getAllProducts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        products,
        totalResults,
        totalPages,
        currentPage,
        resultsPerPage,
      } = await this.productService.getAllProducts(req.query);
      sendResponse(res, 200, {
        data: {
          products,
          totalResults,
          totalPages,
          currentPage,
          resultsPerPage,
        },
        message: "Products fetched successfully",
      });
    }
  );

  getProductById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id: productId } = req.params;
      const product = await this.productService.getProductById(productId);
      sendResponse(res, 200, {
        data: product,
        message: "Product fetched successfully",
      });
    }
  );

  getProductBySlug = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { slug: productSlug } = req.params;
      const product = await this.productService.getProductBySlug(productSlug);
      sendResponse(res, 200, {
        data: product,
        message: "Product fetched successfully",
      });
    }
  );

  createProduct = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const {
        name,
        description,
        isNew,
        isTrending,
        isBestSeller,
        isFeatured,
        categoryId,
        variants: rawVariants,
      } = req.body;

      // Log for debugging
      console.log(
        "req.body:",
        JSON.stringify(req.body, null, 2),
        "req.files:",
        req.files
      );

      // Validate variants
      const variants = rawVariants || [];
      if (!Array.isArray(variants) || variants.length === 0) {
        throw new AppError(400, "At least one variant is required");
      }

      // Upload images to Cloudinary
      const files = (req.files as Express.Multer.File[]) || [];
      let imageResults: { url: string; public_id: string }[] = [];
      if (files.length > 0) {
        try {
          imageResults = await uploadToCloudinary(files);
          if (imageResults.length === 0) {
            throw new AppError(400, "Failed to upload images to Cloudinary");
          }
        } catch (error) {
          console.error("Cloudinary upload error:", error);
          throw new AppError(400, "Failed to upload images to Cloudinary");
        }
      }

      // Process variants
      const processedVariants = variants.map((variant: any, index: number) => {
        // Parse JSON fields
        let attributes = [];
        let imageIndexes = [];
        try {
          attributes = JSON.parse(variant.attributes || "[]");
          imageIndexes = JSON.parse(variant.imageIndexes || "[]");
        } catch (error) {
          console.error(`Error parsing JSON for variant ${index}:`, error);
          throw new AppError(400, `Invalid JSON format in variant ${index}`);
        }

        // Map image URLs based on imageIndexes
        const imageUrls = imageIndexes
          .map((idx: number) => {
            if (idx >= 0 && idx < imageResults.length) {
              return imageResults[idx].url;
            }
            console.warn(`Invalid image index ${idx} for variant ${index}`);
            return null;
          })
          .filter((url: string | null) => url !== null);

        return {
          ...variant,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock, 10),
          lowStockThreshold: parseInt(variant.lowStockThreshold || "10", 10),
          attributes,
          images: imageUrls,
        };
      });

      // Create product
      const product = await this.productService.createProduct({
        name,
        description,
        isNew: isNew === true || isNew === "true",
        isTrending: isTrending === true || isTrending === "true",
        isBestSeller: isBestSeller === true || isBestSeller === "true",
        isFeatured: isFeatured === true || isFeatured === "true",
        categoryId,
        variants: processedVariants,
      });

      // Send response
      res.status(201).json({
        status: "success",
        data: { product },
        message: "Product created successfully",
      });
    }
  );

  updateProduct = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id: productId } = req.params;
      const {
        name,
        description,
        categoryId,
        isNew,
        isFeatured,
        isTrending,
        isBestSeller,
      } = req.body;

      // Multer expands bracketed multipart fields into req.body.variants.
      let parsedVariants: any[] = req.body.variants ?? [];
      if (typeof parsedVariants === "string") {
        try { parsedVariants = JSON.parse(parsedVariants); }
        catch { throw new AppError(400, "Invalid variants format"); }
      }
      if (!Array.isArray(parsedVariants) ||
          (req.body.variants !== undefined && parsedVariants.length === 0)) {
        throw new AppError(400, "Variants must be a non-empty array");
      }
      parsedVariants = parsedVariants.map((variant) => {
        if (!variant || typeof variant !== "object") throw new AppError(400, "Invalid variant");
        const number = (value: unknown) =>
          (typeof value === "number" || (typeof value === "string" && value.trim() !== ""))
            ? Number(value) : NaN;
        return { ...variant, price: number(variant.price), stock: number(variant.stock),
          lowStockThreshold: variant.lowStockThreshold == null ? 10 : number(variant.lowStockThreshold) };
      });

      // Process files for each variant
      const files = (req.files as Express.Multer.File[]) || [];
      const processedVariants = parsedVariants.length
        ? await Promise.all(
            parsedVariants.map(async (variant: any, index: number) => {
              // Try to get files from imageIndexes or variants[${index}][images][${fileIndex}]
              let variantFiles: Express.Multer.File[] = [];
              let imageIndexes: number[] = [];
              try {
                imageIndexes = variant.imageIndexes
                  ? JSON.parse(variant.imageIndexes)
                  : [];
                if (Array.isArray(imageIndexes)) {
                  variantFiles = imageIndexes
                    .map((idx) =>
                      files.find(
                        (f) =>
                          f.fieldname === `images` && files.indexOf(f) === idx
                      )
                    )
                    .filter(Boolean) as Express.Multer.File[];
                }
              } catch {
                // Fallback to old format
                variantFiles = files.filter((f) =>
                  f.fieldname.startsWith(`variants[${index}][images][`)
                );
              }

              // Upload files to Cloudinary
              let imageUrls: string[] = [];
              if (variantFiles.length > 0) {
                const uploadedImages = await uploadToCloudinary(variantFiles);
                imageUrls = uploadedImages
                  .map((img) => img.url)
                  .filter(Boolean);
              }

              // Validate images from req.body
              let bodyImages = variant.images || [];
              if (typeof bodyImages === "string") {
                try {
                  bodyImages = JSON.parse(bodyImages);
                } catch {
                  throw new AppError(
                    400,
                    `Invalid images format at variant index ${index}`
                  );
                }
              }
              if (
                !Array.isArray(bodyImages) ||
                bodyImages.some((img: any) => img && typeof img !== "string")
              ) {
                throw new AppError(
                  400,
                  `Images at variant index ${index} must be an array of strings or empty`
                );
              }

              // Combine uploaded images with body images
              imageUrls = [
                ...imageUrls,
                ...bodyImages.filter((img: string) => img),
              ];

              // Validate other fields
              if (
                !variant.sku ||
                !Number.isFinite(variant.price) || variant.price <= 0 ||
                !Number.isInteger(variant.stock) || variant.stock > 2147483647 ||
                !Number.isInteger(variant.lowStockThreshold) || variant.lowStockThreshold < 0 ||
                variant.lowStockThreshold > 2147483647
              ) {
                throw new AppError(
                  400,
                  `Variant at index ${index} must have sku, price, and stock`
                );
              }
              if (variant.stock < 0) {
                throw new AppError(
                  400,
                  `Variant at index ${index} must have a valid non-negative stock number`
                );
              }

              // Validate attributes
              let parsedAttributes;
              try {
                parsedAttributes =
                  typeof variant.attributes === "string"
                    ? JSON.parse(variant.attributes)
                    : variant.attributes;
                if (!Array.isArray(parsedAttributes)) {
                  throw new AppError(
                    400,
                    `Variant at index ${index} must have an attributes array`
                  );
                }
                parsedAttributes.forEach((attr: any, attrIndex: number) => {
                  if (!attr.attributeId || !attr.valueId) {
                    throw new AppError(
                      400,
                      `Invalid attribute structure in variant at index ${index}, attribute index ${attrIndex}`
                    );
                  }
                });
              } catch (error) {
                throw new AppError(
                  400,
                  `Invalid attributes format at index ${index}`
                );
              }

              // Check for duplicate attributes
              const attributeIds = parsedAttributes.map(
                (attr: any) => attr.attributeId
              );
              if (new Set(attributeIds).size !== attributeIds.length) {
                throw new AppError(
                  400,
                  `Duplicate attributes in variant at index ${index}`
                );
              }

              return {
                ...variant,
                images: imageUrls,
                attributes: parsedAttributes.map(({ attributeId, valueId }: { attributeId: string; valueId: string }) => ({ attributeId, valueId })),
              };
            })
          )
        : undefined;

      if (processedVariants) {
        // Check for duplicate SKUs
        const skuKeys = processedVariants.map((variant: any) => variant.sku);
        if (new Set(skuKeys).size !== skuKeys.length) {
          throw new AppError(400, "Duplicate SKUs detected");
        }

        // Check for duplicate attribute combinations
        const comboKeys = processedVariants.map((variant: any) =>
          variant.attributes
            .map((attr: any) => `${attr.attributeId}:${attr.valueId}`)
            .sort()
            .join("|")
        );
        if (new Set(comboKeys).size !== comboKeys.length) {
          throw new AppError(400, "Duplicate attribute combinations detected");
        }
      }

      const updatedData: any = {
        ...(name && { name }),
        ...(description && { description }),
        ...(isNew !== undefined && { isNew: isNew === true || isNew === "true" }),
        ...(isFeatured !== undefined && { isFeatured: isFeatured === true || isFeatured === "true" }),
        ...(isTrending !== undefined && { isTrending: isTrending === true || isTrending === "true" }),
        ...(isBestSeller !== undefined && {
          isBestSeller: isBestSeller === true || isBestSeller === "true",
        }),
        ...(categoryId && { categoryId }),
        ...(processedVariants && { variants: processedVariants }),
      };

      const product = await this.productService.updateProduct(
        productId,
        updatedData
      );

      sendResponse(res, 200, {
        data: { product },
        message: "Product updated successfully",
      });
      this.logsService.info("Product updated", {
        userId: req.user?.id,
        sessionId: req.session.id,
      });
    }
  );

  bulkCreateProducts = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    const result = await this.productService.bulkCreateProducts(file!);

    sendResponse(res, 201, {
      data: { count: result.count },
      message: `${result.count} products created successfully`,
    });
    const start = Date.now();
    const end = Date.now();

    this.logsService.info("Bulk Products created", {
      userId: req.user?.id,
      sessionId: req.session.id,
      timePeriod: end - start,
    });
  });

  deleteProduct = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { id: productId } = req.params;
      await this.productService.deleteProduct(productId);
      sendResponse(res, 200, { message: "Product deleted successfully" });
      const start = Date.now();
      const end = Date.now();

      this.logsService.info("Product deleted", {
        userId: req.user?.id,
        sessionId: req.session.id,
        timePeriod: end - start,
      });
    }
  );
}
