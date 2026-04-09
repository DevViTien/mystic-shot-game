import type { ReactNode } from 'react';
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent } from './TooltipPrimitive';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  placement?: Placement;
  children: ReactNode;
}

export function Tooltip({ content, placement = 'top', children }: TooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={placement}>{content}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
}
