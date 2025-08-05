// components/wallet-card.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Copy, Loader2 } from "lucide-react"
import { useState } from "react"

interface WalletCardProps {
  name: string
  address: string
  balance: string
  withdrawableAssets: string
  depositAsset: string
  isLoading?: boolean
}

export function WalletCard({ 
  name, 
  address, 
  balance, 
  withdrawableAssets, 
  depositAsset, 
  isLoading = false 
}: WalletCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className="bg-[#2c3029] border-[#272a24] hover:bg-[#343730] transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-[#09b285] rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
          <h3 className="text-white font-bold text-sm">{name}</h3>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-gray-400 text-xs">Address:</span>
          <span className="text-white text-xs flex-1 truncate">{address}</span>
          <button
            onClick={copyToClipboard}
            className="p-1 hover:bg-[#272a24] rounded transition-colors"
          >
            <Copy className={`w-3 h-3 ${copied ? 'text-[#c2ff94]' : 'text-gray-400 hover:text-white'}`} />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-400 text-xs">Balance</p>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#c2ff94]" />
              <span className="text-white text-lg font-bold">Loading...</span>
            </div>
          ) : (
            <p className="text-white text-lg font-bold">{balance}</p>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs">Withdrawable Assets</p>
            {isLoading ? (
              <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
            ) : (
              <p className="text-white font-bold text-sm">{withdrawableAssets}</p>
            )}
          </div>
          <div>
            <p className="text-gray-400 text-xs">Deposit Asset</p>
            {isLoading ? (
              <div className="w-20 h-4 bg-gray-600 rounded animate-pulse"></div>
            ) : (
              <p className="text-white font-bold text-sm">{depositAsset}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}