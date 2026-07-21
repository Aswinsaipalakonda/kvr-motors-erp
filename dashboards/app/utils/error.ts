export const getErrorMessage = (
  error: any,
  fallback: string = "An error occurred while processing your request."
): string => {
  if (!error) return fallback;

  // 1. Django REST Framework response handling
  if (error.response && error.response.data) {
    const data = error.response.data;

    // String response
    if (typeof data === "string" && data.trim()) {
      if (data.includes("<!DOCTYPE") || data.includes("<html")) {
        return fallback;
      }
      return data;
    }

    // JSON Object response
    if (typeof data === "object" && !Array.isArray(data)) {
      if (data.detail && typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }
      if (data.error && typeof data.error === "string" && data.error.trim()) {
        return data.error;
      }
      if (data.message && typeof data.message === "string" && data.message.trim()) {
        return data.message;
      }

      // Format validation dictionary: { "contact_number": ["Must be 10 digits"] }
      const fields = Object.keys(data);
      const messages: string[] = [];
      fields.forEach((field) => {
        const val = data[field];
        const fieldName = field.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
        if (Array.isArray(val) && val.length > 0) {
          messages.push(`${fieldName}: ${val.join(", ")}`);
        } else if (typeof val === "string" && val.trim()) {
          messages.push(`${fieldName}: ${val}`);
        }
      });
      if (messages.length > 0) {
        return messages.join(" | ");
      }
    }

    // Array of errors
    if (Array.isArray(data) && data.length > 0) {
      return data.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join(", ");
    }
  }

  // 2. Axios / JavaScript Error Message handling
  if (error.message && typeof error.message === "string") {
    const msg = error.message;

    // Intercept generic status code strings (e.g. "Request failed with status code 500")
    if (msg.includes("status code 500")) {
      return "Server error: Unable to complete operation. Linked records (stock units, bookings, or leads) exist for this item.";
    }
    if (msg.includes("status code 400")) {
      return "Invalid request: Please check the submitted form data.";
    }
    if (msg.includes("status code 403")) {
      return "Permission denied: You do not have authorization for this operation.";
    }
    if (msg.includes("status code 404")) {
      return "The requested record was not found.";
    }
    if (msg.includes("Network Error")) {
      return "Network error: Unable to reach server. Please check your internet connection.";
    }

    return msg;
  }

  return fallback;
};
