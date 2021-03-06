const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');

const provider = ganache.provider();
const web3 = new Web3(provider);

const { interface, bytecode } = require('../compile');

let contest;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  contest = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000'});
    contest.setProvider(provider);
});

describe('Contest contract', () => {
  it('deploys a contract', () => {
    assert.ok(contest.options.address);
  });

  it('lets one player enter the contest', async () => {
    await contest.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await contest.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it('lets multiple players enter the contest', async () => {
    await contest.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    });
    await contest.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    });
    await contest.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('0.02', 'ether')
    });

    const players = await contest.methods.getPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it('requires a minimum amount of ether to enter', async () => {
    try {
      await contest.methods.enter().send({
        from: accounts[0],
        value: 300
      });
      assert(false)
    } catch (err) {
      assert(err);
    }
  });

  it('only manager can pick a winner', async () => {
    try {
      await contest.methods.pickWinner().send({
        from: accounts[1]
      });
      assert(false);
    } catch (err){ 
      assert(err);
    }
  });

  it('sends funds to the winner and resets the contest', async () => {
    await contest.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('1', 'ether') 
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);

    await contest.methods.pickWinner().send({
      from: accounts[0]
    });

    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
  
    assert(difference > web3.utils.toWei('0.8', 'ether'));
  });
});