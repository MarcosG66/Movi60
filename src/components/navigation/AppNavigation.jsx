import { useContext } from "react"
import { Pressable, View } from "react-native"
import Activity from "lucide-react-native/icons/activity"
import ArrowLeft from "lucide-react-native/icons/arrow-left"
import CalendarDays from "lucide-react-native/icons/calendar-days"
import CircleUserRound from "lucide-react-native/icons/circle-user-round"
import Dumbbell from "lucide-react-native/icons/dumbbell"
import Home from "lucide-react-native/icons/house"
import TrendingUp from "lucide-react-native/icons/trending-up"
import UsersRound from "lucide-react-native/icons/users-round"
import { AccessibilityContext, Text } from "../accessibility/AccessibleElements"
import { COLORS, styles } from "../../styles/theme"

export function ScreenHeader({ title, subtitle, palette }) {
  const { iconScale } = useContext(AccessibilityContext)

  return (
    <View style={[styles.header, { backgroundColor: palette.background }]}>
      <View style={styles.flex}>
        {!!subtitle && (
          <Text style={[styles.headerSubtitle, { color: palette.subtext }]}>
            {subtitle}
          </Text>
        )}
        <Text style={[styles.headerTitle, { color: palette.text }]}>
          {title}
        </Text>
      </View>
      <View style={styles.headerLogo}>
        <Activity color={COLORS.white} size={22 * iconScale} />
      </View>
    </View>
  )
}

export function BackHeader({ title, onBack, palette }) {
  const { iconScale } = useContext(AccessibilityContext)

  return (
    <View
      style={[
        styles.backHeader,
        { borderColor: palette.border, backgroundColor: palette.card },
      ]}
    >
      <Pressable
        style={styles.backButton}
        onPress={onBack}
        accessibilityLabel="Voltar"
      >
        <ArrowLeft color={palette.text} size={26 * iconScale} />
      </Pressable>
      <Text style={[styles.backTitle, { color: palette.text }]}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  )
}

export function StudentNav({ active, onChange, palette }) {
  const items = [
    { id: "home", label: "Início", icon: Home },
    { id: "workout", label: "Treino", icon: Dumbbell },
    { id: "progress", label: "Evolução", icon: TrendingUp },
    { id: "schedule", label: "Agenda", icon: CalendarDays },
    { id: "profile", label: "Perfil", icon: CircleUserRound },
  ]

  return (
    <BottomNav
      items={items}
      active={active}
      onChange={onChange}
      palette={palette}
    />
  )
}

export function StaffNav({ active, onChange, admin, palette }) {
  const items = [
    { id: "dashboard", label: "Painel", icon: Home },
    { id: "people", label: admin ? "Usuários" : "Alunos", icon: UsersRound },
    { id: "workouts", label: "Treinos", icon: Dumbbell },
    { id: "exercises", label: "Exercícios", icon: Activity },
    { id: "profile", label: "Perfil", icon: CircleUserRound },
  ]

  return (
    <BottomNav
      items={items}
      active={active}
      onChange={onChange}
      palette={palette}
    />
  )
}

function BottomNav({ items, active, onChange, palette }) {
  const { iconScale, largeButtons } = useContext(AccessibilityContext)

  return (
    <View
      style={[
        styles.bottomNav,
        largeButtons && { minHeight: 88 },
        { backgroundColor: palette.card, borderColor: palette.border },
      ]}
    >
      {items.map(({ id, label, icon: Icon }) => {
        const selected = active === id
        return (
          <Pressable
            key={id}
            style={[styles.navItem, largeButtons && {minHeight:68}]}
            onPress={() => onChange(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <View style={[styles.navIcon, selected && styles.navIconActive]}>
              <Icon
                color={selected ? COLORS.blue : palette.subtext}
                size={22 * iconScale}
                strokeWidth={selected ? 2.6 : 2}
              />
            </View>
            <Text
              style={[
                styles.navLabel,
                { color: selected ? COLORS.blue : palette.subtext },
                selected && styles.navLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
