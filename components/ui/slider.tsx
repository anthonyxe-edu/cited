'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Slider as SliderPrimitive } from 'radix-ui';

function Slider({ className, children, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex h-5 w-full touch-none select-none items-center', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-[5px] w-full overflow-hidden rounded-full bg-[rgba(0,212,170,0.12)]">
        <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-[#00D4AA] to-[#00E5B5] rounded-full" />
      </SliderPrimitive.Track>
      {children}
    </SliderPrimitive.Root>
  );
}

function SliderThumb({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Thumb>) {
  return (
    <SliderPrimitive.Thumb
      data-slot="slider-thumb"
      className={cn(
        'block size-3 shrink-0 cursor-pointer rounded-full bg-[#00D4AA] border-2 border-[#0A1628] shadow-[0_0_6px_rgba(0,212,170,0.5)] outline-none focus:outline-none transition-transform hover:scale-110',
        className,
      )}
      {...props}
    />
  );
}

export { Slider, SliderThumb };
