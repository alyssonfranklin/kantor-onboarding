"use client"

import React, { useState } from "react";
import Image from 'next/image'
import TextArea from "@/components/ui/textArea";
import { Button } from "@/components/ui/button";

export default function CornerStones(
  { setupData, updateSetupData, onNext }
) {

  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateSetupData({ [name]: value });
  };

  const handleNextClick = () => {
    if (!setupData.practices || !setupData.initiatives) {
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
              Cultural Cornerstones
            </h2>
            <div className='text-gray-600 pt-0 mt-0'>
              How is the Corporate Culture in your company? Tell us about the Ethics and Social Responsibility that guides your business so Voxerion can consider this aspects as well.
            </div>
          </div>

          {error && (
            <div className="bg-transparent border border-red-400 text-red-700 px-4 py-1 rounded relative my-2 text-center" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="mt-4">
            <TextArea
              placeholder="What values, behaviors, and practices define your corporate culture, and how do they influence your team?"
              value={setupData.practices}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="practices"
            />
          </div>

          <div className="mt-4">
            <TextArea
              placeholder="How does your company approach social responsibility, and what initiatives or practices demonstrate your commitment to making a positive impact on society and the environment?"
              value={setupData.initiatives}
              onChange={handleChange}
              className="border-[#D0D5DD] placeholder:text-[#667085] bg-white"
              required={true}
              name="initiatives"
            />
          </div>

          <div className="py-4">
            <Button
              type="submit"
              className="w-full"
              onClick={handleNextClick}
            >
              Finish
            </Button>
          </div>

        </div>
      </div>
    </nav>
  );
}