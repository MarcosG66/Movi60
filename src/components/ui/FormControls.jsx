import { useContext } from "react"
import { Pressable, View } from "react-native"
import { AccessibilityContext, Text, TextInput } from "../accessibility/AccessibleElements"
import { COLORS, styles } from "../../styles/theme"

export function Field({ label, icon: Icon, ...props }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        {Icon && <Icon color={COLORS.slate} size={21} />}
        <TextInput
          {...props}
          style={[styles.input, props.multiline && styles.multilineInput]}
          placeholderTextColor="#7B8796"
          autoCapitalize={
            props.keyboardType === "email-address" ? "none" : "sentences"
          }
        />
      </View>
    </View>
  )
}

export function PrimaryButton({ label, onPress, icon: Icon, disabled }) {
  const { largeButtons } = useContext(AccessibilityContext)
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        largeButtons && {minHeight:68},
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {Icon && <Icon color={COLORS.white} size={22} />}
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  )
}

export function SecondaryButton({ label, onPress, icon: Icon }) {
  const {largeButtons}=useContext(AccessibilityContext)
  return (
    <Pressable
      style={({ pressed }) => [
        styles.secondaryButton,
        largeButtons && {minHeight:68},
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      {Icon && <Icon color={COLORS.blue} size={22} />}
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  )
}

export function TextButton({ label, onPress }) {
  return (
    <Pressable style={styles.textButton} onPress={onPress}>
      <Text style={styles.textButtonText}>{label}</Text>
    </Pressable>
  )
}
