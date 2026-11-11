// Menú principal del panel de administración
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Boton } from "../componentes/Boton";
import { Encabezado } from "../componentes/Encabezado";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { useNavegacion } from "../navegacion/contexto";
import { colores } from "../tema";

interface OpcionProps {
    titulo: string;
    descripcion: string;
    onPress: () => void;
}

function Opcion({ titulo, descripcion, onPress }: OpcionProps) {
    return (
        <Pressable style={estilos.opcion} onPress={onPress}>
            <View style={{ flex: 1 }}>
                <Text style={estilos.opcionTitulo}>{titulo}</Text>
                <Text style={estilos.opcionDescripcion}>{descripcion}</Text>
            </View>
            <Text style={estilos.flecha}>›</Text>
        </Pressable>
    );
}

export function AdminMenuPantalla() {
    const { ir, reiniciar } = useNavegacion();
    const { cerrar } = useSesionAdmin();

    return (
        <View style={estilos.pantalla}>
            <Encabezado titulo="Administración" mostrarVolver mostrarCarrito={false} />
            <View style={estilos.contenido}>
                <Opcion
                    titulo="Perfumes"
                    descripcion="Crear, editar, dar de baja y controlar el stock"
                    onPress={() => ir({ nombre: "adminPerfumes" })}
                />
                <Opcion
                    titulo="Pedidos"
                    descripcion="Ver las órdenes y actualizar su estado"
                    onPress={() => ir({ nombre: "adminPedidos" })}
                />
                <View style={{ height: 16 }} />
                <Boton
                    texto="Cerrar sesión"
                    variante="secundario"
                    onPress={() => {
                        cerrar();
                        reiniciar();
                    }}
                />
            </View>
        </View>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 16 },
    opcion: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colores.tarjeta,
        borderWidth: 1,
        borderColor: colores.borde,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12
    },
    opcionTitulo: { fontSize: 17, fontWeight: "700", color: colores.texto },
    opcionDescripcion: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    flecha: { fontSize: 28, color: colores.textoSuave, marginLeft: 8 }
});
