const { parseEther } = require('ethers/lib/utils');

describe("Deploy", ()=> {
    let Token, token, Notary, notary, owner, addr1, addr2;
    let expect;

    before(async () => {
        expect = (await import('chai')).expect;
    });

    beforeEach(async ()=>{
        Token = await ethers.getContractFactory("Token");
        [owner, addr1, addr2, _] = await ethers.getSigners();
        let holders = [owner.address, addr1.address, addr2.address];
        token = await Token.deploy(holders);

        Notary = await ethers.getContractFactory("Notary");
        notary = await Notary.deploy(token.address);
    });

    describe('Deployment', () => {
        it("Should deploy the contract", async () => {
            console.log("Token Address: ", token.address);
            expect(await token.name()).to.equal('Token');
            expect(await notary.token()).to.equal(token.address);
        });
    });

    describe('Stake', async () => {
        it("Aprovar o contrato Notary para gastar os tokens do usuário", async () => {
            const amount = parseEther('10');
            await token.approve(notary.address, amount);
            console.log("amount: ", await token.allowance(owner.address, notary.address));
            // expect(await token.allowance(owner.address, notary.address)).to.equal(amount);
        });

        it("Deve realizar o stake", async () => {
            const amount = parseEther('10');
            await token.approve(notary.address, amount);
            await notary.stake(amount);
            console.log("balanceOf: ", await token.balanceOf(notary.address));
        });
    });

    describe('Trazacoes', async () => {
        it("Realizar o deposito", async () => {
            const amount = parseEther('1');
            await token.approve(notary.address, amount);
            await notary.deposit(amount, addr1.address);
            console.log("id: ", await notary.lastDepositID());
        });

        it("Stake + Deposit + ExecuteBridge", async () => {
            const amountStake = parseEther('10');
            await token.connect(owner).approve(notary.address, amountStake);
            await notary.connect(owner).stake(amountStake);
            
            const amountDeposit = parseEther('1');
            await token.connect(addr1).approve(notary.address, amountDeposit);
            await notary.connect(addr1).deposit(amountDeposit, addr2.address);
            await notary.connect(owner).executeBridge(123, addr2.address, amountDeposit);
            console.log("balanceOf: ", await token.balanceOf(addr2.address));
        });
    });
});