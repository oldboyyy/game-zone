import authorizeRole from "@/shared/middlewares/authorizeRole";
import protect from "@/shared/middlewares/protect";
import express from "express";
import { makeAttributeController } from "./attribute.factory";

const router = express.Router();
const controller = makeAttributeController();

router.get("/", controller.getAllAttributes);
router.get("/:id", controller.getAttribute);
router.post("/", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.createAttribute);
router.post("/value", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.createAttributeValue);
router.post("/assign-category", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.assignAttributeToCategory);
// router.post("/assign-product", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.assignAttributeToProduct);
router.delete("/:id", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.deleteAttribute);
router.delete("/value/:id", protect, authorizeRole("ADMIN", "SUPERADMIN"), controller.deleteAttributeValue);

export default router;
