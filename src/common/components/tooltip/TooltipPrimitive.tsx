import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { forwardRef } from 'react';

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TOOLTIP_CLASS =
  'z-50 max-w-64 rounded-lg border border-border bg-surface-alt px-3 py-2 ' +
  'text-xs text-text-primary leading-relaxed whitespace-pre-line ' +
  'shadow-[0_2px_12px_rgba(0,204,255,0.15)] ' +
  'animate-in fade-in-0 zoom-in-95 ' +
  'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 ' +
  'data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-top-2 ' +
  'data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2';

const TooltipContent = forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={TOOLTIP_CLASS}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent };
