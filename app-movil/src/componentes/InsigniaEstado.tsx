import { StyleSheet, Text, View } from "react-native";

const COLORES: Record<string, { fondo: string; texto: string }> = {
    Pendiente: { fondo: "#FFF3D6", texto: "#8A5A00" },
    Pagado: { fondo: "#DDEBFF", texto: "#1A4FA0" },
    Enviado: { fondo: "#DDF3E2", texto: "#1F6B33" }
};

export function InsigniaEstado({ estado }: { estado: string }) {
    const color = COLORES[estado] ?? { fondo: "#EEEEEE", texto: "#333333" };
    return (
        <View style={[estilos.caja, { backgroundColor: color.fondo }]}>
            <Text style={[estilos.texto, { color: color.texto }]}>{estado}</Text>
        </View>
    );
}

const estilos = StyleSheet.create({
    caja: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, alignSelf: "flex-start" },
    texto: { fontSize: 12, fontWeight: "700" }
});
