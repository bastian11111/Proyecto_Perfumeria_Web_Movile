import { Pressable, StyleSheet, Text, View } from "react-native";
import { Perfume } from "../modelos";
import { colores } from "../tema";
import { formatearPrecio } from "../utilidades/formato";
import { Boton } from "./Boton";
import { ImagenPerfume } from "./ImagenPerfume";

interface Props {
    perfume: Perfume;
    enCarrito: number;
    onAbrir: () => void;
    onAgregar: () => void;
}

export function TarjetaPerfume({ perfume, enCarrito, onAbrir, onAgregar }: Props) {
    const agotado = perfume.stock <= 0;

    return (
        <Pressable style={estilos.tarjeta} onPress={onAbrir}>
            <ImagenPerfume url={perfume.imagenUrl} alto={170} />
            <View style={estilos.cuerpo}>
                <Text style={estilos.marca}>{perfume.marca.toUpperCase()}</Text>
                <Text style={estilos.nombre}>{perfume.nombre}</Text>
                <Text style={estilos.detalle}>
                    {perfume.volumenMl} ml · {perfume.genero}
                </Text>
                {perfume.descripcion ? (
                    <Text style={estilos.descripcion} numberOfLines={2}>
                        {perfume.descripcion}
                    </Text>
                ) : null}
                <View style={estilos.pie}>
                    <Text style={estilos.precio}>{formatearPrecio(perfume.precio)}</Text>
                    {agotado ? (
                        <Text style={estilos.agotado}>Agotado</Text>
                    ) : (
                        <Boton
                            compacto
                            texto={enCarrito > 0 ? `Agregar (${enCarrito})` : "Agregar"}
                            onPress={onAgregar}
                        />
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const estilos = StyleSheet.create({
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colores.borde,
        overflow: "hidden",
        marginBottom: 16
    },
    cuerpo: { padding: 14 },
    marca: { fontSize: 11, letterSpacing: 1.2, color: colores.acento, fontWeight: "700" },
    nombre: { fontSize: 18, fontWeight: "700", color: colores.texto, marginTop: 2 },
    detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    descripcion: { fontSize: 13, color: colores.textoSuave, marginTop: 8 },
    pie: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 12
    },
    precio: { fontSize: 18, fontWeight: "700", color: colores.texto },
    agotado: { fontSize: 14, fontWeight: "700", color: colores.error }
});
