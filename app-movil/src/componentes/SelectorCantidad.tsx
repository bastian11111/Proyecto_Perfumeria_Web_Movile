import { Pressable, StyleSheet, Text, View } from "react-native";
import { colores } from "../tema";

interface Props {
    valor: number;
    min?: number;
    max: number;
    onCambiar: (nuevo: number) => void;
}

export function SelectorCantidad({ valor, min = 1, max, onCambiar }: Props) {
    const noBaja = valor <= min;
    const noSube = valor >= max;
    return (
        <View style={estilos.fila}>
            <Pressable
                style={[estilos.boton, noBaja && estilos.inactivo]}
                disabled={noBaja}
                onPress={() => onCambiar(valor - 1)}
            >
                <Text style={estilos.signo}>−</Text>
            </Pressable>
            <Text style={estilos.valor}>{valor}</Text>
            <Pressable
                style={[estilos.boton, noSube && estilos.inactivo]}
                disabled={noSube}
                onPress={() => onCambiar(valor + 1)}
            >
                <Text style={estilos.signo}>+</Text>
            </Pressable>
        </View>
    );
}

const estilos = StyleSheet.create({
    fila: { flexDirection: "row", alignItems: "center" },
    boton: {
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colores.borde,
        backgroundColor: colores.tarjeta,
        alignItems: "center",
        justifyContent: "center"
    },
    inactivo: { opacity: 0.35 },
    signo: { fontSize: 20, color: colores.texto },
    valor: {
        minWidth: 36,
        textAlign: "center",
        fontSize: 16,
        fontWeight: "600",
        color: colores.texto
    }
});
