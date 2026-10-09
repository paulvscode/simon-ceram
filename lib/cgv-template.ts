// Starting point offered in the admin until a first version of the CGV is
// saved. Explicit [À compléter] placeholders; the seller's identity, VAT
// mention and mediator are added to the page automatically from the "Vente"
// settings. Not legal advice: to be checked by the atelier's advisor.
export const CGV_TEMPLATE_HTML = `
<h2>1. Objet</h2>
<p>Les présentes conditions générales de vente (CGV) s’appliquent à toute commande passée sur le site par un consommateur. Passer commande implique leur acceptation sans réserve.</p>

<h2>2. Les pièces</h2>
<p>Chaque pièce est unique, façonnée et cuite à la main : de légères variations de forme, de couleur ou d’émail par rapport aux photographies font partie de leur caractère et ne constituent pas un défaut. Les dimensions et poids indiqués sont approximatifs.</p>

<h2>3. Prix</h2>
<p>Les prix sont indiqués en euros. La mention relative à la TVA figure à côté des prix et sur la facture. Les frais de livraison sont indiqués avant le paiement et s’ajoutent au prix des pièces.</p>

<h2>4. Commande et réservation</h2>
<p>Au moment de passer au paiement, les pièces du panier sont réservées pendant 30 minutes. Si le paiement n’est pas effectué dans ce délai, elles redeviennent disponibles. La commande est définitive à la confirmation du paiement ; un e-mail de confirmation est alors envoyé.</p>
<p>Si, à titre exceptionnel, une pièce payée n’était plus disponible, le paiement est intégralement et automatiquement remboursé.</p>

<h2>5. Paiement</h2>
<p>Le paiement s’effectue en ligne par carte bancaire via la plateforme sécurisée Stripe. L’atelier n’a jamais accès à vos coordonnées bancaires. Une facture est établie pour chaque commande [À compléter : envoyée par e-mail / disponible sur simple demande].</p>

<h2>6. Livraison</h2>
<p>Les pièces sont livrées en France et en Belgique, en envoi suivi et assuré. Délai d’expédition : [À compléter, ex. sous 5 jours ouvrés après le paiement]. Délai de livraison indicatif : [À compléter].</p>

<h2>7. Casse pendant le transport</h2>
<p>Chaque pièce est emballée avec le plus grand soin. À la réception, vérifiez l’état du colis en présence du livreur si possible et notez toute réserve. Si une pièce arrive cassée, envoyez des photographies du colis et de la pièce à [À compléter : e-mail] dans un délai de [À compléter, ex. 48 heures] : [À compléter : remboursement intégral ou remplacement si possible].</p>

<h2>8. Droit de rétractation</h2>
<p>Vous disposez d’un délai de <strong>14 jours</strong> à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier de motif. Pour l’exercer, informez-nous de votre décision par une déclaration dénuée d’ambiguïté (par exemple par e-mail), ou à l’aide du formulaire ci-dessous.</p>
<p>La pièce doit être renvoyée, soigneusement emballée et dans son état d’origine, au plus tard 14 jours après nous avoir informés de votre décision. Les frais de retour sont à votre charge [À compléter : ou pris en charge par l’atelier].</p>
<p>Nous vous remboursons la totalité des sommes versées, frais de livraison initiaux inclus (sur la base du mode de livraison standard), au plus tard 14 jours après avoir été informés de votre décision, par le même moyen de paiement. Le remboursement peut être différé jusqu’à réception de la pièce ou de la preuve de son expédition.</p>
<h3>Formulaire de rétractation</h3>
<p><em>(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)</em></p>
<p>À l’attention de [À compléter : nom, adresse et e-mail de l’atelier] :<br>Je vous notifie par la présente ma rétractation du contrat portant sur la vente de la pièce ci-dessous :<br>— Commandée le / reçue le :<br>— Nom du consommateur :<br>— Adresse du consommateur :<br>— Signature du consommateur (uniquement en cas de notification sur papier) :<br>— Date :</p>

<h2>9. Garanties légales</h2>
<p>Les pièces bénéficient de la garantie légale de conformité (articles L.217-3 et suivants du Code de la consommation) et de la garantie des vices cachés (articles 1641 et suivants du Code civil).</p>

<h2>10. Données personnelles</h2>
<p>Les informations recueillies lors de la commande servent uniquement à la traiter et à établir la facture. Voir les mentions légales pour le détail et vos droits.</p>

<h2>11. Litiges</h2>
<p>Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité ; vous pouvez également recourir gratuitement au médiateur de la consommation indiqué ci-dessous.</p>
`;
