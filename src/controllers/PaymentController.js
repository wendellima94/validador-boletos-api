const { valTitBancario, valTitArrecadacao } = require("../functions");

//Valida a linha digitável do boleto e retornar informações sobre o boleto
const boleto = (req, res) => {
  const { linha } = req.query;

  const info = valTitBancario(linha) || valTitArrecadacao(linha);

  if (info) {
    res.status(200).json(info);
  } else {
    res.status(400).json({
      error: true,
      message: "Linha digitável inválida!",
    });
  }
};

module.exports = {
  boleto,
};
