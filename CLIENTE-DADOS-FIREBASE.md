# Persistência de dados do cliente

O fluxo de checkout deve persistir somente os dados do cliente:
- nome completo
- telefone normalizado
- endereço de entrega (CEP, rua, número, complemento, bairro, cidade e UF, quando disponíveis)

O pedido não precisa ser gravado no Firebase por este fluxo.

Ao informar novamente o telefone, o cadastro do cliente pode ser consultado e os dados de entrega preenchidos automaticamente.
