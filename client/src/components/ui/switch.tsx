import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex !h-[34px] !min-h-[34px] !max-h-[34px] w-[60px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent !p-0 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173fad]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#173fad] data-[state=unchecked]:bg-[#cbd5e1] shadow-inner",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-[28px] w-[28px] ml-[1px] rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-[26px] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
