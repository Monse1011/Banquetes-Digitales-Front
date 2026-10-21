export function confirmationOutcome(status: string) {
  const complete = status === "Coordinación Lista";
  return {
    complete,
    message: complete
      ? "Coordinación lista. Los recursos quedaron confirmados. Puedes continuar con los acuerdos del cliente."
      : status === "Coordinación Incompleta"
        ? "Coordinación incompleta. Revisa los recursos marcados como insuficientes, ajusta las cantidades y guarda los cambios. Después vuelve a finalizar la confirmación."
        : `Confirmación guardada. Estado actual: ${status}. Revisa la disponibilidad antes de continuar.`,
  };
}
