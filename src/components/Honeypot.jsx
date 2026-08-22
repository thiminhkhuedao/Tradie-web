/**
 * Champ honeypot — invisible pour un humain, irrésistible pour un bot
 * basique qui remplit tous les champs d'un formulaire automatiquement.
 *
 * Comment ça marche :
 * - Le champ est cosmétiquement invisible (pas juste display:none — certains
 *   bots savent le détecter, donc on utilise un positionnement hors-écran)
 * - Un humain ne le voit jamais et ne le remplit jamais
 * - Un bot qui remplit tous les <input> du formulaire va le remplir
 * - Si à la soumission ce champ n'est PAS vide -> c'est un bot -> on rejette
 *   silencieusement (on peut même faire semblant que ça a marché, pour ne
 *   pas donner d'info au bot sur pourquoi ça a échoué)
 *
 * Usage dans un formulaire :
 *   const [honeypot, setHoneypot] = useState("");
 *   ...
 *   <form onSubmit={handleSubmit}>
 *     <Honeypot value={honeypot} onChange={setHoneypot} />
 *     ...
 *   </form>
 *
 *   function handleSubmit(e) {
 *     e.preventDefault();
 *     if (isBotSubmission(honeypot)) {
 *       // Ne rien envoyer au serveur. Optionnel : faire semblant que ça a
 *       // marché (toast succès) pour ne pas alerter le bot.
 *       return;
 *     }
 *     // ... envoi normal
 *   }
 *
 * IMPORTANT : ça filtre les bots basiques côté client seulement. Un bot un
 * peu plus évolué appelle directement ton API sans passer par le formulaire
 * -> il faut AUSSI vérifier le honeypot côté serveur (Edge Function) et
 * avoir le rate limiting serveur (voir check-rate-limit) en complément.
 */

export function isBotSubmission(honeypotValue) {
  return honeypotValue.trim().length > 0;
}

export default function Honeypot({ value, onChange, fieldName = "website_url" }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: 1,
        height: 1,
        overflow: "hidden",
      }}
    >
      <label htmlFor={fieldName}>Ne remplissez pas ce champ</label>
      <input
        type="text"
        id={fieldName}
        name={fieldName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}