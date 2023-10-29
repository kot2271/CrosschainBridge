import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, ContractTransaction, ContractReceipt, providers, Signature} from "ethers";
import { Address } from 'cluster';

const CONTRACT_NAME = "Bridge";
let signers: SignerWithAddress[];
let validator: SignerWithAddress;
let signature: Signature;

task("redeem", "Take your tokens")
    .addParam("bridge", "Bridge address in this chain")
    .addParam("receiver", "Receiver address in this chain")
    .addParam("tokenAddress", "Token address on another chain")
    .addParam("amount", "Amount of tokens")
    .addParam("chainTo", "This chainId")
    .setAction(async ({ bridge, receiver, tokenAddress, amount, chainTo }, { ethers }) => {
        const Bridge = await ethers.getContractFactory(CONTRACT_NAME);
        const bridgeContract = Bridge.attach(bridge);

        const senderAddress = await ethers.provider.getSigner().getAddress();
        const nonce = await providers.getDefaultProvider().getTransactionCount(senderAddress);

        const amountInEther: BigNumber = ethers.utils.parseEther(amount.toString());

        const encoded = new ethers.utils.AbiCoder().encode(
            ["address", "address", "uint256", "uint256", "uint256"],
            [receiver, tokenAddress, chainTo, amountInEther, nonce]
        );

        signers = await ethers.getSigners();
        [validator] = [signers[0]];

        const signedDataHash = ethers.utils.solidityKeccak256(["bytes"], [encoded]);
        const bytesArray = ethers.utils.arrayify(signedDataHash);
        const flatSignature = await validator.signMessage(bytesArray);
        signature = ethers.utils.splitSignature(flatSignature);

        const contractTx: ContractTransaction = await bridgeContract.redeem(receiver, tokenAddress, amountInEther, nonce, chainTo, signature.v, signature.r, signature.s);
        const contractReceipt: ContractReceipt = await contractTx.wait();
        const event = contractReceipt.events?.find(event => event.event === 'RedeemInitilaized');

        const recipient: Address = event?.args!['receiver'];
        const token: Address = event?.args!['token'];
        const Amount: BigNumber = event?.args!['amount'];
        const nonceValue: BigNumber = event?.args!['nonce'];

        const etherAmount = ethers.utils.formatEther(Amount);

        console.log(`
            Redeem completed:
                - Recipient: ${recipient} 
                - Token: ${token}
                - Amount: ${etherAmount} ETH
                - Nonce: ${nonceValue}
            `);
});