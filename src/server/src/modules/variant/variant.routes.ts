import authorizeRole from "@/shared/middlewares/authorizeRole";
import express from "express";
import { makeVariantController } from "./variant.factory";
import protect from "@/shared/middlewares/protect";

const router = express.Router();
const controller = makeVariantController();

router.get("/", controller.getAllVariants);
router.get("/:id", controller.getVariantById);
router.get("/sku/:sku", controller.getVariantBySku);
router.get('/:id/restock-history', protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.getRestockHistory);
router.post("/", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.createVariant);
router.patch("/:id", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.updateVariant);
router.post("/:id/restock", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.restockVariant);
router.delete("/:id", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.deleteVariant);

export default router;