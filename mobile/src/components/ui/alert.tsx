import { View, Text } from 'react-native';
import * as React from "react";
import { cn } from "./utils";

// Renamed to UIAlert to avoid conflict with React Native's Alert
function UIAlert({ className, variant = "default", ...props }: any) {
  return (
    <View
      className={cn(
        "relative w-full rounded-lg border px-4 py-3",
        variant === "destructive" ? "border-red-500/50 text-red-600 dark:border-red-500 [&>svg]:text-red-600" : "bg-background text-foreground",
        className
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: any) {
  return (
    <Text
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: any) {
  return (
    <Text
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  );
}

export { UIAlert as Alert, AlertTitle, AlertDescription };
