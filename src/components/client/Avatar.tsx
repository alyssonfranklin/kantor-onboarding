import Image from 'next/image';
import React from 'react';

type AvatarProps = {
  name: string;
  description: string;
  imageUrl?: string;
};

const DEFAULT_IMAGE =
  '/images/icons/avatar.svg';

const Avatar: React.FC<AvatarProps> = ({ name, description, imageUrl }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition">
    <Image
      src={imageUrl || DEFAULT_IMAGE}
      alt="Avatar"
      width={40} 
      height={40}
      className="rounded-full object-cover"
    />
    <div className="flex-1">
      <div className="font-medium text-gray-800 text-xs">
        {name}
        <div className="m-0 p-0 text-gray-400">
          {description}
        </div>
      </div>
    </div>
  </div>
);

export default Avatar;
