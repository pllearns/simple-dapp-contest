const path = require('path');
const fs = require('fs');
const solc = require('solc');

const contestPath = path.resolve(__dirname, 'contracts', 'Contest.sol');
const source = fs.readFileSync(contestPath, 'utf-8');

module.exports = solc.compile(source, 1).contracts[':Contest'];

