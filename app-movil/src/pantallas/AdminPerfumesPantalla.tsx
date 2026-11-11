// RF-01 (admin): listado de perfumes con alta, edición, baja lógica y reactivación
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { Encabezado } from "../componentes/Encabezado";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { Perfume } from "../modelos";
import { useNavegacion } from "../navegacion/contexto";
import { AdminServicio } from "../servicios/AdminServicio";
import { mensajeDeError } from "../servicios/http";
import { colores } from "../tema";
import { avisar } from "../utilidades/avisos";
import { formatearPrecio } from "../utilidades/formato";

export function AdminPerfumesPantalla() {
    const { ir } = useNavegacion();
    const { tokenActual, manejarSesionVencida } = useSesionAdmin();

    const [perfumes, setPerfumes] = useState<Perfume[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState("");

    const cargar = useCallback(
        async (esRefresco: boolean = false) => {
            if (esRefresco) setRefrescando(true);
            else setCargando(true);
            setError("");
            try {
                setPerfumes(await AdminServicio.listarPerfumes(tokenActual));
            } catch (e) {
                if (!manejarSesionVencida(e)) setError(mensajeDeError(e));
            } finally {
                setCargando(false);
                setRefrescando(false);
            }
        },
        [tokenActual, manejarSesionVencida]
    );

    useEffect(() => {
        cargar();
    }, [cargar]);

    const cambiarActivo = (p: Perfume) => {
        const darDeBaja = p.activo;
        Alert.alert(
            darDeBaja ? "Dar de baja" : "Reactivar",
            darDeBaja
                ? `"${p.nombre}" dejará de verse en el catálogo (sus pedidos anteriores se conservan).`
                : `"${p.nombre}" volverá a verse en el catálogo.`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: darDeBaja ? "Dar de baja" : "Reactivar",
                    style: darDeBaja ? "destructive" : "default",
                    onPress: async () => {
                        try {
                            if (darDeBaja) await AdminServicio.darDeBaja(tokenActual, p._id);
                            else await AdminServicio.reactivar(tokenActual, p._id);
                            avisar(darDeBaja ? "Perfume dado de baja" : "Perfume reactivado");
                            cargar();
                        } catch (e) {
                            if (!manejarSesionVencida(e)) {
                                Alert.alert("No se pudo completar la acción", mensajeDeError(e));
                            }
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={estilos.pantalla}>
            <Encabezado titulo="Perfumes" mostrarVolver mostrarCarrito={false} />

            {cargando ? (
                <View style={estilos.centro}>
                    <ActivityIndicator size="large" color={colores.primario} />
                </View>
            ) : error ? (
                <View style={estilos.centro}>
                    <Text style={estilos.error}>{error}</Text>
                    <Boton texto="Reintentar" onPress={() => cargar()} />
                </View>
            ) : (
                <FlatList
                    data={perfumes}
                    keyExtractor={(p) => p._id}
                    contentContainerStyle={estilos.lista}
                    refreshing={refrescando}
                    onRefresh={() => cargar(true)}
                    ListEmptyComponent={
                        <Text style={estilos.vacio}>Aún no hay perfumes. Crea el primero.</Text>
                    }
                    renderItem={({ item }) => (
                        <View style={[estilos.fila, !item.activo && estilos.filaInactiva]}>
                            <View style={estilos.encabezadoFila}>
                                <Text style={estilos.marca}>{item.marca.toUpperCase()}</Text>
                                {!item.activo && <Text style={estilos.baja}>DE BAJA</Text>}
                            </View>
                            <Text style={estilos.nombre}>{item.nombre}</Text>
                            <Text style={estilos.detalle}>
                                {item.volumenMl} ml · {item.genero} · {formatearPrecio(item.precio)}
                            </Text>
                            <Text style={[estilos.stock, item.stock === 0 && estilos.sinStock]}>
                                Stock: {item.stock}
                            </Text>
                            <View style={estilos.acciones}>
                                <View style={{ flex: 1 }}>
                                    <Boton
                                        compacto
                                        variante="secundario"
                                        texto="Editar"
                                        onPress={() => ir({ nombre: "adminPerfumeForm", perfume: item })}
                                    />
                                </View>
                                <View style={{ width: 10 }} />
                                <View style={{ flex: 1 }}>
                                    <Boton
                                        compacto
                                        variante={item.activo ? "peligro" : "primario"}
                                        texto={item.activo ? "Dar de baja" : "Reactivar"}
                                        onPress={() => cambiarActivo(item)}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}

            <BarraInferior>
                <Boton texto="Nuevo perfume" onPress={() => ir({ nombre: "adminPerfumeForm" })} />
            </BarraInferior>
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    error: { color: colores.error, textAlign: "center", marginBottom: 16, lineHeight: 20 },
    lista: { padding: 16 },
    vacio: { textAlign: "center", color: colores.textoSuave, marginTop: 40 },
    fila: {
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14,
        marginBottom: 12
    },
    filaInactiva: { opacity: 0.6 },
    encabezadoFila: { flexDirection: "row", justifyContent: "space-between" },
    marca: { fontSize: 11, letterSpacing: 1.2, color: colores.acento, fontWeight: "700" },
    baja: { fontSize: 11, fontWeight: "700", color: colores.error },
    nombre: { fontSize: 17, fontWeight: "700", color: colores.texto, marginTop: 2 },
    detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    stock: { fontSize: 14, fontWeight: "600", color: colores.texto, marginTop: 6 },
    sinStock: { color: colores.error },
    acciones: { flexDirection: "row", marginTop: 12 }
});
