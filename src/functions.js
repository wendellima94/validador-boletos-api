const { TIT_BANK_REGEX, PAG_CONC_REGEX } = require("./constants");

//Método de cálculo do digito verificador
const dacModulo10 = (codigo) => {
  let multiplicador = 2;

  let soma = codigo
    .split("")
    .reverse()
    .reduce((acumulado, item) => {
      let x = item * multiplicador;

      if (x > 9) {
        let s = String(x);
        x = Number(s[0]) + Number(s[1]);
      }

      multiplicador = multiplicador === 2 ? 1 : 2;

      return acumulado + x;
    }, 0);

  let dv = 10 - (soma % 10);

  return String(dv === 10 ? 0 : dv);
};

const dacModulo11 = (codigo) => {
  let multiplicador = 2;

  let soma = codigo
    .split("")
    .reverse()
    .reduce((acumulado, item) => {
      let x = item * multiplicador;

      multiplicador = multiplicador < 9 ? multiplicador + 1 : 2;

      return acumulado + x;
    }, 0);

  let dv = 11 - (soma % 11);

  return String([0, 10].includes(dv) ? 1 : dv);
};

//A cada 9000 dias a data base é alterada a partir de 03/07/2000
const calcularDataBaseVenc = () => {
  let hoje = new Date().toISOString();

  let dataBase = new Date("2000-07-03");
  let proxData = new Date("2000-07-03");

  proxData.setDate(proxData.getDate() + 9000);

  while (proxData.toISOString() <= hoje) {
    dataBase = proxData;
    proxData.setDate(proxData.getDate() + 9000);
  }

  return dataBase.toISOString().slice(0, 10);
};

//Verifica a data no formato YYYYMMDD
const verificarData = (data) => {
  let ano = data.slice(0, 4);
  let mes = data.slice(4, 6);
  let dia = data.slice(6, 8);

  if (Number(ano) < 2000) return null;
  if (Number(ano) >= 3000) return null;

  let d = new Date(`${ano}-${mes}-${dia}`);
  return isNaN(d.getDate()) ? null : `${ano}-${mes}-${dia}`;
};

//Valida os Titulos Bancários
const valTitBancario = (linha) => {
  if (!TIT_BANK_REGEX.exec(linha)) return false;

  //Separa os campos principais
  const banco = linha.slice(0, 3);
  const moeda = linha.slice(3, 4);
  const extra1 = linha.slice(4, 9);
  const dv1 = linha.slice(9, 10);
  const extra2 = linha.slice(10, 20);
  const dv2 = linha.slice(20, 21);
  const extra3 = linha.slice(21, 31);
  const dv3 = linha.slice(31, 32);
  const dv = linha.slice(32, 33);
  const fatorVenc = linha.slice(33, 37);
  const valor = linha.slice(37, 47);

  //Ordena os valores representando o valor númerico do código de barras
  const codigo =
    banco + moeda + dv + fatorVenc + valor + extra1 + extra2 + extra3;

  //Calcula os 3 digitos verificadores segmentados
  const campo1 = linha.slice(0, 9);
  const campo2 = linha.slice(10, 20);
  const campo3 = linha.slice(21, 31);

  const ndv1 = dacModulo10(campo1);
  const ndv2 = dacModulo10(campo2);
  const ndv3 = dacModulo10(campo3);

  //Calculo o digito verificador do codigo de barras
  const codigoSemDigito = codigo
    .split("")
    .filter((e, i) => i !== 4)
    .join("");

  const ndv = dacModulo11(codigoSemDigito);

  //Verifica se os digitos bateram
  if (ndv1 !== dv1 || ndv2 !== dv2 || ndv3 !== dv3 || ndv !== dv) {
    return false;
  }

  //Converte o valor do boleto
  const valorDecimal = valor / 100;

  //Calcula o vencimento do boleto
  let vencimento = null;

  if (fatorVenc >= 1000) {
    const dataBase = calcularDataBaseVenc();

    let vencimento = new Date(dataBase);
    vencimento.setDate(vencimento.getDate() + (fatorVenc - 1000));
    vencimento = vencimento.toISOString().slice(0, 10);
  }

  //Retorna as informações formatadas
  return {
    tipo: "titulo_bancario",
    valor: valorDecimal,
    vencimento,
    linha,
    codigo,
  };
};

//Valida os Titulos de Arrecadação de Concessionarias
const valTitArrecadacao = (linha) => {
  if (!PAG_CONC_REGEX.exec(linha)) return false;

  //Separa a linha digitada em grupos e digitos verificadores
  const dv = linha.slice(3, 4);
  const grupo1 = linha.slice(0, 11);
  const dv1 = linha.slice(11, 12);
  const grupo2 = linha.slice(12, 23);
  const dv2 = linha.slice(23, 24);
  const grupo3 = linha.slice(24, 35);
  const dv3 = linha.slice(35, 36);
  const grupo4 = linha.slice(36, 47);
  const dv4 = linha.slice(47, 48);

  let [ndv, ndv1, ndv2, ndv3, ndv4] = [null, null, null, null, null];

  //Verifica o identificador de valor efetivo ou referência
  const idValor = linha[2];

  //Calcula os digitos verificadores utilizando metodos diferentes
  //de acordo com o valor do identificador
  const linhaSemDigito =
    grupo1.slice(0, 3) + grupo1.slice(4, 11) + grupo2 + grupo3 + grupo4;

  if (["6", "7"].includes(idValor)) {
    ndv1 = dacModulo10(grupo1);
    ndv2 = dacModulo10(grupo2);
    ndv3 = dacModulo10(grupo3);
    ndv4 = dacModulo10(grupo4);
    ndv = dacModulo10(linhaSemDigito);
  }

  if (["8", "9"].includes(idValor)) {
    ndv1 = dacModulo11(grupo1);
    ndv2 = dacModulo11(grupo2);
    ndv3 = dacModulo11(grupo3);
    ndv4 = dacModulo11(grupo4);
    ndv = dacModulo11(linhaSemDigito);
  }

  //Verifica se os digitos bateram
  if (
    dv !== ndv ||
    dv1 !== ndv1 ||
    dv2 !== ndv2 ||
    dv3 !== ndv3 ||
    dv4 !== ndv4
  ) {
    return false;
  }

  //Converte o valor do boleto
  let valorDecimal = (grupo1 + grupo2).slice(4, 15);
  valorDecimal = valorDecimal / 100;

  let data1 = (grupo1 + grupo2 + grupo3).slice(19, 27);
  let data2 = (grupo1 + grupo2 + grupo3).slice(23, 31);

  //Retorna as informações formatadas
  return {
    tipo: "titulo_arrecadacao",
    valor: valorDecimal,
    vencimento: verificarData(data1) || verificarData(data2),
    linha,
    codigo: grupo1 + grupo2 + grupo3 + grupo4,
  };
};

module.exports = {
  valTitBancario,
  valTitArrecadacao,
};
