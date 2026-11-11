// RF-05: datos de envío, método de pago y confirmación del pedido
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { Campo } from "../componentes/Campo";
import { Encabezado } from "../componentes/Encabezado";
import { useCarrito } from "../estado/CarritoContext";
import { DatosEnvio, MetodoPago } from "../modelos";
import { useNavegacion } from "../navegacion/contexto";
import { estadoDeError, mensajeDeError } from "../servicios/http";
import { PedidoServicio } from "../servicios/PedidoServicio";
import { colores } from "../tema";
import { formatearPrecio } from "../utilidades/formato";
import { validarEnvio } from "../utilidades/validaciones";

const METODOS: { valor: MetodoPago; titulo: string; descripcion: string }[] = [
    {
        valor: "transferencia",
        titulo: "Transferencia bancaria",
        descripcion: "Te contactaremos para coordinar los datos de la transferencia."
    },
    {
        valor: "contra_entrega",
        titulo: "Pago contra entrega",
        descripcion: "Pagas al recibir tu pedido."
    }
];

const DATOS_INICIALES: DatosEnvio = { nombre: "", telefono: "", direccion: "", ciudad: "", email: "" };

export function CheckoutPantalla() {
    const { volver, reiniciar } = useNavegacion();
    const { items, total, vaciar } = useCarrito();

    const [datos, setDatos] = useState<DatosEnvio>(DATOS_INICIALES);
    const [metodo, setMetodo] = useState<MetodoPago>("transferencia");
    const [intentado, setIntentado] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const errores = validarEnvio(datos);
    const mostrar = (campo: keyof DatosEnvio) => (intentado ? errores[campo] : undefined);
    const actualizar = (campo: keyof DatosEnvio) => (valor: string) =>
        setDatos((previos) => ({ ...previos, [campo]: valor }));

    const confirmar = async () => {
        setIntentado(true);
        if (Object.keys(errores).length > 0) {
            Alert.alert("Revisa tus datos", "Hay campos con errores en el formulario.");
            return;
        }
        if (items.length === 0) {
            Alert.alert("Carrito vacío", "Agrega productos antes de confirmar.");
            return;
        }

        setEnviando(true);
        try {
            const pedido = await PedidoServicio.crear(
                {
                    nombre: datos.nombre.trim(),
                    telefono: datos.telefono.trim(),
                    direccion: datos.direccion.trim(),
                    ciudad: datos.ciudad.trim(),
                    email: datos.email.trim()
                },
                items.map((i) => ({ perfumeId: i.perfume._id, cantidad: i.cantidad })),
                metodo
            );
            vaciar();
            reiniciar({ nombre: "confirmacion", pedido });
        } catch (e) {
            if (estadoDeError(e) === 409) {
                Alert.alert("Producto no disponible", mensajeDeError(e), [
                    { text: "Revisar carrito", onPress: volver }
                ]);
            } else {
                Alert.alert("No se pudo registrar el pedido", mensajeDeError(e));
            }
        } finally {
            setEnviando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={estilos.pantalla}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Encabezado titulo="Finalizar compra" mostrarVolver mostrarCarrito={false} />

            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                <Text style={estilos.seccion}>Datos de envío</Text>
                <Campo
                    etiqueta="Nombre completo"
                    value={datos.nombre}
                    onChangeText={actualizar("nombre")}
                    error={mostrar("nombre")}
                    autoCapitalize="words"
                />
                <Campo
                    etiqueta="Teléfono"
                    value={datos.telefono}
                    onChangeText={actualizar("telefono")}
                    error={mostrar("telefono")}
                    keyboardType="phone-pad"
                    placeholder="+56 9 1234 5678"
                />
                <Campo
                    etiqueta="Dirección"
                    value={datos.direccion}
                    onChangeText={actualizar("direccion")}
                    error={mostrar("direccion")}
                    autoCapitalize="words"
                />
                <Campo
                    etiqueta="Ciudad"
                    value={datos.ciudad}
                    onChangeText={actualizar("ciudad")}
                    error={mostrar("ciudad")}
                    autoCapitalize="words"
                />
                <Campo
                    etiqueta="Correo (opcional)"
                    value={datos.email}
                    onChangeText={actualizar("email")}
                    error={mostrar("email")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <Text style={estilos.seccion}>Método de pago</Text>
                {METODOS.map((m) => (
                    <Pressable
                        key={m.valor}
                        onPress={() => setMetodo(m.valor)}
                        style={[estilos.opcion, metodo === m.valor && estilos.opcionActiva]}
                    >
                        <View style={[estilos.radio, metodo === m.valor && estilos.radioActivo]} />
                        <View style={{ flex: 1 }}>
                            <Text style={estilos.opcionTitulo}>{m.titulo}</Text>
                            <Text style={estilos.opcionDescripcion}>{m.descripcion}</Text>
                        </View>
                    </Pressable>
                ))}

                <Text style={estilos.seccion}>Resumen</Text>
                <View style={estilos.resumen}>
                    {items.map((i) => (
                        <View key={i.perfume._id} style={estilos.resumenFila}>
                            <Text style={estilos.resumenTexto} numberOfLines={1}>
                                {i.cantidad} × {i.perfume.nombre}
                            </Text>
                            <Text style={estilos.resumenTexto}>
                                {formatearPrecio(i.perfume.precio * i.cantidad)}
                            </Text>
                        </View>
                    ))}
                    <View style={[estilos.resumenFila, estilos.resumenTotal]}>
                        <Text style={estilos.totalTexto}>Total</Text>
                        <Text style={estilos.totalTexto}>{formatearPrecio(total)}</Text>
                    </View>
                </View>
                <Text style={estilos.nota}>
                    El precio final se confirma al registrar el pedido.
                </Text>
            </ScrollView>

            <BarraInferior>
                <Boton texto="Confirmar pedido" onPress={confirmar} cargando={enviando} />
            </BarraInferior>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 16, paddingBottom: 32 },
    seccion: {
        fontSize: 16,
        fontWeight: "700",
        color: colores.texto,
        marginTop: 8,
        marginBottom: 10
    },
    opcion: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colores.tarjeta,
        borderWidth: 1,
        borderColor: colores.borde,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10
    },
    opcionActiva: { borderColor: colores.primario },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: colores.deshabilitado,
        marginRight: 12
    },
    radioActivo: { borderColor: colores.primario, backgroundColor: colores.primario },
    opcionTitulo: { fontSize: 15, fontWeight: "600", color: colores.texto },
    opcionDescripcion: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    resumen: {
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14
    },
    resumenFila: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6
    },
    resumenTexto: { fontSize: 14, color: colores.texto, flexShrink: 1, marginRight: 8 },
    resumenTotal: {
        borderTopWidth: 1,
        borderTopColor: colores.borde,
        paddingTop: 10,
        marginTop: 4,
        marginBottom: 0
    },
    totalTexto: { fontSize: 17, fontWeight: "700", color: colores.texto },
    nota: { fontSize: 12, color: colores.textoSuave, marginTop: 8 },
});
