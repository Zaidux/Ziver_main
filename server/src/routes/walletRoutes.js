const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const mpcController = require('../controllers/features/wallet/mpcController');
const assetController = require('../controllers/features/wallet/assetController');
const transactionController = require('../controllers/features/wallet/transactionController');
const policyController = require('../controllers/features/wallet/policyController');
const recoveryController = require('../controllers/features/wallet/recoveryController');
const gasController = require('../controllers/features/wallet/gasController');
const guardianController = require('../controllers/features/wallet/guardianController');

const router = express.Router();

// MPC Wallet Management
router.post('/create', protect, mpcController.createWallet);
router.get('/status', protect, mpcController.getWalletStatus);
router.post('/validate-shards', protect, mpcController.validateShards);

// Asset Management
router.get('/balances', protect, assetController.getBalances);
router.get('/transactions', protect, assetController.getTransactionHistory);

// Transactions
router.post('/simulate', protect, transactionController.simulateTransaction);
router.post('/send', protect, transactionController.sendTransaction);
router.get('/transaction-status', protect, transactionController.getTransactionStatus);

// Gas Estimation
router.post('/gas/estimate', protect, gasController.estimateFees);
router.get('/gas/prices', protect, gasController.getGasPrices);
router.get('/gas/token-prices', protect, gasController.getTokenPrices);

// Spending Policies
router.post('/policies', protect, policyController.createPolicy);
router.get('/policies', protect, policyController.getPolicies);
router.delete('/policies/:id', protect, policyController.deletePolicy);

// Guardians Management
router.post('/guardians', protect, guardianController.addGuardian);
router.get('/guardians', protect, guardianController.getGuardians);
router.put('/guardians/:id', protect, guardianController.updateGuardian);
router.delete('/guardians/:id', protect, guardianController.removeGuardian);

// Social Recovery
router.post('/recovery/initiate', protect, recoveryController.initiateRecovery);
router.post('/recovery/vote', protect, recoveryController.voteOnRecovery);
router.get('/recovery/status', protect, recoveryController.getRecoveryStatus);

module.exports = router;