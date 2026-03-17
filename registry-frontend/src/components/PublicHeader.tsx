"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export default function PublicHeader() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className='w-full bg-[rgb(32,38,130)] text-white relative z-50'>
      <div className='max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between'>
        <Link href='/' className='text-lg sm:text-xl font-black tracking-tight shrink-0 mr-4'>
          Earth Carbon Registry
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center gap-6'>
          <Link href='/about' className='hover:underline text-sm font-medium'>
            About
          </Link>
          <Link href='/how-it-works' className='hover:underline text-sm font-medium'>
            How It Works
          </Link>
          <Link href='/impact' className='hover:underline text-sm font-medium'>
            Impact
          </Link>
          <Link href='/pricing' className='hover:underline text-sm font-medium'>
            Pricing
          </Link>

          {user ? (
            <Link
              href='/profile'
              className='ml-2 px-4 py-2 bg-white text-[rgb(32,38,130)] text-sm font-bold rounded-md shadow-sm hover:shadow-md transition whitespace-nowrap'
            >
              Go To Profile
            </Link>
          ) : (
            <Link
              href='/signin'
              className='ml-2 px-4 py-2 bg-white text-[rgb(32,38,130)] text-sm font-bold rounded-md shadow-sm hover:shadow-md transition whitespace-nowrap'
            >
              Sign In
            </Link>
          )}
        </nav>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden p-2 -mr-2 text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 ml-auto"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[rgb(32,38,130)] border-t border-white/10 shadow-xl pb-4 px-4 flex flex-col gap-2">
          <Link href='/about' onClick={() => setIsMobileMenuOpen(false)} className='py-3 hover:bg-white/5 rounded-lg px-3 text-base font-medium'>
            About
          </Link>
          <Link href='/how-it-works' onClick={() => setIsMobileMenuOpen(false)} className='py-3 hover:bg-white/5 rounded-lg px-3 text-base font-medium'>
            How It Works
          </Link>
          <Link href='/impact' onClick={() => setIsMobileMenuOpen(false)} className='py-3 hover:bg-white/5 rounded-lg px-3 text-base font-medium'>
            Impact
          </Link>
          <Link href='/pricing' onClick={() => setIsMobileMenuOpen(false)} className='py-3 hover:bg-white/5 rounded-lg px-3 text-base font-medium'>
            Pricing
          </Link>

          <div className="pt-3 border-t border-white/10 mt-2 pb-1 px-1">
            {user ? (
              <Link
                href='/profile'
                onClick={() => setIsMobileMenuOpen(false)}
                className='block w-full text-center px-4 py-3 bg-white text-[rgb(32,38,130)] text-base font-bold rounded-xl shadow-sm hover:shadow-md transition'
              >
                Go To Profile
              </Link>
            ) : (
              <Link
                href='/signin'
                onClick={() => setIsMobileMenuOpen(false)}
                className='block w-full text-center px-4 py-3 bg-white text-[rgb(32,38,130)] text-base font-bold rounded-xl shadow-sm hover:shadow-md transition'
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
