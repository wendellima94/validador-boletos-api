const express = require("express");
const PaymentController = require("./controllers/PaymentController");
const { response } = require("./app");

const routes = express.Router();

routes.get("/", (req, res) => {
  return res.send(
    "Bem-vindo a API de validação de boletos. By Ricardo Henrique"
  );
});

// GET http://localhost:3000/pagamento/boleto?linha=XXXXX
//
// Query Params:
//
// linha - Código da linha digitável do boleto, apenas números.
//
routes.get("/pagamento/boleto", PaymentController.boleto);

module.exports = routes;
