"use client"

import React, { useState } from "react";
import Image from 'next/image'

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export default function NavBar() {
  const [lang, setLang] = React.useState("en");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleMobileMenu = () => {
    setShowMobileMenu(prev => !prev);
  };

  return (
    <nav className="bg-white border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">

        <div className="flex gap-4 items-center">
          <a 
            href="/pages" 
            className="flex items-center space-x-3 rtl:space-x-reverse"
          >
            <Image 
              src="/voxerion-logo.png" 
              alt="Voxerion Logo" 
              width={32} 
              height={32} 
            />
            <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
              Voxerion
            </span>
          </a>

          <div 
            className="hidden w-full md:block md:w-auto" 
            id="navbar-default"
          >
            <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <a 
                  href="/pages" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Home
                </a>
              </li>
              <li className="relative group">
                  <button
                      className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-1 focus:outline-none"
                      type="button"
                >
                  Products
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <ul className="absolute left-0 mt-0 w-40 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity z-10">
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
                    >
                      Product 1
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
                    >
                      Product 2
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
                    >
                      Product 3
                    </a>
                  </li>
                </ul>
              </li>
              <li className="relative group">
                <button
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-1 focus:outline-none"
                  type="button"
                >
                  Resources
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                  <ul className="absolute left-0 mt-0 w-40 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity z-10">
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
                      >
                        Resource 1
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
                      >
                        Resource 2
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
                      >
                        Resource 3
                      </a>
                    </li>
                  </ul>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <select
            value={lang}
            onChange={e => setLang(e.target.value)}
            className="border-none px-3 py-1 focus:outline-none focus:ring-0"
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <button 
          data-collapse-toggle="navbar-default" 
          type="button" 
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" 
          aria-controls="navbar-default" 
          aria-expanded="false"
          onClick={toggleMobileMenu}
        >
          <span className="sr-only">Open main menu</span>
          <svg 
            className="w-5 h-5" 
            aria-hidden="true" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 17 14"
          >
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
          </svg>
        </button>
        
      </div>

      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-2 absolute right-2 top-16">
          <ul className="flex flex-col gap-2">
            <li>
              <a
                href="/pages"
                className="block text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
              >
                Home
              </a>
            </li>
            <li>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-gray-700 hover:text-blue-600 font-medium py-2">
                  Products
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <ul className="pl-4 mt-1">
                  <li>
                    <a href="#" className="block py-1 text-gray-700 hover:text-blue-600">
                      Product 1
                    </a>
                  </li>
                  <li>
                    <a href="#" className="block py-1 text-gray-700 hover:text-blue-600">
                      Product 2
                    </a>
                  </li>
                  <li>
                    <a href="#" className="block py-1 text-gray-700 hover:text-blue-600">
                      Product 3
                    </a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-gray-700 hover:text-blue-600 font-medium py-2">
                  Resources
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <ul className="pl-4 mt-1">
                  <li>
                    <a href="#" className="block py-1 text-gray-700 hover:text-blue-600">
                      Resource 1
                    </a>
                  </li>
                  <li>
                    <a href="#" className="block py-1 text-gray-700 hover:text-blue-600">
                      Resource 2
                    </a>
                  </li>
                  <li>
                    <a href="#" className="block py-1 text-gray-700 hover:text-blue-600">
                      Resource 3
                    </a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <a
                href="#"
                className="block text-gray-700 hover:text-blue-600 font-medium transition-colors py-2"
              >
                Pricing
              </a>
            </li>
          </ul>
        </div>
      )}

    </nav>
  );
}