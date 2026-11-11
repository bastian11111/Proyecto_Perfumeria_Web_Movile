// RF-01 (admin): formulario para crear o editar un perfume
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { BarraInferior } from "../componentes/BarraInferior";
import { Boton } from "../componentes/Boton";
import { Campo } from "../componentes/Campo";
import { Chips } from "../componentes/Chips";
import { Encabezado } from "../componentes/Encabezado";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { DatosPerfume, Genero, Perfume } from "../modelos";
import { useNavegacion } from "../navegacion/contexto";
import { AdminServicio } from "../servicios/AdminServicio";
import { mensajeDeError } from "../servicios/http";
import { colores } from "../tema";
import { avisar } from "../utilidades/avisos";

const GENEROS: readonly Genero[] = ["Hombre", "Mujer", "Unisex"];

// "99990" o "99,5" -> número; vacío -> NaN
function aNumero(texto: string): number {
    const limpio = texto.trim().replace(",", ".");
    return limpio === "" ? NaN : Number(limpio);
}

export function AdminPerfumeFormPantalla({ perfume }: { perfume?: Perfume }) {
    const { volver } = useNavegacion();
    const { tokenActual, manejarSesionVencida } = useSesionAdmin();
    const editando = perfume !== undefined;

    const [nombre, setNombre] = useState(perfume?.nombre ?? "");
    const [marca, setMarca] = useState(perfume?.marca ?? "");
    const [genero, setGenero] = useState<Genero>(perfume?.genero ?? "Unisex");
    const [volumen, setVolumen] = useState(perfume ? String(perfume.volumenMl) : "");
    const [precio, setPrecio] = useState(perfume ? String(perfume.precio) : "");
    const [stock, setStock] = useState(perfume ? String(perfume.stock) : "");
    const [descripcion, setDescripcion] = useState(perfume?.descripcion ?? "");
    const [imagenUrl, setImagenUrl] = useState(perfume?.imagenUrl ?? "");
    const [intentado, setIntentado] = useState(false);
    const [guardando, setGuardando] = useState(false);

    const errores = {
        nombre: nombre.trim().length >= 2 ? undefined : "Ingresa el nombre",
        marca: marca.trim().length >= 2 ? undefined : "Ingresa la marca",
        volumen: aNumero(volumen) > 0 ? undefined : "Ingresa un volumen mayor a 0",
        precio: aNumero(precio) > 0 ? undefined : "Ingresa un precio mayor a 0",
        stock:
            Number.isInteger(aNumero(stock)) && aNumero(stock) >= 0
                ? undefined
                : "El stock debe ser un número entero (0 o más)",
        imagenUrl:
            imagenUrl.trim() === "" || /^https?:\/\/\S+$/i.test(imagenUrl.trim())
                ? undefined
                : "Debe empezar con http:// o https://"
    };
    const hayErrores = Object.values(errores).some((e) => e !== undefined);
    const mostrar = (campo: keyof typeof errores) => (intentado ? errores[campo] : undefined);

    const guardar = async () => {
        setIntentado(true);
        if (hayErrores) {
            Alert.alert("Revisa los datos", "Hay campos con errores en el formulario.");
            return;
        }

        const datos: DatosPerfume = {
            nombre: nombre.trim(),
            marca: marca.trim(),
            genero,
            volumenMl: aNumero(volumen),
            precio: aNumero(precio),
            stock: aNumero(stock),
            descripcion: descripcion.trim(),
            imagenUrl: imagenUrl.trim()
        };

        setGuardando(true);
        try {
            if (editando) await AdminServicio.editarPerfume(tokenActual, perfume._id, datos);
            else await AdminServicio.crearPerfume(tokenActual, datos);
            avisar(editando ? "Perfume actualizado" : "Perfume creado");
            volver();
        } catch (e) {
            if (!manejarSesionVencida(e)) {
                Alert.alert("No se pudo guardar", mensajeDeError(e));
            }
        } finally {
            setGuardando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={estilos.pantalla}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Encabezado
                titulo={editando ? "Editar perfume" : "Nuevo perfume"}
                mostrarVolver
                mostrarCarrito={false}
            />
            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                <Campo
                    etiqueta="Nombre"
                    value={nombre}
                    onChangeText={setNombre}
                    error={mostrar("nombre")}
                    autoCapitalize="words"
                />
                <Campo
                    etiqueta="Marca"
                    value={marca}
                    onChangeText={setMarca}
                    error={mostrar("marca")}
                    autoCapitalize="words"
                />

                <Text style={estilos.etiqueta}>Género</Text>
                <Chips opciones={GENEROS} valor={genero} onCambiar={setGenero} />
                <View style={{ height: 14 }} />

                <Campo
                    etiqueta="Volumen (ml)"
                    value={volumen}
                    onChangeText={setVolumen}
                    error={mostrar("volumen")}
                    keyboardType="numeric"
                />
                <Campo
                    etiqueta="Precio de venta"
                    value={precio}
                    onChangeText={setPrecio}
                    error={mostrar("precio")}
                    keyboardType="numeric"
                />
                <Campo
                    etiqueta="Stock actual"
                    value={stock}
                    onChangeText={setStock}
                    error={mostrar("stock")}
                    keyboardType="numeric"
                />
                <Campo
                    etiqueta="Descripción (opcional)"
                    value={descripcion}
                    onChangeText={setDescripcion}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    style={{ minHeight: 80 }}
                />
                <Campo
                    etiqueta="URL de la imagen (opcional)"
                    value={imagenUrl}
                    onChangeText={setImagenUrl}
                    error={mostrar("imagenUrl")}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    placeholder="https://..."
                />
            </ScrollView>

            <BarraInferior>
                <Boton
                    texto={editando ? "Guardar cambios" : "Crear perfume"}
                    onPress={guardar}
                    cargando={guardando}
                />
            </BarraInferior>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 16, paddingBottom: 32 },
    etiqueta: { fontSize: 13, fontWeight: "600", color: colores.texto, marginBottom: 6 }
});
