'use client';

import Image from 'next/image';

const features = [
  "/assets/feature-1.svg",
  "/assets/feature-2.svg", 
  "/assets/feature-3.svg",
  "/assets/feature-4.svg"
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Upcoming Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex justify-center"
            >
              <Image
                src={feature}
                alt={`Feature ${index + 1}`}
                width={800}
                height={800}
                className="rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
