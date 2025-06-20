"use client"

import { useLogout } from "@/lib/auth/hooks";
import { useAuth } from "@/lib/auth/index-client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import MenuButton from "../ui/menuButton";
import { useRouter } from "next/navigation";

const menuOptions = [
  { 
    name: "Dashboard", 
    icon: '/images/icons/dashboard.svg', 
    active: true,
    link: '/dashboard'
  }
];

const bottomOptions = [
  { 
    name: "Help", 
    icon: '/images/icons/help.svg',
    link: '/dashboard/help'
  },
  { 
    name: "Organization Settings", 
    icon: '/images/icons/settings.svg',
    link: '/dashboard/settings'
  },
];

export default function SideMenu() {

  const { logout, logoutInProgress } = useLogout();
  const { user } = useAuth();
  const router = useRouter();

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    if (logoutInProgress) {
      return;
    }

    try {
      await logout();
      
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const goToPage = (link: string) => {
    router.push(link);
  };

  const toggleMenu = () => {
    setShowMobileMenu(prev => !prev);
  };

  useEffect(() => {
    // Ensure window is defined (for SSR environments)
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia('(max-width: 768px)');
      if (!mediaQueryList.matches) {
        setShowMobileMenu(true);
      }
    }
  }, []);

  return (
    <>
      <aside className={showMobileMenu ? 'block' : 'hidden'}>
        <div className="flex flex-col h-screen w-64 bg-white border-r shadow-sm">
          {/* Top: Logo and App Name */}
            <div className="flex items-center gap-3 h-20 px-6">
              <Image 
                src="/voxerion-logo.png" 
                alt="Voxerion Logo" 
                width={30} 
                height={30} 
              />
              <span className="text-xl font-bold text-gray-800">
                <Image 
                  src="/voxerion.svg" 
                  alt="Voxerion" 
                  width={60} 
                  height={13} 
                />
              </span>
            </div>

            {/* Menu Options */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuOptions.map((item) => (
                <MenuButton
                  key={item.name}
                  label={item.name}
                  icon={item.icon}
                  alt={item.name}
                  onClick={() => goToPage(item.link)}
                />
              ))}
            </nav>

            {/* Bottom Options */}
            <div className="px-4 pb-4">
              <div className="space-y-1 mb-4">
                {bottomOptions.map((item) => (
                  <MenuButton
                    key={item.name}
                    label={item.name}
                    icon={item.icon}
                    alt={item.name}
                    onClick={() => goToPage(item.link)}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition">
                <Image 
                  src="/images/icons/avatar.svg" 
                  alt="Avatar"
                  width={40} 
                  height={40}
                  className="rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-xs">
                    {user?.name}
                    <div className="m-0 p-0 text-gray-400">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <Image 
                  src="/images/icons/logout.svg" 
                  alt="Cerrar Sesión"
                  width={15} 
                  height={15} 
                  className="h-5 w-5 text-gray-400 hover:text-red-500 cursor-pointer"
                  onClick={handleLogout}
                />
              </div>
            </div>
        </div>
        
      </aside>

      <aside className="block lg:hidden">
        <button 
            data-collapse-toggle="navbar-default" 
            type="button" 
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" 
            aria-controls="navbar-default" 
            aria-expanded="false"
            onClick={toggleMenu}
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
      </aside>
    </>
  );
}
