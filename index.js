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

// Get list of available tokens
init();

document.getElementById('login_button').onclick = connect;
document.getElementById('from_token_select').onclick = () => openModal('from');
document.getElementById('to_token_select').onclick = () => openModal('to');
document.getElementById('modal_close').onclick = closeModal;
document.getElementById('from_amount').onblur = getPrice;
