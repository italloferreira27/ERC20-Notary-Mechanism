# Notary Mechanism
[![NPM](https://img.shields.io/npm/l/react)](https://github.com/italloferreira27/Notary-Mechanism/blob/sepolia-amoy--hardhat/LICENSE) 
## Sobre o Projeto

Esse projeto tem como objetivo realizar a interoperação de Tokens fungivéis ERC20 entre as redes teste Sepolia e Amoy com base na implementação do mecanismo notárial.

## Conceitos:
### Interoperabilidade
A interoperabilidade é a capacidade de sistemas distintos de se comunicarem e interagirem entre si. A interoperabilidade é um conceito fundamental para a integração de sistemas, pois permite que diferentes sistemas possam trocar informações e compartilhar recursos.

### Tokens Fungíveis (ERC20)
Os tokens fungíveis são tokens que podem ser trocados entre si de forma equivalente, ou seja, um token fungível é igual a outro token fungível. Os tokens fungíveis são representados por contratos inteligentes que seguem o padrão ERC20, que define uma interface padrão para a criação de tokens na blockchain Ethereum. Os tokens fungíveis são amplamente utilizados em aplicações financeiras, como pagamentos, empréstimos e investimentos.

### Mecanismo Notarial
O mecanismo notarial atua como um intermediário confiável que valida e registra transações ou eventos entre diferentes blockchains. Ele permite a realização de transações entre redes distintas, garantindo a integridade e a autenticidade das informações trocadas. O mecanismo notarial é composto por um conjunto de contratos inteligentes que são responsáveis por realizar a comunicação entre as redes, garantindo a segurança e a confiabilidade das informações trocadas.

## Funcionamento
Para que o processo seja bem-sucedido, é necessário que as redes envolvidas tenham o contrato implementado. Isso requer a realização do deploy do contrato tanto na rede de origem quanto na rede de destino. É importante destacar que, para a execução desses procedimentos, é necessário que as contas possuam fundos na blockchain de teste, conhecidos como faucet tokens, para cobrir as taxas das transações. Após o deploy, é necessário realizar o stake de um endereço, que será responsável por efetuar a interoperabilidade.

Para se tornar um intermediário de trasações, stake, é necessário bloquear seus ativos (Tokens ERC20) no contrato inteligente, criando uma espécie de pool de liquidez. A cada transação bem-sucedida, o intermediário recebe um incentivo de 5% do montante transferido. Além disso, o ele não pode executar transferências se o valor da trasação for maior que 10% do valor assegurado pelo contrato. Dessa forma, se executar uma transferência falsa, o stake roubará no máximo 10% dos tokens.

Para maior segurança, as transações são sempre realizadas através do contrato inteligente, garantindo a integridade e a autenticidade das informações trocadas. Assim o usuário A realiza um depósito na cadeia de origem, informando o destinatário dos tokens na cadeia de destino através da função deposit. É necessário conceder as devidas autorizações para que o contrato possa gerenciar a quantidade de tokens determinada. Já na blockchain de destino, o intermediário (stake) executa a transferência para o destinatário com o montante e o endereço fornecido.

## Execução

* Instale as dependências do projeto:
```bash
npm install
```
* Preencha o arquivo `.env` com as chaves privadas das contas que serão utilizadas para efetuar as transações e com as URLs dos nós das redes.

* Inicialmente é preciso fazer os deploys nas duas redes de teste, tanto na amoy quanto na sepolia:
```bash
npx hardhat run scripts/deploy.js --network arbitrum
npx hardhat run scripts/deploy.js --network amoy
```

* Depois executar o stake.js, que vão ser as contas responsáveis por efetuar a interoperação:
```bash
npx hardhat run scripts/stake.js
```

* Por fim com o script `transaction.js` fará um deposito na rede sepolia, indicando um endereço da amoy e o stake irá efetuar a operação para esse endereço na rede amoy:
```bash
npx hardhat run scripts/transaction.js
```

## Ferramentas Utilizadas
Para a execução da interoperabilidade entre as redes foi utilizado algumas ferramentas:

* Endpoints das Redes de Teste: Utilizamos as API-KEYs fornecidas pela Alchemy para acessar os endpoints das redes de teste.
* Hardhat: Ferramenta fundamental para auxiliar na criação de smart contracts, implantação dos contratos, e teste de suas funcionalidades. O Hardhat facilitou significativamente o desenvolvimento do projeto.


## Exemplo de Uso

Para visualização dos contratos implementados nos exploradores de blocos, basta clicar nos links a seguir:
- [Token Sepolia](https://sepolia.etherscan.io/address/0x5AAd1957A2E047752cad49cbF4BB14f79Cb9B33E)
- [Notary Sepolia](https://sepolia.etherscan.io/address/0x24Da0976634b2d296FB1f6012f7C0aBacB50a872)
- [Token Amoy](https://www.oklink.com/pt-br/amoy/address/0x5fe7cecc95dca0d125b2b354f55efb1502610349)
- [Notary Amoy](https://www.oklink.com/pt-br/amoy/address/0x03f35734a590d7d92e63e49b94d5609b684ef986)


Para exemplificar, o uso desse mecanismo, suponha que o usuário A na rede Sepolia deseja transferir 1 token para o usuário B na rede Amoy. Como explicado anteriormente, para realizar essa transação, o usuário A deve aprovar que o contrato inteligente gerencie os tokens desejados para a transação ([visualizar aprovação](https://sepolia.etherscan.io/tx/0x6d55f7ae513cb92aaf0a17d91ff29ee17100703498c39252edc42e2d85c1ffc5)), logo após o usuário A deve depositar o token na rede Sepolia, informando o endereço do usuário B na rede Amoy ([visualizar depósito](https://sepolia.etherscan.io/tx/0xda7fafb1d9271d91a61726b603a124d02462208e450d88df8df96fffb6f0cf21)). 

O contrato inteligente emitirá um evento confirmando que o depósito foi realizado com sucesso, incluindo informações detalhadas do depósito, como o destinatário e o montante a ser transferido para o usuario B na outra rede ([visualizar evento](https://sepolia.etherscan.io/tx/0xda7fafb1d9271d91a61726b603a124d02462208e450d88df8df96fffb6f0cf21#eventlog)). Ademais, o stake irá executar a transferência do token para o usuário B na rede Amoy, [visualizar transferência](https://www.oklink.com/pt-br/amoy/tx/0xe02a3ba6aec93bc1fb6d36d547a9a490795f70a8265274da99fc2bac25702742), porém, o valor que será recebido será de 0.95 tokens, pois 0.05 tokens são referentes aos 5% que serão destinados como incentivo ao notário pela realização da interoperação ([transferência dos tokens](https://www.oklink.com/pt-br/amoy/tx/0xe02a3ba6aec93bc1fb6d36d547a9a490795f70a8265274da99fc2bac25702742/transfer)). Por fim, será emitido um evento confirmando a transferência do token para o usuário B na rede Amoy informando que foi bem secedida ([visualizar evento](https://www.oklink.com/pt-br/amoy/tx/0xe02a3ba6aec93bc1fb6d36d547a9a490795f70a8265274da99fc2bac25702742/log)).



## Referências
- [ERC20](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC20)
- [kitanovicd](https://github.com/kitanovicd/Bridge)
- [Hardhat](https://hardhat.org/)
- [Alchemy](https://www.alchemy.com/)
- [Ethers](https://docs.ethers.org/v5/)
