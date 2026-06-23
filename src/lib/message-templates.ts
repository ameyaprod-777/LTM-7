export const MESSAGE_REPLY_TEMPLATES = [
  { id: "available", label: "Disponible", body: "Bonjour, je suis disponible pour ces dates." },
  { id: "pickup", label: "Adresse retrait", body: "L'adresse de retrait est : [à compléter]. Créneaux possibles : [horaires]." },
  { id: "delivery", label: "Livraison OK", body: "La livraison est possible sur votre secteur. Merci de confirmer l'adresse exacte." },
  { id: "quote", label: "Devis", body: "Voici mon devis détaillé pour votre demande. N'hésitez pas si vous avez des questions." },
  { id: "thanks", label: "Merci", body: "Merci pour votre message, je reviens vers vous rapidement." },
] as const;
