import { View, Text, TouchableOpacity, Modal } from 'react-native';
import * as React from "react";
import { cn } from "./utils";

const DropdownMenuContext = React.createContext<any>(null);

function DropdownMenu({ children, ...props }: any) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <View {...props}>{children}</View>
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ children, asChild, ...props }: any) {
  const { setOpen, open } = React.useContext(DropdownMenuContext);
  const Comp = asChild ? View : TouchableOpacity;
  return (
    <Comp onPress={() => setOpen(!open)} {...props}>
      {children}
    </Comp>
  );
}

function DropdownMenuContent({ className, children, ...props }: any) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  if (!open) return null;

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
        activeOpacity={1}
        onPress={() => setOpen(false)}
      >
        <View className={cn("min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md bg-white", className)} {...props}>
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function DropdownMenuItem({ className, children, ...props }: any) {
  const { setOpen } = React.useContext(DropdownMenuContext);
  return (
    <TouchableOpacity
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      onPress={(e) => {
        setOpen(false);
        props.onPress && props.onPress(e);
      }}
      {...props}
    >
      <Text>{children}</Text>
    </TouchableOpacity>
  );
}

function DropdownMenuLabel({ className, inset, ...props }: any) {
  return (
    <Text
      className={cn(
        "px-2 py-1.5 text-sm font-semibold",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({ className, ...props }: any) {
  return (
    <View className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  );
}

function DropdownMenuGroup({ children, ...props }: any) {
  return <View {...props}>{children}</View>;
}

function DropdownMenuPortal({ children }: any) {
  return <>{children}</>;
}

function DropdownMenuSub({ children }: any) {
  return <>{children}</>;
}

function DropdownMenuSubContent({ children }: any) {
  return <>{children}</>;
}

function DropdownMenuSubTrigger({ children }: any) {
  return <View>{children}</View>;
}

function DropdownMenuRadioGroup({ children }: any) {
  return <>{children}</>;
}

function DropdownMenuRadioItem({ children }: any) {
  return <View>{children}</View>;
}

function DropdownMenuCheckboxItem({ children }: any) {
  return <View>{children}</View>;
}

function DropdownMenuShortcut({ className, ...props }: any) {
  return (
    <Text
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
