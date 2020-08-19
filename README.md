# Validador de Boleto - API

O objetivo dessa API é validar a linha digitável de dois tipos de boleto e retornar algumas informações sobre o mesmo.

Javascript / Node.js / Express.js

## Endpoints

#### Validar linha digitável do boleto

GET /pagamento/boleto?linha=XXXXX

###

###

###

Query Params:

**linha** (string)
Código da linha digitável do boleto, apenas números.

###

###

###

Responses:

**200 OK**

```
{
    "tipo": "titulo_bancario ou titulo_arrecadacao",
    "valor": 0.00,
    "vencimento": "2020-01-01",
    "linha": "000000000000000000000000",
    "codigo": "0000000000000000000",
}
```

Obs: A data de vencimento pode ser nula.

**400 BAD REQUEST**

```
{
    "error": true,
    "message": "Linha digitável inválida!",
}
```
