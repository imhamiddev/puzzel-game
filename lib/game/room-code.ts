import { customAlphabet } from "nanoid";

// Uppercase letters + digits, excludes ambiguous chars (0/O, 1/I) for readability
const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(alphabet, 6);

export function generateRoomCode(): string {
  return generate();
}
