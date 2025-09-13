/**
 * Decentralized Voting System - Web3 Application
 * Author: sarveshadk
 * Blockchain-powered voting platform
 */

// Global variables
let web3;
let votingContract;
let currentAccount;

// You need to replace this with your actual deployed contract address
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

// Contract ABI - This should match your Voting.sol contract
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "name", "type": "string"},
      {"internalType": "string", "name": "party", "type": "string"}
    ],
    "name": "addCandidate",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "_startDate", "type": "uint256"},
      {"internalType": "uint256", "name": "_endDate", "type": "uint256"}
    ],
    "name": "setDates",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDates",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCountCandidates",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "candidateID", "type": "uint256"}],
    "name": "getCandidate",
    "outputs": [
      {"internalType": "uint256", "name": "", "type": "uint256"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "candidateID", "type": "uint256"}],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "checkVote",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Initialize Web3 and connect to MetaMask
async function initWeb3() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      currentAccount = accounts[0];
      
      // Initialize contract (only if CONTRACT_ADDRESS is set)
      if (CONTRACT_ADDRESS !== "YOUR_CONTRACT_ADDRESS_HERE") {
        votingContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      }
      
      updateUI();
      return true;
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      showMessage('Failed to connect to MetaMask', 'error');
      return false;
    }
  } else {
    console.error('MetaMask not detected');
    showMessage('Please install MetaMask to use this application', 'error');
    return false;
  }
}

// Update UI with current account
function updateUI() {
  const accountElement = document.getElementById('accountAddress');
  if (accountElement && currentAccount) {
    accountElement.textContent = `Your Account: ${currentAccount}`;
  }
  
  // Load voting data if contract is available
  if (votingContract) {
    loadVotingData();
  }
}

// Load all voting data
async function loadVotingData() {
  try {
    await loadCandidates();
    await loadVotingDates();
    await checkVoteStatus();
  } catch (error) {
    console.error('Error loading voting data:', error);
  }
}

// Load candidates
async function loadCandidates() {
  if (!votingContract) return;
  
  try {
    const candidateCount = await votingContract.methods.getCountCandidates().call();
    const candidatesList = document.getElementById('boxCandidate');
    
    if (candidatesList) {
      candidatesList.innerHTML = '';
      
      for (let i = 1; i <= candidateCount; i++) {
        const candidate = await votingContract.methods.getCandidate(i).call();
        const [id, name, party, voteCount] = candidate;
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <input type="radio" name="candidate" value="${id}" id="candidate${id}">
            ${name}
          </td>
          <td>${party}</td>
          <td>${voteCount}</td>
          <td>
            <input type="radio" name="candidate" value="${id}">
          </td>
        `;
        candidatesList.appendChild(row);
      }
    }
  } catch (error) {
    console.error('Error loading candidates:', error);
  }
}

// Load voting dates
async function loadVotingDates() {
  if (!votingContract) return;
  
  try {
    const dates = await votingContract.methods.getDates().call();
    const datesElement = document.getElementById('dates');
    
    if (datesElement) {
      if (dates[0] == 0 && dates[1] == 0) {
        datesElement.textContent = 'Not set yet';
      } else {
        const startDate = new Date(dates[0] * 1000);
        const endDate = new Date(dates[1] * 1000);
        datesElement.textContent = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      }
    }
  } catch (error) {
    console.error('Error loading dates:', error);
  }
}

// Check if user has voted
async function checkVoteStatus() {
  if (!votingContract || !currentAccount) return;
  
  try {
    const hasVoted = await votingContract.methods.checkVote().call({ from: currentAccount });
    const voteButton = document.getElementById('voteButton');
    const msgDiv = document.getElementById('msg');
    
    if (hasVoted) {
      if (voteButton) voteButton.disabled = true;
      if (msgDiv) showMessage('You have already voted!', 'error');
    } else {
      if (voteButton) voteButton.disabled = false;
    }
  } catch (error) {
    console.error('Error checking vote status:', error);
  }
}

// Add candidate
async function addCandidate() {
  if (!votingContract) {
    showMessage('Contract not connected', 'error');
    return;
  }
  
  const nameInput = document.getElementById('name');
  const partyInput = document.getElementById('party');
  
  if (!nameInput || !partyInput) return;
  
  const name = nameInput.value.trim();
  const party = partyInput.value.trim();
  
  if (!name || !party) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  
  try {
    const result = await votingContract.methods.addCandidate(name, party).send({
      from: currentAccount,
      gas: 500000
    });
    
    showMessage('Candidate added successfully!', 'success');
    nameInput.value = '';
    partyInput.value = '';
    
    // Reload candidates
    await loadCandidates();
    
  } catch (error) {
    console.error('Error adding candidate:', error);
    showMessage('Error adding candidate. Please try again.', 'error');
  }
}

// Set voting dates
async function setVotingDates() {
  if (!votingContract) {
    showMessage('Contract not connected', 'error');
    return;
  }
  
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (!startDateInput || !endDateInput) return;
  
  const startDate = startDateInput.value;
  const endDate = endDateInput.value;
  
  if (!startDate || !endDate) {
    showMessage('Please select both start and end dates', 'error');
    return;
  }
  
  const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
  const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000);
  
  if (startTimestamp >= endTimestamp) {
    showMessage('End date must be after start date', 'error');
    return;
  }
  
  try {
    const result = await votingContract.methods.setDates(startTimestamp, endTimestamp).send({
      from: currentAccount,
      gas: 300000
    });
    
    showMessage('Voting dates set successfully!', 'success');
    await loadVotingDates();
    
  } catch (error) {
    console.error('Error setting dates:', error);
    showMessage('Error setting dates. Please try again.', 'error');
  }
}

// Cast vote
async function castVote() {
  if (!votingContract) {
    showMessage('Contract not connected', 'error');
    return;
  }
  
  const selectedCandidate = document.querySelector('input[name="candidate"]:checked');
  
  if (!selectedCandidate) {
    showMessage('Please select a candidate', 'error');
    return;
  }
  
  const candidateId = selectedCandidate.value;
  
  try {
    const result = await votingContract.methods.vote(candidateId).send({
      from: currentAccount,
      gas: 300000
    });
    
    showMessage('Vote cast successfully!', 'success');
    
    // Disable vote button and reload data
    const voteButton = document.getElementById('voteButton');
    if (voteButton) voteButton.disabled = true;
    
    await loadCandidates();
    
  } catch (error) {
    console.error('Error voting:', error);
    showMessage('Error casting vote. Please try again.', 'error');
  }
}

// Show message utility
function showMessage(message, type) {
  // Try to find specific message containers first
  let messageContainer = document.getElementById('candidateMessage') || 
                        document.getElementById('dateMessage') || 
                        document.getElementById('msg');
  
  if (!messageContainer) {
    // Create a temporary message container
    messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px;
      border-radius: 5px;
      z-index: 1000;
      max-width: 300px;
    `;
    document.body.appendChild(messageContainer);
  }
  
  messageContainer.className = `message ${type}`;
  messageContainer.textContent = message;
  messageContainer.style.display = 'block';
  
  // Hide message after 5 seconds
  setTimeout(() => {
    if (messageContainer.parentNode === document.body) {
      document.body.removeChild(messageContainer);
    } else {
      messageContainer.style.display = 'none';
    }
  }, 5000);
}

// Event listeners
document.addEventListener('DOMContentLoaded', async function() {
  // Initialize Web3
  await initWeb3();
  
  // Add event listeners for buttons
  const addCandidateBtn = document.getElementById('addCandidate');
  if (addCandidateBtn) {
    addCandidateBtn.addEventListener('click', addCandidate);
  }
  
  const addDateBtn = document.getElementById('addDate');
  if (addDateBtn) {
    addDateBtn.addEventListener('click', setVotingDates);
  }
  
  const voteBtn = document.getElementById('voteButton');
  if (voteBtn) {
    voteBtn.addEventListener('click', castVote);
  }
});

// Global App object for compatibility
window.App = {
  vote: castVote,
  addCandidate: addCandidate,
  setDates: setVotingDates,
  init: initWeb3
};
