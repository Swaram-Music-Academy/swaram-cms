export function dateString(dateString: string) {
  const [year, month, date] = dateString.split("-").map(Number);

  const dateObj = new Date(year, month - 1, date);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getAcademicYear() {
  const date = new Date();
  const month = date.getMonth();
  return month < 5 ? date.getFullYear() - 1 : date.getFullYear();
}

export function getTimeString(timestring: string) {
  const [hours, minutes] = timestring.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error("Invalid time string format. Expected format: HH:mm:ss");
  }

  const isPM = hours >= 12;
  const friendlyHours = hours % 12 || 12; // Convert 0 to 12 for midnight, and use 12-hour format
  const friendlyMinutes = minutes.toString().padStart(2, "0"); // Ensure minutes are two digits
  const period = isPM ? "PM" : "AM";

  return `${friendlyHours}:${friendlyMinutes} ${period}`;
}

export function formatTime(timeString: string | undefined) {
  if (!timeString) return "";
  const [hours, minutes] = timeString.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const formattedMinutes = minutes
    ? `:${String(minutes).padStart(2, "0")}`
    : "";

  return `${formattedHours}${formattedMinutes} ${period}`;
}

export function getCurrentTimeString() {
  const time = new Date();
  return (
    time.getHours().toString().padStart(2, "0") +
    ":" +
    time.getMinutes().toString().padStart(2, "0")
  );
}
