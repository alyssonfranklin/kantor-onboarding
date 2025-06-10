"use client"

import React, { useState } from "react";
import Image from 'next/image'
import TextArea from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";

export default function Pillars(
  { setupData, updateSetupData, onNext }
) {

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateSetupData({ [name]: value });
  };

  const handleNextClick = () => {
    if (!setupData.mission || !setupData.vision || !setupData.coreValues) {
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
              Organizational Pillars
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              Your company beliefs help us understand and provide better insights, always aligned with its vision, mission, and the core values of your company
            </div>
          </div>

          {error && (
            <div className="bg-transparent border border-red-400 text-red-700 px-4 py-1 rounded relative my-2 text-center" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mt-4">
            <TextArea
              placeholder="Explain Voxerion what is yours company Mission"
              value={setupData.mission}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="mission"
            />
          </div>

          <div className="mt-4">
            <TextArea
              placeholder="Explain Voxerion what is yours company Vision"
              value={setupData.vision}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="vision"
            />
          </div>

          <div className="mt-4">
            <TextArea
              placeholder="What are the Core Values of your company?"
              value={setupData.coreValues}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="coreValues"
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