# СrosschainBridge

## Задача:
- Bridge смарт контракт
- ERC20 с функциями 'mint' и 'burn' (создание и сжигание монет)
- Развернуть в сетях 'polygon-mumbai' и 'binance testnet'

## Installation
Clone the repository using the following command:
Install the dependencies using the following command:
```shell
npm i
```

## Deployment

Fill in all the required environment variables(copy .env-example to .env and fill it). 

Deploy contract to the chain (polygon-mumbai & binance-testnet):
```shell
npx hardhat run scripts/deploy.ts --network polygon-mumbai
```
```shell
npx hardhat run scripts/deploy.ts --network bsc
```

## Verify

Verify the installation by running the following command:
```shell
npx hardhat verify --network polygon-mumbai {TOKEN_ADDRESS} "Token" "T2T"
```

Token in polygon-mumbai: 0x9a384013a9B484F6AB18F7b8c3bcA846155d59FB