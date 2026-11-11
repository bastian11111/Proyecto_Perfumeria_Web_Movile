import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { colores } from "../tema";

interface Props {
    url?: string;
    alto: number;
}

// Muestra la imagen del perfume; si no hay URL válida o falla la descarga, un recuadro de reemplazo.
export function ImagenPerfume({ url, alto }: Props) {
    const [fallo, setFallo] = useState(false);
    const uri = url && /^https?:\/\//i.test(url) && !fallo ? url : null;

    if (!uri) {
        return (
            <View style={[estilos.vacia, { height: alto }]}>
                <Text style={estilos.emoji}>🧴</Text>
                <Text style={estilos.sinImagen}>Sin imagen</Text>
            </View>
        );
    }
    return (
        <Image
            source={{ uri }}
            style={{ width: "100%", height: alto }}
            resizeMode="cover"
            onError={() => setFallo(true)}
        />
    );
}

const estilos = StyleSheet.create({
    vacia: {
        width: "100%",
        backgroundColor: "#EFE9DD",
        alignItems: "center",
        justifyContent: "center"
    },
    emoji: { fontSize: 40 },
    sinImagen: { color: colores.textoSuave, fontSize: 12, marginTop: 4 }
});
