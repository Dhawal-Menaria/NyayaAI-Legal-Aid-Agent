// @ts-nocheck
import './globals.css';
import Link from 'next/link';
import { Space_Grotesk, Space_Mono } from 'next/font/google';

const grotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-grotesk' });
const mono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' });

export const metadata = {
  title: 'NyayaAI – Read the fine print',
  description: 'Plain-language contract review powered by IBM Granite and watsonx Orchestrate.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${grotesk.variable} ${mono.variable}`}>
        <div className="nb-banner">General information only · not a substitute for a lawyer</div>
        <header className="nb-head">
          <div className="nb-head-in">
            <Link href="/" className="nb-logo">Nyaya<span>AI</span></Link>
            <Link href="/" className="nb-btn sm">+ New contract</Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}