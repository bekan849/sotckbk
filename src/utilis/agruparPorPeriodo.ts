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
      const lunes = new Date(fechaCopia.setDate(fechaCopia.getDate() - ((diaSemana + 6) % 7)));
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      return `${lunes.getDate()}-${domingo.getDate()} ${lunes.toLocaleDateString("es-ES", {
        month: "long",
      })}`;
    }

    case "mes":
      return fecha.toLocaleDateString("es-ES", { month: "long" });

    case "anio":
      return fecha.getFullYear().toString();

    default:
      return "Desconocido";
  }
};
