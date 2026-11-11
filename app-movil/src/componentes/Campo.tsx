import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colores } from "../tema";

interface Props extends TextInputProps {
    etiqueta: string;
    error?: string;
}

export function Campo({ etiqueta, error, style, ...resto }: Props) {
    return (
        <View style={estilos.contenedor}>
            <Text style={estilos.etiqueta}>{etiqueta}</Text>
            <TextInput
                placeholderTextColor={colores.deshabilitado}
                style={[estilos.input, !!error && estilos.inputError, style]}
                {...resto}
            />
            {error ? <Text style={estilos.error}>{error}</Text> : null}
        </View>
    );
}

const estilos = StyleSheet.create({
    contenedor: { marginBottom: 12 },
    etiqueta: { fontSize: 13, fontWeight: "600", color: colores.texto, marginBottom: 4 },
    input: {
        borderWidth: 1,
        borderColor: colores.borde,
        backgroundColor: colores.tarjeta,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: colores.texto
    },
    inputError: { borderColor: colores.error },
    error: { color: colores.error, fontSize: 12, marginTop: 4 }
});
