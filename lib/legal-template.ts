// Starting point offered in the admin editor until a first version is saved.
// Pre-filled with what the site already states (Footer); everything else is
// an explicit placeholder the atelier must complete — not legal advice.
export const LEGAL_TEMPLATE_HTML = `
<h2>Éditeur du site</h2>
<p>Le site simon-ceramique.fr est édité par <strong>Simon Barraud</strong> — [À compléter : forme juridique, ex. entreprise individuelle].</p>
<ul>
  <li>Adresse : 12 rue des Tanneurs, Dieulefit</li>
  <li>E-mail : <a href="mailto:atelier@simon-ceramique.fr">atelier@simon-ceramique.fr</a></li>
  <li>Téléphone : [À compléter]</li>
  <li>SIRET : [À compléter]</li>
  <li>N° de TVA intracommunautaire : [À compléter, ou « TVA non applicable, art. 293 B du CGI »]</li>
</ul>
<p>Directeur de la publication : [À compléter : nom et prénom].</p>

<h2>Hébergement</h2>
<p>Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — <a href="https://vercel.com">vercel.com</a>.</p>

<h2>Propriété intellectuelle</h2>
<p>L’ensemble des contenus de ce site (textes, photographies, créations) est la propriété exclusive de Simon Barraud, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.</p>

<h2>Données personnelles</h2>
<p>Les informations transmises via le formulaire de contact ou lors d’une commande (nom, e-mail, adresse de livraison) sont utilisées uniquement pour répondre à vos messages et traiter vos commandes. Elles ne sont jamais cédées à des tiers. Le paiement est assuré par Stripe ; l’atelier n’a jamais accès à vos coordonnées bancaires.</p>
<p>Conformément au RGPD, vous disposez d’un droit d’accès, de rectification et de suppression de vos données. Pour l’exercer, écrivez à <a href="mailto:atelier@simon-ceramique.fr">atelier@simon-ceramique.fr</a>.</p>

<h2>Cookies</h2>
<p>Ce site n’utilise aucun cookie publicitaire ni de mesure d’audience. [À vérifier et compléter si cela change.]</p>

<h2>Médiation de la consommation</h2>
<p>Conformément à l’article L.612-1 du Code de la consommation, vous pouvez recourir gratuitement au médiateur de la consommation suivant : [À compléter : nom et coordonnées du médiateur].</p>
`.trim();
