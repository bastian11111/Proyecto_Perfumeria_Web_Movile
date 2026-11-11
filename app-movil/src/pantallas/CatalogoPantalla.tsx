// RF-03: catálogo público de perfumes
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { Boton } from "../componentes/Boton";
import { Encabezado } from "../componentes/Encabezado";
import { TarjetaPerfume } from "../componentes/TarjetaPerfume";
import { useCarrito } from "../estado/CarritoContext";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { Genero, Perfume } from "../modelos";
import { useNavegacion } from "../navegacion/contexto";
import { mensajeDeError } from "../servicios/http";
import { PerfumeServicio } from "../servicios/PerfumeServicio";
import { colores } from "../tema";
import { avisar } from "../utilidades/avisos";

const FILTROS: (Genero | "Todos")[] = ["Todos", "Hombre", "Mujer", "Unisex"];

export function CatalogoPantalla() {
    const { ir } = useNavegacion();
    const { agregar, cantidadDe } = useCarrito();
    const { token } = useSesionAdmin();

    const [perfumes, setPerfumes] = useState<Perfume[]>([]);
    const [cargando, setCargando] = useState(true);
    const [refrescando, setRefrescando] = useState(false);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [genero, setGenero] = useState<Genero | "Todos">("Todos");

    const cargar = useCallback(async (esRefresco: boolean = false) => {
        if (esRefresco) setRefrescando(true);
        else setCargando(true);
        setError("");
        try {
            setPerfumes(await PerfumeServicio.listar());
        } catch (e) {
            setError(mensajeDeError(e));
        } finally {
            setCargando(false);
            setRefrescando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const visibles = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return perfumes.filter(
            (p) =>
                (genero === "Todos" || p.genero === genero) &&
                (texto === "" ||
                    p.nombre.toLowerCase().includes(texto) ||
                    p.marca.toLowerCase().includes(texto))
        );
    }, [perfumes, busqueda, genero]);

    const alAgregar = (perfume: Perfume) => {
        if (agregar(perfume)) {
            avisar(`${perfume.nombre} agregado al carrito`);
        } else {
            avisar("No hay más unidades disponibles");
        }
    };

    return (
        <View style={estilos.pantalla}>
            <Encabezado titulo="Perfumería" />

            <View style={estilos.filtros}>
                <TextInput
                    style={estilos.busqueda}
                    placeholder="Buscar por nombre o marca"
                    placeholderTextColor={colores.deshabilitado}
                    value={busqueda}
                    onChangeText={setBusqueda}
                />
                <View style={estilos.chips}>
                    {FILTROS.map((f) => (
                        <Pressable
                            key={f}
                            onPress={() => setGenero(f)}
                            style={[estilos.chip, genero === f && estilos.chipActivo]}
                        >
                            <Text style={[estilos.chipTexto, genero === f && estilos.chipTextoActivo]}>
                                {f}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

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
                    data={visibles}
                    keyExtractor={(p) => p._id}
                    contentContainerStyle={estilos.lista}
                    refreshing={refrescando}
                    onRefresh={() => cargar(true)}
                    ListFooterComponent={
                        <Pressable
                            style={estilos.admin}
                            onPress={() => ir({ nombre: token ? "adminMenu" : "adminLogin" })}
                        >
                            <Text style={estilos.adminTexto}>Acceso administrador</Text>
                        </Pressable>
                    }
                    ListEmptyComponent={
                        <Text style={estilos.vacio}>
                            {perfumes.length === 0
                                ? "Aún no hay perfumes en el catálogo."
                                : "No se encontraron perfumes con ese filtro."}
                        </Text>
                    }
                    renderItem={({ item }) => (
                        <TarjetaPerfume
                            perfume={item}
                            enCarrito={cantidadDe(item._id)}
                            onAbrir={() => ir({ nombre: "detalle", perfumeId: item._id })}
                            onAgregar={() => alAgregar(item)}
                        />
                    )}
                />
            )}
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    filtros: { padding: 16, paddingBottom: 4 },
    busqueda: {
        borderWidth: 1,
        borderColor: colores.borde,
        backgroundColor: colores.tarjeta,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: colores.texto
    },
    chips: { flexDirection: "row", marginTop: 10 },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colores.borde,
        backgroundColor: colores.tarjeta,
        marginRight: 8
    },
    chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
    chipTexto: { fontSize: 13, color: colores.texto },
    chipTextoActivo: { color: "#FFFFFF", fontWeight: "600" },
    lista: { padding: 16 },
    centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
    error: { color: colores.error, textAlign: "center", marginBottom: 16, lineHeight: 20 },
    vacio: { textAlign: "center", color: colores.textoSuave, marginTop: 40 },
    admin: { alignItems: "center", paddingVertical: 20 },
    adminTexto: { color: colores.textoSuave, fontSize: 13, textDecorationLine: "underline" }
});
