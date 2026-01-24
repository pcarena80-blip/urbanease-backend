import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet } from 'react-native';
import * as React from "react";
import { Search } from "lucide-react-native";
import { cn } from "./utils";

const CommandContext = React.createContext<any>(null);

function Command({ className, children, ...props }: any) {
  return (
    <CommandContext.Provider value={{}}>
      <View className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground bg-white", className)} {...props}>
        {children}
      </View>
    </CommandContext.Provider>
  );
}

function CommandDialog({ children, open, onOpenChange, ...props }: any) {
  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => onOpenChange?.(false)}
    >
      <View style={styles.overlay}>
        <View className="bg-background w-full max-w-lg gap-4 border p-6 shadow-lg sm:rounded-lg bg-white rounded-xl mx-4">
          <Command {...props}>
            {children}
          </Command>
        </View>
      </View>
    </Modal>
  );
}

function CommandInput({ className, ...props }: any) {
  return (
    <View className="flex flex-row items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" size={16} />
      <TextInput
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholderTextColor="#666"
        {...props}
      />
    </View>
  );
}

function CommandList({ className, ...props }: any) {
  return (
    <View
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  );
}

function CommandEmpty({ ...props }: any) {
  return (
    <View className="py-6 text-center text-sm" {...props} />
  );
}

function CommandGroup({ className, heading, children, ...props }: any) {
  return (
    <View
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    >
      {heading && <Text className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{heading}</Text>}
      {children}
    </View>
  );
}

function CommandSeparator({ className, ...props }: any) {
  return (
    <View className={cn("-mx-1 h-px bg-border", className)} {...props} />
  );
}

function CommandItem({ className, children, onSelect, ...props }: any) {
  return (
    <TouchableOpacity
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onPress={onSelect}
      {...props}
    >
      <Text>{children}</Text>
    </TouchableOpacity>
  );
}

function CommandShortcut({ className, ...props }: any) {
  return (
    <Text
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
