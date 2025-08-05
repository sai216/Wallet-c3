// components/wallet-grid.tsx
"use client"

import { useState, useEffect } from "react"
import { WalletCard } from "./wallet-card"

interface WalletData {
  name: string;
  address: string;
  balance: string;
  withdrawableAssets: string;
  depositAsset: string;
  isLoading?: boolean;
}

interface JupiterUltraBalance {
  amount: string;
  uiAmount: number;
  slot: number;
  isFrozen: boolean;
}

interface JupiterUltraResponse {
  [token: string]: JupiterUltraBalance;
}

interface JupiterUltraErrorResponse {
  error: string;
}

type JupiterUltraApiResponse = JupiterUltraResponse | JupiterUltraErrorResponse;

const WALLET_ADDRESSES = {
  smartWallet: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//solana address
  palmeraWallet: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//solana address
  farcaster1: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//solana address
  farcaster2: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//solana address
  customWallet1: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//solana address
  customWallet2: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//solana address
  privyWallet1: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB",//solana address
  privyWallet2: "6BJnPjRqz3uPQYopZ9bJjhi3bWGUuUdeZqRXJ8wgvvFB"//solana address
}

class JupiterUltraAPIService {
  private static readonly BASE_URL = 'https://lite-api.jup.ag/ultra/v1/balances'
  private static lastRequestTime = 0
  private static readonly MIN_REQUEST_INTERVAL = 1500

  private static async rateLimitedFetch(url: string, retries = 3): Promise<Response> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest))
    }
    this.lastRequestTime = Date.now()

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url)
        if (response.status === 429 && attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 2000))
          continue
        }
        return response
      } catch (error) {
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 2000))
        }
      }
    }
    throw new Error(`Failed to fetch after ${retries} attempts`)
  }

  static async getWalletBalances(address: string): Promise<JupiterUltraResponse> {
    try {
      const response = await this.rateLimitedFetch(`${this.BASE_URL}/${address}`)
      if (!response.ok) return {}
      const data: JupiterUltraApiResponse = await response.json()
      if ('error' in data) return {}
      return data
    } catch (error) {
      return {}
    }
  }

  static async getTokenPrices(tokens: string[]): Promise<Record<string, { price: number }>> {
    const commonPrices: Record<string, { price: number }> = {
      'So11111111111111111111111111111111111111112': { price: 100 }, // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { price: 1 },   // USDC
      'Es9vMFrzaCERZy5CjzU5bRJWz9kz7YR2v7jcD7Y9K3CM': { price: 1 },   // USDT
      'DezXf7bGnnTT5kuHVzCyepwXQb2g5tGSvT3J7kRJb9fT': { price: 0.00001 }, // BONK
      'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB': { price: 0.5 }  // JUP
    }

    const tokenPrices: Record<string, { price: number }> = {}
    tokens.forEach(token => {
      tokenPrices[token] = commonPrices[token] || { price: 0 }
    })

    return tokenPrices
  }

  static formatCurrency(balance: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance)
  }

  static async calculateWalletValue(balances: JupiterUltraResponse): Promise<{
    totalValue: number;
    withdrawableValue: number;
    depositValue: number;
  }> {
    const tokens = Object.keys(balances)
    if (tokens.length === 0) return { totalValue: 0, withdrawableValue: 0, depositValue: 0 }
    const prices = await this.getTokenPrices(tokens)
    let totalValue = 0

    tokens.forEach(token => {
      const tokenBalance = balances[token]
      if (tokenBalance && !tokenBalance.isFrozen) {
        const price = prices[token]?.price || 0
        const value = tokenBalance.uiAmount * price
        totalValue += value
      }
    })

    return {
      totalValue,
      withdrawableValue: totalValue * 0.7,
      depositValue: totalValue * 0.3
    }
  }
}

const initialWalletData: WalletData[] = Object.entries(WALLET_ADDRESSES).map(([name, address]) => ({
  name: name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
  address,
  balance: "$0.00",
  withdrawableAssets: "$0.00",
  depositAsset: "$0.00",
  isLoading: false
}))

export function WalletGrid() {
  const [walletData, setWalletData] = useState<WalletData[]>(initialWalletData)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchWalletData = async (wallet: WalletData): Promise<WalletData> => {
    const balances = await JupiterUltraAPIService.getWalletBalances(wallet.address)
    const { totalValue, withdrawableValue, depositValue } = await JupiterUltraAPIService.calculateWalletValue(balances)
    return {
      ...wallet,
      balance: JupiterUltraAPIService.formatCurrency(totalValue),
      withdrawableAssets: JupiterUltraAPIService.formatCurrency(withdrawableValue),
      depositAsset: JupiterUltraAPIService.formatCurrency(depositValue),
      isLoading: false
    }
  }

  const updateAllWallets = async () => {
    setIsUpdating(true)
    setWalletData(prev => prev.map(wallet => ({ ...wallet, isLoading: true })))

    for (let i = 0; i < walletData.length; i++) {
      const wallet = walletData[i]
      const updatedWallet = await fetchWalletData(wallet)
      setWalletData(prev => {
        const newData = [...prev]
        newData[i] = updatedWallet
        return newData
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setIsUpdating(false)
  }

  useEffect(() => {
    const handleWalletSettingsClick = () => updateAllWallets()
    window.addEventListener('triggerWalletUpdate', handleWalletSettingsClick)
    return () => window.removeEventListener('triggerWalletUpdate', handleWalletSettingsClick)
  }, [])

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
