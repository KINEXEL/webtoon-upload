export function toDateTimeLocalValue(date?: Date | null) {
  if (!date) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function nowDateTimeLocalValue() {
  return toDateTimeLocalValue(new Date());
}

export function toDateTimeDisplay(date?: Date | null) {
  return toDateTimeLocalValue(date).replace("T", " ");
}
