const express = require("express");
const router = express.Router();
const productController = require("./controller");
const middleware = require("../../middleware");

router.post(
  "/",
  [
    middleware.multer().array("images"),
    middleware.authentication.passportAuthenticate,
    middleware.authentication.grantAccess(["seller", "admin"]),
  ],
  productController.createProduct
);

router.get("/shop/:shop_id", productController.getShopProducts);
router.get("/categories", productController.getProductCategories);
router.get("/conditions", productController.getProductConditions);
router.get("/shipping-methods", productController.getProductShippingMethods);

module.exports = router;
