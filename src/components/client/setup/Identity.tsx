"use client"

import React, { useState } from "react";
import Image from 'next/image'
import TextArea from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";

export default function Identity(
  { setupData, updateSetupData, onNext }
) {

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateSetupData({ [name]: value });
  };

  const handleNextClick = () => {
    if (!setupData.companyHistory || !setupData.sell || !setupData.brand) {
      setError('All fields are required!');
      return;
    }
    onNext();
  };

  return (
    <nav className="bg-white border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap justify-center mx-auto px-4">
        <div className="w-2/3">
          <div className="flex justify-center">
            <Image
                src="/images/icons/key.svg"
                alt="key icon"
                width={28}
                height={28}
                className="inline-block"
              />
          </div>

          <div className='text-center'>
            <h2 className="text-2xl font-bold my-2">
              Corporate Identity
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Tell Voxerion about your company: What is your history? What do you sell? How your brand looks like for your customers and for your stakeholders?
            </div>
          </div>

          {error && (
            <div className="bg-transparent border border-red-400 text-red-700 px-4 py-1 rounded relative my-2 text-center" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mt-4">
            <TextArea
              placeholder="What is the history of your company? is there any important milestones that Voxerion need to know?"
              value={setupData.companyHistory}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="companyHistory"
            />
          </div>

          <div className="mt-4">
            <TextArea
              placeholder="What does your company sell? It is a physical product, or a service? "
              value={setupData.sell}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="sell"
            />
          </div>

          <div className="mt-4">
            <TextArea
              placeholder="How is your brand? What are the promises that your brand delivers? What is the perception for your customers?"
              value={setupData.brand}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="brand"
            />
          </div>

          <div className="py-4">
            <Button
              type="submit"
              className="w-full"
              onClick={handleNextClick}
            >
              Continue
            </Button>
          </div>

        </div>
      </div>
    </nav>
  );
}