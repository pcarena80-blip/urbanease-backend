import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import * as React from "react";
import { ChevronDown } from "lucide-react-native";
import { cn } from "./utils";

// Simplified Select for Mobile - Placeholder for now
const SelectContext = React.createContext<any>(null);

function Select({ children, onValueChange, value, ...props }: any) {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen }}>
      <View {...props}>{children}</View>
    </SelectContext.Provider>
  );
}

function SelectGroup({ children, ...props }: any) {
  return <View {...props}>{children}</View>;
}

function SelectValue({ placeholder, className, ...props }: any) {
  const { value } = React.useContext(SelectContext);
  return (
    <Text className={cn("text-base text-foreground", className)} {...props}>
      {value || placeholder}
    </Text>
  );
}

function SelectTrigger({ className, children, ...props }: any) {
  const { setOpen, open } = React.useContext(SelectContext);
  return (
    <TouchableOpacity
      onPress={() => setOpen(!open)}
      className={cn(
        "flex flex-row h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown size={16} className="opacity-50" />
    </TouchableOpacity>
  );
}

function SelectContent({ className, children, position = "popper", ...props }: any) {
  const { open, setOpen } = React.useContext(SelectContext);

  if (!open) return null;

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 }}
        activeOpacity={1}
        onPress={() => setOpen(false)}
      >
        <View className={cn("bg-popover relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md bg-white", className)} {...props}>
          <ScrollView>
            {children}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function SelectLabel({ className, ...props }: any) {
  return (
    <Text className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props} />
  );
}

function SelectItem({ className, children, value, ...props }: any) {
  const { onValueChange, setOpen } = React.useContext(SelectContext);
  return (
    <TouchableOpacity
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onPress={() => {
        onValueChange(value);
        setOpen(false);
      }}
      {...props}
    >
      <Text>{children}</Text>
    </TouchableOpacity>
  );
}

function SelectSeparator({ className, ...props }: any) {
  return (
    <View className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
};
