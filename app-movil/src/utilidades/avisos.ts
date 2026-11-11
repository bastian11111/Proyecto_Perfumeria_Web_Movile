import { Alert, Platform, ToastAndroid } from "react-native";

// Mensaje breve: toast en Android, alerta en otras plataformas
export function avisar(mensaje: string): void {
    if (Platform.OS === "android") {
        ToastAndroid.show(mensaje, ToastAndroid.SHORT);
    } else {
        Alert.alert(mensaje);
    }
}
