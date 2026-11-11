import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colores } from "../tema";

// Barra fija al pie de la pantalla (botones de acción).
// Suma el espacio de la barra de navegación del sistema para que Android no tape los botones.
export function BarraInferior({ children }: { children: ReactNode }) {
    const insets = useSafeAreaInsets();
    return <View style={[estilos.barra, { paddingBottom: 16 + insets.bottom }]}>{children}</View>;
}

const estilos = StyleSheet.create({
    barra: {
        paddingTop: 16,
        paddingHorizontal: 16,
        backgroundColor: colores.tarjeta,
        borderTopWidth: 1,
        borderTopColor: colores.borde
    }
});
