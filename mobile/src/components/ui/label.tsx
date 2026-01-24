import { Text } from 'react-native';
import * as React from "react";
import { cn } from "./utils";

function Label({ className, ...props }: any) {
  return (
    <Text
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
}

export { Label };
