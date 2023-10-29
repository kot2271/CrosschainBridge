import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, BigNumberish, Signature, ContractTransaction, ContractReceipt, providers } from "ethers";
import { ethers } from "hardhat";
import { Address } from 'cluster';

import { Bridge } from "../src/types/Bridge";
import { Bridge__factory } from "../src/types/factories/Bridge__factory";

import { Token } from "../src/types/Token";

describe("Bridge", function () {
    let mumbaiBridge: Bridge;
    let bscBridge: Bridge;
    let mumbaiToken: Token;
    let bscToken: Token;

    const tokenName = "Token";
    const tokenSymbol = "T2T";

    let signers: SignerWithAddress[];
    let validator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    const mumbaiId: BigNumberish = 80001;
    const bscId: BigNumberish = 97;

    const defaultAmount: BigNumber = ethers.utils.parseEther("100");
    const tenEther: BigNumber = ethers.utils.parseEther("10");
    const wrongChainId: BigNumberish = 555;
    const newChainId: BigNumberish = 777;
    const addreessForTests = "0x86A976e9bEC571F2f45fc9A5642d2353BDA40AF1";

    beforeEach(async function () {
        signers = await ethers.getSigners();
        [validator, user1, user2] = [signers[0], signers[1], signers[2]];

        const MumbaiToken = await ethers.getContractFactory(tokenName);
        mumbaiToken = await MumbaiToken.deploy(tokenName, tokenSymbol)

        const BinanceToken = await ethers.getContractFactory(tokenName);
        bscToken = await BinanceToken.deploy(tokenName, tokenSymbol)

        const bridgeFactory = (await ethers.getContractFactory("Bridge", validator)) as Bridge__factory;
        mumbaiBridge = await bridgeFactory.deploy(validator.address, mumbaiId);
        bscBridge = await bridgeFactory.deploy(validator.address, bscId);

        await mumbaiBridge.updateChainById(bscId, true);
        await bscBridge.updateChainById(mumbaiId, true);

        await bscBridge.includeToken(bscToken.address, mumbaiToken.address, mumbaiId);
        await mumbaiBridge.includeToken(mumbaiToken.address, bscToken.address, bscId);

        await mumbaiToken.connect(validator).grantMinterRole(mumbaiBridge.address);
        await mumbaiToken.connect(validator).grantBurnerRole(mumbaiBridge.address);

        await bscToken.connect(validator).grantMinterRole(bscBridge.address);
        await bscToken.connect(validator).grantBurnerRole(bscBridge.address);

        const thousandEther = ethers.utils.parseEther("1000");

        await bscToken.mint(validator.address, thousandEther.mul(2))
        await mumbaiToken.mint(validator.address, thousandEther.mul(2))

        await bscToken.transfer(user1.address, thousandEther);
        await bscToken.transfer(user2.address, thousandEther);

        await mumbaiToken.transfer(user1.address, thousandEther);
        await mumbaiToken.transfer(user2.address, thousandEther);

        await mumbaiToken.connect(user1).approve(mumbaiBridge.address, thousandEther);
        await mumbaiToken.connect(user2).approve(mumbaiBridge.address, thousandEther);

        await bscToken.connect(user1).approve(bscBridge.address, thousandEther);
        await bscToken.connect(user2).approve(bscBridge.address, thousandEther);
    });

    describe("Initial params of token contracts", async () => {
        it("Initializes name, symbol and decimals correctly", async () => {
            expect(await mumbaiToken.name()).to.equal("Token");
            expect(await mumbaiToken.symbol()).to.equal("T2T");
            expect(await mumbaiToken.decimals()).to.equal(18);
  
            expect(await bscToken.name()).to.equal("Token");
            expect(await bscToken.symbol()).to.equal("T2T");
            expect(await bscToken.decimals()).to.equal(18);
        });
           
        it("should have the correct initial total supply", async () => {
            const thousandEther = ethers.utils.parseEther("1000");
            expect(await mumbaiToken.totalSupply()).to.equal(thousandEther.mul(2));
            expect(await bscToken.totalSupply()).to.equal(thousandEther.mul(2));
        });
      
        it("should have the correct initial balance for the owner", async () => {
              expect(await mumbaiToken.balanceOf(validator.address)).to.equal(0);
              expect(await bscToken.balanceOf(validator.address)).to.equal(0);
        });
    });

    describe("Checking getters", () => {

        it("isTokenSupported = true", async () => {
            expect(await mumbaiBridge.isTokenSupported(mumbaiToken.address, bscId)).to.eq(true);
        });

        it("isTokenSupported = false", async () => {
            expect(await mumbaiBridge.isTokenSupported(mumbaiToken.address, wrongChainId)).to.eq(false);
        });

        it("isChainSupported = true", async () => {
            expect(await mumbaiBridge.isChainSupported(bscId)).to.eq(true);
        });

        it("isChainSupported = false", async () => {
            expect(await mumbaiBridge.isChainSupported(wrongChainId)).to.eq(false);
        });

        it("nonceStatus = false", async () => {
            expect(await mumbaiBridge.nonceStatus(user1.address, 1)).to.eq(false);
        });

        it("nonceStatus = true", async () => {
            await mumbaiBridge.connect(user1).swap(user2.address, mumbaiToken.address, defaultAmount, bscId, 1);
            expect(await mumbaiBridge.nonceStatus(user1.address, 1)).to.eq(true);
        });
    });

    describe("Checking setters", () => {

        it("updateChainById = true", async () => {
            await mumbaiBridge.updateChainById(newChainId, true);
            expect(await mumbaiBridge.isChainSupported(newChainId)).to.eq(true);
        });

        it("updateChainById = false", async () => {
            await mumbaiBridge.updateChainById(newChainId, true);
            await mumbaiBridge.updateChainById(newChainId, false);
            expect(await mumbaiBridge.isChainSupported(newChainId)).to.eq(false);
        });

        it("updateChainById - emit ChainByIdUpdated", async () => {
            await expect(mumbaiBridge.updateChainById(newChainId, true))
            .to.emit(mumbaiBridge, "ChainByIdUpdated")
            .withArgs(newChainId, true);
        });

        it("includeToken", async () => {
            await mumbaiBridge.includeToken(addreessForTests, addreessForTests, wrongChainId);
            expect(await mumbaiBridge.isTokenSupported(addreessForTests, wrongChainId)).to.eq(true);
        });

        it("includeToken - emit TokenIncluded", async () => {
            await expect(mumbaiBridge.includeToken(addreessForTests, addreessForTests, wrongChainId))
            .to.emit(mumbaiBridge, "TokenIncluded")
            .withArgs(addreessForTests, addreessForTests, wrongChainId);
        });

        it("excludeToken", async () => {
            await mumbaiBridge.excludeToken(mumbaiToken.address, bscId);
            expect(await mumbaiBridge.isTokenSupported(mumbaiToken.address, bscId)).to.eq(false);
        });

        it("excludeToken - emit TokenExcluded", async () => {
            await expect(mumbaiBridge.excludeToken(mumbaiToken.address, bscId))
            .to.emit(mumbaiBridge, "TokenExcluded").withArgs(mumbaiToken.address, bscId);
        });
    });

    describe("modifiers", () => {

        it("adminControl", async () => {
            await expect(mumbaiBridge.connect(user1).excludeToken(mumbaiToken.address, bscId))
            .to.be.revertedWith("Bridge: Only admin can use this function");
        });

        it("checkNonce", async () => {
            await mumbaiBridge.connect(user1).swap(user2.address, mumbaiToken.address, defaultAmount, bscId, 1);
            await expect(mumbaiBridge.connect(user1).swap(user2.address, mumbaiToken.address, defaultAmount, bscId, 1))
                .to.be.revertedWith("Bridge: This nonce was already used");
        });
    });

    describe("main functions", () => {
        describe("swap", () => {

            it("swap - chain isn't supported", async () => {
                await expect(
                    mumbaiBridge.connect(user1).swap(user2.address, mumbaiToken.address, defaultAmount, wrongChainId, 1)
                    ).to.be.revertedWith("Bridge: One of the blockchains isn't supported");
            });

            it("swap - token isn't supported", async () => {
                await expect(
                    mumbaiBridge.connect(user1).swap(user2.address, addreessForTests, defaultAmount, bscId, 1)
                    ).to.be.revertedWith("Bridge: This token is not supported");
            });

            it("swap burned tokens", async () => {
                const totalSupplyBefore = await mumbaiToken.totalSupply();
                await mumbaiBridge.connect(user1).swap(user2.address, mumbaiToken.address, defaultAmount, bscId, 1);
                const totalSupply = await mumbaiToken.totalSupply();

                expect(totalSupplyBefore).to.eq(totalSupply.add(defaultAmount));
            });

            it("swap - emit SwapInitilaized", async () => {
                await expect(
                    mumbaiBridge.connect(user1).swap(user2.address, mumbaiToken.address, defaultAmount, bscId, 1)
                ).to.emit(mumbaiBridge, "SwapInitilaized")
                .withArgs(user2.address, bscToken.address, bscId, defaultAmount, 1, mumbaiId);
            });
        });
    });

    describe("redeem", () => {
        let signature: Signature;
        beforeEach(async function () {
            await mumbaiToken.connect(validator).grantMinterRole(bscBridge.address);
            await bscToken.connect(validator).grantBurnerRole(mumbaiBridge.address);

            await mumbaiBridge.connect(user1).swap(user2.address, mumbaiToken.address, defaultAmount, bscId, 1);

            const encoded = new ethers.utils.AbiCoder().encode(
                ["address", "address", "uint256", "uint256", "uint256"],
                [user2.address, mumbaiToken.address, bscId, defaultAmount, 1]
            );

            const signedDataHash = ethers.utils.solidityKeccak256(["bytes"], [encoded]);

            const bytesArray = ethers.utils.arrayify(signedDataHash);

            const flatSignature = await validator.signMessage(bytesArray);
            signature = ethers.utils.splitSignature(flatSignature);
        });

        it("isn't a msg.sender", async () => {
            await expect(
                bscBridge.redeem(
                    user2.address,
                    mumbaiToken.address,
                    defaultAmount,
                    1,
                    bscId,
                    signature.v,
                    signature.r,
                    signature.s
                )
            ).to.be.revertedWith("Only the receiver can collect the tokens");
        });

        it("Invalid sig", async () => {
            await expect(
                bscBridge.connect(user2).redeem(
                    user2.address,
                    mumbaiToken.address,
                    defaultAmount.sub(tenEther),
                    1,
                    bscId,
                    signature.v,
                    signature.r,
                    signature.s
                )
            ).to.be.revertedWith("Bridge: invalid sig");
        });

        it("For another chain", async () => {
            await expect(
                bscBridge.connect(user2).redeem(
                    user2.address,
                    mumbaiToken.address,
                    defaultAmount,
                    1,
                    wrongChainId,
                    signature.v,
                    signature.r,
                    signature.s
                )
            ).to.be.revertedWith("This transaction is for another chain");
        });

        it("Tokens minted", async () => {
            const BalanceBefore = await mumbaiToken.balanceOf(user2.address);

            await bscBridge.connect(user2).redeem(
                user2.address,
                mumbaiToken.address,
                defaultAmount,
                1,
                bscId,
                signature.v,
                signature.r,
                signature.s
            );
            const Balance = await mumbaiToken.balanceOf(user2.address);
            expect(BalanceBefore.add(defaultAmount)).to.equal(Balance);
        });

        it("Redeem setted a usersNonces", async () => {
            await bscBridge.connect(user2).redeem(
                user2.address,
                mumbaiToken.address,
                defaultAmount,
                1,
                bscId,
                signature.v,
                signature.r,
                signature.s
            );
            expect(await bscBridge.nonceStatus(user2.address, 1)).to.equal(true);
        });

        it("Redeem - emit RedeemInitilaized", async () => {
            await expect(bscBridge.connect(user2).redeem(
                user2.address,
                mumbaiToken.address,
                defaultAmount,
                1,
                bscId,
                signature.v,
                signature.r,
                signature.s
            )).to.emit(bscBridge, "RedeemInitilaized")
            .withArgs(user2.address, mumbaiToken.address, defaultAmount, 1);
        });
    });

    describe("swap & redeem", () => {
        let signature: Signature;

        it("process of executing 'swap' & 'redeem' functions", async () => {
            await bscToken.connect(validator).grantMinterRole(mumbaiBridge.address);
            await mumbaiToken.connect(validator).grantBurnerRole(bscBridge.address);

            const nonce = await providers.getDefaultProvider().getTransactionCount(user1.address);

            const swapTx: ContractTransaction = await bscBridge.connect(user1).swap(user2.address, bscToken.address, defaultAmount, mumbaiId, nonce);
            const swapReceipt: ContractReceipt = await swapTx.wait();
            const swapEvent = swapReceipt.events?.find(event => event.event === 'SwapInitilaized');
            const swapRecipient: Address = swapEvent?.args!['receiver'];
            const supportedToken: Address = swapEvent?.args!['token'];
            const chainDestination: BigNumber = swapEvent?.args!['chainTo'];
            const swapAmount: BigNumber = swapEvent?.args!['amount'];
            const nonceValue1: BigNumber = swapEvent?.args!['nonce'];
            const thisChainId: BigNumber = swapEvent?.args!['chainFrom'];

            const swapEtherAmount = ethers.utils.formatEther(swapAmount);

            console.log(`
                Swap initialized from chain_id ${thisChainId}:
                    - Recipient: ${swapRecipient}
                    - Token: ${supportedToken}
                    - Amount: ${swapEtherAmount} ETH
                    - Destination chain: ${chainDestination}
                    - Nonce: ${nonceValue1}
            `);

            const encoded = new ethers.utils.AbiCoder().encode(
                ["address", "address", "uint256", "uint256", "uint256"],
                [user2.address, bscToken.address, mumbaiId, defaultAmount, nonce]
            );

            const signedDataHash = ethers.utils.solidityKeccak256(["bytes"], [encoded]);
            const bytesArray = ethers.utils.arrayify(signedDataHash);
            const flatSignature = await validator.signMessage(bytesArray);
            signature = ethers.utils.splitSignature(flatSignature);

            const redeemTx: ContractTransaction = await mumbaiBridge.connect(user2).redeem(user2.address, bscToken.address, defaultAmount, nonce, mumbaiId, signature.v, signature.r, signature.s);
            const contractReceipt: ContractReceipt = await redeemTx.wait();
            const redeemEvent = contractReceipt.events?.find(event => event.event === 'RedeemInitilaized');
            const redeemRecipient: Address = redeemEvent?.args!['receiver'];
            const token: Address = redeemEvent?.args!['token'];
            const Amount: BigNumber = redeemEvent?.args!['amount'];
            const nonceValue2: BigNumber = redeemEvent?.args!['nonce'];

            const redeemEtherAmount = ethers.utils.formatEther(Amount);

            console.log(`
                Redeem completed:
                    - Recipient: ${redeemRecipient} 
                    - Token: ${token}
                    - Amount: ${redeemEtherAmount} ETH
                    - Nonce: ${nonceValue2}
            `);
        });
    });

});