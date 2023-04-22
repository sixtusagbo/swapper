const BigNumber = require('bignumber.js');
const qs = require('qs');

let currentTrade = {};
// To keep track of which side of the token select I am on
let currentSelectSide;

async function connect() {
  // Check if MetaMask is installed, if it is, try connecting to an account
  if (typeof window.ethereum !== 'undefined') {
    try {
      document.getElementById('login_button').innerHTML = 'Connecting';
      // Requests that the user provides an Ethereum address to be identified by.
      // This request causes a MetaMask popup to appear.
      // More at: https://docs.metamask.io/wallet/reference/rpc-api/#eth-requestaccounts
      await ethereum.request({ method: 'eth_requestAccounts' });
    } catch (error) {
      if (error.code === 4001) {
        // EIP-1193: userRejectedRequest error
        alert('You have to approve the request in order to use this app.');
        console.log('User rejected request!');
      } else {
        console.error(error);
      }
    }
    // If connected, change button to "Connected"
    document.getElementById('login_button').innerHTML = 'Connected';
    // If connected, enable "Swap" button
    document.getElementById('swap_button').disabled = false;
  }
  // Ask user to install MetaMask if it's not detected
  else {
    document.getElementById('login_button').innerHTML =
      'Please install MetaMask';
  }
}

function openModal(side) {
  currentSelectSide = side;
  document.getElementById('token_modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('token_modal').style.display = 'none';
}

async function init() {
  console.log('initializing');
  if (currentTrade.from === undefined) {
    document.getElementById('from_token_text').innerHTML = 'SELECT A TOKEN';
  }
  if (currentTrade.to === undefined) {
    document.getElementById('to_token_text').innerHTML = 'SELECT A TOKEN';
  }
  listAvailableTokens();
}

async function listAvailableTokens() {
  let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
  let tokenList = await response.json();
  console.log('Available tokens: ', tokenList);
  let tokens = tokenList.tokens;
  console.log('Tokens (Deserialized): ', tokens);

  // Create a list of tokens for the modal
  let parent = document.getElementById('token_list');
  for (const token of tokens) {
    // Create row for the token
    let div = document.createElement('div');
    div.className = 'token_row';
    // Display the token image and symbol in this row
    let html = `<img class="token_list_img" src="${token.logoURI}"> <span class="token_list_text">
    ${token.name} (${token.symbol})</span>`;
    div.innerHTML = html;
    div.onclick = () => selectToken(token);
    parent.appendChild(div);
  }
}

function selectToken(token) {
  closeModal();
  currentTrade[currentSelectSide] = token;
  console.log('currentTrade: ', currentTrade);
  renderSelectedTokenInterface();
}

function renderSelectedTokenInterface() {
  if (currentTrade.from) {
    document.getElementById('from_token_img').src = currentTrade.from.logoURI;
    document.getElementById('from_token_text').innerHTML = `${currentTrade.from.name} (${currentTrade.from.symbol})`;
  }
  if (currentTrade.to) {
    document.getElementById('to_token_img').src = currentTrade.to.logoURI;
    document.getElementById('to_token_text').innerHTML = `${currentTrade.to.name} (${currentTrade.to.symbol})`;
  }
}

async function getPrice() {
  console.log('Getting Price');
  // ensure that required variables has been filled in
  if (!currentTrade.from || !currentTrade.to || !document.getElementById('from_amount').value) return;
  // Calculate the smallest base unit of the token
  let amount = Number(document.getElementById('from_amount').value * (10 ** currentTrade.from.decimals));

  // Set request params
  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount,
  }
  const headers = { '0x-api-key': '81687871-16e9-4f62-b518-0a9137c19a40' };
  const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`, headers);
  let swapPriceResult = await response.json();
  if (swapPriceResult.code !== undefined) {
    alert(swapPriceResult.validationErrors[0].description);
  }
  console.log('[Swap Price]: ', swapPriceResult);

  // Populate the UI with the result
  document.getElementById('to_amount').value = swapPriceResult.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById('gas_estimate').innerHTML = swapPriceResult.estimatedGas;
}

async function getQuote(account) {
  console.log('Getting Quote');
  // ensure that required variables has been filled in
  if (!currentTrade.from || !currentTrade.to || !document.getElementById('from_amount').value) return;
  // Calculate the smallest base unit of the token
  let amount = Number(document.getElementById('from_amount').value * (10 ** currentTrade.from.decimals));

  // Set request params
  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount,
    takerAddress: account,
  }
  const headers = { '0x-api-key': '81687871-16e9-4f62-b518-0a9137c19a40' };
  const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`, headers);
  let swapQuoteResult = await response.json();
  if (swapQuoteResult.validationErrors) {
    alert(swapQuoteResult.validationErrors[0].description);
  }
  console.log('[Swap Quote]: ', swapQuoteResult);

  // Populate the UI with the result
  document.getElementById('to_amount').value = swapQuoteResult.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById('gas_estimate').innerHTML = swapQuoteResult.estimatedGas;

  return swapQuoteResult;
}

async function trySwap() {
  // The address, if any, of the most recently used account that the caller is permitted to access
  let accounts = await ethereum.request({ method: 'eth_accounts' });
  // Most recently used address in the user's MetaMask wallet
  let takerAddress = accounts[0];
  console.log('takerAddress: ', takerAddress);
  // Get a JSON object trade order
  const swapQuote = await getQuote(takerAddress);

  // Setup the erc20abi in json format so we can interact with the approve method below
  const erc20abi = [{ "inputs": [{ "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "symbol", "type": "string" }, { "internalType": "uint256", "name": "max_supply", "type": "uint256" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burn", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "burnFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" }], "name": "decreaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" }], "name": "increaseAllowance", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "address", "name": "recipient", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }];

  const fromTokenAddress = currentTrade.from.address;

  // web3 object to interact with a ERC20
  const web3 = new Web3(Web3.givenProvider);
  const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
  console.log("setup ERC20TokenContract: ", ERC20TokenContract);
  const maxApproval = new BigNumber(2).pow(256).minus(1);
  console.log("approval amount: ", maxApproval);
  const tx = await ERC20TokenContract.methods.approve(
    swapQuote.allowanceTarget,
    maxApproval,
  )
    .send({ from: takerAddress })
    .then(tx => {
      console.log("tx: ", tx)
    });

  // Perform the swap
  const receipt = await web3.eth.sendTransaction(swapQuote);
  console.log("receipt: ", receipt);
}

// Get list of available tokens
init();

document.getElementById('login_button').onclick = connect;
document.getElementById('from_token_select').onclick = () => openModal('from');
document.getElementById('to_token_select').onclick = () => openModal('to');
document.getElementById('modal_close').onclick = closeModal;
document.getElementById('from_amount').onblur = getPrice;
document.getElementById("swap_button").onclick = trySwap;