import { View } from 'react-native';
import * as React from "react";
import { cn } from "./utils";

function Separator({ className, orientation = "horizontal", decorative = true, ...props }: any) {
  return (
    <View
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
