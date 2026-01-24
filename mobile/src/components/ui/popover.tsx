import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import * as React from "react";
import { cn } from "./utils";

const PopoverContext = React.createContext<any>(null);

function Popover({ children, open, onOpenChange }: any) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const show = isControlled ? open : uncontrolledOpen;
  const setShow = isControlled ? onOpenChange : setUncontrolledOpen;

  return (
    <PopoverContext.Provider value={{ open: show, setOpen: setShow }}>
      <View>{children}</View>
    </PopoverContext.Provider>
  );
}

function PopoverTrigger({ children, asChild, ...props }: any) {
  const { setOpen } = React.useContext(PopoverContext);
  const Comp = asChild ? View : TouchableOpacity;
  return (
    <Comp onPress={() => setOpen(true)} {...props}>
      {children}
    </Comp>
  );
}

function PopoverContent({ className, align = "center", sideOffset = 4, children, ...props }: any) {
  const { open, setOpen } = React.useContext(PopoverContext);

  return (
    <Modal
      transparent
      visible={open}
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => setOpen(false)}
      >
        <View
          className={cn(
            "z-50 w-72 rounded-md border bg-popover p-4 shadow-md outline-none bg-white",
            className
          )}
          {...props}
        >
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function PopoverAnchor({ ...props }: any) {
  return <View {...props} />;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
