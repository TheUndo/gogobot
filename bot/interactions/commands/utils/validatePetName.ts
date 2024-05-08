export function validatePetName(name: string) {
  if (name.length < 3) {
    return "Name must be at least 3 characters long";
  }

  if (name.length > 20) {
    return "Name must be at most 20 characters long";
  }

  if (/![^[.,a-zA-ZåäöÅÄÖ0-9 ]$]/.test(name)) {
    return "Name must not contain special characters";
  }

  if (!/[a-zA-Z]/.test(name)) {
    return "Name must contain at least one letter";
  }

  return null;
}
