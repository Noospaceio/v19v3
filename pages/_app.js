import '../styles/global.css'
import React, { useEffect } from 'react'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'; // <--- wichtig: aus wallets, nicht phantom direkt!
import { clusterApiUrl } from '@solana/web3.js';

require('@solana/wallet-adapter-react-ui/styles.css');

export default function App({ Component, pageProps }) {
  // Use devnet by default; override via NEXT_PUBLIC_SOLANA_NETWORK
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(network);

  // Wir registrieren explizit den Phantom Wallet Adapter
  const wallets = [new PhantomWalletAdapter()];

  // Optional: Debug ob Phantom im mobilen In-App Browser injected wird
  useEffect(() => {
    if (typeof window !== 'undefined' && window.solana?.isPhantom) {
      console.log("Phantom injected wallet found:", window.solana);
    }
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
