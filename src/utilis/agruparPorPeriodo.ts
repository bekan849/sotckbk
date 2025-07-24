export const agruparPorPeriodo = (
  fecha: Date,
  tipo: "dia" | "semana" | "mes" | "anio"
): string => {
  switch (tipo) {
    case "dia":
      return fecha.toLocaleDateString("es-ES", { weekday: "long" });

    case "semana": {
      const fechaCopia = new Date(fecha);
      const diaSemana = fechaCopia.getDay();
      const lunes = new Date(fechaCopia);
      lunes.setDate(fechaCopia.getDate() - ((diaSemana + 6) % 7));
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      return `${lunes.getDate().toString().padStart(2, '0')}/${(lunes.getMonth() + 1)
        .toString()
        .padStart(2, '0')} - ${domingo.getDate().toString().padStart(2, '0')}/${(domingo.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`;
    }

    case "mes":
      return fecha.toLocaleDateString("es-ES", { month: "long" });

    case "anio":
      return fecha.getFullYear().toString();

    default:
      return "Desconocido";
  }
};


import { toZonedTime } from "date-fns-tz";

const ZONA_HORARIA = "America/La_Paz";

export const esDelPeriodo = (
  fechaVenta: Date,
  tipo: "dia" | "semana" | "mes" | "anio",
  compararCon: Date = new Date()
): boolean => {
  const fecha = toZonedTime(fechaVenta, ZONA_HORARIA);
  const referencia = toZonedTime(compararCon, ZONA_HORARIA);

  switch (tipo) {
    case "dia":
      return (
        fecha.getFullYear() === referencia.getFullYear() &&
        fecha.getMonth() === referencia.getMonth() &&
        fecha.getDate() === referencia.getDate()
      );

    case "semana": {
      const getLunes = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        return new Date(date.setDate(date.getDate() + diff));
      };

      const lunesVenta = getLunes(fecha);
      const lunesReferencia = getLunes(referencia);

      return lunesVenta.toDateString() === lunesReferencia.toDateString();
    }

    case "mes":
      return (
        fecha.getFullYear() === referencia.getFullYear() &&
        fecha.getMonth() === referencia.getMonth()
      );

    case "anio":
      return fecha.getFullYear() === referencia.getFullYear();

    default:
      return false;
  }
};
