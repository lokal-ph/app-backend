const transactionModel = require("./model");
const offerModel = require("../offer/model");
const productModel = require("../product/model");
const addressModel = require("../address/model");
const shopModel = require("../shop/model");
const accountModel = require("../account/model");
const httpResource = require("../../http_resource");

const transactionController = {
  async getShopTransactions(request, response) {
    try {
      const shopId = parseInt(request.params.shop_id);
      const page = parseInt(request.query.page) || 1;
      const perPage = parseInt(request.query.per_page) || 5;
      const shopTransactions = await transactionModel.getShopTransactions({
        shopId,
        page,
        perPage,
      });
      const totalCount = await transactionModel.getShopTransactionsCount(
        shopId
      );
      const shopTransactionsDetails = await Promise.all(
        shopTransactions.map(async (data) => {
          const shopTransaction = data;
          const account = await accountModel.getDetails(
            shopTransaction.account_id
          );
          const shop = await shopModel.getShopDetails(shopTransaction.shop_id);
          const offer = await offerModel.getOfferDetailsById(
            shopTransaction.offer_id
          );
          const address = await addressModel.getAddressDetails(
            shopTransaction.address_id
          );
          const product = await productModel.getProductDetails(
            shopTransaction.product_id
          );

          if (shopTransaction.status === "received") {
            const receivedBy = await accountModel.getDetails(
              shopTransaction.received_by
            );
            shopTransaction.received_by = Object.assign({}, receivedBy);
          }

          shopTransaction.account = Object.assign({}, account);
          shopTransaction.shop = Object.assign({}, shop);
          shopTransaction.offer = Object.assign({}, offer);
          shopTransaction.address = Object.assign({}, address);
          shopTransaction.product = Object.assign({}, product);

          delete shopTransaction.account_id;
          delete shopTransaction.shop_id;
          delete shopTransaction.offer_id;
          delete shopTransaction.address_id;
          delete shopTransaction.product_id;

          return shopTransaction;
        })
      );
      response.status(200).json(
        httpResource({
          success: true,
          code: 200,
          message: "Successfully got records.",
          data: {
            shop_transactions: shopTransactionsDetails,
            total_count: totalCount,
          },
        })
      );
    } catch (error) {
      response.status(400).json(
        httpResource({
          success: false,
          code: 400,
          message: error,
        })
      );
    }
  },
  async getAccountTransactions(request, response) {
    try {
      const { id } = request.user;
      const page = parseInt(request.query.page) || 1;
      const perPage = parseInt(request.query.per_page) || 5;
      const accountTransactions = await transactionModel.getAccountTransactions(
        {
          account_id: parseInt(id),
          page,
          perPage,
        }
      );

      const accountTransactionsDetails = await Promise.all(
        accountTransactions.map(async (data) => {
          const accountTransaction = data;
          const account = await accountModel.getDetails(
            accountTransaction.account_id
          );
          const shop = await shopModel.getShopDetails(
            accountTransaction.shop_id
          );
          const offer = await offerModel.getOfferDetailsById(
            accountTransaction.offer_id
          );
          const address = await addressModel.getAddressDetails(
            accountTransaction.address_id
          );
          const product = await productModel.getProductDetails(
            accountTransaction.product_id
          );

          if (accountTransaction.status === "received") {
            const receivedBy = await accountModel.getDetails(
              accountTransaction.received_by
            );
            accountTransaction.received_by = Object.assign({}, receivedBy);
          }

          accountTransaction.account = Object.assign({}, account);
          accountTransaction.shop = Object.assign({}, shop);
          accountTransaction.offer = Object.assign({}, offer);
          accountTransaction.address = Object.assign({}, address);
          accountTransaction.product = Object.assign({}, product);

          delete accountTransaction.account_id;
          delete accountTransaction.shop_id;
          delete accountTransaction.offer_id;
          delete accountTransaction.address_id;
          delete accountTransaction.product_id;
          delete accountTransaction.code;

          return accountTransaction;
        })
      );
      const totalCount = await transactionModel.getAccountTransactionsTotalCount(
        id
      );

      response.status(200).json(
        httpResource({
          success: true,
          code: 200,
          message: "Successfully got records.",
          data: {
            account_transactions: accountTransactionsDetails,
            total_count: totalCount,
          },
        })
      );
    } catch (error) {
      response.status(400).json(
        httpResource({
          success: false,
          code: 400,
          message: error,
        })
      );
    }
  },
  async cancelTransaction(request, response) {
    try {
      const { transaction_id, cancelled_by } = request.body;
      const cancelledTransaction = await transactionModel.cancelTransaction(
        transaction_id,
        cancelled_by
      );
      const transactionDetail = await transactionModel.getTransactionDetailsById(
        cancelledTransaction.id
      );
      const product = await productModel.getProductDetails(
        transactionDetail.product_id
      );
      const offer = await offerModel.getOfferDetailsById(
        transactionDetail.offer_id
      );
      const newStock = product.stock + offer.quantity;
      await productModel.updateProductDetails(product.id, { stock: newStock });
      response.status(200).json(
        httpResource({
          success: true,
          code: 200,
          message: "Successfully got records.",
          data: transactionDetail,
        })
      );
    } catch (error) {
      response.status(400).json(
        httpResource({
          success: false,
          code: 400,
          message: error,
        })
      );
    }
  },
  async receiveTransaction(request, response) {
    try {
      const accountId = parseInt(request.user.id);
      const { transaction_id, code } = request.body;
      const doesTransactionCodeMatch = await transactionModel.doesTransactionCodeMatch(
        transaction_id,
        code
      );
      if (!doesTransactionCodeMatch) throw "Transaction code does not match.";
      const receivedTransaction = await transactionModel.receiveTransaction(
        transaction_id,
        accountId
      );

      const transactionDetails = await transactionModel.getTransactionDetailsById(
        receivedTransaction.id
      );

      const account = await accountModel.getDetails(
        transactionDetails.account_id
      );
      const shop = await shopModel.getShopDetails(transactionDetails.shop_id);
      const offer = await offerModel.getOfferDetailsById(
        transactionDetails.offer_id
      );
      const address = await addressModel.getAddressDetails(
        transactionDetails.address_id
      );
      const product = await productModel.getProductDetails(
        transactionDetails.product_id
      );

      if (transactionDetails.status === "received") {
        const receivedBy = await accountModel.getDetails(
          transactionDetails.received_by
        );
        transactionDetails.received_by = Object.assign({}, receivedBy);
      }

      transactionDetails.account = Object.assign({}, account);
      transactionDetails.shop = Object.assign({}, shop);
      transactionDetails.offer = Object.assign({}, offer);
      transactionDetails.address = Object.assign({}, address);
      transactionDetails.product = Object.assign({}, product);

      delete transactionDetails.account_id;
      delete transactionDetails.shop_id;
      delete transactionDetails.offer_id;
      delete transactionDetails.address_id;
      delete transactionDetails.product_id;

      response.status(200).json(
        httpResource({
          success: true,
          code: 200,
          message: "Successfully got records.",
          data: transactionDetails,
        })
      );
    } catch (error) {
      response.status(400).json(
        httpResource({
          success: false,
          code: 400,
          message: error,
        })
      );
    }
  },
};

module.exports = transactionController;
