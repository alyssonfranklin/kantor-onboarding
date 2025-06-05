"use client"

import React from "react";
import Image from 'next/image'

const languages = [
    { code: "en", label: "English" },
    { code: "es", label: "Español" },
    { code: "pt", label: "Português" },
];

export default function NavBar() {
    const [lang, setLang] = React.useState("en");

    return (
        <nav className="bg-white border-gray-200">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <a href="https://flowbite.com/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Image src="/voxerion-logo.png" alt="Voxerion Logo" width={32} height={32} />
                    <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                        Voxerion
                    </span>
                </a>
                <button data-collapse-toggle="navbar-default" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-default" aria-expanded="false">
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
                    </svg>
                </button>
                <div className="hidden w-full md:block md:w-auto" id="navbar-default">
                <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
                    <li>
                    <a href="#" className="block py-2 px-3 text-white bg-blue-700 rounded-sm md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-blue-500" aria-current="page">Home</a>
                    </li>
                    <li>
                    <a href="#" className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">About</a>
                    </li>
                    <li>
                    <a href="#" className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Services</a>
                    </li>
                    <li>
                    <a href="#" className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Pricing</a>
                    </li>
                    <li>
                    <a href="#" className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent">Contact</a>
                    </li>
                </ul>
                </div>
            </div>
            </nav>
        // <nav className="w-full flex items-center justify-between px-20 py-4 bg-white shadow">
        //     <div className="w-2/3 flex gap-4 justify-start items-center">

        //         <div className="flex gap-2">
        //             <Image src="/voxerion-logo.png" alt="Voxerion Logo" width={32} height={32} />
        //             <span className="ml-2 text-xl font-bold text-gray-800">Voxerion</span>
        //         </div>

        //         <div className="w-full ms-10">
        //             <ul className="flex space-x-6">
        //                 <li>
        //                     <a 
        //                         href="/pages" 
        //                         className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
        //                     >
        //                         Home
        //                     </a>
        //                 </li>
        //                 <li className="relative group">
        //                     <button
        //                         className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-1 focus:outline-none"
        //                         type="button"
        //                     >
        //                         Products
        //                         <svg
        //                             className="w-4 h-4 ml-1"
        //                             fill="none"
        //                             stroke="currentColor"
        //                             strokeWidth={2}
        //                             viewBox="0 0 24 24"
        //                         >
        //                             <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        //                         </svg>
        //                     </button>
        //                     <ul className="absolute left-0 mt-0 w-40 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity z-10">
        //                         <li>
        //                             <a
        //                                 href="#"
        //                                 className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
        //                             >
        //                                 Product 1
        //                             </a>
        //                         </li>
        //                         <li>
        //                             <a
        //                                 href="#"
        //                                 className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
        //                             >
        //                                 Product 2
        //                             </a>
        //                         </li>
        //                         <li>
        //                             <a
        //                                 href="#"
        //                                 className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
        //                             >
        //                                 Product 3
        //                             </a>
        //                         </li>
        //                     </ul>
        //                 </li>
        //                 <li className="relative group">
        //                     <button
        //                         className="text-gray-700 hover:text-blue-600 font-medium transition-colors flex items-center gap-1 focus:outline-none"
        //                         type="button"
        //                     >
        //                         Resources
        //                         <svg
        //                             className="w-4 h-4 ml-1"
        //                             fill="none"
        //                             stroke="currentColor"
        //                             strokeWidth={2}
        //                             viewBox="0 0 24 24"
        //                         >
        //                             <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        //                         </svg>
        //                     </button>
        //                     <ul className="absolute left-0 mt-0 w-40 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto transition-opacity z-10">
        //                         <li>
        //                             <a
        //                                 href="#"
        //                                 className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
        //                             >
        //                                 Resource 1
        //                             </a>
        //                         </li>
        //                         <li>
        //                             <a
        //                                 href="#"
        //                                 className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
        //                             >
        //                                 Resource 2
        //                             </a>
        //                         </li>
        //                         <li>
        //                             <a
        //                                 href="#"
        //                                 className="block px-4 py-2 text-gray-700 hover:bg-blue-50"
        //                             >
        //                                 Resource 3
        //                             </a>
        //                         </li>
        //                     </ul>
        //                 </li>
        //                 <li>
        //                     <a 
        //                         href="#" 
        //                         className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
        //                     >
        //                         Pricing
        //                     </a>
        //                 </li>
        //             </ul>
        //         </div>
        //     </div>

        //     <div>
        //         <select
        //             value={lang}
        //             onChange={e => setLang(e.target.value)}
        //             className="border-none px-3 py-1 focus:outline-none focus:ring-0"
        //         >
        //             {languages.map(l => (
        //                 <option key={l.code} value={l.code}>
        //                     {l.label}
        //                 </option>
        //             ))}
        //         </select>
        //     </div>
        // </nav>
    );
}