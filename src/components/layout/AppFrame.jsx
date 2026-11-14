import { KeyboardAvoidingView, Platform, StatusBar, View } from "react-native"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { AccessibilityProvider } from "../accessibility/AccessibleElements"
import { styles } from "../../styles/theme"

export function AppFrame({ children, palette, access }) {
  const fontFamily =
    access.fontFamily === "mono"
      ? Platform.select({
          ios: "Courier New",
          android: "monospace",
          web: "ui-monospace, SFMono-Regular, Menlo, monospace",
        })
      : undefined

  return (
    <SafeAreaProvider>
      <AccessibilityProvider access={access} fontFamily={fontFamily}>
        <View style={[styles.webStage, { backgroundColor: palette.background }]}>
          <StatusBar barStyle="dark-content" />
          {/* Respeita barra de status, notch e barra de navegacao do celular (Android edge-to-edge e iOS). */}
          <SafeAreaView
            edges={["top", "bottom", "left", "right"]}
            style={[styles.phone, { backgroundColor: palette.background }]}
            accessibilityLabel={`Movi60. Texto ${access.textSize}. Ícones ${access.iconSize}. Botões ${
              access.largeButtons ? "ampliados" : "normais"
            }.`}
          >
            {/* Evita que o teclado cubra os campos de texto no celular. */}
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "web" ? undefined : "padding"}
              enabled={Platform.OS !== "web"}
            >
              {children}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </AccessibilityProvider>
    </SafeAreaProvider>
  )
}
