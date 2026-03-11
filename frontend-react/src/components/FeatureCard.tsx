// src/components/FeatureCard.tsx
import React from "react";

interface FeatureCardProps {
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => {
  return (
    <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-xl p-6 text-center shadow-lg hover:scale-105 transition transform">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-blue-100">{description}</p>
    </div>
  );
};

export default FeatureCard;