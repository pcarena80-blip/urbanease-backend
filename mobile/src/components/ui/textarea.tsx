import { TextInput } from 'react-native';
import * as React from "react";

import { cn } from "./utils";

function Textarea({ className, ...props }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      multiline
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      textAlignVertical="top"
      placeholderTextColor="#666"
      {...props}
    />
  );
}

export { Textarea };
