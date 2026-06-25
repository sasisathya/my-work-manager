'use client';

import React from 'react';
import { CanvasElement } from '@/lib/canvas/types';

interface ElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
}

export default function ElementRenderer({
  element,
  isSelected,
}: ElementRendererProps) {
  const { position, size, style, type, content, imageSrc } = element;
  const { x, y } = position;
  const { width, height } = size;

  const commonProps = {
    fill: style.fill,
    stroke: style.stroke,
    strokeWidth: style.strokeWidth,
    opacity: style.opacity,
  };

  const renderElement = () => {
    switch (type) {
      case 'rectangle':
        return (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx="4"
            {...commonProps}
          />
        );

      case 'circle':
        const radius = Math.min(width, height) / 2;
        return (
          <circle
            cx={x + radius}
            cy={y + radius}
            r={radius}
            {...commonProps}
          />
        );

      case 'line':
        return (
          <line
            x1={x}
            y1={y}
            x2={x + width}
            y2={y + height}
            {...commonProps}
          />
        );

      case 'text':
        return (
          <text
            x={x}
            y={y + style.fontSize!}
            fontSize={style.fontSize}
            fontFamily={style.fontFamily}
            fontWeight={style.fontWeight as any}
            textAnchor={style.textAlign === 'center' ? 'middle' : (style.textAlign === 'left' ? 'start' : 'end')}
            fill={style.fill || '#000000'}
          >
            {content}
          </text>
        );

      case 'image':
        return (
          <image
            x={x}
            y={y}
            width={width}
            height={height}
            href={imageSrc}
            preserveAspectRatio="xMidYMid slice"
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderElement()}

      {/* Selection box */}
      {isSelected && (
        <g>
          {/* Selection border */}
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
            pointerEvents="none"
          />

          {/* Resize handles */}
          {[
            { x: x - 5, y: y - 5, cursor: 'nw-resize' }, // top-left
            { x: x + width / 2 - 5, y: y - 5, cursor: 'n-resize' }, // top-middle
            { x: x + width - 5, y: y - 5, cursor: 'ne-resize' }, // top-right
            { x: x - 5, y: y + height / 2 - 5, cursor: 'w-resize' }, // middle-left
            { x: x + width - 5, y: y + height / 2 - 5, cursor: 'e-resize' }, // middle-right
            { x: x - 5, y: y + height - 5, cursor: 'sw-resize' }, // bottom-left
            { x: x + width / 2 - 5, y: y + height - 5, cursor: 's-resize' }, // bottom-middle
            { x: x + width - 5, y: y + height - 5, cursor: 'se-resize' }, // bottom-right
          ].map((handle, idx) => (
            <rect
              key={idx}
              x={handle.x}
              y={handle.y}
              width="10"
              height="10"
              fill="#3b82f6"
              stroke="#ffffff"
              strokeWidth="1"
              className="cursor-pointer"
              style={{ cursor: handle.cursor }}
              pointerEvents="auto"
            />
          ))}
        </g>
      )}
    </>
  );
}
