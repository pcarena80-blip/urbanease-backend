import { View, TouchableOpacity } from 'react-native';
import * as React from "react";
import { Check } from "lucide-react-native";

import { cn } from "./utils";

function Checkbox({ className, checked, onCheckedChange, ...props }: any) {
  return (
    <TouchableOpacity
      className={cn(
        "h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        checked && "bg-primary text-primary-foreground",
        className
      )}
      onPress={() => onCheckedChange?.(!checked)}
      {...props}
    >
      {checked && (
        <View className={cn("items-center justify-center h-full w-full")}>
          <Check size={12} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}

export { Checkbox };
