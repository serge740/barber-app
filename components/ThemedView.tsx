import { View, StyleSheet, useColorScheme, ViewProps, ViewStyle } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

/**
 * Props for ThemedView
 * Extends ViewProps to support all standard View props
 */
type ThemedViewProps = {
  /** Optional custom style to merge with theme */
  style?: ViewStyle | ViewStyle[];
  /** If true, applies safe area padding (top/bottom) – defaults to `false` */
  safe?: boolean;
  no_bottom?: boolean;
} & Omit<ViewProps, 'style'>;

/**
 * A themed container view that adapts to light/dark mode.
 * Optionally applies safe area insets when `safe={true}`.
 */
export default function SafestView({ style, safe = false,no_bottom=false, ...props }: ThemedViewProps) {

  
  
  if (!safe) {
      return <>
      <StatusBar style="light" backgroundColor="#6F4E37" />
      <View style={[ style]} {...props} />;
      </>
    }
    
    const insets = useSafeAreaInsets();
    console.log(insets);
    
    return (
        <>
        <StatusBar style="light" backgroundColor="#6F4E37" />
    <View
      style={[
          // baseStyle,
          {
              paddingTop: insets.top ,
              paddingBottom:  no_bottom ? 0 :  insets.bottom,
    backgroundColor: '#6F4E37',
    flex:1,
  
            },
            style,
        ]}
        {...props}
        />
        </>
  );
}