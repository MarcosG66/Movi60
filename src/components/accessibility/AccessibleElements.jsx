import { createContext, useContext } from "react"
import {
  StyleSheet,
  Text as NativeText,
  TextInput as NativeTextInput,
} from "react-native"

const ACCESS_SCALE = {
  small: 0.9,
  medium: 1,
  large: 1.16,
}

export const AccessibilityContext = createContext({
  textScale: 1,
  iconScale: 1,
  fontFamily: undefined,
  largeButtons: false,
})

export function AccessibilityProvider({ access, fontFamily, children }) {
  return (
    <AccessibilityContext.Provider
      value={{
        textScale: ACCESS_SCALE[access.textSize],
        iconScale: ACCESS_SCALE[access.iconSize],
        fontFamily,
        largeButtons: access.largeButtons,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function Text(props) {
  const access = useContext(AccessibilityContext)
  const flattened = StyleSheet.flatten(props.style)
  const fontSize =
    typeof flattened?.fontSize === "number"
      ? flattened.fontSize * access.textScale
      : undefined
  const lineHeight =
    typeof flattened?.lineHeight === "number"
      ? flattened.lineHeight * access.textScale
      : undefined

  return (
    <NativeText
      {...props}
      allowFontScaling={false}
      style={[
        props.style,
        access.fontFamily ? { fontFamily: access.fontFamily } : undefined,
        fontSize ? { fontSize } : undefined,
        lineHeight ? { lineHeight } : undefined,
      ]}
    />
  )
}

export function TextInput(props) {
  const access = useContext(AccessibilityContext)
  const flattened = StyleSheet.flatten(props.style)
  const fontSize =
    typeof flattened?.fontSize === "number"
      ? flattened.fontSize * access.textScale
      : undefined

  return (
    <NativeTextInput
      {...props}
      allowFontScaling={false}
      style={[
        props.style,
        access.fontFamily ? { fontFamily: access.fontFamily } : undefined,
        fontSize ? { fontSize } : undefined,
      ]}
    />
  )
}
