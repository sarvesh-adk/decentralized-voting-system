/**
 * Decentralized Voting System - Contract Deployment
 * Author: sarveshadk
 * Deployment script for Voting smart contract
 */

var Voting = artifacts.require("./Voting.sol")

module.exports = function(deployer) {
  deployer.deploy(Voting)
}
