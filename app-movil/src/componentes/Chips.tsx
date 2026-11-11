import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { colores } from "../tema";

interface Props<T extends string> {
    opciones: readonly T[];
    valor: T;
    onCambiar: (nuevo: T) => void;
}

// Fila de opciones seleccionables (filtros, género, etc.)
export function Chips<T extends string>({ opciones, valor, onCambiar }: Props<T>) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ flexGrow: 0 }}
        >
            {opciones.map((o) => (
                <Pressable
                    key={o}
                    onPress={() => onCambiar(o)}
                    style={[estilos.chip, valor === o && estilos.activo]}
                >
                    <Text style={[estilos.texto, valor === o && estilos.textoActivo]}>{o}</Text>
                </Pressable>
            ))}
        </ScrollView>
    );
}

const estilos = StyleSheet.create({
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colores.borde,
        backgroundColor: colores.tarjeta,
        marginRight: 8
    },
    activo: { backgroundColor: colores.primario, borderColor: colores.primario },
    texto: { fontSize: 13, color: colores.texto },
    textoActivo: { color: "#FFFFFF", fontWeight: "600" }
});
