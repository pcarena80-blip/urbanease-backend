import { View, Text } from 'react-native';
import * as React from "react";
import { cn } from "./utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: any) {
  return (
    <View className={cn("p-3", className)} {...props}>
      <Text>Calendar Component Placeholder</Text>
    </View>
  );
}

export { Calendar };
