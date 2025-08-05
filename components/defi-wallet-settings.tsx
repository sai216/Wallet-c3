// components/wallet-grid.tsx
"use client"

import { useState, useEffect } from "react"
import { WalletCard } from "./wallet-card"

// Types
interface WalletData {
  name: string;
  address: string;
  balance: string;
  withdrawableAssets: string;
  depositAsset: string;
  isLoading?: boolean;
}

interface JupiterBalance {
  amount: string;
  uiAmount: number;
  decimals: number;
  mint: string;
  symbol?: string;
}

const WALLET_ADDRESSES = {
  smartWallet: "0x609E83a8dE16f5a8332204E7ceb61832e8e40F0B",// BASE
  palmeraWallet: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//SOL
  farcaster1: "0x609E83a8dE16f5a8332204E7ceb61832e8e40F0B",//ETH
  farcaster2: "bc1qnfjglwrpqxya8fsjljxwg9heam30sn83fuhsku",//BTC
  customWallet1: "0x609E83a8dE16f5a8332204E7ceb61832e8e40F0B",//ETH
  customWallet2: "bc1qnfjglwrpqxya8fsjljxwg9heam30sn83fuhsku",//btc
  privyWallet1: "0x609E83a8dE16f5a8332204E7ceb61832e8e40F0B",//BASE
  privyWallet2: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB"//SOL
}

// Jupiter API service
class JupiterAPIService {
  private static readonly BASE_URL = 'https://lite-api.jup.ag/ultra/v1'
  private static readonly PRICE_API = 'https://price.jup.ag/v6/price'
  
  static async getWalletBalances(address: string): Promise<JupiterBalance[]> {
    try {
      console.log(`Fetching balances for address: ${address}`)
      const response = await fetch(`${this.BASE_URL}/balances/${address}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log(`Received ${data.balances?.length || 0} token balances for ${address}`)
      return data.balances || []
    } catch (error) {
      console.error(`Error fetching balances for ${address}:`, error)
      return []
    }
  }

  static async getTokenPrices(mints: string[]): Promise<Record<string, any>> {
    try {
      if (mints.length === 0) return {}
      const mintParams = mints.join(',')
      const response = await fetch(`${this.PRICE_API}?ids=${mintParams}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.data || {}
    } catch (error) {
      console.error('Error fetching token prices:', error)
      return {}
    }
  }

  static formatBalance(amount: string, decimals: number): number {
    return parseFloat(amount) / Math.pow(10, decimals)
  }

  static formatCurrency(balance: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance)
  }

  static async calculateWalletValue(balances: JupiterBalance[]): Promise<{
    totalValue: number;
    withdrawableValue: number;
    depositValue: number;
  }> {
    if (balances.length === 0) {
      return { totalValue: 0, withdrawableValue: 0, depositValue: 0 }
    }

    const mints = balances.map(b => b.mint).filter(Boolean)
    const prices = await this.getTokenPrices(mints)

    let totalValue = 0
    for (const balance of balances) {
      const tokenBalance = this.formatBalance(balance.amount, balance.decimals)
      const price = prices[balance.mint]?.price || 0
      const value = tokenBalance * price
      totalValue += value
    }

    const withdrawableValue = totalValue * 0.7 // 70% withdrawable
    const depositValue = totalValue * 0.3 // 30% deposit

    return { totalValue, withdrawableValue, depositValue }
  }
}

// NO MOCK DATA - All wallets start with $0.00
const initialWalletData: WalletData[] = [
  // Top row wallets (positions 1-4)
  {
    name: "Smart Wallet",
    address: WALLET_ADDRESSES.smartWallet,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
  {
    name: "Palmera Wallet",
    address: WALLET_ADDRESSES.palmeraWallet,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
  {
    name: "Farcaster 1",
    address: WALLET_ADDRESSES.farcaster1,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
  {
    name: "Farcaster 2",
    address: WALLET_ADDRESSES.farcaster2,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
  // Bottom row wallets (positions 5-8)
  {
    name: "Custom Wallet 1",
    address: WALLET_ADDRESSES.customWallet1,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
  {
    name: "Custom Wallet 2",
    address: WALLET_ADDRESSES.customWallet2,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
  {
    name: "Privy Wallet 1",
    address: WALLET_ADDRESSES.privyWallet1,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
  {
    name: "Privy Wallet 2",
    address: WALLET_ADDRESSES.privyWallet2,
    balance: "$0.00",
    withdrawableAssets: "$0.00",
    depositAsset: "$0.00",
    isLoading: false
  },
]

export function WalletGrid() {
  const [walletData, setWalletData] = useState<WalletData[]>(initialWalletData)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchWalletData = async (wallet: WalletData): Promise<WalletData> => {
    try {
      const balances = await JupiterAPIService.getWalletBalances(wallet.address)
      
      if (balances.length > 0) {
        const { totalValue, withdrawableValue, depositValue } = await JupiterAPIService.calculateWalletValue(balances)

        return {
          ...wallet,
          balance: JupiterAPIService.formatCurrency(totalValue),
          withdrawableAssets: JupiterAPIService.formatCurrency(withdrawableValue),
          depositAsset: JupiterAPIService.formatCurrency(depositValue),
          isLoading: false
        }
      }
    } catch (error) {
      console.error(`Error fetching data for wallet ${wallet.name}:`, error)
    }

    // Return $0.00 if no balances found or API fails
    return {
      ...wallet,
      balance: "$0.00",
      withdrawableAssets: "$0.00",
      depositAsset: "$0.00",
      isLoading: false
    }
  }

  const updateAllWallets = async () => {
    setIsUpdating(true)
    
    // Set all wallets to loading state
    setWalletData(prev => prev.map(wallet => ({ ...wallet, isLoading: true })))
    
    try {
      const updatedWallets = await Promise.all(
        initialWalletData.map(wallet => fetchWalletData(wallet))
      )
      setWalletData(updatedWallets)
    } catch (error) {
      console.error('Error updating wallet data:', error)
      // Reset to $0.00 if all fails
      setWalletData(prev => prev.map(wallet => ({
        ...wallet,
        balance: "$0.00",
        withdrawableAssets: "$0.00",
        depositAsset: "$0.00",
        isLoading: false
      })))
    } finally {
      setIsUpdating(false)
    }
  }

  // Listen for the wallet settings trigger event
  useEffect(() => {
    const handleWalletSettingsClick = () => {
      updateAllWallets()
    }

    // Listen for custom event from sidebar
    window.addEventListener('triggerWalletUpdate', handleWalletSettingsClick)
    
    return () => {
      window.removeEventListener('triggerWalletUpdate', handleWalletSettingsClick)
    }
  }, [])

  // Expose the update function globally so sidebar can call it
  useEffect(() => {
    (window as any).updateWalletBalances = updateAllWallets
  }, [])

  return (
    <div className="col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {walletData.map((wallet, index) => (
        <WalletCard
          key={`${wallet.name.replace(/\s+/g, '-').toLowerCase()}-${index}`}
          name={wallet.name}
          address={wallet.address}
          balance={wallet.balance}
          withdrawableAssets={wallet.withdrawableAssets}
          depositAsset={wallet.depositAsset}
          isLoading={wallet.isLoading}
        />
      ))}
    </div>
  )
}