import React from "react";

interface CardLeaderProps {
  id: number;
  name: string;
  email: string;
  role: string;
  onLeaderSelected: (id: number) => void;
}

const CardLeader: React.FC<CardLeaderProps> = ({ id, name, email, role, onLeaderSelected }) => (
  <div 
    className="cursor-pointer bg-gray-50 rounded-lg shadow p-4 m-2 flex flex-col items-start border border-gray-200"
    onClick={() => onLeaderSelected(id)}
  >
    <div className="font-semibold text-lg text-[#101828]">{name}</div>
    <div className="text-[#475467] text-sm mt-1">{email}</div>
    <div className="text-[#475467] text-sm mt-2 py-1 uppercase">{role}</div>
  </div>
);

export default CardLeader;