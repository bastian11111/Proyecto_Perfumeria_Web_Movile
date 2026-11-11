// RF-03: detalle de un perfume + agregar al carrito (RF-04)
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { Encabezado } from "../componentes/Encabezado";
import { ImagenPerfume } from "../componentes/ImagenPerfume";
import { SelectorCantidad } from "../componentes/SelectorCantidad";
import { useCarrito } from "../estado/CarritoContext";
import { Perfume } from "../modelos";
import { useNavegacion } from "../navegacion/contexto";
import { mensajeDeError } from "../servicios/http";
import { PerfumeServicio } from "../servicios/PerfumeServicio";
import { colores } from "../tema";
import { avisar } from "../utilidades/avisos";
import { formatearPrecio } from "../utilidades/formato";

export function DetallePantalla({ perfumeId }: { perfumeId: string }) {
    const { ir, volver } = useNavegacion();
    const { agregar, cantidadDe } = useCarrito();

    const [perfume, setPerfume] = useState<Perfume | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [cantidad, setCantidad] = useState(1);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError("");
        try {
            setPerfume(await PerfumeServicio.obtener(perfumeId));
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setCargando(false);
        }
    }, [perfumeId]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const enCarrito = perfume ? cantidadDe(perfume._id) : 0;
    const disponible = perfume ? Math.max(perfume.stock - enCarrito, 0) : 0;
    const cantidadValida = Math.min(cantidad, Math.max(disponible, 1));

    const alAgregar = () => {
        if (!perfume) return;
        if (!agregar(perfume, cantidadValida)) {
            avisar("No hay más unidades disponibles");
            return;
        }
        setCantidad(1);
        Alert.alert("Agregado al carrito", `${cantidadValida} × ${perfume.nombre}`, [
            { text: "Seguir comprando", onPress: volver },
            { text: "Ir al carrito", onPress: () => ir({ nombre: "carrito" }) }
        ]);
    };

    return (
        <View style={estilos.pantalla}>
            <Encabezado titulo="Detalle" mostrarVolver />

            {cargando ? (
                <View style={estilos.centro}>
                    <ActivityIndicator size="large" color={colores.primario} />
                </View>
            ) : error || !perfume ? (
                <View style={estilos.centro}>
                    <Text style={estilos.error}>{error || "No se pudo cargar el perfume."}</Text>
                    <Boton texto="Reintentar" onPress={cargar} />
                </View>
            ) : (
                <>
                    <ScrollView>
                        <ImagenPerfume url={perfume.imagenUrl} alto={280} />
                        <View style={estilos.cuerpo}>
                            <Text style={estilos.marca}>{perfume.marca.toUpperCase()}</Text>
                            <Text style={estilos.nombre}>{perfume.nombre}</Text>
                            <Text style={estilos.detalle}>
                                {perfume.volumenMl} ml · {perfume.genero}
                            </Text>
                            <Text style={estilos.precio}>{formatearPrecio(perfume.precio)}</Text>

                            <Text style={estilos.subtitulo}>Descripción</Text>
                            <Text style={estilos.descripcion}>
                                {perfume.descripcion ? perfume.descripcion : "Sin descripción disponible."}
                            </Text>

                            {perfume.stock <= 0 ? (
                                <Text style={estilos.agotado}>Agotado</Text>
                            ) : (
                                <Text style={estilos.stock}>
                                    {perfume.stock <= 5
                                        ? `¡Quedan solo ${perfume.stock} unidades!`
                                        : "Disponible"}
                                </Text>
                            )}
                        </View>
                    </ScrollView>

                    <BarraInferior>
                        {perfume.stock <= 0 ? (
                            <Boton texto="Agotado" onPress={() => {}} deshabilitado />
                        ) : disponible === 0 ? (
                            <>
                                <Text style={estilos.aviso}>
                                    Ya tienes todas las unidades disponibles en tu carrito.
                                </Text>
                                <Boton
                                    texto="Ir al carrito"
                                    onPress={() => ir({ nombre: "carrito" })}
                                />
                            </>
                        ) : (
                            <View style={estilos.fila}>
                                <SelectorCantidad
                                    valor={cantidadValida}
                                    max={disponible}
                                    onCambiar={setCantidad}
                                />
                                <View style={{ flex: 1, marginLeft: 16 }}>
                                    <Boton texto="Agregar al carrito" onPress={alAgregar} />
                                </View>
                            </View>
                        )}
                    </BarraInferior>
                </>
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    error: { color: colores.error, textAlign: "center", marginBottom: 16, lineHeight: 20 },
    cuerpo: { padding: 20 },
    marca: { fontSize: 12, letterSpacing: 1.4, color: colores.acento, fontWeight: "700" },
    nombre: { fontSize: 26, fontWeight: "700", color: colores.texto, marginTop: 4 },
    detalle: { fontSize: 14, color: colores.textoSuave, marginTop: 4 },
    precio: { fontSize: 24, fontWeight: "700", color: colores.texto, marginTop: 12 },
    subtitulo: { fontSize: 14, fontWeight: "700", color: colores.texto, marginTop: 20 },
    descripcion: { fontSize: 15, color: colores.textoSuave, marginTop: 6, lineHeight: 22 },
    stock: { fontSize: 14, color: colores.exito, marginTop: 16, fontWeight: "600" },
    agotado: { fontSize: 14, color: colores.error, marginTop: 16, fontWeight: "700" },
    fila: { flexDirection: "row", alignItems: "center" },
    aviso: { color: colores.textoSuave, textAlign: "center", marginBottom: 10 }
});
