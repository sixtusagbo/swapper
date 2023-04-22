async function connect() {
  // Check if MetaMask is installed, if it is, try connecting to an account
  if (typeof window.ethereum !== 'undefined') {
    try {
      console.log('connecting');
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

function openModal() {
  document.getElementById('token_modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('token_modal').style.display = 'none';
}

document.getElementById('login_button').onclick = connect;
document.getElementById('from_token_select').onclick = openModal;
document.getElementById('modal_close').onclick = closeModal;
