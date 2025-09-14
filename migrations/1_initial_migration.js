/**
 * Decentralized Voting System - Migration Script
 * Author: sarveshadk
 * Truffle migration for Voting contract deployment
 */

var Voting = artifacts.require("Voting")

module.exports = function(deployer) {
  deployer.deploy(Voting)
}
