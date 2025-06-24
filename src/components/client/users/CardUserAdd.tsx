import Image from "next/image";
import React from "react";

interface CardUserAddProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
}

const CardUserAdd: React.FC<CardUserAddProps> = ({
  title,
  description,
  buttonText,
  onButtonClick,
}) => (
  <div className="flex justify-center w-full p-6 border border-gray-300 rounded-2xl">
    <div className="border-2 border-[#90119B] rounded-lg p-6 bg-[#FDF6FE] flex flex-col max-w-sm h-64 shadow-md relative">
      <div className="flex justify-center mb-2">
        <Image
          src="/images/icons/upload.svg" 
          alt="Upload Icon" 
          width={30} 
          height={25} 
        />
      </div>
      <div className="text-center px-2">
        <h2 className="text-xl font-semibold text-black mb-2">
          {title}
        </h2>
        <p className="text-gray-600">
          {description}
        </p>
      </div>
      <div className="flex justify-center w-full">
        <button
          className="absolute w-44 bottom-3 bg-[#90119B] text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
          onClick={onButtonClick}
        >
          {buttonText}
        </button>
      </div>
    </div>
  </div>
);

export default CardUserAdd;