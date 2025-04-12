'use client';

import { FC } from 'react';

interface FrameProps {
  title: string;
  description: string;
  image?: string;
  buttons: {
    label: string;
    action: string;
  }[];
}

export const FrameContainer: FC<FrameProps> = ({
  title,
  description,
  image,
  buttons
}) => {
  return (
    <div className="w-full max-w-[600px] aspect-[1.91/1] relative bg-gray-900 text-white">
      <div className="absolute inset-0 p-4 flex flex-col">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-lg mt-2">{description}</p>
        {image && (
          <div className="flex-1 relative my-4">
            <img 
              src={image} 
              alt={title}
              className="object-cover rounded-lg"
            />
          </div>
        )}
        <div className="mt-auto flex gap-2">
          {buttons.map((button, i) => (
            <button
              key={i}
              data-action={button.action}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 