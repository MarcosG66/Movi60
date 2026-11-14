import { useContext } from "react"
import { Pressable, View } from "react-native"
import ChevronRight from "lucide-react-native/icons/chevron-right"
import { AccessibilityContext, Text } from "../accessibility/AccessibleElements"
import { COLORS, styles } from "../../styles/theme"

export function MetricCard({ icon: Icon, value, label, color, palette }) {
  return (
    <View
      style={[
        styles.metricCard,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
    >
      <Icon color={color} size={25} />
      <Text style={[styles.metricValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: palette.subtext }]}>
        {label}
      </Text>
    </View>
  )
}

export function InfoSection({ title, text, palette }) {
  return (
    <View style={styles.infoSection}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>
        {title}
      </Text>
      <Text style={[styles.infoText, { color: palette.subtext }]}>{text}</Text>
    </View>
  )
}

export function MenuRow({ icon: Icon, label, onPress, palette, last }) {
  const { iconScale } = useContext(AccessibilityContext)

  return (
    <Pressable
      style={[
        styles.menuRow,
        !last && { borderBottomColor: palette.border, borderBottomWidth: 1 },
      ]}
      onPress={onPress}
    >
      <Icon color={COLORS.blue} size={23 * iconScale} />
      <Text style={[styles.menuLabel, { color: palette.text }]}>{label}</Text>
      <ChevronRight color={palette.subtext} size={23} />
    </Pressable>
  )
}

export function QuickAction({ icon: Icon, label, onPress, palette }) {
  return (
    <Pressable
      style={[
        styles.quickAction,
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.quickIcon}>
        <Icon color={COLORS.blue} size={24} />
      </View>
      <Text style={[styles.quickLabel, { color: palette.text }]}>{label}</Text>
      <ChevronRight color={palette.subtext} size={24} />
    </Pressable>
  )
}
