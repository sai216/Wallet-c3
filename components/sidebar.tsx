// components/sidebar.tsx
"use client"

import { useState } from "react"
import { ChevronDownIcon, ChevronRightIcon, HomeIcon, SettingsIcon, FileTextIcon, Users2Icon, Wallet, Loader2 } from "lucide-react"

// DeFi Wallet Settings Button Component
function DefiWalletSettingsButton() {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleClick = async () => {
    setIsUpdating(true)
    console.log("DeFi Wallet Settings clicked - updating wallet balances...")
    
    try {
      // Trigger wallet update
      if ((window as any).updateWalletBalances) {
        await (window as any).updateWalletBalances()
      }
      
      // Dispatch custom event as backup
      window.dispatchEvent(new CustomEvent('triggerWalletUpdate'))
    } catch (error) {
      console.error('Error updating wallets:', error)
    } finally {
      setTimeout(() => setIsUpdating(false), 1000) // Minimum 1 second loading
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className="flex items-center w-full px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-[#2c3029] rounded-md transition-colors disabled:opacity-50 ml-4"
    >
      <Wallet className="w-4 h-4 mr-3" />
      {isUpdating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Updating Wallets...
        </>
      ) : (
        'DeFi Wallet Settings'
      )}
    </button>
  )
}

// Main Sidebar Component
export function Sidebar() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['w3-treasury'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  return (
    <div className="fixed left-0 top-0 z-10 h-screen w-64 bg-[#1a1d18] text-white border-r border-[#272a24] hidden md:flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-6">
        <div className="w-8 h-8 bg-[#c2ff94] rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-sm">F</span>
        </div>
        <h1 className="text-[#c2ff94] text-xl font-bold">Fundio</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {/* Command & Control */}
        <div>
          <button
            onClick={() => toggleSection('command-control')}
            className="flex items-center justify-between w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2c3029] rounded-md transition-colors"
          >
            <div className="flex items-center">
              <HomeIcon className="w-4 h-4 mr-3" />
              Command & Control
            </div>
            {expandedSections.includes('command-control') ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Administration Consoles */}
        <div>
          <button
            onClick={() => toggleSection('admin-consoles')}
            className="flex items-center justify-between w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2c3029] rounded-md transition-colors"
          >
            <div className="flex items-center">
              <FileTextIcon className="w-4 h-4 mr-3" />
              Administration Consoles
            </div>
            {expandedSections.includes('admin-consoles') ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* W3 Treasury Tools */}
        <div>
          <button
            onClick={() => toggleSection('w3-treasury')}
            className="flex items-center justify-between w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2c3029] rounded-md transition-colors"
          >
            <div className="flex items-center">
              <SettingsIcon className="w-4 h-4 mr-3" />
              W3 Treasury Tools
            </div>
            {expandedSections.includes('w3-treasury') ? (
              <ChevronDownIcon className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
          
          {/* W3 Treasury Tools Submenu */}
          {expandedSections.includes('w3-treasury') && (
            <div className="mt-2 space-y-1">
              <DefiWalletSettingsButton />
            </div>
          )}
        </div>

        {/* Sura Guidance */}
        <div>
          <button className="flex items-center w-full px-3 py-2 text-left text-sm text-white hover:bg-[#2c3029] rounded-md transition-colors">
            <Users2Icon className="w-4 h-4 mr-3" />
            Sura Guidance
          </button>
        </div>
      </nav>
    </div>
  )
}