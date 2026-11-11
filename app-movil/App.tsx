// Punto de entrada de la app (cliente + panel de administración).
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CarritoProvider } from "./src/estado/CarritoContext";
import { SesionAdminProvider } from "./src/estado/SesionAdminContext";
import { Navegador } from "./src/navegacion/Navegador";

export default function App() {
    return (
        <SafeAreaProvider>
            <SesionAdminProvider>
                <CarritoProvider>
                    <StatusBar style="dark" />
                    <Navegador />
                </CarritoProvider>
            </SesionAdminProvider>
        </SafeAreaProvider>
    );
}
