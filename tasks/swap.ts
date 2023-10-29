import { task } from "hardhat/config";
import { BigNumber, ContractTransaction, ContractReceipt, providers} from "ethers";
import { Address } from 'cluster';

const CONTRACT_NAME = "Bridge";

task("swap", "Swap tokens to another chain")
    .addParam("bridge", "Bridge address in this chain")
    .addParam("receiver", "Receiver address on another chain")
    .addParam("tokenAddress", "Token address in this chain")
    .addParam("amount", "How many tokens")
    .addParam("chainTo", "On which chainId send tokens")
    .setAction(async ({ bridge, receiver, tokenAddress, amount, chainTo }, { ethers }) => {
        const Bridge = await ethers.getContractFactory(CONTRACT_NAME);
        const bridgeContract = Bridge.attach(bridge);

        const senderAddress = await ethers.provider.getSigner().getAddress();
        const nonce = await providers.getDefaultProvider().getTransactionCount(senderAddress);

        const amountInEther: BigNumber = ethers.utils.parseEther(amount.toString());
        const contractTx: ContractTransaction = await bridgeContract.swap(receiver, tokenAddress, amountInEther, chainTo, nonce);
        const contractReceipt: ContractReceipt = await contractTx.wait();
        const event = contractReceipt.events?.find(event => event.event === 'SwapInitilaized');
        const recipient: Address = event?.args!['receiver'];
        const supportedToken: Address = event?.args!['token'];
        const chainDestination: BigNumber = event?.args!['chainTo'];
        const Amount: BigNumber = event?.args!['amount'];
        const nonceValue: BigNumber = event?.args!['nonce'];
        const thisChainId: BigNumber = event?.args!['chainFrom'];

        const etherAmount = ethers.utils.formatEther(Amount);

        console.log(`
            Swap initialized from chain_id ${thisChainId}:
                - Recipient: ${recipient}
                - Token: ${supportedToken}
                - Amount: ${etherAmount} ETH
                - Destination chain: ${chainDestination}
                - Nonce: ${nonceValue}
            `);
    });