# Swapper
A token swap dapp with [0x](https://0x.org) API.
I use a global API at `window.ethereum` injected by MetaMask into websites visited by its users.
This API allows me to interact with MetaMask in order to request users' Ethereum accounts, read data from blockchains the user is connected to, and suggest that the user sign messages and transactions.The presence of the provider object indicates an Ethereum user and that MetaMask is installed.

# Installation
- Clone this repo `git clone https://github.com/sixtusagbo/swapper`
- Install npm packages `npm install`
- Compile required modules using [`browserify`](https://browserify.org/)
  - `npm install -g browserify`
  - `browserify index.js --standalone bundle -o bundle.js`
- You can now open index.html in a browser and Voila!