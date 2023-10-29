import { task } from "hardhat/config";
import { ContractTransaction, ContractReceipt } from "ethers";
import { Address } from 'cluster';

const TOKEN_NAME = "Token";

task("grantBurnerRole", "Grant burner role to bridge contract")
    .addParam("bridge", "Bridge contract address")
    .addParam("token", "Token contract address")
    .setAction(async ({ bridge, token }, { ethers }) => {
        const Token = await ethers.getContractFactory(TOKEN_NAME);
        const tokenContract = Token.attach(token);

        const tx: ContractTransaction = await tokenContract.grantBurnerRole(bridge);
        const receipt: ContractReceipt = await tx.wait();
        if (receipt.status === 1) {
            const event = receipt.events?.find(event => event.event === 'RoleGranted');
            const bridgeAddress: Address = event?.args!['account'];
            const sender: Address = event?.args!['sender'];
            console.log(`
                Burner role granted to bridge with addres: ${bridgeAddress}
                initiator is: ${sender}
            `);
        } else {
            console.log(`
                The role of BURNER was not granted !!!
                Only the ${TOKEN_NAME} administrator can grant permissions !
            `)
          }   
    });