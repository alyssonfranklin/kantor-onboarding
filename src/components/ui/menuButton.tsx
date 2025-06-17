import Image from 'next/image';
import React from 'react';

type MenuButtonProps = {
  onClick?: () => void;
  label: string;
  icon: string;
  alt: string;
};

const MenuButton: React.FC<MenuButtonProps> = ({
  onClick,
  label = 'Open',
  icon,
  alt
}) => (
  <button
    className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition`}
    onClick={onClick}
  >
    <Image 
      src={icon} 
      alt={alt}
      width={18} 
      height={18} 
    />
    <span className="text-sm font-semibold">
      {label}
    </span>
  </button>
);

export default MenuButton;