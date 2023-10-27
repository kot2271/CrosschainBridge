import { ethers, run, network } from "hardhat";
import { Bridge } from "../src/types";

const delay = async (time: number) => {
  return new Promise((resolve: any) => {
    setInterval(() => {
      resolve()
    }, time)
  })
}

async function main() {

  const tstName = "Token";
  const tstSymbol = "T2T";
  const bridgeName = "Bridge";

  if (network.name === 'polygon-mumbai') {

  const MumbaiToken = await ethers.getContractFactory(tstName);
  const mumbaiToken = await MumbaiToken.deploy(tstName, tstSymbol);

  await mumbaiToken.deployed();

  console.log(`${tstName} in polygon-mumbai deployed to: ${mumbaiToken.address}`);
  console.log('Wait for delay...');
  await delay(20000); // 20 seconds
  console.log(`Starting verify ${tstName}...`);

  try {
    await run('verify', {
      address: mumbaiToken!.address,
      constructorArguments: [tstName, tstSymbol],
      contract: 'contracts/Token.sol:Token',
      network: 'polygon-mumbai'
    });
    console.log('Verify success')
  } catch(e: any) {
    console.log(e.message)
  }

  const mumbaiChainId = 80001;
  const [mumbaiValidator] = await ethers.getSigners();
  let mumbaiBridge: Bridge;

  try {
  const MumbaiBridge = await ethers.getContractFactory(bridgeName);
  mumbaiBridge = await MumbaiBridge.deploy(mumbaiValidator.address, mumbaiChainId);
  await mumbaiBridge.deployed();

  console.log(`Bridge in polygon-mumbai deployed to: ${mumbaiBridge.address}`);
  console.log(`Validator in polygon-mumbai : ${mumbaiValidator.address}`);
  } catch (e: any) {
    console.log(e.message)
  }
  console.log('Wait for delay...');
  await delay(60000);
  console.log('Starting verify Bridge contract in polygon-mumbai ...');

  try {
    await run('verify', {
      address: mumbaiBridge!.address,
      constructorArguments: [mumbaiValidator.address, mumbaiChainId],
      contract: 'contracts/Bridge.sol:Bridge',
      network: 'polygon-mumbai'
    });
    console.log('Verify success')
  } catch(e: any) {
    console.log(e.message)
  }
}

if (network.name === 'bsc') {

  const BinanceToken = await ethers.getContractFactory(tstName);
  const binanceToken = await BinanceToken.deploy(tstName, tstSymbol);

  await binanceToken.deployed();

  console.log(`${tstName} in Binance Smart Chain deployed to: ${binanceToken.address}`);
  console.log('Wait for delay...');
  await delay(20000); // 20 seconds
  console.log(`Starting verify ${tstName}...`);

  try {
    await run('verify', {
      address: binanceToken!.address,
      constructorArguments: [tstName, tstSymbol],
      contract: 'contracts/Token.sol:Token',
      network: 'bsc'
    });
    console.log('Verify success')
  } catch(e: any) {
    console.log(e.message)
  }

  const binanceChainId = 56;
  const [binanceValidator] = await ethers.getSigners();
  let binanceBridge;

  try {
    const BinanceBridge = await ethers.getContractFactory(bridgeName);
    binanceBridge = await BinanceBridge.deploy(binanceValidator.address, binanceChainId);
    await binanceBridge.deployed();
  
    console.log(`Bridge in Binance Smart Chain deployed to: ${binanceBridge.address}\n`);
    console.log(`Validator in Binance Smart Chain : ${binanceValidator.address}\n`);
    } catch (e: any) {
      console.log(e.message)
    }
    console.log('Wait for delay...');
    await delay(60000);
    console.log('Starting verify Bridge contract in Binance Smart Chain ...');
  
    try {
      await run('verify', {
        address: binanceBridge!.address,
        constructorArguments: [binanceValidator.address, binanceChainId],
        contract: 'contracts/Bridge.sol:Bridge',
        network: 'bsc'
      });
      console.log('Verify success')
    } catch(e: any) {
      console.log(e.message)
    }
  }

}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });