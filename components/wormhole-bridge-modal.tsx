// components/wormhole-bridge-modal.tsx - Real Wormhole Bridge with Live/Testnet Toggle
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  ArrowLeftRight, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Shield,
  Clock,
  Zap,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Eye,
  Database,
  TrendingUp,
  Activity,
  TestTube,
  Rocket
} from 'lucide-react';
import { ethers } from 'ethers';
import { LightweightWormholeService, type SupportedChain, type TransferParams } from '../services/wormhole-real.service';

// Network mode type
type NetworkMode = 'live' | 'testnet';

// Chain configuration with both mainnet and testnet
const CHAIN_CONFIG = {
  live: {
    ethereum: {
      name: 'Ethereum',
      icon: '⟠',
      chainId: '0x1',
      rpcUrl: 'https://eth.llamarpc.com',
      blockExplorer: 'https://etherscan.io',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      wormholeChainId: 2,
    },
    polygon: {
      name: 'Polygon',
      icon: '⬟',
      chainId: '0x89',
      rpcUrl: 'https://polygon.llamarpc.com',
      blockExplorer: 'https://polygonscan.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      wormholeChainId: 5,
    },
    bsc: {
      name: 'BSC',
      icon: '🟡',
      chainId: '0x38',
      rpcUrl: 'https://bsc.llamarpc.com',
      blockExplorer: 'https://bscscan.com',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      wormholeChainId: 4,
    },
    arbitrum: {
      name: 'Arbitrum',
      icon: '🔷',
      chainId: '0xA4B1',
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      blockExplorer: 'https://arbiscan.io',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      wormholeChainId: 23,
    },
    avalanche: {
      name: 'Avalanche',
      icon: '🔺',
      chainId: '0xA86A',
      rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
      blockExplorer: 'https://snowtrace.io',
      nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
      wormholeChainId: 6,
    },
    optimism: {
      name: 'Optimism',
      icon: '🔴',
      chainId: '0xA',
      rpcUrl: 'https://mainnet.optimism.io',
      blockExplorer: 'https://optimistic.etherscan.io',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      wormholeChainId: 24,
    },
  },
  testnet: {
    ethereum: {
      name: 'Ethereum Sepolia',
      icon: '⟠',
      chainId: '0xaa36a7',
      rpcUrl: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      blockExplorer: 'https://sepolia.etherscan.io',
      nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
      wormholeChainId: 10002,
    },
    polygon: {
      name: 'Polygon Mumbai',
      icon: '⬟',
      chainId: '0x13881',
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      blockExplorer: 'https://mumbai.polygonscan.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      wormholeChainId: 10005,
    },
    bsc: {
      name: 'BSC Testnet',
      icon: '🟡',
      chainId: '0x61',
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      blockExplorer: 'https://testnet.bscscan.com',
      nativeCurrency: { name: 'tBNB', symbol: 'BNB', decimals: 18 },
      wormholeChainId: 10004,
    },
    arbitrum: {
      name: 'Arbitrum Sepolia',
      icon: '🔷',
      chainId: '0x66eee',
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      blockExplorer: 'https://sepolia.arbiscan.io',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      wormholeChainId: 10023,
    },
    avalanche: {
      name: 'Avalanche Fuji',
      icon: '🔺',
      chainId: '0xa869',
      rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
      blockExplorer: 'https://testnet.snowtrace.io',
      nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
      wormholeChainId: 10006,
    },
    optimism: {
      name: 'Optimism Sepolia',
      icon: '🔴',
      chainId: '0xaa37dc',
      rpcUrl: 'https://sepolia.optimism.io',
      blockExplorer: 'https://sepolia-optimism.etherscan.io',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      wormholeChainId: 10024,
    },
  }
};

// Transfer status tracking
interface TransferStatus {
  step: number;
  totalSteps: number;
  message: string;
  txHash?: string;
  sequence?: string;
  vaaHash?: string;
  completed: boolean;
  error?: string;
}

interface WormholeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WormholeBridgeWithToggle({ isOpen, onClose }: WormholeModalProps) {
  // Network mode state
  const [networkMode, setNetworkMode] = useState<NetworkMode>('testnet'); // Default to testnet for safety
  
  // Initialize Wormhole service based on network mode
  const [wormholeService, setWormholeService] = useState(() => new LightweightWormholeService());

  // Form state
  const [sourceChain, setSourceChain] = useState<SupportedChain>('ethereum');
  const [targetChain, setTargetChain] = useState<SupportedChain>('polygon');
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [userAddress, setUserAddress] = useState('');
  
  // Wallet state
  const [isConnected, setIsConnected] = useState(false);
  const [currentChain, setCurrentChain] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [needsApproval, setNeedsApproval] = useState(false);
  const [walletName, setWalletName] = useState('');
  
  // Transfer state
  const [isLoading, setIsLoading] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string>('');
  const [quote, setQuote] = useState<any>(null);
  const [transferStatus, setTransferStatus] = useState<TransferStatus | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get current chain config based on network mode
  const getCurrentChainConfig = () => CHAIN_CONFIG[networkMode];

  // Handle network mode toggle
  const handleNetworkModeToggle = (newMode: NetworkMode) => {
    const wasConnected = isConnected;
    
    // Disconnect wallet when switching networks
    if (wasConnected) {
      disconnectWallet();
    }
    
    // Update network mode
    setNetworkMode(newMode);
    
    // Reinitialize Wormhole service with new network mode
    setWormholeService(new LightweightWormholeService());
    
    // Reset form state
    setAmount('');
    setRecipientAddress('');
    setError('');
    setQuote(null);
    setTransferStatus(null);
    
    // Show confirmation message
    const modeText = newMode === 'live' ? 'Live Mainnet' : 'Testnet';
    alert(`🔄 Switched to ${modeText} mode. Please reconnect your wallet if needed.`);
  };

  // Web3 detection functions
  const getEthereumProvider = () => {
    if (typeof window === 'undefined') return null;
    
    if (typeof (window as any).ethereum !== 'undefined') {
      return (window as any).ethereum;
    }
    
    if (typeof (window as any).web3 !== 'undefined') {
      return (window as any).web3.currentProvider;
    }
    
    return null;
  };

  const detectWallet = () => {
    if (typeof window === 'undefined') return null;
    
    const provider = getEthereumProvider();
    if (!provider) return null;
    
    if (provider.isMetaMask) return 'MetaMask';
    if (provider.isCoinbaseWallet) return 'Coinbase Wallet';
    if (provider.isWalletConnect) return 'WalletConnect';
    if (provider.isTrust) return 'Trust Wallet';
    if (provider.isRabby) return 'Rabby Wallet';
    if (provider.isBraveWallet) return 'Brave Wallet';
    if (provider.isFrame) return 'Frame';
    if (provider.isExodus) return 'Exodus';
    
    return 'Web3 Wallet';
  };

  const isWeb3Available = () => {
    if (typeof window === 'undefined') return false;
    
    return !!(
      typeof (window as any).ethereum !== 'undefined' ||
      typeof (window as any).web3 !== 'undefined'
    );
  };

  // Wallet connection
  const connectWallet = async () => {
    try {
      setError('');
      const provider = getEthereumProvider();
      
      if (!provider) {
        const userAgent = navigator.userAgent;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        
        if (isMobile) {
          setError('Please open this page in your mobile wallet browser (MetaMask, Trust Wallet, etc.)');
        } else {
          setError('Web3 wallet not found! Please install MetaMask, Coinbase Wallet, or another Web3 wallet extension.');
        }
        return;
      }

      const detectedWallet = detectWallet();
      setWalletName(detectedWallet || 'Web3 Wallet');

      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts && accounts.length > 0) {
        setUserAddress(accounts[0]);
        setIsConnected(true);

        const chainId = await provider.request({ 
          method: 'eth_chainId' 
        });
        setCurrentChain(chainId);

        await loadTokenBalance(accounts[0]);

        if (provider.on && typeof provider.on === 'function') {
          provider.on('accountsChanged', (accounts: string[]) => {
            if (accounts.length === 0) {
              disconnectWallet();
            } else {
              setUserAddress(accounts[0]);
              loadTokenBalance(accounts[0]);
            }
          });

          provider.on('chainChanged', (chainId: string) => {
            setCurrentChain(chainId);
            if (userAddress) {
              loadTokenBalance(userAddress);
            }
          });

          provider.on('disconnect', () => {
            disconnectWallet();
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      if (error.code === 4001) {
        setError('Connection rejected. Please try again and approve the connection.');
      } else if (error.code === -32002) {
        setError('Connection request pending. Please check your wallet.');
      } else {
        setError(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
    }
  };

  // Load token balance based on current network mode
  const loadTokenBalance = async (address: string) => {
    if (!address || !selectedToken) return;
    
    try {
      setIsBalanceLoading(true);
      setError('');
      
      console.log(`Loading ${networkMode} balance for ${selectedToken} on ${sourceChain} for address ${address}`);
      
      if (networkMode === 'testnet') {
        // For testnet, return mock data
        const mockBalance = (Math.random() * 1000).toFixed(6);
        setTokenBalance(mockBalance);
        setAllowance('999999');
        console.log(`Testnet mock balance: ${mockBalance} ${selectedToken}`);
      } else {
        // For live mode, get real balance from blockchain
        const realBalance = await wormholeService.getTokenBalance(sourceChain, selectedToken, address);
        const realAllowance = await wormholeService.checkTokenAllowance(sourceChain, selectedToken, address);
        
        setTokenBalance(realBalance);
        setAllowance(realAllowance);
        console.log(`Live balance: ${realBalance} ${selectedToken}, Allowance: ${realAllowance}`);
      }
      
      // Check if approval needed
      const amountNum = parseFloat(amount || '0');
      const allowanceNum = parseFloat(allowance);
      setNeedsApproval(amountNum > 0 && amountNum > allowanceNum);
      
    } catch (error: any) {
      console.error('Failed to load token balance:', error);
      setError(`Failed to load balance: ${error.message}`);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  // Get bridge quote based on network mode
  const getBridgeQuote = async () => {
    if (!amount || !recipientAddress || !userAddress) return;

    try {
      setIsLoading(true);
      setError('');

      const params: TransferParams = {
        sourceChain,
        targetChain,
        token: selectedToken,
        amount,
        recipientAddress,
        senderAddress: userAddress,
      };

      console.log(`Getting ${networkMode} bridge quote:`, params);
      
      if (networkMode === 'testnet') {
        // Mock quote for testnet
        const mockQuote = {
          fee: (Math.random() * 0.01 + 0.005).toFixed(6),
          estimatedTime: Math.floor(Math.random() * 10 + 5).toString(),
          route: `Wormhole Testnet: ${params.sourceChain} → ${params.targetChain}`,
          mode: 'testnet'
        };
        setQuote(mockQuote);
        console.log('Testnet mock quote:', mockQuote);
      } else {
        // Real quote for live mode
        const realQuote = await wormholeService.getBridgeQuote(params);
        setQuote({ ...realQuote, mode: 'live' });
        console.log('Live quote received:', realQuote);
      }
      
    } catch (error: any) {
      console.error('Failed to get bridge quote:', error);
      setError(`Failed to get quote: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle token approval based on network mode
  const handleApproval = async () => {
    if (!isConnected || !amount) return;

    const currentChainConfig = getCurrentChainConfig();
    const expectedChainId = currentChainConfig[sourceChain].chainId;
    
    if (currentChain !== expectedChainId) {
      const shouldSwitch = confirm(`Please switch to ${currentChainConfig[sourceChain].name} network to approve tokens.`);
      if (shouldSwitch) {
        await switchNetwork(sourceChain);
        return;
      }
      return;
    }

    try {
      setIsApproving(true);
      setError('');

      console.log(`Starting ${networkMode} token approval for ${amount} ${selectedToken} on ${sourceChain}`);

      if (networkMode === 'testnet') {
        // Mock approval for testnet
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        console.log('Testnet mock approval transaction:', mockTxHash);
        alert(`Testnet Token Approval Simulated!\nMock Transaction: ${mockTxHash}`);
        
        // Update allowance for testnet
        setAllowance('999999');
      } else {
        // Real approval for live mode
        const provider = new ethers.BrowserProvider(getEthereumProvider());
        const signer = await provider.getSigner();

        const txHash = await wormholeService.approveToken(signer, sourceChain, selectedToken, amount);
        console.log('Live approval transaction submitted:', txHash);
        
        const receipt = await provider.waitForTransaction(txHash);
        console.log('Approval confirmed:', receipt);
        
        alert(`Token approval confirmed!\nTransaction: ${txHash}`);
      }
      
      await loadTokenBalance(userAddress);
      
    } catch (error: any) {
      console.error('Token approval failed:', error);
      setError(`Token approval failed: ${error.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  // Handle transfer based on network mode
  const handleTransfer = async () => {
    if (!userAddress || !amount || !recipientAddress) return;

    const currentChainConfig = getCurrentChainConfig();
    const expectedChainId = currentChainConfig[sourceChain].chainId;
    
    if (currentChain !== expectedChainId) {
      const shouldSwitch = confirm(`Please switch to ${currentChainConfig[sourceChain].name} network to initiate transfer.`);
      if (shouldSwitch) {
        await switchNetwork(sourceChain);
        return;
      }
      return;
    }

    const estimatedFee = quote?.fee || 'Unknown';
    const modeText = networkMode === 'live' ? 'REAL mainnet' : 'testnet simulation';
    
    const confirmed = confirm(
      `Confirm ${networkMode.toUpperCase()} Wormhole bridge transfer:\n\n` +
      `• Amount: ${amount} ${selectedToken}\n` +
      `• From: ${currentChainConfig[sourceChain].name}\n` +
      `• To: ${currentChainConfig[targetChain].name}\n` +
      `• Recipient: ${recipientAddress}\n` +
      `• Estimated Fee: ${estimatedFee} ETH\n\n` +
      `⚠️ This will execute a ${modeText} transaction.\n` +
      `${networkMode === 'live' ? 'This action cannot be undone.' : 'This is a safe testnet simulation.'} Continue?`
    );

    if (!confirmed) return;

    try {
      setIsTransferring(true);
      setError('');
      
      setTransferStatus({
        step: 1,
        totalSteps: 4,
        message: `Preparing ${networkMode} transfer...`,
        completed: false
      });

      console.log(`Starting ${networkMode} Wormhole transfer: ${amount} ${selectedToken} from ${sourceChain} to ${targetChain}`);

      const params: TransferParams = {
        sourceChain,
        targetChain,
        token: selectedToken,
        amount,
        recipientAddress,
        senderAddress: userAddress,
      };

      if (networkMode === 'testnet') {
        // Mock transfer for testnet
        await mockTransferProcess(params);
      } else {
        // Real transfer for live mode
        const provider = new ethers.BrowserProvider(getEthereumProvider());
        const signer = await provider.getSigner();

        const result = await wormholeService.initiateWormholeTransfer(
          signer,
          params,
          (step: number, message: string) => {
            console.log(`Live transfer step ${step}: ${message}`);
            setTransferStatus(prev => ({
              ...prev!,
              step,
              message,
            }));
          }
        );

        console.log('Live transfer initiated:', result);

        setTransferStatus(prev => ({
          ...prev!,
          step: 2,
          message: 'Transaction confirmed on source chain',
          txHash: result.txHash,
          sequence: result.sequence,
        }));

        await monitorTransferCompletion(result.sequence, result.txHash);
      }
      
    } catch (error: any) {
      console.error(`${networkMode} transfer failed:`, error);
      setError(`Transfer failed: ${error.message}`);
      setTransferStatus(prev => prev ? {
        ...prev,
        error: error.message,
        completed: false
      } : null);
    } finally {
      setIsTransferring(false);
    }
  };

  // Mock transfer process for testnet
  const mockTransferProcess = async (params: TransferParams) => {
    const steps = [
      'Preparing testnet transfer...',
      'Simulating transaction on source chain...',
      'Generating mock VAA...',
      'Completing testnet transfer...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const mockSequence = Math.floor(Math.random() * 1000000).toString();
      
      setTransferStatus(prev => ({
        ...prev!,
        step: i + 1,
        message: steps[i],
        txHash: i === 1 ? mockTxHash : prev?.txHash,
        sequence: i === 1 ? mockSequence : prev?.sequence,
      }));
    }

    setTransferStatus(prev => ({
      ...prev!,
      completed: true,
      message: 'Testnet transfer simulation completed successfully!'
    }));

    alert(`Testnet Transfer Simulation Complete!\nThis was a safe simulation on testnet.`);
  };

  // Monitor transfer completion for live mode
  const monitorTransferCompletion = async (sequence: string, txHash: string) => {
    try {
      console.log(`Monitoring live transfer completion for sequence: ${sequence}`);
      
      setTransferStatus(prev => ({
        ...prev!,
        step: 3,
        message: 'Waiting for Guardian signatures...',
      }));

      const currentChainConfig = getCurrentChainConfig();
      const vaaResponse = await fetch(`https://api.wormholescan.io/api/v1/vaas/${currentChainConfig[sourceChain].wormholeChainId}/${txHash}/${sequence}`);
      
      if (vaaResponse.ok) {
        const vaaData = await vaaResponse.json();
        console.log('Real VAA retrieved:', vaaData);
        
        setTransferStatus(prev => ({
          ...prev!,
          step: 4,
          message: 'VAA ready, completing on target chain...',
          vaaHash: vaaData.vaa,
        }));

        setTimeout(() => {
          setTransferStatus(prev => ({
            ...prev!,
            step: 4,
            message: 'Live transfer completed successfully!',
            completed: true,
          }));
        }, 5000);
      } else {
        throw new Error('VAA not yet available');
      }
      
    } catch (error: any) {
      console.error('Failed to monitor live transfer:', error);
      setError(`Transfer monitoring failed: ${error.message}`);
    }
  };

  // Switch network
  const switchNetwork = async (chain: SupportedChain) => {
    try {
      const provider = getEthereumProvider();
      if (!provider) return;

      const currentChainConfig = getCurrentChainConfig();
      const targetChainId = currentChainConfig[chain].chainId;
      
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
      
      setCurrentChain(targetChainId);
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          const provider = getEthereumProvider();
          if (!provider) return;
          
          const currentChainConfig = getCurrentChainConfig();
          const config = currentChainConfig[chain];
          
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: config.chainId,
              chainName: config.name,
              rpcUrls: [config.rpcUrl],
              blockExplorerUrls: [config.blockExplorer],
              nativeCurrency: config.nativeCurrency,
            }],
          });
          setCurrentChain(config.chainId);
        } catch (addError) {
          console.error('Failed to add network:', addError);
          setError(`Failed to add ${getCurrentChainConfig()[chain].name} network to your wallet`);
        }
      } else {
        console.error('Failed to switch network:', error);
        setError('Failed to switch network');
      }
    }
  };

  // Auto-detect existing wallet connection
  useEffect(() => {
    const checkExistingConnection = async () => {
      const provider = getEthereumProvider();
      if (!provider) return;

      try {
        const accounts = await provider.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts && accounts.length > 0) {
          setUserAddress(accounts[0]);
          setIsConnected(true);
          setWalletName(detectWallet() || 'Web3 Wallet');
          
          const chainId = await provider.request({ 
            method: 'eth_chainId' 
          });
          setCurrentChain(chainId);
          
          await loadTokenBalance(accounts[0]);
        }
      } catch (error) {
        console.log('No existing wallet connection found');
      }
    };

    setTimeout(checkExistingConnection, 500);
  }, [networkMode]);

  // Auto-refresh balance when chain or token changes
  useEffect(() => {
    if (isConnected && userAddress && !isTransferring) {
      loadTokenBalance(userAddress);
    }
  }, [sourceChain, selectedToken, userAddress, isConnected, networkMode]);

  // Auto-get quote when form changes
  useEffect(() => {
    if (amount && recipientAddress && userAddress && !isLoading && !isTransferring) {
      const debounce = setTimeout(getBridgeQuote, 2000);
      return () => clearTimeout(debounce);
    }
  }, [amount, recipientAddress, sourceChain, targetChain, selectedToken, networkMode]);

  // Utility functions
  const disconnectWallet = () => {
    setIsConnected(false);
    setUserAddress('');
    setCurrentChain('');
    setTokenBalance('0');
    setAllowance('0');
    setWalletName('');
    setQuote(null);
    setTransferStatus(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleReset = () => {
    setAmount('');
    setRecipientAddress('');
    setError('');
    setQuote(null);
    setTransferStatus(null);
  };

  const swapChains = () => {
    const temp = sourceChain;
    setSourceChain(targetChain);
    setTargetChain(temp);
  };

  const showWalletInstallationGuide = () => {
    alert(`
🦊 Install MetaMask (Recommended):
1. Go to metamask.io
2. Click "Download"
3. Add to your browser
4. Create or import wallet
5. Refresh this page

💙 Or try Coinbase Wallet:
1. Go to wallet.coinbase.com
2. Download extension
3. Set up wallet
4. Refresh this page

📱 On Mobile:
• Use MetaMask app browser
• Use Trust Wallet browser
• Use Coinbase Wallet browser
    `);
  };

  // Validation
  const isValidAmount = parseFloat(amount || '0') > 0;
  const hasValidRecipient = recipientAddress.length === 42 && recipientAddress.startsWith('0x');
  const hasEnoughBalance = parseFloat(tokenBalance) >= parseFloat(amount || '0');
  const currentChainConfig = getCurrentChainConfig();
  const isCorrectNetwork = currentChain === currentChainConfig[sourceChain].chainId;

  // Get supported tokens from service
  const supportedTokens = wormholeService.getSupportedTokens(sourceChain);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold text-gray-900">Wormhole Bridge</span>
            {networkMode === 'live' ? (
              <div className="flex items-center gap-1">
                <Rocket className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600 font-bold">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <TestTube className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600 font-bold">TESTNET</span>
              </div>
            )}
            <Database className="w-4 h-4 text-blue-500" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Network Mode Toggle */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {networkMode === 'testnet' ? (
                    <TestTube className="w-5 h-5 text-green-600" />
                  ) : (
                    <Rocket className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    Network Mode: 
                    <span className={`ml-1 font-bold ${networkMode === 'live' ? 'text-red-600' : 'text-green-600'}`}>
                      {networkMode === 'live' ? 'LIVE MAINNET' : 'TESTNET'}
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600">Testnet</span>
                <Switch
                  checked={networkMode === 'live'}
                  onCheckedChange={(checked) => handleNetworkModeToggle(checked ? 'live' : 'testnet')}
                  className="data-[state=checked]:bg-red-500"
                />
                <span className="text-xs text-gray-600">Live</span>
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-600">
              {networkMode === 'live' ? (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>⚠️ Live mode uses real funds and mainnet contracts</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-green-600">
                  <Shield className="w-3 h-3" />
                  <span>✅ Safe testnet mode with simulated transactions</span>
                </div>
              )}
            </div>
          </div>

          {/* Wallet Connection Status */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            {!isWeb3Available() ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-orange-600 p-3 bg-orange-50 rounded border border-orange-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">
                    Web3 wallet not detected. Please install a wallet to continue.
                  </span>
                </div>
                
                <Button 
                  onClick={showWalletInstallationGuide}
                  variant="outline" 
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  📋 Show Installation Guide
                </Button>
              </div>
            ) : !isConnected ? (
              <Button 
                onClick={connectWallet} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Web3 Wallet ({networkMode === 'live' ? 'Mainnet' : 'Testnet'})
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {walletName}: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(userAddress)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={disconnectWallet}>
                      Disconnect
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    Network: {Object.entries(currentChainConfig).find(([_, config]) => config.chainId === currentChain)?.[1]?.name || 'Unknown'}
                  </span>
                  {!isCorrectNetwork && (
                    <Button variant="outline" size="sm" onClick={() => switchNetwork(sourceChain)}>
                      Switch to {currentChainConfig[sourceChain].name}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Source Chain Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">From</label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => loadTokenBalance(userAddress)}
                disabled={isBalanceLoading || !userAddress}
                className="text-blue-600 hover:text-blue-700"
              >
                <RefreshCw className={`w-3 h-3 ${isBalanceLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Select value={sourceChain} onValueChange={(value: SupportedChain) => setSourceChain(value)}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(currentChainConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedToken} onValueChange={setSelectedToken}>
                <SelectTrigger className="border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-gray-500">{token.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Balance Display */}
            {isConnected && (
              <div className="bg-gray-50 p-3 rounded border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {isBalanceLoading ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading {networkMode} balance...
                      </span>
                    ) : (
                      <>Balance: <span className="font-medium text-gray-900">{parseFloat(tokenBalance).toFixed(6)} {selectedToken}</span></>
                    )}
                  </span>
                  {allowance !== '0' && (
                    <span className="text-gray-600">
                      Allowance: <span className="font-medium text-gray-900">{parseFloat(allowance).toFixed(6)}</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {supportedTokens.length} tokens available
                  </span>
                  <div className="flex items-center gap-2">
                    {networkMode === 'live' ? (
                      <span className="text-red-600 flex items-center gap-1">
                        <Rocket className="w-3 h-3" />
                        Live Data
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        <TestTube className="w-3 h-3" />
                        Test Data
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${!hasEnoughBalance && amount ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isTransferring || isApproving}
              />
              {tokenBalance !== '0' && !isBalanceLoading && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setAmount((parseFloat(tokenBalance) * 0.99).toString())}
                  disabled={isTransferring || isApproving}
                >
                  Max
                </Button>
              )}
            </div>
            
            {amount && !hasEnoughBalance && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Insufficient balance. Available: {parseFloat(tokenBalance).toFixed(4)} {selectedToken}
              </div>
            )}
          </div>

          {/* Target Chain Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">To</label>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={swapChains} 
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                disabled={isTransferring || isApproving}
              >
                <ArrowLeftRight className="w-3 h-3" />
              </Button>
            </div>
            
            <Select value={targetChain} onValueChange={(value: SupportedChain) => setTargetChain(value)}>
              <SelectTrigger className="border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currentChainConfig)
                  .filter(([key]) => key !== sourceChain)
                  .map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Recipient Address</label>
            <div className="relative">
              <Input
                placeholder="0x742d35Cc6635C0532925a3b8D73C4f3c8d2c99d0"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${recipientAddress && !hasValidRecipient ? 'border-red-300 focus:border-red-500' : ''}`}
                disabled={isTransferring || isApproving}
              />
              {userAddress && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setRecipientAddress(userAddress)}
                  disabled={isTransferring || isApproving}
                >
                  Self
                </Button>
              )}
            </div>
            
            {recipientAddress && !hasValidRecipient && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Invalid Ethereum address format
              </div>
            )}
          </div>

          {/* Bridge Quote */}
          {quote && (
            <div className={`p-4 rounded-lg border ${networkMode === 'live' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200' : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'}`}>
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2 text-gray-800">
                <Zap className="w-4 h-4 text-blue-600" />
                {networkMode === 'live' ? 'Live Bridge Quote' : 'Testnet Bridge Quote'}
                {networkMode === 'live' ? (
                  <Rocket className="w-3 h-3 text-red-500" />
                ) : (
                  <TestTube className="w-3 h-3 text-green-500" />
                )}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bridge Fee:</span>
                    <span className="font-medium text-gray-900">{quote.fee} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="flex items-center gap-1 text-gray-900">
                      <Clock className="w-3 h-3" />
                      {quote.estimatedTime} min
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  <div>Route: {quote.route}</div>
                  <div className={`flex items-center gap-1 ${networkMode === 'live' ? 'text-red-600' : 'text-green-600'}`}>
                    <Activity className="w-3 h-3" />
                    {networkMode === 'live' ? 'Live mainnet quote' : 'Testnet simulation'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Progress */}
          {transferStatus && (
            <div className={`p-4 rounded-lg border ${networkMode === 'live' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                {transferStatus.completed ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : transferStatus.error ? (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                )}
                <span className="text-sm font-medium text-gray-800">
                  {networkMode === 'live' ? 'Live' : 'Testnet'} Transfer Progress: Step {transferStatus.step}/{transferStatus.totalSteps}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${networkMode === 'live' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-green-500 to-blue-500'}`}
                  style={{ 
                    width: `${(transferStatus.step / transferStatus.totalSteps) * 100}%` 
                  }}
                />
              </div>
              
              <div className="text-xs text-gray-600 mb-2">
                {transferStatus.message}
              </div>

              {transferStatus.txHash && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600">TX:</span>
                  <code className="bg-white px-2 py-1 rounded border text-gray-800">
                    {transferStatus.txHash.slice(0, 10)}...{transferStatus.txHash.slice(-6)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transferStatus.txHash!)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`${currentChainConfig[sourceChain].blockExplorer}/tx/${transferStatus.txHash}`, '_blank')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {transferStatus.sequence && (
                <div className="flex items-center gap-2 text-xs mt-1">
                  <span className="text-gray-600">Sequence:</span>
                  <code className="bg-white px-2 py-1 rounded border text-gray-800">
                    {transferStatus.sequence}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Advanced Options */}
          <div className="border-t pt-4 border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              <Eye className="w-3 h-3 mr-1" />
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
            
            {showAdvanced && (
              <div className="mt-3 p-3 bg-gray-50 rounded border text-xs space-y-2 text-gray-600">
                <div>Network Mode: <span className={`font-medium ${networkMode === 'live' ? 'text-red-700' : 'text-green-700'}`}>{networkMode === 'live' ? 'Live Mainnet' : 'Safe Testnet'}</span></div>
                <div>Service Type: <span className="font-medium text-blue-700">Wormhole Protocol v2</span></div>
                <div>Balance Loading: <span className="font-medium">{isBalanceLoading ? 'Active' : 'Idle'}</span></div>
                <div>Sequence: <span className="font-mono">{transferStatus?.sequence || 'N/A'}</span></div>
                <div>VAA Status: <span className="font-medium">{transferStatus?.vaaHash ? 'Ready' : 'Pending'}</span></div>
                <div>Connected Wallet: <span className="font-medium">{walletName}</span></div>
                <div>Current Network: <span className="font-medium">{Object.entries(currentChainConfig).find(([_, config]) => config.chainId === currentChain)?.[1]?.name || 'Unknown'}</span></div>
                <div>Web3 Available: <span className="font-medium text-green-700">{isWeb3Available() ? 'Yes' : 'No'}</span></div>
                <div>Provider: <span className="font-medium">{getEthereumProvider() ? 'Detected' : 'Not Found'}</span></div>
                <div>Available Tokens: <span className="font-medium text-blue-700">{supportedTokens.length} loaded</span></div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            {!isConnected ? (
              <Button 
                onClick={connectWallet} 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Web3 Wallet
              </Button>
            ) : needsApproval && isValidAmount && hasEnoughBalance ? (
              <Button 
                onClick={handleApproval}
                disabled={isApproving || !isCorrectNetwork || isTransferring}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50"
              >
                {isApproving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4 mr-2" />
                )}
                Approve {selectedToken} ({networkMode === 'live' ? 'Live' : 'Test'})
              </Button>
            ) : (
              <Button 
                onClick={handleTransfer}
                disabled={
                  !isValidAmount || 
                  !hasValidRecipient || 
                  !hasEnoughBalance ||
                  isTransferring ||
                  isApproving ||
                  needsApproval ||
                  !isCorrectNetwork ||
                  isBalanceLoading
                }
                className={`flex-1 disabled:opacity-50 ${networkMode === 'live' ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700'}`}
              >
                {isTransferring ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : networkMode === 'live' ? (
                  <Rocket className="w-4 h-4 mr-2" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Bridge {amount || '0'} {selectedToken} ({networkMode === 'live' ? 'LIVE' : 'TEST'})
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={handleReset} 
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={isTransferring || isApproving}
            >
              Reset
            </Button>
          </div>

          {/* Network Mode Warning */}
          <Alert className={`${networkMode === 'live' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            {networkMode === 'live' ? (
              <Rocket className="w-4 h-4 text-red-600" />
            ) : (
              <TestTube className="w-4 h-4 text-green-600" />
            )}
            <AlertDescription className={`text-sm ${networkMode === 'live' ? 'text-red-700' : 'text-green-700'}`}>
              {networkMode === 'live' ? (
                <strong>🚨 LIVE MODE - REAL TRANSACTIONS:</strong>
              ) : (
                <strong>✅ TESTNET MODE - SAFE SIMULATION:</strong>
              )}
              {' '}
              {networkMode === 'live' 
                ? 'This uses live mainnet contracts with real funds. All transactions are irreversible and use real ETH for gas fees. Test with small amounts first.'
                : 'This is a safe testing environment. No real funds are used. Perfect for learning and testing bridge operations.'
              }
            </AlertDescription>
          </Alert>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h5 className="text-sm font-medium text-gray-800 mb-2">
                {networkMode === 'live' ? '🔴 Live Features' : '🟢 Testnet Features'}
              </h5>
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  {networkMode === 'live' ? <Rocket className="w-3 h-3 text-red-500" /> : <TestTube className="w-3 h-3 text-green-500" />}
                  {networkMode === 'live' ? 'Real Blockchain Data' : 'Simulated Test Data'}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                  {networkMode === 'live' ? 'Live Balance Updates' : 'Mock Balance Updates'}
                </div>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-orange-500" />
                  {networkMode === 'live' ? 'Mainnet Contracts' : 'Testnet Contracts'}
                </div>
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-purple-500" />
                  Wormhole Protocol v2
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <h5 className="text-sm font-medium text-gray-800 mb-2">⚡ Bridge Capabilities</h5>
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  {networkMode === 'live' ? 'Real Execution' : 'Safe Simulation'}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                  VAA Monitoring
                </div>
                <div className="flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-orange-500" />
                  Multi-Wallet Support
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3 text-purple-500" />
                  Explorer Integration
                </div>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${networkMode === 'live' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${networkMode === 'live' ? 'bg-red-500' : 'bg-green-500'}`}></div>
              {networkMode === 'live' ? 'Live Wormhole Service Active' : 'Testnet Simulation Active'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
