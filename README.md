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
npx hardhat run scripts/deploy.ts --network bscTestnet
```

## Verify

Verify the installation by running the following command:
```shell
npx hardhat verify --network polygon-mumbai {TOKEN_ADDRESS} "Token" "T2T"
```

```shell
npx hardhat verify --network polygon-mumbai {BRIDGE_ADDRESS} {VALIDATOR_ADDRESS} {CHAIN_ID}
```

```shell
npx hardhat verify --network bscTestnet {TOKEN_ADDRESS} "Token" "T2T"
```

```shell
npx hardhat verify --network bscTestnet {BRIDGE_ADDRESS} {VALIDATOR_ADDRESS} {CHAIN_ID}
```

## Tasks

Create a new task(s) and save it(them) in the folder "tasks". Add a new task_name in the file "tasks/index.ts"

Running a swap task:
```shell
npx hardhat swap --bridge {BRIDGE_ADDRESS} --receiver {RECIPIENT_ADDRESS} --token-address {TOKEN_IN_THIS_CHAIN} --amount {AMOUNT} --chain-to {NETWORK_ID} --network {THIS_CHAIN_NETWORK_NAME}
```

Running a swap task:
```shell
npx hardhat redeem --bridge {BRIDGE_ADDRESS} --receiver {RECIPIENT_ADDRESS} --token-address {TOKEN_ON_ANOTHER_CHAIN} --amount {AMOUNT} --chain-to {THIS_NETWORK_ID} --network {THIS_CHAIN_NETWORK_NAME}
```

Running a grantMinterRole task:
```shell
npx hardhat grantMinterRole --bridge {BRIDGE_ADDRESS} --token {TOKEN_ADDRESS} --network {NETWORK_NAME}
```

Running a grantBurnerRole task:
```shell
npx hardhat grantBurnerRole --bridge {BRIDGE_ADDRESS} --token {TOKEN_ADDRESS} --network {NETWORK_NAME}
```

Token in polygon-mumbai: 0x33aF70E7b86FD48AF30ec40baC3bcE6A64890499

Bridge in polygon-mumbai: 0xb8715d96Baf0b67751Dd9b61976C52184aE4E19b

Validator in polygon-mumbai : 0x28217F6A9AeBa48042E814e9fa8004Ecf5f90873

-------------------------------------------------------------------------

Token in Binance Smart Chain: 0x3d6958bf3D102Ce785a43d0d657A6686273CAE4e

Bridge in Binance Smart Chain: 0xEe6c3C2f2417C808EBbE8E74F4F15a72a4216210

Validator in Binance Smart Chain: 0x28217F6A9AeBa48042E814e9fa8004Ecf5f90873