import { Perfume } from "../modelos";
import { pedirJson } from "./http";

export const PerfumeServicio = {
    listar: () => pedirJson<Perfume[]>("/perfumes"),
    obtener: (id: string) => pedirJson<Perfume>(`/perfumes/${id}`)
};
