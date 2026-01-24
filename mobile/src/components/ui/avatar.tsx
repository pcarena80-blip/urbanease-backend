import { View, Text, Image, StyleSheet } from 'react-native';
import * as React from "react";
import { cn } from "./utils";

function Avatar({
  className,
  style,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      style={style}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  source,
  style,
  ...props
}: React.ComponentProps<typeof Image>) {
  return (
    <Image
      className={cn("aspect-square h-full w-full", className)}
      source={source}
      style={style}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  style,
  children,
  ...props
}: React.ComponentProps<typeof View>) {
  return (
    <View
      className={cn(
        "bg-muted flex h-full w-full items-center justify-center rounded-full",
        className
      )}
      style={style}
      {...props}
    >
      <Text>{children}</Text>
    </View>
  );
}

export { Avatar, AvatarImage, AvatarFallback };
