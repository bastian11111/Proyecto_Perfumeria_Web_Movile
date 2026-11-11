// Inicio de sesión del administrador
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Boton } from "../componentes/Boton";
import { Campo } from "../componentes/Campo";
import { Encabezado } from "../componentes/Encabezado";
import { useSesionAdmin } from "../estado/SesionAdminContext";
import { useNavegacion } from "../navegacion/contexto";
import { AdminServicio } from "../servicios/AdminServicio";
import { mensajeDeError } from "../servicios/http";
import { colores } from "../tema";

export function AdminLoginPantalla() {
    const { reiniciar } = useNavegacion();
    const { iniciar } = useSesionAdmin();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [intentado, setIntentado] = useState(false);
    const [enviando, setEnviando] = useState(false);

    const errorEmail = /^\S+@\S+\.\S+$/.test(email.trim()) ? undefined : "Ingresa un correo válido";
    const errorPassword = password.length > 0 ? undefined : "Ingresa tu contraseña";

    const entrar = async () => {
        setIntentado(true);
        if (errorEmail || errorPassword) return;

        setEnviando(true);
        try {
            const token = await AdminServicio.login(email.trim(), password);
            iniciar(token);
            reiniciar({ nombre: "adminMenu" });
        } catch (e) {
            Alert.alert("No se pudo iniciar sesión", mensajeDeError(e));
        } finally {
            setEnviando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={estilos.pantalla}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <Encabezado
                titulo="Administrador"
                mostrarVolver
                mostrarCarrito={false}
                alVolver={() => reiniciar()}
            />
            <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
                <Text style={estilos.titulo}>Acceso para administradores</Text>
                <Text style={estilos.subtitulo}>
                    Ingresa con la cuenta creada en el backend (npm run crear-admin).
                </Text>
                <View style={{ height: 16 }} />
                <Campo
                    etiqueta="Correo"
                    value={email}
                    onChangeText={setEmail}
                    error={intentado ? errorEmail : undefined}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <Campo
                    etiqueta="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    error={intentado ? errorPassword : undefined}
                    secureTextEntry
                    autoCapitalize="none"
                />
                <Boton texto="Ingresar" onPress={entrar} cargando={enviando} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const estilos = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: colores.fondo },
    contenido: { padding: 20 },
    titulo: { fontSize: 20, fontWeight: "700", color: colores.texto, marginTop: 8 },
    subtitulo: { fontSize: 13, color: colores.textoSuave, marginTop: 4 }
});
