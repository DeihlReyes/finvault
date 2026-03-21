/**
 * Keyword → category name mapping for auto-suggest in TransactionForm.
 * Keys are lowercase keywords; values are category names (matched against user's categories).
 */
export const CATEGORY_KEYWORD_MAP: Record<string, string> = {
  // Food & Dining
  restaurant: "Food",
  cafe: "Food",
  coffee: "Food",
  pizza: "Food",
  burger: "Food",
  sushi: "Food",
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  grocery: "Food",
  supermarket: "Food",
  // Transport
  uber: "Transport",
  lyft: "Transport",
  taxi: "Transport",
  gas: "Transport",
  fuel: "Transport",
  parking: "Transport",
  bus: "Transport",
  metro: "Transport",
  train: "Transport",
  flight: "Transport",
  airline: "Transport",
  // Housing
  rent: "Housing",
  mortgage: "Housing",
  electricity: "Housing",
  water: "Housing",
  internet: "Housing",
  wifi: "Housing",
  utility: "Housing",
  // Entertainment
  netflix: "Entertainment",
  spotify: "Entertainment",
  cinema: "Entertainment",
  movie: "Entertainment",
  game: "Entertainment",
  concert: "Entertainment",
  // Health
  pharmacy: "Health",
  doctor: "Health",
  hospital: "Health",
  gym: "Health",
  fitness: "Health",
  medicine: "Health",
  // Shopping
  amazon: "Shopping",
  ebay: "Shopping",
  clothes: "Shopping",
  shoes: "Shopping",
  mall: "Shopping",
  // Income
  salary: "Salary",
  paycheck: "Salary",
  payroll: "Salary",
  freelance: "Freelance",
  invoice: "Freelance",
  client: "Freelance",
  // Savings
  savings: "Savings",
  investment: "Savings",
  deposit: "Savings",
};

/**
 * Given a note/description, returns a suggested category name or null.
 */
export function suggestCategory(note: string): string | null {
  const lower = note.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORD_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return null;
}
