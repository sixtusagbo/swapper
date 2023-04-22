# Swapper
A token swap dapp with [0x](https://0x.org) API

# Overview
I use a global API at `window.ethereum` injected by MetaMask into websites visited by its users.
This API allows me to interact with MetaMask in order to request users' Ethereum accounts, read data from blockchains the user is connected to, and suggest that the user sign messages and transactions.The presence of the provider object indicates an Ethereum user and that MetaMask is installed.