(function(){
'use strict';
/* ================= réglages ================= */
// Envoi direct : colle ici l'adresse d'un webhook GHL (ou autre) pour recevoir les budgets sans pièce jointe.
// Laisse vide pour garder l'envoi par fichier + courriel.
const WEBHOOK_URL='';
const MAIL='mickael.leveille@sfl.ca';
// Lien de prise de rendez-vous (Microsoft Bookings, Calendly…). Vide = le bouton ouvre un courriel de demande.
const BOOK_URL='';
const SHARE_URL='https://claude.ai/artifact/TrGPib9tCRHSPW5vzKH5Zf';
const KEY='budget-gfx-v3';try{Object.keys(localStorage).filter(k=>/^budget-gfx-v[12]\b/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(e){}

/* ================= langue ================= */
let LANG='fr';try{LANG=localStorage.getItem('budget-gfx-lang')==='en'?'en':'fr'}catch(e){}
const L=(fr,en)=>LANG==='en'?en:fr;
document.documentElement.lang=L('fr-CA','en-CA');

/* ================= constantes ================= */
const F={sem:52/12,'2sem':26/12,'2fm':2,mois:1,'2mois':1/2,'3mois':1/3,an:1/12};
const NB={sem:52,'2sem':26,'2fm':24,mois:12,'2mois':6,'3mois':4,an:1};
const FL=[['',L('Choisir…','Choose…')],['sem',L('Par semaine','Weekly')],['2sem',L('Aux 2 semaines','Every 2 weeks')],['2fm',L('2 fois par mois','Twice a month')],['mois',L('Par mois','Monthly')],['2mois',L('Aux 2 mois','Every 2 months')],['3mois',L('Aux 3 mois','Every 3 months')],['an',L('Par année','Yearly')]];
const FLFR={sem:'par semaine','2sem':'aux 2 semaines','2fm':'2 fois par mois',mois:'par mois','2mois':'aux 2 mois','3mois':'aux 3 mois',an:'par année'};
const PAYF=FL.filter(x=>['sem','2sem','2fm','mois'].includes(x[0]));
const HF=[['',L('Choisir…','Choose…')],['sem',L('Par semaine','Weekly')],['2sem',L('Aux 2 semaines','Every 2 weeks')],['mois',L('Par mois','Monthly')]];
const RAISONS=[['',L('Choisir…','Choose…')]].concat([
  ['Je paie plus pour finir plus vite',L('Je paie plus pour finir plus vite','I pay more to finish sooner')],
  ['Paiement accéléré',L('Paiement accéléré','Accelerated payment')],
  ['Budget serré, paiement réduit',L('Budget serré, paiement réduit','Tight budget, reduced payment')],
  ['Taxes municipales incluses',L('Taxes municipales incluses','Property taxes included')],
  ['Assurance incluse dans le paiement',L('Assurance incluse dans le paiement','Insurance included in the payment')],
  ['Paiement changé au renouvellement',L('Paiement changé au renouvellement','Payment changed at renewal')],
  ['Congé de paiement',L('Congé de paiement','Payment holiday')],
  ['Autre raison',L('Autre raison','Other reason')]]);
const CATS=['Revenu','Carte de crédit','Paiement auto','Essence','Assurance auto','Immatriculation (plaque)','Cellulaire','Gym','Argent personnel','Cadeaux','Loisirs','Épargne','Épicerie','Logement','Autre / à préciser'];
const PROFD=[
 ['etu',L('Aux études','Student'),L('Avec ou sans emploi à côté','With or without a side job')],
 ['sal',L('Employé(e)','Employee'),L("Une paie régulière d'un employeur",'A regular paycheque from an employer')],
 ['var',L('Revenus variables','Variable income'),L('Temps partiel, saisonnier, commissions, pourboires','Part-time, seasonal, commissions, tips')],
 ['auto',L('Travailleur autonome','Self-employed'),L('À mon compte, sans compagnie incorporée','On my own, not incorporated')],
 ['inc',L('Entrepreneur incorporé','Incorporated business owner'),L('Je me verse un salaire ou des dividendes','I pay myself a salary or dividends')],
 ['trans',L('En transition','In transition'),L('Entre deux emplois, congé parental, arrêt de travail','Between jobs, parental leave, off work')],
 ['pre',L('Préretraite','Pre-retirement'),L('La retraite approche, dans 10 ans ou moins','Retiring within 10 years')],
 ['ret',L('Retraité(e)','Retired'),L('Je vis de mes rentes et de mon épargne','I live on pensions and savings')]];
const PROFILES=PROFD.map(p=>[p[0],p[1]]);
const FAMS=[['seul',L('Seul(e)','Single')],['couple',L('En couple','Couple')],['enf',L('En couple avec enfants','Couple with kids')],['mono',L('Parent seul(e)','Single parent')]];
const FAMFR={seul:'Seul(e)',couple:'En couple',enf:'En couple avec enfants',mono:'Parent seul(e)'};
const POURFR={moi:'Seulement sa part',menage:'Tout le ménage'};
const OLDPROF={jeune:'sal'};
const kids=()=>S.famille==='enf'||S.famille==='mono';
const REV_CHIPS=[["Deuxième emploi / revenu d'appoint",L("Deuxième emploi / revenu d'appoint",'Second job / side income')],['Allocations (famille, TPS, solidarité…)',L('Allocations (famille, TPS, solidarité…)','Benefits (family, GST, solidarity…)')],['Pension alimentaire reçue',L('Pension alimentaire reçue','Support payments received')],['Rente ou pension de retraite',L('Rente ou pension de retraite','Retirement pension or annuity')],['Autre revenu',L('Autre revenu','Other income')]];
const REV_BY={
 etu:[['Prêts et bourses (Aide financière aux études)',L('Prêts et bourses (Aide financière aux études)','Student loans and bursaries')],['Aide des parents',L('Aide des parents','Help from parents')]],
 var:[['Pourboires / commissions',L('Pourboires / commissions','Tips / commissions')],['Assurance-emploi (hors saison)',L('Assurance-emploi (hors saison)','EI benefits (off season)')]],
 inc:[['Dividendes de ma compagnie',L('Dividendes de ma compagnie','Dividends from my company')]],
 trans:[['Assurance-emploi',L('Assurance-emploi','EI benefits')],['RQAP (congé parental)',L('RQAP (congé parental)','QPIP (parental leave)')],['Assurance salaire / invalidité',L('Assurance salaire / invalidité','Salary / disability insurance')]],
 pre:[['Revenus de placements',L('Revenus de placements','Investment income')]],
 ret:[['Rente du Québec (RRQ)',L('Rente du Québec (RRQ)','Quebec Pension Plan (QPP)')],['Pension de la Sécurité de la vieillesse (PSV)',L('Pension de la Sécurité de la vieillesse (PSV)','Old Age Security (OAS)')],['Supplément de revenu garanti (SRG)',L('Supplément de revenu garanti (SRG)','Guaranteed Income Supplement (GIS)')],['Retraits FERR / REER',L('Retraits FERR / REER','RRIF / RRSP withdrawals')],['Revenus de placements',L('Revenus de placements','Investment income')]]};
const revChips=()=>{const x=REV_BY[S.profile]||[],seen=new Set(x.map(c=>c[0]));return x.concat(REV_CHIPS.filter(c=>!seen.has(c[0])&&!(S.profile==='ret'&&c[0]==='Rente ou pension de retraite')))};
const DEBT_TYPES=['Carte de crédit','Marge de crédit','Prêt étudiant','Prêt ou location auto','Prêt personnel','Financement magasin','Autre dette'];
const ASSUR_TYPES=[['vie','assurance vie','Assurance vie'],['mg','maladies graves','Maladies graves'],['inv','invalidité','Invalidité'],['sante','santé et dentaire','Santé / dentaire'],['voy','voyage','Voyage'],['aut','autre assurance','Autre']];
const TERMES=[['',L('Choisir…','Choose…')],['10',L('Temporaire 10 ans','10-year term')],['20',L('Temporaire 20 ans','20-year term')],['30',L('Temporaire 30 ans','30-year term')],['perm',L('Permanente (vie entière)','Permanent (whole life)')],['nsp',L('Je ne sais pas','I don’t know')]];
const TERMFR={'10':'temporaire 10 ans','20':'temporaire 20 ans','30':'temporaire 30 ans',perm:'permanente',nsp:'terme inconnu'};
const LOGL={loc:L('Locataire','Renter'),prop:L('Propriétaire','Owner'),autre:L('Autre','Other')};
const LOGFR={loc:'Locataire',prop:'Propriétaire',autre:'Autre (chez ses parents, pension…)'};
const PROFFR={etu:'Aux études',sal:'Employé(e)',var:'Revenus variables (temps partiel, saisonnier, commissions)',auto:'Travailleur autonome',inc:'Entrepreneur incorporé',trans:'En transition (entre deux emplois, congé, arrêt de travail)',pre:'Préretraite',ret:'Retraité(e)'};
const TIPS={
  taux:L('Le taux annuel écrit sur ton contrat ou ton relevé. Écris 4,5 pour 4,5 %.','The yearly rate on your contract or statement. Type 4.5 for 4.5%.'),
  renouv:L('La date où ton terme se termine : tu renégocies alors ton taux et tes conditions avec la banque.','The date your term ends: you then renegotiate your rate and conditions with the bank.'),
  terme:L('La durée de ton contrat actuel avec la banque (souvent 5 ans, 10 ans au maximum). À la fin, tu renouvelles.','The length of your current contract with the bank (often 5 years, 10 at most). At the end, you renew.'),
  amort:L("Le nombre d'années prévu au départ pour tout rembourser, souvent 25 ans. On appelle ça l'amortissement.",'The number of years planned at the start to pay it all back, often 25. This is called the amortization.'),
  cov:L('La somme versée si le contrat s’applique, par exemple 250 000 $ en assurance vie.','The amount paid if the policy applies, for example $250,000 of life insurance.'),
  dtaux:L('Le taux annuel de ta carte ou de ton prêt, écrit sur ton relevé. Une carte de crédit tourne souvent autour de 20 %.','The yearly rate of your card or loan, shown on your statement. A credit card is often around 20%.'),
  vie:L('Assurance vie : un montant versé à tes proches à ton décès.','Life insurance: an amount paid to your loved ones when you die.'),
  mg:L('Maladies graves : un montant versé d’un coup si tu reçois un diagnostic couvert (cancer, crise cardiaque…).','Critical illness: a lump sum paid if you are diagnosed with a covered illness (cancer, heart attack…).'),
  inv:L('Invalidité : un revenu chaque mois si tu ne peux plus travailler à cause d’une maladie ou d’un accident.','Disability: a monthly income if you can no longer work because of illness or injury.')
};

/* ================= utilitaires ================= */
const $=s=>document.querySelector(s);
const num=v=>{if(v===''||v==null)return 0;if(typeof v==='number')return v;let t=String(v).replace(/[^\d,.\-]/g,'');
  if(t.includes(',')&&t.includes('.'))t=t.lastIndexOf(',')>t.lastIndexOf('.')?t.replace(/\./g,'').replace(',','.'):t.replace(/,/g,'');else t=t.replace(',','.');
  const n=parseFloat(t);return isFinite(n)?n:0};
const has=v=>v!==''&&v!=null&&String(v).trim()!=='';
const cur=new Intl.NumberFormat(L('fr-CA','en-CA'),{style:'currency',currency:'CAD'});
const $$=v=>cur.format(v||0);
const dash=v=>v?$$(v):'—';
const pct=v=>(v*100).toLocaleString(L('fr-CA','en-CA'),{maximumFractionDigits:1})+(LANG==='en'?'%':' %');
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pid=p=>p.replace(/\./g,'_');
const getP=p=>p.split('.').reduce((o,k)=>o==null?o:o[k],S);
const setP=(p,v)=>{const ks=p.split('.');const last=ks.pop();const o=ks.reduce((o,k)=>o[k],S);if(o)o[last]=v};
const pm=x=>num(x.a)*(F[x.f]||0);
const opts=(list,val)=>list.map(([v,l])=>`<option value="${esc(v)}"${v===val?' selected':''}>${esc(l)}</option>`).join('');
const fv=v=>esc(v===0?'0':v??'');
const rate=t=>{const n=num(t);return n>=1?n/100:n};
const ic=(id,cls='i')=>`<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
const flab=f=>(FL.find(x=>x[0]===f)||['',''])[1].replace(/Choisir…|Choose…/,'').toLowerCase();
const flabelFR=f=>FLFR[f]||'';
const cap=s=>{s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1)};
const shortAmt=v=>{const n=num(v);return n.toLocaleString(L('fr-CA','en-CA'),{maximumFractionDigits:2})};
const filled=items=>items.filter(x=>pm(x)).length;
const tr=s=>LANG==='en'&&DICT[s]?DICT[s]:s;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const toTop=()=>{try{window.scrollTo(0,0);const w=document.querySelector('.wrap');if(w)w.scrollIntoView({block:'start'})}catch(e){}};

/* ================= métadonnées des postes ================= */
const META={
 'Loyer ou pension':{e:1,ex:'1 050',mx:6000,hint:L('Chez tes parents ? Inscris la pension que tu leur verses.','Living with your parents? Enter what you pay them.')},
 'Électricité / chauffage (Hydro)':{e:1,ex:'180',q:[100,150,200],hint:L('Ta facture Hydro couvre souvent 2 mois : choisis alors « Aux 2 mois ».','Your Hydro bill often covers 2 months: then pick “Every 2 months”.')},
 'Internet':{ex:'75',q:[60,80,100]},
 'Assurance habitation / locataire':{ex:'30',hint:L('Regarde ta dernière facture : souvent par mois ou une fois par année.','Check your last bill: often monthly or once a year.')},
 'Taxes municipales et scolaires':{ex:'3 200',np:['etu'],hint:L('Le total de ton compte de taxes de l’année.','The total of your yearly tax bill.')},
 'Frais de condo / entretien':{ex:'250',np:['etu']},
 'Assurance auto':{e:1,ex:'120'},
 'Immatriculation (plaque) + permis':{ex:'450',hint:L('La SAAQ facture l’immatriculation une fois par année.','The SAAQ bills registration once a year.')},
 'Stationnement / péage':{ex:'60'},
 'Transport en commun / taxi':{ex:'97'},
 'Cellulaire':{e:1,ex:'65',q:[45,65,85]},
 'Gym':{ex:'35',q:[25,40,60]},
 'Streaming (Netflix, Spotify…)':{ex:'25',q:[10,20,35]},
 'Applications / autres abonnements':{ex:'15'},
 'Épicerie':{e:1,ex:'500',q:[300,500,700],mx:3500,hint:L('Regarde ton relevé bancaire du dernier mois.','Check last month’s bank statement.')},
 'Restaurants, café, livraison':{e:1,ex:'150',q:[75,150,250]},
 'Essence':{e:1,ex:'60',q:[40,60,90],mx:2000,hint:L('Le total pour un mois, environ 4 pleins.','The total for a month, about 4 fill-ups.')},
 'Entretien auto (pneus, huile, réparations)':{ex:'800',hint:L('Le total pour l’année.','The total for the year.')},
 "Pharmacie et produits d'hygiène":{ex:'40'},
 'Vêtements et chaussures':{ex:'75'},
 'Coiffure / soins personnels':{ex:'40'},
 'Animaux':{ex:'80'},
 'Garderie / frais de garde':{ex:'200',fam:1},
 'Activités des enfants':{ex:'60',fam:1},
 "Fonds d'urgence":{ex:'100',tip:L("Un coussin pour les imprévus (perte d'emploi, bris d'auto). L'objectif courant : 3 à 6 mois de dépenses.",'A cushion for surprises (job loss, car repair). A common goal: 3 to 6 months of expenses.')},
 'CELI':{ex:'200',tip:L("Compte d'épargne libre d'impôt : ce que ton argent y rapporte n'est jamais imposé, et tu peux retirer quand tu veux.",'Tax-free savings account (TFSA): what your money earns is never taxed, and you can withdraw anytime.')},
 'REER':{ex:'150',tip:L("Régime enregistré d'épargne-retraite : tes cotisations baissent tes impôts aujourd'hui; l'impôt se paie au retrait, à la retraite.",'Registered retirement savings plan (RRSP): contributions lower your taxes today; tax is paid when you withdraw, in retirement.')},
 "CELIAPP (achat d'une première maison)":{ex:'200',np:['pre','ret'],tip:L("Compte pour l'achat d'une première propriété : déductible comme un REER et retrait sans impôt comme un CELI, jusqu'à 8 000 $ par année.",'First home savings account (FHSA): deductible like an RRSP and tax-free withdrawals like a TFSA, up to $8,000 a year.')},
 'REEE (études des enfants)':{ex:'50',fam:1,tip:L("Régime enregistré d'épargne-études : les gouvernements ajoutent environ 30 % de tes cotisations pour les études de tes enfants.",'Registered education savings plan (RESP): governments add about 30% of your contributions for your children’s education.')},
 'Argent personnel (dépenses perso)':{e:1,ex:'100',q:[50,100,150]},
 'Sorties et divertissement':{ex:'80'},
 'Chasse, pêche, sports, hobbies':{ex:'500',hint:L('Le total pour l’année.','The total for the year.')},
 'Voyages et vacances':{ex:'2 000',hint:L('Le total pour l’année.','The total for the year.')},
 'Cadeaux de Noël':{ex:'600',hint:L('Le total pour toute la période des fêtes.','The total for the whole holiday season.')},
 'Autres cadeaux (fêtes, anniversaires)':{ex:'300',hint:L('Le total pour l’année.','The total for the year.')},
 'Frais médicaux / dentiste / lunettes':{ex:'400',hint:L('Le total pour l’année.','The total for the year.')},
 'Contraventions / amendes':{ex:'150',hint:L('Le total pour l’année.','The total for the year.')},
 'Frais bancaires':{ex:'15'},
 'Dons':{ex:'200',hint:L('Le total pour l’année.','The total for the year.')},
 'Frais de scolarité et livres':{ex:'3 500',p:['etu'],hint:L('Le total pour l’année.','The total for the year.')},
 'Impôts à payer / acomptes provisionnels':{ex:'1 500',p:['auto','inc','var','ret'],hint:L("Le total de l'année versé à Revenu Québec et à l'ARC en acomptes.",'The yearly total paid to Revenu Québec and the CRA in instalments.')},
 'Cotisations professionnelles / permis':{ex:'600',np:['etu','ret','trans'],hint:L('Le total pour l’année.','The total for the year.')}
};
const IGN='__ignore__';
const CAT_RULES=[
 [/virement|transfert|transfer|paiement (de )?(carte|visa|master)|payment.*thank|remboursement carte/i,IGN],
 [/netflix|spotify|disney|crave|prime video|apple tv|youtube premium|paramount|tou\.?tv|illico/i,'Streaming (Netflix, Spotify…)'],
 [/\biga\b|metro|maxi|provigo|super ?c\b|costco|walmart|épicerie|epicerie|adonis|loblaws|intermarch|marché|marche|grocery|groceries/i,'Épicerie'],
 [/esso|shell|petro|ultramar|irving|couche-?tard|crevier|essence|\bgaz\b|\bgas\b/i,'Essence'],
 [/hydro|électricit|electricit|énergir|energir/i,'Électricité / chauffage (Hydro)'],
 [/ebox|oxio|cogeco|internet/i,'Internet'],
 [/vid[ée]otron|\bbell\b|fizz|koodo|telus|rogers|virgin|fido|freedom|public mobile|cellulaire|\bcell\b|phone/i,'Cellulaire'],
 [/uber ?eats|doordash|skip ?the|mcdo|mcdonald|tim hortons|starbucks|restaurant|resto|a&w|subway|pizza|caf[ée]|st-hubert|poulet|burger|sushi|dunkin|second cup/i,'Restaurants, café, livraison'],
 [/pharmaprix|jean coutu|uniprix|familiprix|brunet|proxim|pharmac/i,"Pharmacie et produits d'hygiène"],
 [/gym|[ée]nergie cardio|[ée]conofitness|nautilus|crossfit|yoga|fitness/i,'Gym'],
 [/\bstm\b|\brtc\b|opus|\bexo\b|uber|taxi|lyft|bixi|autobus|bus\b/i,'Transport en commun / taxi'],
 [/stationnement|parking|indigo|p[ée]age/i,'Stationnement / péage'],
 [/saaq|immatriculation|permis de conduire/i,'Immatriculation (plaque) + permis'],
 [/\bloyer\b|\brent\b/i,'Loyer ou pension'],
 [/assurance (auto|voiture)|intact|belairdirect|la capitale|promutuel|wawanesa/i,'Assurance auto'],
 [/coiffure|salon|barbier|esth[ée]tique|spa\b/i,'Coiffure / soins personnels'],
 [/v[êe]tement|winners|h&m|simons|old navy|sports experts|sail\b|souliers|chaussures|clothing/i,'Vêtements et chaussures'],
 [/v[ée]t[ée]rinaire|animalerie|mondou|chien|chat\b|pet/i,'Animaux'],
 [/\bsaq\b|sortie|cin[ée]ma|\bbar\b|spectacle|billet|ticketmaster|evenko/i,'Sorties et divertissement'],
 [/frais (bancaires|de service|mensuels)|service charge|monthly fee/i,'Frais bancaires'],
 [/garderie|\bcpe\b|daycare/i,'Garderie / frais de garde'],
 [/apple\.com|icloud|google (storage|one)|microsoft|adobe|chatgpt|openai|claude|dropbox/i,'Applications / autres abonnements']
];

/* ================= modèle de données ================= */
const it=(l,df='mois',k)=>Object.assign({l,a:'',f:df,c:'',df},k?{k}:{});
const DEFAULT={
  nom:'',date:'',email:'',profile:'',famille:'',pour:'',mode:'',logType:'',rdv:'',gate:{},unk:{},cmt:{},
  sal:{amt:'',f:'2sem',type:'Net',vrai:''},
  ret:{syn:'',pen:'',reer:'',ass:'',aut:''},
  rev:[],
  sec:[
    {k:'log',t:'Logement',b:'Logement',core:1,items:[it('Loyer ou pension','mois','loyer'),it('Électricité / chauffage (Hydro)'),it('Internet'),it('Assurance habitation / locataire'),it('Taxes municipales et scolaires','an'),it('Frais de condo / entretien')]},
    {k:'tra',t:'Transport',b:'Transport (assurance, plaque)',core:1,items:[it('Assurance auto'),it('Immatriculation (plaque) + permis','an'),it('Stationnement / péage'),it('Transport en commun / taxi')]},
    {k:'tel',t:'Télécom et abonnements',b:'Cellulaire et abonnements',core:1,items:[it('Cellulaire'),it('Gym'),it('Streaming (Netflix, Spotify…)'),it('Applications / autres abonnements')]},
    {k:'quo',t:'Vie quotidienne',b:'Épicerie, essence et quotidien',core:1,items:[it('Épicerie'),it('Restaurants, café, livraison'),it('Essence'),it('Entretien auto (pneus, huile, réparations)','an'),it("Pharmacie et produits d'hygiène"),it('Vêtements et chaussures'),it('Coiffure / soins personnels'),it('Animaux'),it('Garderie / frais de garde'),it('Activités des enfants')]},
    {k:'epa',t:'Épargne et placements',b:'Épargne et placements',items:[it("Fonds d'urgence"),it('CELI'),it('REER'),it("CELIAPP (achat d'une première maison)"),it('REEE (études des enfants)')]},
    {k:'loi',t:'Loisirs et personnel',b:'Loisirs et argent perso',items:[it('Argent personnel (dépenses perso)'),it('Sorties et divertissement'),it('Chasse, pêche, sports, hobbies','an'),it('Voyages et vacances','an')]},
    {k:'occ',t:'Dépenses occasionnelles / annuelles',b:'Cadeaux et imprévus',items:[it('Cadeaux de Noël','an'),it('Autres cadeaux (fêtes, anniversaires)','an'),it('Frais médicaux / dentiste / lunettes','an'),it('Contraventions / amendes','an'),it('Frais bancaires'),it('Dons','an'),it('Frais de scolarité et livres','an'),it('Impôts à payer / acomptes provisionnels','an'),it('Cotisations professionnelles / permis','an')]}
  ],
  assur:ASSUR_TYPES.map(([k,t])=>({k,t,items:[]})),
  hyp:{solde:'',pmt:'',f:'mois',taux:'',renouv:'',valeur:'',pret:'',amort:'',terme:'',raison:'',vrai:''},
  dettes:[],immo:[],
  cal:{10:[],11:[],12:[]}
};

let S;
try{const raw=localStorage.getItem(KEY);S=raw?JSON.parse(raw):null}catch(e){S=null}
if(!S||!S.sec) S=JSON.parse(JSON.stringify(DEFAULT));
function migrate(){
  const D=DEFAULT;
  ['nom','date','email','profile','famille','pour','mode','logType','rdv'].forEach(k=>{if(S[k]==null)S[k]=''});
  if(OLDPROF[S.profile])S.profile=OLDPROF[S.profile];if(S.profile==='fam'){S.profile='';if(!S.famille)S.famille='enf'}
  S.gate=S.gate||{};S.unk=S.unk||{};S.cmt=S.cmt||{};
  if(S.none){for(const k in S.none)if(S.none[k])S.gate[k]='non';delete S.none}
  S.sal=Object.assign({},D.sal,S.sal||{});S.ret=Object.assign({},D.ret,S.ret||{});
  const addC=(k,t)=>{if(!has(t))return;S.cmt[k]=(S.cmt[k]?S.cmt[k]+'\n':'')+t};
  S.sec=S.sec||[];
  D.sec.forEach((Ds,i)=>{let sec=S.sec.find(s=>s.k===Ds.k)||S.sec[i];if(!sec){sec=JSON.parse(JSON.stringify(Ds));S.sec[i]=sec}
    sec.k=Ds.k;sec.t=Ds.t;sec.b=Ds.b;sec.core=Ds.core;
    sec.items=(sec.items||[]).filter(x=>x.u||!/^Autre/.test(x.l)||has(x.a));
    sec.items.forEach(x=>{if(/^Loyer/.test(x.l)&&!x.u){x.k='loyer';x.l='Loyer ou pension'}
      const d=Ds.items.find(y=>y.l===x.l);if(d&&!x.u)x.df=d.df;if(!x.df)x.df='mois';if(!x.f||(!has(x.a)&&!x.u))x.f=x.df;
      if(has(x.c)){addC('sec'+i,x.l+' : '+x.c);x.c=''}});
    Ds.items.forEach(d=>{if(!sec.items.some(x=>x.l===d.l))sec.items.push(JSON.parse(JSON.stringify(d)))});
  });
  S.sec=D.sec.map(Ds=>S.sec.find(s=>s.k===Ds.k));
  S.rev=(S.rev||[]).filter(x=>x.u||has(x.a)).map(x=>{if(has(x.c)){addC('rev',(x.l||'')+' : '+x.c);x.c=''}return Object.assign({df:'mois'},x,{u:1,f:x.f||'mois'})});
  if(!S.assur||!S.assur.length||!S.assur[0].k){
    const old=S.assur||[],nw=JSON.parse(JSON.stringify(D.assur)),keep=x=>has(x.a)||has(x.c);
    const clean=x=>({l:/contrat \d|^Assurance (santé|voyage)/i.test(x.l)?'':x.l,a:x.a,f:x.f||'mois',c:x.c,cov:x.cov||'',df:'mois'});
    [0,1,2].forEach(g=>((old[g]||{}).items||[]).filter(keep).forEach(x=>nw[g].items.push(clean(x))));
    ((old[3]||{}).items||[]).filter(keep).forEach(x=>nw[/santé/i.test(x.l)?3:/voyage/i.test(x.l)?4:5].items.push(clean(x)));
    S.assur=nw}
  S.assur.forEach(g=>g.items.forEach(x=>{if(!x.f)x.f='mois';if(has(x.c)){addC('assur',(x.l||g.t)+' : '+x.c);x.c=''}}));
  S.dettes=(S.dettes||[]).filter(d=>d.u||has(d.a)||has(d.solde)||has(d.c)).map(d=>Object.assign({nom:'',f:'mois'},d,{f:d.f||'mois'}));
  S.immo=(S.immo||[]).filter(b=>b.u||['valeur','solde','taux','renouv','pmt','loyers','taxes','entretien','pret','rest'].some(k=>has(b[k]))||!/^Immeuble \d+$/.test(b.nom||''));
  S.hyp=Object.assign({},D.hyp,S.hyp||{});
  if(has(S.hyp.vrai)&&!has(S.hyp.pmt)){if(S.hyp.f&&F[S.hyp.f]&&S.hyp.f!=='mois')S.hyp.pmt=String(Math.round(num(S.hyp.vrai)/F[S.hyp.f]*100)/100);else{S.hyp.pmt=S.hyp.vrai;S.hyp.f='mois'}S.hyp.vrai=''}
  if(!S.hyp.f)S.hyp.f='mois';
  S.cal=S.cal||{};['10','11','12'].forEach(m=>{S.cal[m]=(S.cal[m]||[]).map(r=>Array.isArray(r)?{d:r[0],ds:r[1],ct:r[2],i:r[3]||'',o:r[4]||''}:r)});
}
migrate();

/* ================= état de la page ================= */
let O={},calc={},guide=false,gcur='wel',ADV=false,DLP=null,SAMPLE=null,SAMPLE_IMG=false,QMSG=null,CSVR=null,curM='10';
const seen=new Set(), LBL={}, animState={};
const SR=window.SpeechRecognition||window.webkitSpeechRecognition, SPEECH=!!SR;
let saveT;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}
  document.querySelectorAll('.gsave').forEach(e=>e.classList.add('on'));clearTimeout(saveT);
  saveT=setTimeout(()=>document.querySelectorAll('.gsave').forEach(e=>e.classList.remove('on')),1600)};

/* ================= briques de rendu ================= */
const tipBtn=id=>`<button type="button" class="tipb" data-tip="${id}_tip" aria-expanded="false" aria-label="${L("Qu'est-ce que c'est ?",'What is this?')}">?</button>`;
const tipBox=(id,t)=>`<p class="tipbox" id="${id}_tip" hidden>${esc(t)}</p>`;
function money(path,val,unit='$',label='Montant',ph=''){const id=pid(path);return `<span class="unit" data-u="${unit}"><input class="fld num" id="${id}" data-p="${path}" inputmode="decimal" value="${fv(val)}" aria-label="${esc(label)}"${ph?` placeholder="${esc(ph)}"`:''}></span>`}
function row(path,x,o={}){
  const id=pid(path), m=META[x.l]||{}, edit=o.edit||x.u, rm=o.rm||x.u, name=tr(x.l);
  LBL[path+'.a']=x.l||o.ph||'Ligne';
  const lbl=edit
    ?`<div class="lbl"><input class="fld lbl-in" id="${id}_l" data-p="${path}.l" value="${fv(x.l)}" placeholder="${esc(o.ph||L('Nom de la dépense','Expense name'))}" aria-label="${L('Nom','Name')}"></div>`
    :`<div class="lbl"><span><label for="${id}_a">${esc(name)}</label>${m.tip?tipBtn(id):''}</span>${m.hint?`<span class="rhint">${esc(m.hint)}</span>`:''}${m.tip?tipBox(id,m.tip):''}</div>`;
  const ex=m.ex||o.ex||'';
  const qa=m.q?`<span class="qa">${m.q.map(v=>`<button type="button" class="qchip" data-qa="${path}.a" data-v="${v}">${LANG==='en'?'$'+v:v+' $'}</button>`).join('')}</span>`:'';
  return `<div class="row${x.k?' r-'+x.k:''}" data-row="${path}">${lbl}
  ${money(path+'.a',x.a,'$',name||L('Montant','Amount'),ex?L('ex. ','e.g. ')+ex:L('Montant','Amount'))}
  <select class="fld fsel" id="${id}_f" data-p="${path}.f" aria-label="${L('Fréquence','Frequency')}">${opts(FL,x.f)}</select>
  <output class="calc" data-out="pm:${path}"></output>
  <span class="acts"><button class="cbtn idk-i" type="button" data-idk="${path}.a" aria-pressed="false" aria-label="${L('Je ne sais pas','I don’t know')}" title="${L('Je ne sais pas','I don’t know')}">${ic('i-q')}</button>${rm?`<button class="cbtn rm" type="button" data-rm="${path}" aria-label="${L('Retirer cette ligne','Remove this line')}">${ic('i-x')}</button>`:''}</span>
  <div class="sub">${qa}<button type="button" class="idk" data-idk="${path}.a" aria-pressed="false">${L('Je ne sais pas','I don’t know')}</button><span class="rwarn" data-out="w:${path}"></span></div>
  ${o.extra||''}</div>`;
}
const head=`<div class="row head"><span>${L('Poste','Item')}</span><span>${L('Montant','Amount')}</span><span>${L('Fréquence','Frequency')}</span><span>${L('Par mois','Per month')}</span><span></span></div>`;
const STEPOF={sal:'rev',rev:'rev',sec0:'log',hyp:'log',immo:'log',sec1:'cour',sec2:'cour',sec3:'cour',sec5:'loi',sec6:'loi',dettes:'dettes',assur:'prot',sec4:'prot'};
function blk(title,key,inner,open,cnt,o={}){
  const g=o.g?` data-gk="${o.g}" data-g="${o.has?'oui':(S.gate[o.g]||'')}"`:'';
  return `<details class="blk${o.has?' hasitems':''}" data-sec="${key}" data-step="${STEPOF[key]||key}"${g}${open?' open':''}><summary><h2>${title}</h2>${cnt?`<span class="cnt" data-out="cnt:${key}"></span>`:''}<span class="tot" data-out="t:${key}"></span><svg class="chev"><use href="#i-chev"/></svg></summary><div class="body">${inner}</div></details>`;
}
function fld(label,path,val,type='money',help='',o={}){
  const id=pid(path);LBL[path]=o.fr||label;
  const h=help?`<div class="help">${help}</div>`:'';
  let input;
  if(type==='date') input=`<input class="fld" type="date" lang="${L('fr-CA','en-CA')}" id="${id}" data-p="${path}" value="${fv(val)}">`;
  else if(type==='text') input=`<input class="fld" id="${id}" data-p="${path}" value="${fv(val)}"${o.ex?` placeholder="${esc(o.ex)}"`:''}>`;
  else if(Array.isArray(type)) input=`<select class="fld" id="${id}" data-p="${path}">${opts(type,val)}</select>`;
  else input=money(path,val,type==='pct'?'%':type==='yr'?L('ans','yrs'):'$',label,o.ex?L('ex. ','e.g. ')+o.ex:'');
  const idk=o.idk?`<button type="button" class="idk" data-idk="${path}" aria-pressed="false" style="display:inline">${L('Je ne sais pas','I don’t know')}</button>`:'';
  return `<div class="f" data-f="${path}"><div class="fl"><label for="${id}">${label}</label>${o.tip?tipBtn(id):''}</div>${input}${o.tip?tipBox(id,o.tip):''}${h}${idk}</div>`;
}
const out=(label,key)=>`<div class="f"><label>${label}</label><output class="calc" data-out="${key}"></output></div>`;
const chip=(kind,arg,label)=>`<button class="chip" type="button" data-add="${kind}" data-arg="${esc(arg)}">+ ${esc(label)}</button>`;
const addzone=(lbl,chips)=>`<div class="addzone">${lbl?`<span class="addlbl">${lbl}</span>`:''}<div class="chips">${chips}</div></div>`;
const gateQ=(key,q)=>`<div class="gate"><p class="q">${q}</p><div class="seg two" role="group">${[['oui',L('Oui','Yes')],['non',L('Non','No')]].map(([v,l])=>`<button type="button" data-gate="${key}" data-v="${v}" aria-pressed="${S.gate[key]===v}">${l}</button>`).join('')}</div></div>`;
const scmt=key=>{const v=S.cmt[key]||'';return `<div class="scmt"><button type="button" class="linkbtn" data-scmt="${key}"${v?' hidden':''}>${ic('i-note')}${L('Ajouter un commentaire sur cette section','Add a comment on this section')}</button><textarea class="fld" id="cmt_${key}" data-p="cmt.${key}" rows="3" placeholder="${L('Ton commentaire pour Mickaël','Your comment for Mickaël')}"${v?'':' hidden'} aria-label="${L('Commentaire','Comment')}">${esc(v)}</textarea></div>`};
const more=(inner,title=L('Plus de détails (facultatif)','More details (optional)'))=>`<details class="more"><summary><svg class="chev"><use href="#i-chev"/></svg>${title}</summary>${inner}</details>`;
const privy=()=>`<p class="privy">${ic('i-lock')}${L('Seul Mickaël verra ces chiffres.','Only Mickaël will see these numbers.')}</p>`;
const logQ=()=>`<div class="logq"><span class="q">${L('Tu es :','You are:')}</span><div class="seg" role="group" aria-label="${L('Ton logement','Your housing')}">${Object.entries(LOGL).map(([k,l])=>`<button type="button" data-logset="${k}" aria-pressed="${S.logType===k}">${l}</button>`).join('')}</div><p class="hint" style="margin:0">${L("Propriétaire de ta maison ou de ton plex ? Le loyer disparaît et la section « Hypothèque » s'affiche. « Autre » : chez tes parents, en pension, etc.","Own your house or plex? Rent disappears and the Mortgage section appears. “Other”: living with your parents, boarding, etc.")}</p></div>`;
function applyLog(){const lc=$('#leftCol');if(lc)lc.dataset.log=S.logType||'';document.querySelectorAll('[data-logset]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.logset===S.logType))}
const vis=x=>{const m=META[x.l]||{};if(has(x.a)||x.u)return true;if(S.mode==='express'&&!m.e)return false;if(m.p&&S.profile&&!m.p.includes(S.profile))return false;if(m.np&&m.np.includes(S.profile))return false;if(m.fam&&S.famille&&!kids())return false;return true};
const secHas=si=>S.sec[si].items.some(x=>has(x.a)||x.u);

/* ================= rendu du budget ================= */
function renderBudget(){
  for(const k in LBL)delete LBL[k];
  const ex=S.mode==='express';
  const defi=(k,t,p)=>`<aside class="defi" data-step="${k}"><b>${t}</b><p>${p}</p></aside>`;
  let h=defi('rev',L("Tes entrées d'argent",'Your money coming in'),L("Tout ce qui te rapporte de l'argent : ton salaire, tes autres revenus, tes placements, une pension ou des allocations. Les revenus d'immeubles locatifs viennent un peu plus loin, avec ton logement.",'Everything that brings you money: your pay, other income, investments, a pension or benefits. Rental property income comes a bit later, with your housing.'))
    +renderSal()+renderRev()
    +defi('log',L("Tes sorties d'argent",'Your money going out'),L("Tout ce que tu n'as pas le choix de payer chaque mois pour vivre : hypothèque ou loyer, prêts et cartes de crédit, épicerie, assurances, cellulaire, abonnements, et tout le reste. On commence par ton logement.",'Everything you have no choice but to pay each month to live: mortgage or rent, loans and credit cards, groceries, insurance, phone, subscriptions, and everything else. Let’s start with your housing.'))
    +renderSec(0)+renderHyp();
  if(!ex||S.immo.length) h+=renderImmo();
  h+=toolQuick();
  h+=renderSec(1)+renderSec(2)+renderSec(3)+renderSec(5);
  if(!ex||secHas(6)) h+=renderSec(6);
  h+=renderDettes();
  if(!ex||S.assur.some(g=>g.items.length)) h+=renderAssur();
  if(!ex||secHas(4)) h+=renderSec(4);
  $('#leftCol').innerHTML=h; applyLog(); keyHints();
}
function renderSal(){
  const pf=S.profile,auto=pf==='auto'||pf==='inc';
  const SALT={auto:L('Ce que tu te verses','What you pay yourself'),inc:L('Ce que tu te verses','What you pay yourself'),trans:L('Ton revenu principal','Your main income'),ret:L('Ta pension principale','Your main pension'),etu:L('Ton emploi','Your job')}[pf]||L('Ton salaire','Your pay');
  const SALQ={var:[L('Combien reçois-tu en moyenne à chaque paie ?','On average, how much do you get each payday?'),L('Fais une moyenne de tes derniers mois, pourboires et commissions compris, après impôts.','Average your last few months, tips and commissions included, after taxes.')],
    inc:[L('Combien te verses-tu à chaque fois (salaire ou dividendes) ?','How much do you pay yourself each time (salary or dividends)?'),L('Ce que tu sors de ta compagnie pour toi, après impôts.','What you take out of your company for yourself, after taxes.')],
    trans:[L('Combien reçois-tu à chaque versement ?','How much do you get each payment?'),L('Assurance-emploi, RQAP ou assurance salaire, après impôts.','EI, QPIP or salary insurance, after taxes.')],
    ret:[L('Combien reçois-tu de ta pension principale ?','How much do you get from your main pension?'),L("Par exemple, la rente de ton ancien employeur, après impôts. La RRQ, la PSV et tes retraits de FERR s'ajoutent juste en dessous.",'For example, your former employer’s pension, after taxes. QPP, OAS and RRIF withdrawals go just below.')],
    etu:[L('Combien reçois-tu à chaque paie ?','How much do you get each payday?'),L("De ton emploi pendant tes études, après impôts. Pas d'emploi ? Laisse vide : tes prêts et bourses vont juste en dessous.",'From your job during school, after taxes. No job? Leave it blank: loans and bursaries go just below.')]}[pf];
  return blk(SALT,'sal',`${privy()}
    <div class="photo" id="photoBox"${SAMPLE_IMG?'':' hidden'}><button class="btn" type="button" id="photoBtn">${ic('i-cam')}${L('Remplir avec une photo de mon talon de paie','Fill in from a photo of my pay stub')}</button><input type="file" id="photoIn" accept="image/*" hidden><span class="help">${L('La photo est lue par Claude pour trouver tes montants, puis oubliée. Vérifie toujours le résultat.','Claude reads the photo to find your amounts; it is not kept. Always check the result.')}</span><span class="status" id="photoMsg" aria-live="polite"></span></div>
    <div class="cgrid">
      ${fld(SALQ?SALQ[0]:auto?L('Combien te verses-tu à chaque fois ?','How much do you pay yourself each time?'):L('Combien reçois-tu dans ton compte à chaque paie ?','How much lands in your account each payday?'),'sal.amt',S.sal.amt,'money',SALQ?SALQ[1]:auto?L("Ce que tu te verses, après les dépenses de ton entreprise.",'What you pay yourself, after business expenses.'):L('Le montant déposé, après impôts et retenues.','The amount deposited, after taxes and deductions.'),{ex:'850',idk:1,fr:'Paie'})}
      ${fld(L('À quelle fréquence ?','How often?'),'sal.f',S.sal.f,PAYF,'',{fr:'Fréquence de la paie'})}
      ${out(L('Net par mois (dans ton budget)','Net per month (in your budget)'),'salm2')}
    </div>
    ${more(`<div class="cgrid">
      ${fld(L('Ce montant est…','This amount is…'),'sal.type',S.sal.type,[['Net',L('Net (dans mon compte)','Net (in my account)')],['Brut',L('Brut (avant impôts)','Gross (before taxes)')]])}
      ${fld(L('Mon vrai net par paie','My actual net pay'),'sal.vrai',S.sal.vrai,'money',L('Si tu as inscrit ton brut : le montant réellement déposé.','If you entered your gross: the amount actually deposited.'),{fr:'Vrai net par paie'})}
      <div class="f"><label>${L('Brut par année','Gross per year')} · <span data-out="salBrutTag"></span></label><output class="calc" data-out="salBrut"></output></div>
      <div class="f"><label>${L('Net par année','Net per year')} · <span data-out="salNetTag"></span></label><output class="calc" data-out="salNet"></output></div>
    </div>`)}${scmt('sal')}`,true);
}
function renderRev(){
  const n=S.rev.length;
  return blk(L('Tous tes revenus','All your income'),'rev',head+
    `<div class="row sal"><span class="lbl">${S.profile==='ret'?L('Pension principale nette','Main pension, net'):S.profile==='trans'?L('Revenu principal net','Main income, net'):L('Salaire net','Net pay')} <span class="muted small">${L('(calculé plus haut)','(from above)')}</span></span><span></span><span class="small muted">${L('Par mois','Per month')}</span><output class="calc" data-out="salm"></output><span></span></div>`+
    gateQ('rev',S.profile==='ret'?L("As-tu d'autres revenus ? (RRQ, PSV, retraits de FERR, placements…)",'Any other income? (QPP, OAS, RRIF withdrawals, investments…)'):S.profile==='etu'?L("As-tu d'autres revenus ? (prêts et bourses, aide des parents…)",'Any other income? (loans and bursaries, help from parents…)'):L("As-tu d'autres revenus que ton salaire ? (2e emploi, allocations, pension…)",'Do you have other income besides your pay? (2nd job, benefits, pension…)'))+
    `<div class="gbody">${S.rev.map((x,i)=>row('rev.'+i,x,{edit:1,rm:1,ph:L('Nom du revenu','Income name')})).join('')}${addzone(L('Ajouter un revenu','Add income'),revChips().map(([v,l])=>chip('rev',v,l)).join(''))}</div>`+scmt('rev'),
    true,true,{g:'rev',has:n>0});
}
function renderSec(si){
  const s=S.sec[si], items=s.items.map((x,i)=>[x,i]).filter(([x])=>vis(x)), gated=s.k==='epa', hasI=filled(s.items)>0;
  let inner=(s.k==='log'?logQ():'')+(gated?gateQ('epa',L("Mets-tu de l'argent de côté ? (CELI, REER, fonds d'urgence…)",'Do you put money aside? (TFSA, RRSP, emergency fund…)'))+'<div class="gbody">':'')+
    head+items.map(([x,i])=>row(`sec.${si}.items.${i}`,x)).join('')+
    addzone('',chip('sec',si,s.k==='epa'?L('Ajouter un autre placement','Add another investment'):L('Ajouter une autre dépense','Add another expense')))+
    (gated?'</div>':'')+scmt('sec'+si);
  const open=s.core||hasI||s.items.some(x=>x.u)||(gated&&S.gate.epa==='oui');
  return blk(esc(tr(s.t)),'sec'+si,inner,open,true,gated?{g:'epa',has:hasI}:{});
}
function renderHyp(){
  const H=S.hyp, yrs=[['',L('Choisir…','Choose…')]].concat(Array.from({length:10},(_,i)=>[String(i+1),(i+1)+' '+(i?L('ans','years'):L('an','year'))]));
  const open=S.logType==='prop'||['solde','pmt','taux'].some(k=>has(H[k]));
  return blk(L('Hypothèque — maison ou plex où tu habites','Mortgage — the home or plex you live in'),'hyp',`
    <p class="hint">${L("Tu trouves ces informations sur ton relevé hypothécaire annuel ou dans l'app de ta banque.",'You’ll find this on your yearly mortgage statement or in your bank’s app.')}</p>
    <div class="cgrid">
      ${fld(L('Solde restant','Balance owing'),'hyp.solde',H.solde,'money','',{ex:'250 000',idk:1,fr:'Solde hypothécaire'})}
      ${fld(L('Ton paiement','Your payment'),'hyp.pmt',H.pmt,'money','',{ex:'1 400',idk:1,fr:'Paiement hypothécaire'})}
      ${fld(L('Fréquence des paiements','Payment frequency'),'hyp.f',H.f,HF)}
      ${fld(L("Taux d'intérêt annuel",'Yearly interest rate'),'hyp.taux',H.taux,'pct','',{ex:'4,5',idk:1,tip:TIPS.taux,fr:'Taux hypothécaire'})}
      ${fld(L('Date de renouvellement','Renewal date'),'hyp.renouv',H.renouv,'date','',{idk:1,tip:TIPS.renouv,fr:'Date de renouvellement'})}
    </div>
    <div class="cgrid" style="margin-top:var(--s3)">${out(L('Paiement par mois (dans ton budget)','Payment per month (in your budget)'),'hyp.used')}${out(L('Temps restant','Time left'),'hyp.left')}</div>
    ${more(`<div class="cgrid">
      ${fld(L('Valeur de la propriété','Property value'),'hyp.valeur',H.valeur,'money','',{ex:'450 000',idk:1,fr:'Valeur de la propriété'})}
      ${fld(L('Prêt au départ','Original loan length'),'hyp.pret',H.pret,'yr','',{ex:'25',tip:TIPS.amort,fr:'Prêt au départ (ans)'})}
      ${fld(L('Années restantes à payer','Years left to pay'),'hyp.amort',H.amort,'yr','',{ex:'20',idk:1,fr:'Années restantes'})}
      ${fld(L('Années restantes au terme','Years left in the term'),'hyp.terme',H.terme,yrs,L('10 ans maximum','10 years maximum'),{tip:TIPS.terme})}
      ${out(L('Paiement estimé selon les années restantes','Estimated payment from years left'),'hyp.estm')}
      ${fld(L('Pourquoi ton paiement est différent ?','Why is your payment different?'),'hyp.raison',H.raison,RAISONS)}
      ${out(L('Intérêts payés ce mois-ci','Interest paid this month'),'hyp.int')}
      ${out(L('Équité (valeur − solde)','Equity (value − balance)'),'hyp.eq')}
      ${out(L('Fin prévue','Expected payoff'),'hyp.end')}
    </div><p class="hint" data-out="hyp.why"></p>`)}${scmt('hyp')}`,open);
}
function renderImmo(){
  const n=S.immo.length;
  return blk(L('Immeubles locatifs','Rental properties'),'immo',
    gateQ('immo',L('As-tu des immeubles locatifs (plex, condo loué…) ?','Do you own rental properties (plex, rented condo…)?'))+
    `<div class="gbody"><p class="hint">${L("Un immeuble par carte. Les liquidités nettes s'ajoutent à tes entrées et les soldes à tes dettes.",'One property per card. Net cash flow is added to your income and balances to your debts.')}</p>
    <div class="cards">${S.immo.map((b,i)=>{const p='immo.'+i,fresh=!['valeur','solde','loyers','pmt'].some(k=>has(b[k]));return `<details class="card"${fresh?' open':''}><summary><svg class="chev"><use href="#i-chev"/></svg><span class="t" data-out="immoName:${i}">${esc(b.nom)}</span><span class="tagv" data-out="immoTag:${i}"></span></summary>
      <div class="cgrid">
        ${fld(L('Nom ou adresse','Name or address'),p+'.nom',b.nom,'text')}
        ${fld(L('Valeur marchande','Market value'),p+'.valeur',b.valeur,'money','',{idk:1,fr:b.nom+' — valeur'})}
        ${fld(L('Solde hypothécaire','Mortgage balance'),p+'.solde',b.solde,'money','',{idk:1,fr:b.nom+' — solde'})}
        ${fld(L('Paiement hypothécaire / mois','Mortgage payment / month'),p+'.pmt',b.pmt,'money','',{idk:1,fr:b.nom+' — paiement'})}
        ${fld(L('Loyers reçus / mois','Rent received / month'),p+'.loyers',b.loyers,'money','',{idk:1,fr:b.nom+' — loyers'})}
        ${out(L('Liquidités nettes / mois','Net cash flow / month'),'immoLiq:'+i)}
      </div>
      ${more(`<div class="cgrid">
        ${fld(L('Taux hypothécaire','Mortgage rate'),p+'.taux',b.taux,'pct','',{tip:TIPS.taux})}
        ${fld(L('Date de renouvellement','Renewal date'),p+'.renouv',b.renouv,'date')}
        ${fld(L('Taxes + assurances / mois','Taxes + insurance / month'),p+'.taxes',b.taxes)}
        ${fld(L('Entretien et autres / mois','Maintenance and other / month'),p+'.entretien',b.entretien)}
        ${fld(L('Prêt au départ','Original loan length'),p+'.pret',b.pret,'yr')}
        ${fld(L('Années restantes','Years left'),p+'.rest',b.rest,'yr')}
        ${out(L('Équité (valeur − solde)','Equity (value − balance)'),'immoEq:'+i)}
        ${out(L('Intérêts ce mois-ci','Interest this month'),'immoInt:'+i)}
      </div>`)}
      <div class="cfoot"><button class="btn quiet" type="button" data-rm="${p}">${L('Retirer cet immeuble','Remove this property')}</button></div></details>`}).join('')}</div>
    ${addzone('',chip('immo','',n?L('Ajouter un autre immeuble','Add another property'):L('Ajouter un immeuble','Add a property')))}</div>${scmt('immo')}`,n>0||S.gate.immo==='oui',false,{g:'immo',has:n>0});
}
function renderDettes(){
  const n=S.dettes.length;
  return blk(L('Dettes et remboursements','Debts and repayments'),'dettes',`${privy()}
    <div class="cards" style="margin-bottom:var(--s3)"><details class="card d-hyp"><summary><svg class="chev"><use href="#i-chev"/></svg><span class="t">${L('Hypothèque','Mortgage')}</span><span class="tagv" data-out="dHypTag"></span></summary>
      <div class="cgrid">${out(L('Paiement par mois','Payment per month'),'hyp.used2')}${out(L('Solde restant','Balance owing'),'hyp.solde2')}${out(L('Temps restant','Time left'),'hyp.left')}${out(L('Fin prévue','Expected payoff'),'hyp.end')}</div>
      <p class="hint" style="padding:0 var(--s4) var(--s3)">${L('Rempli automatiquement à partir de la section Hypothèque.','Filled in automatically from the Mortgage section.')}</p></details></div>
    ${gateQ('dettes',L("As-tu d'autres dettes ? (carte de crédit, marge, prêts…)",'Do you have other debts? (credit card, line of credit, loans…)'))}
    <div class="gbody"><p class="hint">${L("Pour chaque dette : le solde et ton paiement suffisent. Le taux aide à calculer les intérêts.",'For each debt, the balance and your payment are enough. The rate helps calculate interest.')}</p>
    <div class="cards">${S.dettes.map((d,i)=>{const p='dettes.'+i;return `<details class="card"${num(d.solde)||num(d.a)||!(has(d.solde)||has(d.a))?' open':''}><summary><svg class="chev"><use href="#i-chev"/></svg><span class="t" data-out="dName:${i}">${esc(tr(d.l)+(has(d.nom)?' — '+d.nom:''))}</span><span class="tagv" data-out="dTag:${i}"></span></summary>
      <div class="cgrid">
        ${fld(L('Solde restant','Balance owing'),p+'.solde',d.solde,'money','',{idk:1,fr:d.l+' — solde'})}
        ${fld(L('Ton paiement','Your payment'),p+'.a',d.a,'money','',{idk:1,fr:d.l+' — paiement'})}
        ${fld(L('Fréquence','Frequency'),p+'.f',d.f,FL)}
        ${fld(L('Taux annuel','Yearly rate'),p+'.taux',d.taux,'pct','',{idk:1,tip:TIPS.dtaux,ex:'19,99',fr:d.l+' — taux'})}
        ${out(L('Temps restant','Time left'),'dLeft:'+i)}
      </div>
      ${more(`<div class="cgrid">
        ${fld(L('Nom ou institution','Name or institution'),p+'.nom',d.nom,'text','',{ex:L('ex. Visa Desjardins','e.g. Visa Desjardins')})}
        ${out(L('Par mois','Per month'),'dPm:'+i)}
        ${out(L('Intérêts ce mois-ci','Interest this month'),'dInt:'+i)}
        ${out(L('Fin prévue','Expected payoff'),'dEnd:'+i)}
        ${out(L('Intérêts d’ici la fin','Interest until payoff'),'dTot:'+i)}
        ${fld(L('Ton commentaire','Your comment'),p+'.c',d.c,'text')}
      </div>`)}
      <div class="cfoot"><button class="btn quiet" type="button" data-rm="${p}">${L('Retirer cette dette','Remove this debt')}</button></div></details>`}).join('')}</div>
    ${addzone(L('Ajouter une dette','Add a debt'),DEBT_TYPES.map(t=>chip('dette',t,tr(t))).join(''))}</div>${scmt('dettes')}`,true,false,{g:'dettes',has:n>0});
}
function renderAssur(){
  const any=S.assur.some(g=>g.items.length);
  let inner=gateQ('assur',L('Paies-tu toi-même des assurances ? (vie, invalidité, maladies graves…)','Do you pay for insurance yourself? (life, disability, critical illness…)'))+
    `<div class="gbody"><p class="hint">${L("Ajoute chaque contrat que tu paies toi-même. Le coût total de chaque type se calcule tout seul. N'inclus pas les assurances collectives retenues sur ta paie.",'Add each policy you pay yourself. Each type’s total is calculated for you. Don’t include group insurance taken off your pay.')}</p>`+(any?head:'');
  S.assur.forEach((g,gi)=>{
    if(!g.items.length)return;
    const tip=TIPS[g.k];
    inner+=`<div class="sub-h">${esc(tr(cap(g.t)))}${tip?tipBtn('at'+gi):''}</div>${tip?tipBox('at'+gi,tip):''}`+g.items.map((x,i)=>{const path=`assur.${gi}.items.${i}`,id=pid(path);
      const cov=`<span class="xf"><label for="${id}_cov">${L('Montant assuré (facultatif)','Coverage amount (optional)')}</label>${money(path+'.cov',x.cov,'$',L('Montant assuré','Coverage amount'),L('ex. 250 000','e.g. 250,000'))}</span>`;
      const vie=g.k==='vie'?`<span class="xf"><label for="${id}_terme">${L('Terme (facultatif)','Term (optional)')}</label><select class="fld" id="${id}_terme" data-p="${path}.terme">${opts(TERMES,x.terme||'')}</select></span><span class="xf"><label for="${id}_ech">${L("Date d'échéance (facultatif)",'Expiry date (optional)')}</label><input class="fld" type="date" lang="${L('fr-CA','en-CA')}" id="${id}_ech" data-p="${path}.ech" value="${fv(x.ech)}"></span>`:'';
      return row(path,x,{edit:1,rm:1,ph:L("Nom de l'assureur",'Insurer name'),extra:`<span class="extra">${cov}${vie}</span>`})}).join('')+
      `<div class="row tot"><span class="lbl">${L('Coût total','Total cost:')} ${esc(tr(g.t))}</span><output class="calc" data-out="aTot:${gi}"></output></div>`;
  });
  inner+=addzone(L('Ajouter un contrat','Add a policy'),ASSUR_TYPES.map(([k,t,lab],gi)=>chip('assur',gi,tr(lab))).join(''))+'</div>'+scmt('assur');
  return blk(L('Assurances de personnes','Personal insurance'),'assur',inner,any||S.gate.assur==='oui',true,{g:'assur',has:any});
}
const toolQuick=()=>`<section class="tool" data-step="cour"><h3>${L('Ajout rapide','Quick add')}</h3><p class="help">${L('Écris ou dicte une dépense, par exemple « Netflix 18 $ par mois » ou « épicerie 150 par semaine ». Elle se place toute seule dans la bonne section.','Type or dictate an expense, for example “Netflix $18 a month” or “groceries 150 a week”. It goes into the right section on its own.')}</p>
  <div class="qrow"><input class="fld" id="qaddIn" placeholder="${L('Netflix 18 $ par mois','Netflix $18 a month')}" autocomplete="off" enterkeyhint="done" aria-label="${L('Ajout rapide','Quick add')}"><button class="btn" type="button" id="qaddMic"${SPEECH?'':' hidden'} aria-label="${L('Dicter','Dictate')}">${ic('i-mic')}</button><button class="btn primary" type="button" id="qaddBtn">${L('Ajouter','Add')}</button></div>
  <p class="status${QMSG?' '+QMSG.c:''}" id="qaddMsg" aria-live="polite">${QMSG?esc(QMSG.t):''}</p></section>`;
const toolCSV=()=>`<section class="tool" data-step="cour"><h3>${L('Gagne du temps avec ton relevé bancaire','Save time with your bank statement')}</h3><p class="help">${L("Importe le fichier CSV de ton compte (dans ton app ou sur le site de ta banque, cherche « Exporter » ou « Télécharger les transactions »). On calcule tes moyennes par mois : tu n'as qu'à cocher. Le fichier reste sur ton appareil.",'Import your account’s CSV file (in your bank’s app or website, look for “Export” or “Download transactions”). We work out your monthly averages: just tick what to keep. The file stays on your device.')}</p>
  <div><label class="btn" for="csvIn">${ic('i-up')}${L('Importer un relevé (CSV)','Import a statement (CSV)')}</label><input type="file" id="csvIn" accept=".csv,text/csv,text/plain" hidden></div><div id="csvOut">${csvHTML()}</div></section>`;
function refresh(sel){renderBudget();paint();if(guide)goStep(gcur,true);
  if(sel){const el=document.querySelector(sel);if(el){openUp(el);el.focus({preventScroll:true});el.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'})}}}
function openUp(el){let a=el.parentElement;while(a){if(a.tagName==='DETAILS')a.open=true;a=a.parentElement}}
function keyHints(){document.querySelectorAll('input.fld').forEach(i=>{if(i.id!=='qaddIn')i.setAttribute('enterkeyhint','next')})}
function renderProfSeg(){$('#profSeg').innerHTML=PROFD.map(([k,l,d])=>`<button type="button" class="profc" data-prof="${k}" aria-pressed="${S.profile===k}"><b>${esc(l)}</b><span>${esc(d)}</span></button>`).join('');
  $('#famSeg').innerHTML=FAMS.map(([k,l])=>`<button type="button" data-fam="${k}" aria-pressed="${S.famille===k}">${esc(l)}</button>`).join('');
  const cp=S.famille==='couple'||S.famille==='enf';$('#pourBox').hidden=!cp;$('#pourSeg').innerHTML=[['moi',L('Seulement ma part','Just my share')],['menage',L('Tout le ménage','The whole household')]].map(([k,l])=>`<button type="button" data-pour="${k}" aria-pressed="${S.pour===k}">${esc(l)}</button>`).join('');
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.mode===S.mode))}

/* ================= impôts 2026 (Québec) ================= */
function contribs(g){const pens=Math.min(Math.max(g-3500,0),71100);const add=Math.max(0,Math.min(g,85000)-74600);
  return {pens,add,rrq:pens*0.063+add*0.04,rqap:Math.min(g,103000)*0.0043,ae:Math.min(g,68900)*0.013}}
function br(x,b){let t=0,prev=0;for(const [lim,r] of b){if(x>prev)t+=(Math.min(x,lim)-prev)*r;prev=lim}return t}
function taxes(g,dedTax){const c=contribs(g);const ti=Math.max(0,g-(c.pens*0.01+c.add*0.04)-dedTax);
  const fed=Math.max(0,br(ti,[[58523,.14],[117045,.205],[181440,.26],[258482,.29],[1e12,.33]])-0.14*(16452+c.pens*0.053+c.add*0.04+c.rqap+c.ae))*(1-0.165);
  const qc=Math.max(0,br(ti,[[54345,.14],[108680,.19],[132245,.24],[1e12,.2575]])-0.14*18952);
  return {...c,ti,fed,qc}}
function netOf(g,retAn,dedTax){const t=taxes(g,dedTax);return g-t.rrq-t.rqap-t.ae-t.fed-t.qc-retAn}
function grossFor(net,retAn,dedTax){let lo=net,hi=net*3+10000;for(let k=0;k<60;k++){const m=(lo+hi)/2;if(netOf(m,retAn,dedTax)<net)lo=m;else hi=m}return (lo+hi)/2}
function nper(r,p,b){if(p<=0||b<=0)return null;if(r<=0)return Math.ceil(b/p);if(p<=b*r)return Infinity;return Math.ceil(-Math.log(1-r*b/p)/Math.log(1+r))}
const dur=n=>{if(n==null)return '—';if(n===Infinity)return L('Paiement trop bas','Payment too low');const y=Math.floor(n/12),m=n%12;return (y?y+' '+(y>1?L('ans','years'):L('an','year'))+' ':'')+(m?m+' '+L('mois',m>1?'months':'month'):'')||L('Moins d’un mois','Under a month')};
const endDate=n=>{if(n==null||n===Infinity)return '—';const base=has(S.date)?new Date(S.date+'T12:00'):new Date();base.setMonth(base.getMonth()+n);return base.toLocaleDateString(L('fr-CA','en-CA'),{month:'long',year:'numeric'})};

/* ================= calcul ================= */
const FQ=()=>L('Fréquence ?','Frequency?');
const val=(x,p)=>S.unk[p+'.a']?0:pm(x);
const pmTxt=(x,v)=>num(x.a)&&!F[x.f]?FQ():dash(v);
const cntTxt=n=>L(n+' rempli'+(n>1?'s':''),n+' filled');
const perMo=v=>$$(v)+L(' / mois',' / month');
function compute(){
  O={};const W=[];
  const s=S.sal, nb=NB[s.f]||0, amt=S.unk['sal.amt']?0:num(s.amt);
  const r=S.ret, retPay=num(r.syn)+num(r.pen)+num(r.reer)+num(r.ass)+num(r.aut), retAn=retPay*nb, dedTax=(num(r.syn)+num(r.pen)+num(r.reer))*nb;
  let g=0,netEst=0;
  if(nb&&amt){if(s.type==='Brut'){g=amt*nb;netEst=netOf(g,retAn,dedTax)}else{g=grossFor(amt*nb,retAn,dedTax);netEst=amt*nb}}
  const netUsed=has(s.vrai)&&nb?num(s.vrai)*nb:(s.type==='Net'?amt*nb:netEst), salm=netUsed/12;
  O.salm=O.salm2=dash(salm);O.salBrut=dash(g);O.salNet=dash(netUsed);
  O.salBrutTag=s.type==='Brut'?L('inscrit','entered'):L('estimé','estimated');
  O.salNetTag=has(s.vrai)?L('selon ta vraie paie','from your actual pay'):(s.type==='Net'?L('inscrit','entered'):L('estimé','estimated'));
  calc.pay={g,nb,T:taxes(g,dedTax),retAn,retPay,netUsed,vrai:has(s.vrai)?num(s.vrai):null};
  O['ret.tot']=retPay?$$(retPay)+L(' / paie',' / pay'):'';
  ['syn','pen','reer','ass','aut'].forEach(k=>O['retAn:'+k]=dash(num(r[k])*nb));
  O['t:sal']=salm?perMo(salm):'';
  let revOther=0;S.rev.forEach((x,i)=>{const p='rev.'+i,v=val(x,p);revOther+=v;O['pm:'+p]=pmTxt(x,v);W.push([p,v,x])});
  O['t:rev']=$$(salm+revOther);const nr=filled(S.rev)+(salm?1:0);O['cnt:rev']=nr?cntTxt(nr):'';
  let outTot=0,saveTot=0;const secT={};
  S.sec.forEach((sec,si)=>{let t=0;sec.items.forEach((x,i)=>{const p=`sec.${si}.items.${i}`,v=(x.k==='loyer'&&S.logType==='prop')?0:val(x,p);t+=v;O['pm:'+p]=pmTxt(x,v);W.push([p,v,x])});
    O['t:sec'+si]=t?$$(t):'';const n=filled(sec.items);O['cnt:sec'+si]=n?cntTxt(n):'';outTot+=t;if(sec.k==='epa')saveTot=t;secT[sec.k]=t;calc['sec'+si]=t});
  // hypothèque
  const noHyp=S.logType==='loc'||S.logType==='autre', H=S.hyp, R=rate(H.taux), Sd=noHyp?0:num(H.solde), hnb=NB[H.f]||12, am=num(H.amort);
  let est=0,estm=0;if(Sd&&R&&am){const rp=Math.pow(1+R/2,2/hnb)-1,n=am*hnb;est=Sd*rp/(1-Math.pow(1+rp,-n));estm=est*hnb/12}
  const hmr=Math.pow(1+R/2,1/6)-1, hint=Sd&&R?Sd*hmr:0, pmtM=noHyp?0:num(H.pmt)*(F[H.f]||1), used=noHyp?0:(pmtM||estm);
  O['hyp.est']=dash(est);O['hyp.estm']=dash(estm);O['hyp.int']=dash(hint);O['hyp.used']=O['hyp.used2']=dash(used);
  O['hyp.eq']=has(H.valeur)&&!noHyp?$$(num(H.valeur)-Sd):'—';O['hyp.solde2']=dash(Sd);
  const diff=pmtM&&estm&&Math.abs(pmtM-estm)/estm>0.05;
  O['hyp.why']=diff&&!has(H.raison)?L("Ton paiement est différent de l'estimation : tu peux choisir la raison dans la liste.",'Your payment differs from the estimate: you can pick the reason from the list.'):'';
  let hn=null;if(Sd&&used&&R)hn=nper(hmr,used,Sd);else if(Sd&&am)hn=Math.round(am*12);else if(Sd&&used)hn=Math.ceil(Sd/used);
  O['hyp.left']=dur(hn);O['hyp.end']=endDate(hn);
  O.dHypTag=used?perMo(used):L('À remplir','To fill in');O['t:hyp']=used?perMo(used):'';
  // dettes
  let dPm=used,dSolde=Sd,dInt=hint,dN=0;
  S.dettes.forEach((d,i)=>{const p='dettes.'+i,v=S.unk[p+'.a']?0:pm(d);dPm+=v;const b=S.unk[p+'.solde']?0:num(d.solde),rr=rate(d.taux)/12,ii=b&&has(d.taux)?b*rr:0;dSolde+=b;dInt+=ii;if(v||b)dN++;
    const n=b&&v?(has(d.taux)?nper(rr,v,b):Math.ceil(b/v)):null;
    O['dPm:'+i]=pmTxt(d,v);O['dName:'+i]=tr(d.l)+(has(d.nom)?' — '+d.nom:'');O['dInt:'+i]=dash(ii);O['dLeft:'+i]=dur(n);O['dEnd:'+i]=endDate(n);
    O['dTot:'+i]=n&&n!==Infinity&&has(d.taux)?$$(Math.max(0,v*n-b)):'—';
    O['dTag:'+i]=n===Infinity?L('Paiement trop bas','Payment too low'):(v||b?(v?perMo(v):'')+(b?(v?' · ':'')+L('solde ','balance ')+$$(b):''):L('À remplir','To fill in'))});
  O['t:dettes']=dPm?perMo(dPm):'';outTot+=dPm;calc.dettes=dPm;
  // assurances
  let aT=0,aN=0;S.assur.forEach((gp,gi)=>{let t=0;gp.items.forEach((x,i)=>{const p=`assur.${gi}.items.${i}`,v=val(x,p);t+=v;O['pm:'+p]=pmTxt(x,v);W.push([p,v,x])});aN+=gp.items.length;O['aTot:'+gi]=dash(t);aT+=t});
  O['t:assur']=aT?perMo(aT):'';O['cnt:assur']=aN?aN+' '+L('contrat'+(aN>1?'s':''),aN>1?'policies':'policy'):'';outTot+=aT;calc.assur=aT;
  // immeubles
  let liq=0,iS=0,iInt=0,cnt=0;
  S.immo.forEach((b,i)=>{const any=['pmt','loyers','taxes','entretien'].some(k=>has(b[k]));const l=num(b.loyers)-num(b.pmt)-num(b.taxes)-num(b.entretien);
    const bs=num(b.solde),ii=bs&&has(b.taux)?bs*(Math.pow(1+rate(b.taux)/2,1/6)-1):0;
    if(any){liq+=l;cnt++}iS+=bs;iInt+=ii;
    O['immoName:'+i]=b.nom||(L('Immeuble ','Property ')+(i+1));O['immoLiq:'+i]=any?$$(l):'—';O['immoEq:'+i]=has(b.valeur)?$$(num(b.valeur)-bs):'—';O['immoInt:'+i]=dash(ii);
    O['immoTag:'+i]=any?(l>=0?'+':'')+perMo(l):L('À remplir','To fill in');calc['immoCls'+i]=any?(l>=0?'ok':'ko'):''});
  O['t:immo']=cnt?(liq>=0?'+':'')+perMo(liq):'';
  const inTot=salm+revOther+liq, rest=inTot-outTot;
  // montants inhabituels
  W.forEach(([p,v,x])=>{const mx=(META[x.l]||{}).mx||4000;O['w:'+p]=v>0&&(v>mx||(inTot>0&&v>0.6*inTot&&v>800))?L(`Montant élevé : ${$$(v)} par mois. C'est bien ${flab(x.f)} ?`,`High amount: ${$$(v)} a month. Is it really ${flab(x.f)}?`):''});
  calc.k={'k.in':inTot,'k.out':outTot,'k.rest':rest};
  O['k.save']=inTot?pct(saveTot/inTot)+L(' des entrées',' of income'):'—';O['k.debt']=$$(dSolde+iS);O['k.int']=$$(dInt+iInt);O['k.restTxt']=$$(rest);
  // sections répondues
  const gs=k=>!!S.gate[k];
  const ans={rev:salm>0,log:!!S.logType||filled(S.sec[0].items)>0||Sd>0,cour:filled(S.sec[1].items)+filled(S.sec[2].items)+filled(S.sec[3].items)>0,
    loi:filled(S.sec[5].items)+filled(S.sec[6].items)>0,dettes:dN>0||S.dettes.length>0||gs('dettes')};
  if(S.mode!=='express')ans.prot=(gs('assur')||aN>0)&&(gs('epa')||filled(S.sec[4].items)>0);
  calc.ans=ans;const av=Object.values(ans),done=av.filter(Boolean).length;
  O['prog.txt']=L(`Sections remplies : ${done} sur ${av.length}`,`Sections completed: ${done} of ${av.length}`);calc.prog=done/av.length;
  Object.assign(calc,{rest,inTot,salm,outTot,secT,saveTot,dPm,aT,used});
  calc.bars=[...S.sec.filter(s=>['log','tra','tel','quo'].includes(s.k)).map(s=>[s.b,secT[s.k]]),
    ['Dettes (hypothèque, crédit, prêts)',dPm],['Assurances',aT],...S.sec.filter(s=>['epa','loi','occ'].includes(s.k)).map(s=>[s.b,secT[s.k]])];
  calc.summary={inTot,outTot,rest,dSolde:dSolde+iS};
}
function animate(el,key,to){const from=animState[key]??to;animState[key]=to;if(reduce||from===to){el.textContent=$$(to);return}
  const t0=performance.now(),d=350;const step=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);el.textContent=$$(from+(to-from)*e);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)}
function paint(){
  compute();
  document.querySelectorAll('[data-out]').forEach(el=>{const k=el.dataset.out;if(k in O){if(el.textContent!==O[k])el.textContent=O[k];if(el.tagName==='OUTPUT'){el.classList.toggle('zero',O[k]==='—');el.classList.toggle('warn',O[k]===FQ())}}});
  document.querySelectorAll('.row[data-row]').forEach(r=>{const p=r.dataset.row;r.classList.toggle('hasw',!!O['w:'+p]);r.classList.toggle('unk',!!S.unk[p+'.a'])});
  document.querySelectorAll('[data-anim]').forEach(el=>animate(el,el.dataset.anim,calc.k[el.dataset.anim]));
  $('#kReste').classList.toggle('ko',calc.rest<0);$('#gChip').classList.toggle('ko',calc.rest<0);
  $('#progFill').style.width=(calc.prog*100)+'%';
  S.immo.forEach((_,i)=>{const el=document.querySelector(`[data-out="immoTag:${i}"]`);if(el){el.classList.remove('ok','ko');if(calc['immoCls'+i])el.classList.add(calc['immoCls'+i])}});
  S.dettes.forEach((_,i)=>{const el=document.querySelector(`[data-out="dTag:${i}"]`);if(el)el.classList.toggle('ko',O['dTag:'+i]===L('Paiement trop bas','Payment too low'))});
  const shown=calc.bars.filter(b=>b[1]>0),empty=calc.bars.filter(b=>!(b[1]>0)),mx=Math.max(1,...shown.map(b=>b[1]));
  $('#bars').innerHTML=shown.sort((a,b)=>b[1]-a[1]).map(([l,v])=>`<div class="bar" title="${esc(tr(l))} : ${$$(v)}"><span>${esc(tr(l))}</span><span class="v">${$$(v)}<span class="p">${calc.inTot?Math.round(v/calc.inTot*100)+(LANG==='en'?'%':' %'):''}</span></span><div class="track"><div class="fill" style="width:${v/mx*100}%"></div></div></div>`).join('');
  $('#barsEmpty').textContent=empty.length?L("Rien d'inscrit pour l'instant : ",'Nothing entered yet: ')+empty.map(b=>tr(b[0]).toLowerCase()).join(', ')+'.':'';
  const top=calc.bars.filter(b=>b[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,3).map(b=>tr(b[0]).toLowerCase());
  $('#resMsg').innerHTML=!calc.inTot?L('Remplis au moins ton salaire pour voir ton résultat.','Fill in at least your pay to see your result.')
    :calc.rest>=0?L(`<b>Il te reste ${$$(calc.rest)} par mois</b> une fois tout payé. Belle base : Mickaël va t'aider à en tirer le meilleur.`,`<b>You have ${$$(calc.rest)} left each month</b> once everything is paid. A good base: Mickaël will help you make the most of it.`)
    :L(`<b>Tes dépenses dépassent tes entrées de ${$$(-calc.rest)} par mois.</b> C'est plus courant qu'on pense, et c'est exactement ce que Mickaël va regarder avec toi.${top.length?' Tes plus gros postes : '+esc(top.join(', '))+'.':''}`,`<b>Your spending is ${$$(-calc.rest)} a month above your income.</b> It’s more common than you think, and it’s exactly what Mickaël will look at with you.${top.length?' Your biggest items: '+esc(top.join(', '))+'.':''}`);
  $('#goDeeper').hidden=S.mode!=='express';
  paintUnk();paintB5();if(guide&&gcur==='res')renderRecap();paintPaie();
}
function paintUnk(){
  document.querySelectorAll('input[data-p],select[data-p]').forEach(el=>{const u=!!S.unk[el.dataset.p];if(el.disabled!==u){el.disabled=u;
    if(u){el.dataset.ph=el.getAttribute('placeholder')||'';el.setAttribute('placeholder',L('À voir avec Mickaël','To check with Mickaël'))}else if('ph' in el.dataset){el.setAttribute('placeholder',el.dataset.ph);delete el.dataset.ph}}});
  document.querySelectorAll('.f[data-f]').forEach(f=>f.classList.toggle('unk',!!S.unk[f.dataset.f]));
  document.querySelectorAll('[data-idk]').forEach(b=>{const u=!!S.unk[b.dataset.idk];b.setAttribute('aria-pressed',u);
    if(b.classList.contains('idk')){const t=u?L('Annuler « Je ne sais pas »','Undo “I don’t know”'):L('Je ne sais pas','I don’t know');if(b.textContent!==t)b.textContent=t}});
}
function paintB5(){const el=$('#b5');const t=calc.secT,inc=calc.inTot;
  if(!inc){el.innerHTML=`<p class="hint" style="margin:0">${L('Inscris ton salaire pour voir la répartition.','Enter your pay to see the split.')}</p>`;return}
  const needs=(t.log||0)+(t.tra||0)+(t.tel||0)+(t.quo||0)+calc.dPm+calc.aT, wants=(t.loi||0)+(t.occ||0), sav=t.epa||0;
  const rows=[[L('Besoins','Needs'),L('logement, transport, épicerie, dettes, assurances','housing, transport, groceries, debts, insurance'),needs,.5],[L('Envies','Wants'),L('loisirs, sorties, cadeaux','leisure, outings, gifts'),wants,.3],[L('Épargne','Savings'),L("CELI, REER, fonds d'urgence",'TFSA, RRSP, emergency fund'),sav,.2]];
  el.innerHTML=rows.map(([l,d,v,tg])=>{const p=v/inc;return `<div class="r" title="${esc(l)} : ${$$(v)} ${L('par mois','a month')} (${pct(p)})"><span>${esc(l)}</span><span class="v">${pct(p)} <span class="muted">· ${$$(v)}</span></span><div class="track"><div class="fill" style="width:${Math.min(100,p*100)}%"></div><div class="tgt" style="left:calc(${tg*100}% - 1px)"></div></div><span class="m">${esc(d)} · ${L('cible','target')} ${Math.round(tg*100)}${LANG==='en'?'%':' %'}</span></div>`}).join('');
}
function renderRecap(){const el=$('#recap');if(!el)return;
  const G=[],ln=(l,d,v,p)=>({l,d,v,p}),fq=x=>`${LANG==='en'?'$'+shortAmt(x.a):shortAmt(x.a)+' $'} ${flab(x.f)}`;
  const add=(t,ls)=>{if(ls.length)G.push([t,ls])};
  const secL=si=>S.sec[si].items.map((x,i)=>[x,i]).filter(([x,i])=>val(x,`sec.${si}.items.${i}`)&&!(x.k==='loyer'&&S.logType==='prop')).map(([x,i])=>ln(tr(x.l)||'—',fq(x),pm(x),`sec.${si}.items.${i}.a`));
  add(L('Revenus','Income'),[...(calc.salm?[ln(L('Salaire net','Net pay'),fq({a:S.sal.amt,f:S.sal.f}),calc.salm,'sal.amt')]:[]),...S.rev.map((x,i)=>[x,i]).filter(([x,i])=>val(x,'rev.'+i)).map(([x,i])=>ln(x.l||'—',fq(x),pm(x),`rev.${i}.a`))]);
  add(tr('Logement'),[...secL(0),...(calc.used?[ln(L('Hypothèque','Mortgage'),has(S.hyp.pmt)?fq({a:S.hyp.pmt,f:S.hyp.f}):L('estimé','estimated'),calc.used,'hyp.pmt')]:[])]);
  [1,2,3,5,6].forEach(si=>add(tr(S.sec[si].t),secL(si)));
  add(L('Dettes','Debts'),S.dettes.map((d,i)=>[d,i]).filter(([d])=>pm(d)).map(([d,i])=>ln(tr(d.l)+(has(d.nom)?' — '+d.nom:''),fq(d),pm(d),`dettes.${i}.a`)));
  add(L('Assurances','Insurance'),S.assur.flatMap((g,gi)=>g.items.map((x,i)=>[x,i]).filter(([x])=>pm(x)).map(([x,i])=>ln(tr(cap(g.t))+(x.l?' — '+x.l:''),fq(x),pm(x),`assur.${gi}.items.${i}.a`))));
  add(tr('Épargne et placements'),secL(4));
  const U=Object.keys(S.unk).filter(p=>S.unk[p]);
  if(U.length)G.push([L('À voir avec Mickaël','To check with Mickaël'),U.map(p=>ln(tr(LBL[p]||p),L('Tu as indiqué « Je ne sais pas »','You chose “I don’t know”'),null,p))]);
  el.innerHTML=G.length?G.map(([t,ls])=>`<div class="grp"><h3>${esc(t)}</h3>${ls.map(x=>`<button type="button" class="line" data-edit="${x.p}"><span>${esc(x.l)}</span><b>${x.v==null?'?':$$(x.v)+L(' / mois',' / mo')}</b><span class="d">${esc(x.d)}</span></button>`).join('')}</div>`).join(''):`<p class="empty-t">${L("Rien d'inscrit pour l'instant.",'Nothing entered yet.')}</p>`;
}
function paintPaie(){
  const P=calc.pay,nb=P.nb||1,T=P.T,pp=v=>P.nb?$$(v/nb):'—';
  const rows=[['Salaire brut',P.g,S.sal.type==='Brut'?'Inscrit':'Estimé à partir du net'],['RRQ (Régime de rentes du Québec)',T.rrq,"6,30 % jusqu'à 74 600 $, puis 4 % jusqu'à 85 000 $"],['RQAP (assurance parentale)',T.rqap,"0,43 % jusqu'à 103 000 $"],['Assurance-emploi',T.ae,"1,30 % jusqu'à 68 900 $"],['Impôt fédéral',T.fed,"Après l'abattement du Québec (16,5 %)"],['Impôt du Québec',T.qc,'14 %, 19 %, 24 %, 25,75 %'],['Autres retenues (syndicat, pension, assurances…)',P.retAn,'Voir plus bas']];
  const tot=T.rrq+T.rqap+T.ae+T.fed+T.qc+P.retAn;
  $('#paieBody').innerHTML=rows.map(([l,v,n],i)=>`<tr><td>${i?'− ':''}${l}</td><td class="r">${$$(v)}</td><td class="r">${pp(v)}</td><td class="muted">${n}</td></tr>`).join('')+
    `<tr><td><b>Total des retenues</b></td><td class="r"><b>${$$(tot)}</b></td><td class="r"><b>${pp(tot)}</b></td><td class="muted">${P.g?pct(tot/P.g)+' du brut':''}</td></tr>`+
    `<tr class="net"><td>Salaire net estimé</td><td class="r">${$$(P.g-tot)}</td><td class="r">${pp(P.g-tot)}</td><td>${P.g?pct((P.g-tot)/P.g)+' reste dans les poches':''}</td></tr>`;
  const vr=P.vrai;
  $('#cmpBody').innerHTML=`<tr><th></th><th class="r">Par année</th><th class="r">Par paie</th></tr><tr><td>Vrai net</td><td class="r">${vr!=null?$$(vr*nb):'—'}</td><td class="r">${vr!=null?$$(vr):'—'}</td></tr>
   <tr><td>Net estimé</td><td class="r">${$$(P.g-tot)}</td><td class="r">${pp(P.g-tot)}</td></tr>
   <tr><td><b>Écart (retenues non identifiées)</b></td><td class="r" style="color:var(--bad)">${vr!=null?$$(P.g-tot-vr*nb):'—'}</td><td class="r" style="color:var(--bad)">${vr!=null?$$((P.g-tot)/nb-vr):'—'}</td></tr>`;
}
function renderRet(){const Lr=[['syn','Cotisation syndicale'],['pen','Fonds de pension'],['reer','REER collectif'],['ass','Assurance collective'],['aut','Autre retenue']];
  $('#retRows').innerHTML=Lr.map(([k,l])=>`<div class="f"><label for="ret_${k}">${l} (par paie)</label>${money('ret.'+k,S.ret[k],'$',l)}<div class="help">Par année : <span data-out="retAn:${k}"></span></div></div>`).join('')}

/* ================= calendriers (mode conseiller) ================= */
const MN={10:'Octobre',11:'Novembre',12:'Décembre'},MS={10:'--s-oct',11:'--s-nov',12:'--s-dec'};
const cls=ct=>ct==='Revenu'?'pay':ct==='Carte de crédit'?'credit':['Paiement auto','Assurance auto','Gym','Cellulaire'].includes(ct)?'auto':'';
const itemTxt=x=>esc(cap(x.ds))+(num(x.i)?' + '+shortAmt(x.i):num(x.o)?' − '+shortAmt(x.o):'');
function renderMvList(){const Lm=S.cal[curM];
  $('#mvList').innerHTML=Lm.map((x,i)=>{const p=`cal.${curM}.${i}`;return `<div class="mv">
    <input class="fld dt" type="date" lang="fr-CA" data-p="${p}.d" value="${fv(x.d)}" aria-label="Date">
    <input class="fld ds" data-p="${p}.ds" value="${fv(x.ds)}" placeholder="Description" aria-label="Description">
    <select class="fld ct" data-p="${p}.ct" aria-label="Catégorie">${opts([['','Choisir…']].concat(CATS.map(c=>[c,c])),x.ct)}</select>
    <span class="unit" data-u="$"><input class="fld num" data-p="${p}.i" inputmode="decimal" value="${fv(x.i)}" placeholder="Entrée" aria-label="Entrée"></span>
    <span class="unit" data-u="$"><input class="fld num" data-p="${p}.o" inputmode="decimal" value="${fv(x.o)}" placeholder="Sortie" aria-label="Sortie"></span>
    <button class="cbtn x" type="button" data-del="${i}" aria-label="Supprimer la ligne">${ic('i-x')}</button></div>`}).join('');keyHints()}
function paintCal(){const m=+curM,Lm=S.cal[curM];
  $('#calWrap').style.setProperty('--season',`var(${MS[m]})`);
  const byDay={};Lm.forEach(x=>{if(has(x.d))(byDay[x.d]=byDay[x.d]||[]).push(x)});
  const first=new Date(2026,m-1,1),start=new Date(first);start.setDate(1-((first.getDay()+6)%7));const last=new Date(2026,m,0);
  let g=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=>`<div class="dh">${d}</div>`).join('');const c=new Date(start);let agenda='';
  do{const iso=`${c.getFullYear()}-${String(c.getMonth()+1).padStart(2,'0')}-${String(c.getDate()).padStart(2,'0')}`;
    const inM=c.getMonth()===m-1,items=byDay[iso]||[],we=c.getDay()===0||c.getDay()===6;
    const lab=inM?c.getDate():(items.length?c.getDate()+' '+c.toLocaleDateString('fr-CA',{month:'short'}):'');
    g+=`<div class="d${inM?(we?' we':''):' out'}"><div class="n">${lab}</div>${items.map(x=>`<div class="it ${cls(x.ct)}">${itemTxt(x)}</div>`).join('')}</div>`;
    if(items.length)agenda+=`<div class="day"><div class="n">${c.toLocaleDateString('fr-CA',{weekday:'short',day:'numeric',month:'short'})}</div><div>${items.map(x=>`<div class="it ${cls(x.ct)}">${itemTxt(x)}</div>`).join('')}</div></div>`;
    c.setDate(c.getDate()+1)}while(!(c>last&&c.getDay()===1));
  $('#calGrid').innerHTML=g;$('#calAgenda').innerHTML=agenda||'<div class="day"><span></span><span class="muted">Aucun mouvement ce mois-ci. Ajoute-en un plus bas.</span></div>';
  const inn=Lm.reduce((a,x)=>a+num(x.i),0),outt=Lm.reduce((a,x)=>a+num(x.o),0),rest=inn-outt;
  $('#calHead').innerHTML=`<h2>${MN[m]} 2026</h2><span class="num">${rest>=0?'Reste':'Déficit'} ${$$(rest)}</span>`;
  const byCat={};Lm.forEach(x=>{if(num(x.o)){const k=x.ct||'Autre / à préciser';byCat[k]=(byCat[k]||0)+num(x.o)}});
  const ecart=inn-(calc.salm||0);
  $('#mSum').innerHTML=`<div><span>Entrées</span><b>${$$(inn)}</b></div><div><span>Sorties</span><b>${$$(outt)}</b></div>
   <div><span>Reste</span><b style="color:${rest<0?'var(--bad)':'var(--good)'}">${$$(rest)}</b></div>
   <div class="muted"><span>Écart avec la moyenne du budget</span><span>${ecart>=0?'+':''}${$$(ecart)}</span></div>
   <hr class="sep"><div class="muted"><span>Sorties par catégorie</span></div>
   ${Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div><span>${esc(k)}</span><span>${$$(v)}</span></div>`).join('')}`}

/* ================= événements ================= */
function onEdit(e){const t=e.target,p=t.dataset&&t.dataset.p;if(!p)return;
  const v=t.type==='checkbox'?t.checked:t.value;setP(p,v);
  if(/\.a$/.test(p)&&has(v)){const base=p.slice(0,-2),o=getP(base);if(o&&'f' in o&&!o.f){o.f=o.df||'mois';const sel=document.querySelector(`[data-p="${base}.f"]`);if(sel)sel.value=o.f}}
  if(t.type!=='checkbox')document.querySelectorAll(`[data-p="${p}"]`).forEach(x=>{if(x!==t&&x.value!==v)x.value=v});
  save();if(p.startsWith('cal.'))paintCal();else paint();
  if(!$('#exportPanel').hidden)updateMail()}
document.addEventListener('input',onEdit);document.addEventListener('change',onEdit);
document.addEventListener('click',e=>{
  const t=e.target;let b;
  if((b=t.closest('[data-add]'))){addItem(b.dataset.add,b.dataset.arg);return}
  if((b=t.closest('[data-rm]'))){rmItem(b.dataset.rm);return}
  if((b=t.closest('[data-logset]'))){S.logType=b.dataset.logset;save();applyLog();paint();return}
  if((b=t.closest('[data-gate]'))){const k=b.dataset.gate;S.gate[k]=b.dataset.v;save();const d=document.querySelector(`details.blk[data-gk="${k}"]`);if(d&&!d.classList.contains('hasitems'))d.dataset.g=S.gate[k];
    document.querySelectorAll(`[data-gate="${k}"]`).forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===S.gate[k]));paint();return}
  if((b=t.closest('[data-idk]'))){const p=b.dataset.idk;if(S.unk[p])delete S.unk[p];else{S.unk[p]=true;setP(p,'');const inp=document.querySelector(`[data-p="${p}"]`);if(inp)inp.value=''}save();paint();return}
  if((b=t.closest('[data-tip]'))){const box=document.getElementById(b.dataset.tip);if(box){box.hidden=!box.hidden;b.setAttribute('aria-expanded',!box.hidden)}e.preventDefault();return}
  if((b=t.closest('[data-scmt]'))){b.hidden=true;const ta=document.getElementById('cmt_'+b.dataset.scmt);if(ta){ta.hidden=false;ta.focus()}return}
  if((b=t.closest('[data-qa]'))){const p=b.dataset.qa;setP(p,b.dataset.v);delete S.unk[p];const inp=document.querySelector(`[data-p="${p}"]`);if(inp)inp.value=b.dataset.v;
    const base=p.slice(0,-2),o=getP(base);if(o&&!o.f)o.f=o.df||'mois';save();paint();return}
  if((b=t.closest('[data-prof]'))){S.profile=S.profile===b.dataset.prof?'':b.dataset.prof;if(S.profile==='ret'&&!has(S.sal.amt))S.sal.f='mois';save();renderProfSeg();refresh();return}
  if((b=t.closest('[data-fam]'))){S.famille=S.famille===b.dataset.fam?'':b.dataset.fam;save();renderProfSeg();refresh();return}
  if((b=t.closest('[data-pour]'))){S.pour=S.pour===b.dataset.pour?'':b.dataset.pour;save();renderProfSeg();return}
  if((b=t.closest('[data-mode]'))){S.mode=b.dataset.mode;save();renderProfSeg();refresh();return}
  if((b=t.closest('[data-rdv]'))){S.rdv=b.dataset.rdv;save();paintRdv();return}
  if((b=t.closest('.bookA'))){S.rdvClic=1;save();return}
  if((b=t.closest('[data-edit]'))){editPath(b.dataset.edit);return}
  if((b=t.closest('[data-go]'))){const k=b.dataset.go;if(guide)goStep(k);else{const el=document.querySelector(`#leftCol [data-step="${k}"]`);if(el){openUp(el);if(el.tagName==='DETAILS')el.open=true;el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}}return}
  if((b=t.closest('[data-page]'))){setGuide(false);return}
  if((b=t.closest('[data-resume]'))){openResume(b.dataset.resume);return}
  if(t.closest('#photoBtn')){$('#photoIn').click();return}
  if(t.closest('#qaddBtn')){quickAdd();return}
  if(t.closest('#qaddMic')){dictate();return}
  if(t.closest('#csvApply')){applyCSV();return}
  if(t.closest('#csvCancel')){CSVR=null;$('#csvOut').innerHTML='';return}
});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='photoIn'&&t.files[0]){readStub(t.files[0]);t.value=''}
  else if(t.id==='csvIn'&&t.files[0]){handleCSV(t.files[0]);t.value=''}
  else if(t.dataset&&t.dataset.csv!=null&&CSVR&&CSVR.cats){CSVR.cats[+t.dataset.csv].on=t.checked}});
function editPath(p){const el=document.querySelector(`[data-p="${p}"]`);if(!el)return;const st=el.closest('[data-step]');if(guide&&st)goStep(st.dataset.step,true);
  setTimeout(()=>{openUp(el);el.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});if(!el.disabled)el.focus({preventScroll:true})},60)}
function addItem(kind,arg){let sel;
  if(kind==='rev'){const other=arg==='Autre revenu';S.rev.push({l:other?'':arg,a:'',f:'mois',c:'',df:'mois',u:1});S.gate.rev='oui';const i=S.rev.length-1;sel=other?`#rev_${i}_l`:`#rev_${i}_a`}
  else if(kind==='sec'){const s=S.sec[+arg];s.items.push({l:'',a:'',f:'mois',c:'',df:'mois',u:1});if(s.k==='epa')S.gate.epa='oui';sel=`#sec_${arg}_items_${s.items.length-1}_l`}
  else if(kind==='assur'){const g=S.assur[+arg];g.items.push({l:'',a:'',f:'mois',c:'',cov:'',df:'mois'});S.gate.assur='oui';sel=`#assur_${arg}_items_${g.items.length-1}_l`}
  else if(kind==='dette'){S.dettes.push({l:arg,nom:'',a:'',f:'mois',solde:'',taux:'',c:'',df:'mois',u:1});S.gate.dettes='oui';sel=`#dettes_${S.dettes.length-1}_solde`}
  else if(kind==='immo'){S.immo.push({nom:L('Immeuble ','Property ')+(S.immo.length+1),valeur:'',solde:'',taux:'',renouv:'',pmt:'',loyers:'',taxes:'',entretien:'',pret:'',rest:'',u:1});S.gate.immo='oui';sel=`#immo_${S.immo.length-1}_valeur`}
  save();refresh(sel)}
function rmItem(path){const ks=path.split('.'),i=+ks.pop(),arr=getP(ks.join('.'));if(!Array.isArray(arr))return;arr.splice(i,1);
  Object.keys(S.unk).forEach(k=>{if(k.startsWith(path+'.')||k.startsWith(ks.join('.')+'.'))delete S.unk[k]});save();refresh()}
function selectTab(k){document.querySelectorAll('.tab').forEach(x=>x.setAttribute('aria-selected',x.dataset.tab===k));['budget','paie','cal'].forEach(t=>$('#tab-'+t).hidden=t!==k);if(k==='cal'){paint();paintCal()}}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{selectTab(t.dataset.tab);try{localStorage.setItem(KEY+'-tab',t.dataset.tab)}catch(e){}}));
document.querySelectorAll('.mbtn').forEach(b=>b.addEventListener('click',()=>{curM=b.dataset.m;document.querySelectorAll('.mbtn').forEach(x=>x.setAttribute('aria-pressed',x===b));renderMvList();paintCal()}));
$('#addMv').addEventListener('click',()=>{const m=+curM;S.cal[curM].push({d:`2026-${String(m).padStart(2,'0')}-01`,ds:'',ct:'',i:'',o:''});save();renderMvList();paintCal();const l=document.querySelectorAll('#mvList .ds');l[l.length-1]&&l[l.length-1].focus()});
$('#mvList').addEventListener('click',e=>{const b=e.target.closest('[data-del]');if(!b)return;S.cal[curM].splice(+b.dataset.del,1);save();renderMvList();paintCal()});
$('#resetBtn').addEventListener('click',()=>{$('#confirmBox').hidden=false;$('#resetNo').focus()});
$('#resetNo').addEventListener('click',()=>{$('#confirmBox').hidden=true});
$('#resetYes').addEventListener('click',()=>{S=JSON.parse(JSON.stringify(DEFAULT));save();try{localStorage.removeItem(KEY+'-step');localStorage.removeItem(KEY+'-app')}catch(e){}location.reload()});
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const t=e.target;
  if(t.id==='qaddIn'){e.preventDefault();quickAdd();return}
  if(t.id==='expAmt'||t.id==='expNote'){e.preventDefault();addExpense();return}
  if(!t.dataset||!t.dataset.p)return;
  if(!t.matches||!t.matches('input.fld')||t.type==='file')return;e.preventDefault();
  const all=[...document.querySelectorAll('input.fld[data-p],select.fld[data-p]')].filter(x=>x.offsetParent!==null&&!x.disabled);const nx=all[all.indexOf(t)+1];if(nx)nx.focus();else t.blur()});
const sumEl=$('#summary');let sumTop=0;
const measure=()=>{sumEl.classList.remove('compact');sumTop=sumEl.getBoundingClientRect().top+scrollY};
addEventListener('scroll',()=>{if(guide){sumEl.classList.remove('compact');return}if(!sumTop)measure();sumEl.classList.toggle('compact',scrollY>sumTop+40)},{passive:true});
addEventListener('resize',()=>{sumTop=0});
function setBig(on){document.body.classList.toggle('big',on);$('#bigBtn').setAttribute('aria-pressed',on);try{localStorage.setItem(KEY+'-big',on?'1':'')}catch(e){}}
$('#bigBtn').addEventListener('click',()=>setBig(!document.body.classList.contains('big')));
$('#langBtn').addEventListener('click',()=>{try{localStorage.setItem('budget-gfx-lang',LANG==='en'?'fr':'en')}catch(e){}location.reload()});

/* ================= mode guidé ================= */
const STEPS=[
  {k:'wel',t:L('Bienvenue','Welcome'),ic:'i-wave'},
  {k:'rev',t:L('Tes revenus','Your income'),ic:'i-cash',m:2,me:1},
  {k:'log',t:L('Ton logement','Your housing'),ic:'i-home',m:2,me:1},
  {k:'cour',t:L('Dépenses courantes','Everyday expenses'),ic:'i-cart',m:3,me:1.5},
  {k:'loi',t:L('Loisirs et extras','Leisure and extras'),ic:'i-smile',m:2,me:.5},
  {k:'dettes',t:L('Tes dettes','Your debts'),ic:'i-card',m:2,me:1},
  {k:'prot',t:L('Assurances et épargne','Insurance and savings'),ic:'i-shield',m:2,full:1},
  {k:'res',t:L('Vérifier','Review'),ic:'i-check',m:1,me:.5},
  {k:'send',t:L('Envoyer à Mickaël','Send to Mickaël'),ic:'i-send',m:1,me:.5},
  {k:'paie',t:L('Détail de la paie','Pay details'),ic:'i-doc',x:1},
  {k:'cal',t:L('Calendriers','Calendars'),ic:'i-cal',x:1}
];
const MAIN=()=>STEPS.filter(s=>!s.x&&!(s.full&&S.mode==='express'));
const SKEY=KEY+'-step',VKEY=KEY+'-view';
let cheerT;
function cheer(txt){const c=$('#gCheer');c.textContent=txt;c.classList.add('on');clearTimeout(cheerT);cheerT=setTimeout(()=>c.classList.remove('on'),2800)}
function closeMenu(){$('#gMenu').hidden=true;$('#gMenuBtn').setAttribute('aria-expanded','false')}
function renderMenu(){
  const b=s=>`<button type="button" data-go="${s.k}" class="${seen.has(s.k)?'seen':''}"${s.k===gcur?' aria-current="step"':''}><span class="n">${ic(s.ic)}</span>${esc(s.t)}</button>`;
  $('#gMenu').innerHTML=MAIN().map(b).join('')+(ADV?`<div class="gsep">${L('Mode conseiller','Advisor mode')}</div>`+STEPS.filter(s=>s.x).map(b).join(''):'')+
    `<button type="button" class="gpage" data-resume="out"><span class="n">${ic('i-dev')}</span>${L('Continuer sur un autre appareil','Continue on another device')}</button>`+
    `<button type="button" class="gpage" data-page style="margin-top:0;border-top:0"><span class="n">${ic('i-doc')}</span>${L('Voir tout sur une seule page','See everything on one page')}</button>`;
}
function goStep(k,keep){
  let s=STEPS.find(x=>x.k===k);if(!s||(s.x&&!ADV)||(s.full&&S.mode==='express'))s=STEPS.find(x=>x.k==='wel');k=s.k;
  const M=MAIN(),prevI=M.findIndex(x=>x.k===gcur),mi=M.findIndex(x=>x.k===k),N=M.length-1,prev=gcur;
  gcur=k;seen.add(k);document.body.dataset.cur=k;
  document.querySelectorAll('[data-step]').forEach(el=>{const on=el.dataset.step===k;el.classList.toggle('on',on);if(on&&el.matches('details.blk:not(.acc)'))el.open=true});
  const rem=mi<0?0:M.slice(mi+1).reduce((a,x)=>a+(S.mode==='express'?(x.me||0):(x.m||0)),0);
  $('#gK').innerHTML=s.x?L('Mode conseiller','Advisor mode'):`${L('Étape','Step')} ${mi} ${L('sur','of')} ${N}${rem>=1?` <span class="gtime">· ≈ ${Math.ceil(rem)} min</span>`:''}`;
  $('#gT').textContent=s.t;$('#gFill').style.width=(s.x?100:mi/N*100)+'%';
  const pb=$('#gPrev'),nb=$('#gNext');
  if(s.x){pb.hidden=false;pb.textContent=L('Retour à la vérification','Back to review');nb.hidden=true}
  else{const nk=M[mi+1];pb.hidden=mi===0;pb.textContent=L('Précédent','Back');nb.hidden=!nk;
    nb.textContent=mi===0?L('Commencer','Start'):!nk?'':nk.k==='res'?L('Vérifier mon budget','Review my budget'):nk.k==='send'?L('Envoyer à Mickaël','Send to Mickaël'):L('Suivant','Next')}
  closeMenu();
  if(!keep&&mi>prevI&&mi>1&&!s.x){const left=N-mi;cheer(k==='res'?L('Bravo, tu as tout parcouru ! Vérifie, puis envoie.','Well done, you’re through! Review, then send.'):k==='send'?L('Dernière étape !','Last step!'):left<=3?L(`Plus que ${left} étapes.`,`Only ${left} steps left.`):[L('Belle lancée !','Great start!'),L('Ça avance bien !','Nice progress!'),L('Continue comme ça !','Keep it up!')][mi%3])}
  if(k==='cal')paintCal();if(k==='res'){paint();renderRecap()}if(k==='send'){paint();updateMail();paintReview()}
  if(prev==='wel'&&k!=='wel'){if(!S.mode){S.mode='complet';save();renderProfSeg()}startPing()}
  try{localStorage.setItem(SKEY,k)}catch(e){}
  if(!keep)toTop();
}
function setGuide(on,store=true){
  guide=on;document.body.classList.toggle('guide',on);
  if(store)try{localStorage.setItem(VKEY,on?'guide':'page')}catch(e){}
  if(on){['budget','paie','cal'].forEach(t=>$('#tab-'+t).hidden=false);$('#exportPanel').hidden=false;goStep(gcur)}
  else{delete document.body.dataset.cur;closeMenu();$('#exportPanel').hidden=true;$('#exportBtn').setAttribute('aria-expanded','false');
    document.querySelectorAll('[data-step].on').forEach(e=>e.classList.remove('on'));
    const t=document.querySelector('.tab[aria-selected="true"]');selectTab(ADV&&t?t.dataset.tab:'budget');toTop()}
}
const nextStep=()=>{const M=MAIN(),i=M.findIndex(x=>x.k===gcur);if(M[i+1])goStep(M[i+1].k)};
const prevStep=()=>{const s=STEPS.find(x=>x.k===gcur);if(s&&s.x)return goStep('res');const M=MAIN(),i=M.findIndex(x=>x.k===gcur);if(i>0)goStep(M[i-1].k)};
$('#gPrev').addEventListener('click',prevStep);$('#gNext').addEventListener('click',nextStep);
$('#gMenuBtn').addEventListener('click',()=>{const m=$('#gMenu');if(m.hidden){renderMenu();m.hidden=false;$('#gMenuBtn').setAttribute('aria-expanded','true')}else closeMenu()});
$('#toGuide').addEventListener('click',()=>setGuide(true));
$('#goDeeper').addEventListener('click',()=>{S.mode='complet';save();renderProfSeg();refresh();goStep('prot')});
document.addEventListener('click',e=>{if(guide&&e.target.closest('details.blk:not(.acc)>summary'))e.preventDefault()},true);
const typing=el=>el&&el.matches&&el.matches('input:not([type=date]):not([type=file]):not([type=checkbox]),textarea');
document.addEventListener('focusin',e=>{if(guide&&typing(e.target))document.body.classList.add('typing')});
document.addEventListener('focusout',()=>setTimeout(()=>{if(!typing(document.activeElement))document.body.classList.remove('typing')},80));
// balayer pour changer d'étape
let tx=0,ty=0,tt=0,tok=false;
document.addEventListener('touchstart',e=>{if(!guide||APPON||e.touches.length!==1){tok=false;return}tok=!e.target.closest('input,select,textarea,.scroll,.cal,dialog,.gmenu');const p=e.touches[0];tx=p.clientX;ty=p.clientY;tt=Date.now()},{passive:true});
document.addEventListener('touchend',e=>{if(!guide||!tok)return;const p=e.changedTouches[0],dx=p.clientX-tx,dy=p.clientY-ty;if(Date.now()-tt<700&&Math.abs(dx)>70&&Math.abs(dy)<50){if(dx<0)nextStep();else prevStep()}},{passive:true});

/* ================= ajout rapide + dictée ================= */
function findItem(label){for(let si=0;si<S.sec.length;si++){const i=S.sec[si].items.findIndex(x=>x.l===label);if(i>=0)return [si,i]}return null}
const categorize=d=>{for(const [re,l] of CAT_RULES)if(re.test(d))return l;return null};
function parseQuick(txt){const t=' '+String(txt).toLowerCase().replace(/\s+/g,' ')+' ';
  const m=t.match(/\$?\s?(\d[\d  ]*(?:[.,]\d{1,2})?)\s?\$?/);if(!m)return null;const a=num(m[1]);
  const FR=[[/(aux?|chaque|toutes les|par|every) ?(2|deux|two) (semaines|weeks)/,'2sem'],[/(2|deux|two) fois par mois|twice a month/,'2fm'],[/(aux?|chaque|tous les|par|every) ?(2|deux|two) (mois|months)/,'2mois'],[/(3|trois|three) (mois|months)|trimestr|quarter/,'3mois'],[/semaine|hebdo|\/sem|\bweek/,'sem'],[/par an\b|par année|par annee|annuel|l'an\b|\/an\b|\byear|annual/,'an'],[/mois|mensuel|\bmonth/,'mois']];
  let f='mois';for(const [re,v] of FR){if(re.test(t)){f=v;break}}
  let l=t.replace(m[0],' ').replace(/\$|dollars?|piasses?|bucks?/g,' ')
    .replace(/\b(aux?|chaque|toutes les|tous les|par|fois|hebdo\w*|mensuel\w*|annuel\w*|semaines?|mois|année|annee|an|trimestr\w*|deux|trois|every|per|a|week(ly)?s?|month(ly)?s?|year(ly)?s?|twice|quarter(ly)?)\b/g,' ')
    .replace(/\b[23]\b/g,' ').replace(/\s+/g,' ').trim().replace(/^(de|pour|à|en|the|for|my|mon|ma|mes)\s+/,'');
  return {a,f,l:cap(l)}}
function quickAdd(){const inp=$('#qaddIn');if(!inp)return;const r=parseQuick(inp.value);
  if(!r||!r.a){QMSG={c:'ko',t:L("Je n'ai pas trouvé de montant. Exemple : « Netflix 18 $ par mois ».",'I couldn’t find an amount. Example: “Netflix $18 a month”.')};$('#qaddMsg').className='status ko';$('#qaddMsg').textContent=QMSG.t;return}
  const cat=r.l?categorize(r.l):null,pos=cat&&cat!==IGN?findItem(cat):null;let si,where;
  if(pos&&!has(S.sec[pos[0]].items[pos[1]].a)){const x=S.sec[pos[0]].items[pos[1]];x.a=String(r.a);x.f=r.f;delete S.unk[`sec.${pos[0]}.items.${pos[1]}.a`];si=pos[0];where=tr(x.l)}
  else{si=pos?pos[0]:3;const lab=r.l||L('Dépense','Expense');S.sec[si].items.push({l:lab,a:String(r.a),f:r.f,c:'',df:r.f,u:1});where=lab}
  QMSG={c:'ok',t:L(`Ajouté : ${where} — ${shortAmt(r.a)} $ ${flab(r.f)} (dans « ${S.sec[si].t} »). Tu peux en ajouter une autre.`,`Added: ${where} — $${shortAmt(r.a)} ${flab(r.f)} (in “${tr(S.sec[si].t)}”). You can add another.`)};
  save();refresh();const ni=$('#qaddIn');if(ni&&!guide)ni.focus({preventScroll:true})}
function dictate(){if(!SR)return;const rec=new SR();rec.lang=L('fr-CA','en-CA');rec.interimResults=false;rec.maxAlternatives=1;
  const msg=$('#qaddMsg');msg.className='status';msg.textContent=L('Je t’écoute… dis par exemple « Netflix 18 dollars par mois ».','Listening… say for example “Netflix 18 dollars a month”.');
  rec.onresult=ev=>{const txt=ev.results[0][0].transcript;$('#qaddIn').value=txt;quickAdd()};
  rec.onerror=()=>{msg.className='status ko';msg.textContent=L('Le micro n’est pas disponible ici. Utilise le micro de ton clavier dans le champ.','The mic isn’t available here. Use your keyboard’s mic in the field.')};
  try{rec.start()}catch(e){rec.onerror()}}

/* ================= import d'un relevé CSV ================= */
function parseCSV(txt){txt=txt.replace(/^\uFEFF/,'');const first=txt.split(/\r?\n/).find(l=>l.trim())||'';
  const d=[';','\t',','].map(c=>[c,first.split(c).length]).sort((a,b)=>b[1]-a[1])[0][0];
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<txt.length;i++){const c=txt[i];
    if(q){if(c==='"'){if(txt[i+1]==='"'){cell+='"';i++}else q=false}else cell+=c}
    else if(c==='"')q=true;else if(c===d){row.push(cell);cell=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&txt[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=c}
  if(cell||row.length){row.push(cell);rows.push(row)}
  return rows.filter(r=>r.some(x=>x.trim()))}
const isDate=s=>/\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}|\d{1,2}[-\/.]\d{1,2}[-\/.]\d{4}/.test(s);
const toDate=s=>{let m=s.match(/(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);if(m)return new Date(+m[1],m[2]-1,+m[3]);m=s.match(/(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);if(m){let a=+m[1],b=+m[2];if(b>12)[a,b]=[b,a];return new Date(+m[3],b-1,a)}return null};
const isMoney=s=>/^\s*[-(]?\s*\$?\s*-?\d[\d\s ]*([.,]\d{1,2})?\s*\$?\s*\)?-?\s*$/.test(s)&&!isDate(s);
const sval=c=>{if(!has(c))return 0;const neg=/^\s*-|\(.*\)|-\s*$/.test(c);const v=num(c);return neg?-Math.abs(v):v};
function analyzeCSV(rows){
  if(!rows.length)return{err:L('Le fichier est vide.','The file is empty.')};
  const H0=rows[0].map(c=>c.toLowerCase().trim()),hdr=H0.some(c=>/[a-zé]/.test(c))&&!H0.some(isDate)&&!H0.some(c=>isMoney(c)&&c!=='');
  const ix=re=>hdr?H0.findIndex(c=>re.test(c)):-1;
  const iDesc=ix(/descr|libell|marchand|détail|detail|payee|bénéf|benef|name|commerçant|transaction/),iDeb=ix(/débit|debit|retrait|withdraw|sortie/),iCred=ix(/crédit|credit|dépôt|depot|deposit|entrée/),iAmt=ix(/montant|amount/),iDate=ix(/date/);
  const data=hdr?rows.slice(1):rows;
  let mode='amt',cDeb=-1,cCred=-1,cAmt=-1;
  if(iDeb>=0){mode='dc';cDeb=iDeb;cCred=iCred}else if(iAmt>=0){cAmt=iAmt}
  else{const w=Math.max(...data.map(r=>r.length)),cols=[];for(let c=0;c<w;c++){const k=data.filter(r=>isMoney(r[c]||'')).length;if(k>=data.length*0.3)cols.push(c)}
    if(cols.length>=3){mode='dc';cDeb=cols[0];cCred=cols[1]}else if(cols.length===2){if(data.some(r=>sval(r[cols[0]])<0))cAmt=cols[0];else{mode='dc';cDeb=cols[0];cCred=cols[1]}}else if(cols.length===1)cAmt=cols[0];else return{err:L("Je n'ai pas trouvé de colonne de montants dans ce fichier.",'I couldn’t find an amount column in this file.')}}
  const tx=[];let anyNeg=false;
  data.forEach(r=>{const cells=r.map(c=>(c||'').trim());let dt=iDate>=0?toDate(cells[iDate]||''):null;if(!dt){const c=cells.find(isDate);dt=c?toDate(c):null}
    let desc=iDesc>=0?cells[iDesc]:'';if(!desc)desc=cells.filter(c=>c&&!isDate(c)&&!isMoney(c)).sort((a,b)=>b.length-a.length)[0]||'';
    let s=0;if(mode==='dc'){const db=Math.abs(sval(cells[cDeb]));s=db?-db:Math.abs(sval(cells[cCred]))}else s=sval(cells[cAmt]);
    if(s<0)anyNeg=true;tx.push({dt,desc,s})});
  const exp=tx.map(t=>({...t,out:mode==='dc'||anyNeg?(t.s<0?-t.s:0):t.s})).filter(t=>t.out>0&&!/paie|salaire|payroll|d[ée]p[ôo]t direct|direct deposit/i.test(t.desc));
  const ds=tx.map(t=>t.dt).filter(Boolean).map(d=>+d);const span=ds.length?(Math.max(...ds)-Math.min(...ds))/864e5+1:30;const months=Math.max(1,span/30.44);
  const agg={},other={sum:0,count:0,top:{}};
  exp.forEach(t=>{const c=categorize(t.desc);if(c===IGN)return;if(c&&findItem(c)){(agg[c]=agg[c]||{sum:0,count:0}).sum+=t.out;agg[c].count++}else{other.sum+=t.out;other.count++;const k=t.desc.slice(0,40);other.top[k]=(other.top[k]||0)+t.out}});
  const cats=Object.entries(agg).map(([label,v])=>({label,avg:v.sum/months,count:v.count,on:true})).sort((a,b)=>b.avg-a.avg);
  return{cats,other:{avg:other.sum/months,count:other.count,top:Object.entries(other.top).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0])},months:Math.round(months*10)/10,n:exp.length};
}
function csvHTML(){if(!CSVR)return '';if(CSVR.err)return `<p class="status ko">${esc(CSVR.err)}</p>`;if(CSVR.done)return `<p class="status ok">${esc(CSVR.done)}</p>`;
  const mo=CSVR.months;
  return `<div class="csvres"><p class="small">${L(`${CSVR.n} dépenses trouvées sur environ ${String(mo).replace('.',',')} mois. Voici tes moyennes par mois : décoche ce que tu ne veux pas garder.`,`${CSVR.n} expenses found over about ${mo} months. Here are your monthly averages: untick what you don’t want to keep.`)}</p>
    ${CSVR.cats.map((c,i)=>`<label class="crow"><input type="checkbox" data-csv="${i}"${c.on?' checked':''}><span>${esc(tr(c.label))} <span class="n">· ${c.count} transaction${c.count>1?'s':''}</span></span><b>${$$(c.avg)}</b></label>`).join('')||`<p class="small muted">${L("Aucune dépense reconnue automatiquement.",'No expense recognized automatically.')}</p>`}
    ${CSVR.other.count?`<p class="small muted">${L('Non classé','Not sorted')} : ${$$(CSVR.other.avg)} ${L('par mois','a month')} (${CSVR.other.count} transaction${CSVR.other.count>1?'s':''}${CSVR.other.top.length?', ex. : '+esc(CSVR.other.top.join(', ')):''}). ${L('Ajoute-les à la main au besoin.','Add them by hand if needed.')}</p>`:''}
    <label class="none"><input type="checkbox" id="csvRepl"><span>${L('Remplacer les montants déjà inscrits','Replace amounts already entered')}</span></label>
    <div class="tools" style="margin:0"><button class="btn primary" type="button" id="csvApply">${L('Ajouter au budget','Add to budget')}</button><button class="btn quiet" type="button" id="csvCancel">${L('Annuler','Cancel')}</button></div></div>`}
function handleCSV(file){file.text().then(t=>{CSVR=analyzeCSV(parseCSV(t));$('#csvOut').innerHTML=csvHTML()}).catch(()=>{CSVR={err:L('Impossible de lire ce fichier.','Couldn’t read this file.')};$('#csvOut').innerHTML=csvHTML()})}
function applyCSV(){if(!CSVR||!CSVR.cats)return;const repl=$('#csvRepl')&&$('#csvRepl').checked;let n=0;
  CSVR.cats.filter(c=>c.on).forEach(c=>{const pos=findItem(c.label);if(!pos)return;const x=S.sec[pos[0]].items[pos[1]];if(has(x.a)&&!repl)return;x.a=String(Math.round(c.avg));x.f='mois';delete S.unk[`sec.${pos[0]}.items.${pos[1]}.a`];n++});
  CSVR={done:L(`${n} montant${n>1?'s':''} ajouté${n>1?'s':''} à ton budget. Vérifie-les dans les sections plus bas.`,`${n} amount${n>1?'s':''} added to your budget. Check them in the sections below.`)};save();refresh()}

/* ================= photo du talon de paie (Claude) ================= */
(async()=>{try{SAMPLE=window.claude&&window.claude.use?await window.claude.use('sample'):null}catch(e){SAMPLE=null}if(!SAMPLE)return;
  try{const l=await SAMPLE.limits();SAMPLE_IMG=!!(l&&l.images)}catch(e){SAMPLE_IMG=false}const b=$('#photoBox');if(b)b.hidden=!SAMPLE_IMG})();
async function readStub(file){const msg=$('#photoMsg'),btn=$('#photoBtn');if(!SAMPLE)return;msg.className='status';msg.textContent=L('Lecture de ta photo… (environ 30 secondes)','Reading your photo… (about 30 seconds)');btn.disabled=true;
  const prompt=`Tu lis la photo d'un talon de paie canadien (Québec). Réponds uniquement avec un objet JSON de cette forme :
{"net":nombre ou null,"brut":nombre ou null,"frequence":"sem"|"2sem"|"2fm"|"mois"|null,"syndicat":nombre ou null,"pension":nombre ou null,"reer":nombre ou null,"assurance":nombre ou null,"autre":nombre ou null}
Les montants sont ceux de CETTE paie (pas les cumulatifs de l'année), en dollars, avec un point comme séparateur décimal. "net" = montant déposé. "pension" = régime de retraite de l'employeur (pas le RRQ). "assurance" = assurances collectives. "autre" = autres retenues volontaires. N'inclus pas l'impôt, le RRQ, le RQAP ni l'assurance-emploi. Mets null si l'information n'est pas visible.`;
  try{const r=await SAMPLE.json(prompt,{images:[file]});const n=v=>typeof v==='number'&&isFinite(v)&&v>0;
    if(n(r.net)){S.sal.amt=String(r.net);S.sal.type='Net'}else if(n(r.brut)){S.sal.amt=String(r.brut);S.sal.type='Brut'}
    if(r.frequence&&NB[r.frequence])S.sal.f=r.frequence;delete S.unk['sal.amt'];
    [['syndicat','syn'],['pension','pen'],['reer','reer'],['assurance','ass'],['autre','aut']].forEach(([a,b])=>{if(n(r[a]))S.ret[b]=String(r[a])});
    save();refresh();renderRet();paint();const m2=$('#photoMsg');if(m2){m2.className='status ok';m2.textContent=L("C'est rempli ! Vérifie les montants ci-dessous.",'Done! Check the amounts below.')}}
  catch(e){const c=e&&e.code;const m2=$('#photoMsg')||msg;m2.className='status ko';
    m2.textContent=c==='not_granted'||c==='sampling_disabled'||c==='images_unavailable'?L("La lecture de photo n'est pas offerte ici. Inscris tes montants à la main.",'Photo reading isn’t available here. Enter your amounts by hand.')
      :c==='image_rejected'?L('Photo illisible : essaie une autre photo, bien éclairée et à plat.','Unreadable photo: try another one, well lit and flat.')
      :c==='rate_limited'?L('Trop de demandes pour le moment : réessaie dans quelques minutes.','Too many requests right now: try again in a few minutes.')
      :c==='cancelled'?'':L("Je n'ai pas réussi à lire les montants. Essaie une photo plus nette.",'I couldn’t read the amounts. Try a sharper photo.');
    if(c==='not_granted'||c==='sampling_disabled'||c==='images_unavailable'){SAMPLE_IMG=false}}
  finally{const b2=$('#photoBtn');if(b2)b2.disabled=false}}

/* ================= code de reprise ================= */
async function encodeState(){let bytes=new TextEncoder().encode(JSON.stringify(S)),tag='GFX0.';
  if(window.CompressionStream){try{const s=new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));bytes=new Uint8Array(await new Response(s).arrayBuffer());tag='GFX1.'}catch(e){}}
  let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode.apply(null,bytes.subarray(i,i+8192));
  return tag+btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function decodeState(code){const m=String(code).replace(/\s+/g,'').match(/^GFX([01])\.(.+)$/);if(!m)throw 0;let b=m[2].replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';
  let bytes=Uint8Array.from(atob(b),c=>c.charCodeAt(0));if(m[1]==='1'){const s=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));bytes=new Uint8Array(await new Response(s).arrayBuffer())}
  return JSON.parse(new TextDecoder().decode(bytes))}
async function openResume(mode){const dlg=$('#resumeDlg');$('#resOut').hidden=mode!=='out';$('#resMsg').textContent='';$('#resIn').value='';
  if(mode==='out'){const code=await encodeState();$('#resCode').value=code;
    $('#resMail').href=`mailto:?subject=${encodeURIComponent(L('Mon code de reprise — budget GFX','My resume code — GFX budget'))}&body=${encodeURIComponent(L('Mon code pour continuer mon budget :\n\n','My code to continue my budget:\n\n')+code)}`}
  closeMenu();if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','')}
$('#resumeIn').addEventListener('click',()=>openResume('in'));$('#resumeOut').addEventListener('click',()=>openResume('out'));
$('#resCopy').addEventListener('click',async()=>{const ta=$('#resCode');try{await navigator.clipboard.writeText(ta.value);$('#resCopy').textContent=L('Code copié','Code copied')}catch(e){ta.focus();ta.select()}});
$('#resLoad').addEventListener('click',async()=>{const msg=$('#resMsg');try{const d=await decodeState($('#resIn').value);if(!d||!d.sec)throw 0;S=d;migrate();save();msg.className='status ok';msg.textContent=L('Budget repris !','Budget restored!');boot();setTimeout(()=>{$('#resumeDlg').close&&$('#resumeDlg').close()},700)}
  catch(e){msg.className='status ko';msg.textContent=L('Ce code ne fonctionne pas. Vérifie que tu l’as copié au complet.','This code doesn’t work. Check that you copied all of it.')}});

/* ================= mode conseiller : lien + QR ================= */
const ADVK=KEY+'-adv';
function setAdv(on,store=true){ADV=on;document.body.classList.toggle('adv',on);if(store)try{localStorage.setItem(ADVK,on?'1':'')}catch(e){}
  $('#advPanel').hidden=!on;$('#advBtn').textContent=on?L('Quitter le mode conseiller','Leave advisor mode'):L('Mode conseiller','Advisor mode');
  if(on)fillAdv();else if(!guide)selectTab('budget');if(guide)goStep(STEPS.find(s=>s.k===gcur&&s.x)&&!on?'res':gcur,true)}
function fillAdv(){const p=$('#advProf');if(!p.options.length)p.innerHTML=opts([['',L('Elle choisit','Client chooses')]].concat(PROFILES),'');if(!$('#advBase').value)$('#advBase').value=SHARE_URL;advLink()}
function advLink(){const base=$('#advBase').value.trim()||SHARE_URL,q=new URLSearchParams();const n=$('#advNom').value.trim(),pr=$('#advProf').value,md=$('#advMode').value;
  if(n)q.set('nom',n);if(pr)q.set('profil',pr);if(md)q.set('mode',md);const qs=q.toString();const link=base+(qs?(base.includes('#')?'&':'#')+qs:'');$('#advLink').value=link;
  const box=$('#advQR');try{if(typeof qrcode!=='function')throw 0;const qr=qrcode(0,'M');qr.addData(link);qr.make();box.innerHTML=qr.createSvgTag({cellSize:4,margin:2,scalable:true});box.parentElement.hidden=false}catch(e){box.parentElement.hidden=true}}
['advNom','advProf','advMode','advBase'].forEach(id=>{$('#'+id).addEventListener('input',advLink);$('#'+id).addEventListener('change',advLink)});
$('#advCopy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#advLink').value);$('#advCopy').textContent=L('Copié','Copied')}catch(e){$('#advLink').select()}});
$('#advBtn').addEventListener('click',()=>setAdv(!ADV));$('#advOff').addEventListener('click',()=>setAdv(false));
function readParams(){let q='';try{q=(location.hash||'').replace(/^#/,'')+'&'+(location.search||'').replace(/^\?/,'')}catch(e){}const p=new URLSearchParams(q);
  const nom=p.get('nom'),pr=p.get('profil'),md=p.get('mode');let ch=false;
  if(nom&&!has(S.nom)){S.nom=nom;ch=true}const prm=OLDPROF[pr]||pr;if(prm&&PROFILES.some(x=>x[0]===prm)&&!S.profile){S.profile=prm;ch=true}if(pr==='fam'&&!S.famille){S.famille='enf';ch=true}if((md==='express'||md==='complet')&&!S.mode){S.mode=md;ch=true}
  if(ch)save();return p.get('conseiller')==='1'}

/* ================= envoi direct + relance (webhook) ================= */
async function hook(type){if(!WEBHOOK_URL)return false;try{const body={type,nom:S.nom,courriel:S.email,date:S.date,profil:PROFFR[S.profile]||'',famille:FAMFR[S.famille]||'',version:S.mode};
  if(type==='budget'){body.resume=summaryText();body.html=reportHtml();body.data=Object.assign({},S,{app:undefined})}
  const r=await fetch(WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return r.ok}catch(e){return false}}
function startPing(){if(WEBHOOK_URL&&has(S.email)&&!S.pinged){S.pinged=1;save();hook('debut')}}
$('#directBox').hidden=!WEBHOOK_URL;
$('#directBtn').addEventListener('click',async()=>{const m=$('#directMsg'),b=$('#directBtn');b.disabled=true;m.className='status';m.textContent=L('Envoi en cours…','Sending…');
  const ok=await hook('budget');b.disabled=false;if(ok){m.className='status ok';m.textContent=L('Envoyé ! Mickaël a reçu ton budget.','Sent! Mickaël has your budget.');$('#thanks').hidden=false}
  else{m.className='status ko';m.textContent=L("L'envoi direct n'a pas fonctionné. Utilise les étapes ci-dessous.",'Direct sending didn’t work. Use the steps below.')}});

/* ================= envoi : fichier + courriel ================= */
function openExport(){if(guide){goStep('send');return}const p=$('#exportPanel');p.hidden=false;paintReview();$('#exportBtn').setAttribute('aria-expanded','true');updateMail();p.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})}
$('#exportBtn').addEventListener('click',()=>{const p=$('#exportPanel');if(p.hidden)openExport();else{p.hidden=true;$('#exportBtn').setAttribute('aria-expanded','false')}});
$('#footSend').addEventListener('click',openExport);
function paintReview(){compute();const miss=MAIN().filter(s=>s.k in calc.ans&&!calc.ans[s.k]);const U=Object.keys(S.unk).filter(k=>S.unk[k]).length;let h='';
  if(!has(S.nom))h+=`<div class="f"><label for="nom2">${L('Ton nom','Your name')}</label><input id="nom2" class="fld" data-p="nom" autocomplete="name"><div class="help">${L('Pour que Mickaël sache de qui vient le budget.','So Mickaël knows whose budget it is.')}</div></div>`;
  h+=miss.length?`<p><b>${L("Avant d'envoyer :",'Before sending:')}</b> ${miss.length>1?L(miss.length+' sections sont encore vides',miss.length+' sections are still empty'):L('une section est encore vide','one section is still empty')}. ${L("Si c'est normal, envoie quand même.",'If that’s normal, send anyway.')}</p><div class="chips">${miss.map(s=>`<button class="chip" type="button" data-go="${s.k}">${esc(s.t)}</button>`).join('')}</div>`:`<p class="ok">${L('Tout est rempli. Beau travail !','Everything is filled in. Nice work!')}</p>`;
  if(U)h+=`<p class="small muted">${L(`${U} montant${U>1?'s':''} marqué${U>1?'s':''} « Je ne sais pas » : Mickaël t'aidera à ${U>1?'les':'le'} trouver.`,`${U} amount${U>1?'s':''} marked “I don’t know”: Mickaël will help you find ${U>1?'them':'it'}.`)}</p>`;
  $('#review').innerHTML=h;keyHints()}
function fname(){const n=(S.nom||'cliente').trim().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'');return `Budget-${n||'cliente'}-${S.date||new Date().toISOString().slice(0,10)}.html`}
function summaryText(){
  compute();const Lx=[],fmt=x=>`${shortAmt(x.a)} $ ${flabelFR(x.f)}`;
  const add=(l,x,p)=>{const v=val(x,p);if(v)Lx.push(`  ${l} : ${fmt(x)} (${$$(v)}/mois)${has(x.cov)?' · montant assuré '+x.cov+' $':''}${x.terme?' · '+TERMFR[x.terme]:''}${has(x.ech)?' · échéance '+x.ech:''}`)};
  const s=calc.summary;
  Lx.push(`BUDGET — ${S.nom||'(nom)'} — ${S.date||new Date().toLocaleDateString('fr-CA')}`,'',`Entrées/mois : ${$$(s.inTot)}  |  Sorties/mois : ${$$(s.outTot)}  |  Reste : ${$$(s.rest)}`,`Total des dettes : ${$$(s.dSolde)}`,`Profil : ${PROFFR[S.profile]||'non indiqué'} · Famille : ${FAMFR[S.famille]||'non indiquée'}${S.pour&&(S.famille==='couple'||S.famille==='enf')?' (budget : '+POURFR[S.pour].toLowerCase()+')':''} · Version : ${S.mode==='express'?'rapide':'complète'} · Logement : ${LOGFR[S.logType]||'non indiqué'}`);
  if(has(S.email))Lx.push(`Courriel : ${S.email}`);
  Lx.push(`Rendez-vous : ${S.rdv==='oui'?'déjà pris':S.rdvClic?'pas encore (a ouvert la prise de rendez-vous)':S.rdv==='non'?'pas encore':'non indiqué'}`);
  Lx.push('','SALAIRE',`  Paie : ${S.unk['sal.amt']?'à voir':fmt({a:S.sal.amt,f:S.sal.f})} (${S.sal.type})${has(S.sal.vrai)?` · vrai net ${S.sal.vrai} $/paie`:''}`,`  Brut/an : ${O.salBrut} · Net/an : ${O.salNet}`);
  const rk=[['syn','Syndicat'],['pen','Pension'],['reer','REER coll.'],['ass','Assurance coll.'],['aut','Autre']].filter(([k])=>num(S.ret[k]));
  if(rk.length)Lx.push('  Retenues/paie : '+rk.map(([k,l])=>`${l} ${S.ret[k]} $`).join(', '));
  const cm=k=>{if(has(S.cmt[k]))Lx.push('  Commentaire : '+S.cmt[k].replace(/\n/g,' / '))};
  const sect=(t,items,pre,gk,ck)=>{const n=Lx.length;Lx.push('',t.toUpperCase());items.forEach((x,i)=>add(x.l||'(sans nom)',x,pre+i));
    if(gk&&S.gate[gk]==='non'&&Lx.length===n+2)Lx.push('  Aucun (confirmé)');cm(ck);if(Lx.length===n+2)Lx.splice(n)};
  sect('Autres revenus',S.rev,'rev.','rev','rev');S.sec.forEach((sec,si)=>sect(sec.t,sec.items,`sec.${si}.items.`,sec.k==='epa'?'epa':null,'sec'+si));
  const H=S.hyp;if(S.logType!=='loc'&&S.logType!=='autre'&&(has(H.solde)||has(H.pmt)))Lx.push('','HYPOTHÈQUE',`  Solde ${H.solde||'?'} $ · paiement ${H.pmt?fmt({a:H.pmt,f:H.f}):'?'} · taux ${H.taux||'?'} % · renouvellement ${H.renouv||'?'}`,`  Valeur ${H.valeur||'?'} $ · ${H.amort||'?'} ans restants (prêt ${H.pret||'?'} ans) · terme ${H.terme||'?'} ans${has(H.raison)?' · raison : '+H.raison:''}`,`  Paiement utilisé : ${O['hyp.used']}/mois`);
  if(S.immo.length){Lx.push('','IMMEUBLES LOCATIFS');S.immo.forEach(b=>Lx.push(`  ${b.nom} : valeur ${b.valeur||'?'} $, solde ${b.solde||'?'} $ à ${b.taux||'?'} %, paiement ${b.pmt||0} $/mois, loyers ${b.loyers||0} $, taxes ${b.taxes||0} $, entretien ${b.entretien||0} $, prêt ${b.pret||'?'} ans, reste ${b.rest||'?'} ans, renouv. ${b.renouv||'?'}`))}
  else if(S.gate.immo==='non')Lx.push('','IMMEUBLES LOCATIFS','  Aucun (confirmé)');
  if(S.dettes.length){Lx.push('','DETTES');S.dettes.forEach(d=>Lx.push(`  ${d.l}${has(d.nom)?' ('+d.nom+')':''} : solde ${num(d.solde)} $, paiement ${fmt(d)}, taux ${d.taux||'?'} %${has(d.c)?' — '+d.c:''}`))}
  else if(S.gate.dettes==='non')Lx.push('','DETTES','  Aucune (confirmé)');cm('dettes');
  const as=S.assur.filter(g=>g.items.length);
  if(as.length){Lx.push('','ASSURANCES');as.forEach(g=>{const gi=S.assur.indexOf(g);g.items.forEach((x,i)=>add(cap(g.t)+' — '+(x.l||'contrat'),x,`assur.${gi}.items.${i}`));Lx.push(`  → Coût total ${g.t} : ${O['aTot:'+gi]}/mois`)})}
  else if(S.gate.assur==='non')Lx.push('','ASSURANCES','  Aucune (confirmé)');cm('assur');
  const U=Object.keys(S.unk).filter(k=>S.unk[k]);if(U.length)Lx.push('','À VOIR AVEC MICKAËL (« Je ne sais pas »)',...U.map(p=>'  '+(LBL[p]||p)));
  return Lx.join('\n');
}
function updateMail(){const intro=`Bonjour Mickaël,\n\nVoici mon budget rempli. Le fichier « ${fname()} » est en pièce jointe.\n\n`;
  let body=intro+summaryText();if(body.length>1600)body=body.slice(0,1600)+'\n\n(… le détail complet est dans le fichier joint)';
  $('#mailLink').href=`mailto:${MAIL}?subject=${encodeURIComponent('Mon budget rempli — '+(S.nom||''))}&body=${encodeURIComponent(body)}`}
$('#mailLink').addEventListener('click',()=>{setTimeout(()=>{$('#thanks').hidden=false},600)});
$('#copyAddr').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(MAIL);$('#copyAddr').textContent=L('Adresse copiée','Address copied')}catch(e){const r=document.createRange();r.selectNodeContents($('#mailAddr'));const sel=getSelection();sel.removeAllRanges();sel.addRange(r)}});
$('#copyBtn').addEventListener('click',async()=>{const t=summaryText();const ta=$('#copyText');ta.value=t;ta.hidden=false;
  try{await navigator.clipboard.writeText(t);$('#copyMsg').className='status ok';$('#copyMsg').textContent=L('Résumé copié. Colle-le dans un courriel ou un texto.','Summary copied. Paste it in an email or text.');$('#thanks').hidden=false}
  catch(e){ta.focus();ta.select();$('#copyMsg').className='status';$('#copyMsg').textContent=L('Sélectionne le texte ci-dessous et copie-le.','Select the text below and copy it.')}});
DLP=(async()=>{try{return window.claude&&window.claude.use?await window.claude.use('downloads'):null}catch(e){return null}})();
$('#saveFileBtn').addEventListener('click',async()=>{const st=$('#saveStatus'),b=$('#saveFileBtn');b.disabled=true;st.className='status';st.textContent=L('Préparation…','Preparing…');
  const html=reportHtml(),DL=window.claude?await DLP:null;
  if(DL){try{await DL.save({filename:fname(),data:html});st.className='status ok';st.textContent=L('Fichier enregistré. Passe à l’étape 2.','File saved. Go to step 2.')}
    catch(e){st.className='status ko';st.textContent=e&&e.code==='declined'?L('Enregistrement annulé.','Save cancelled.'):L('Impossible d’enregistrer ici. Utilise « Copier le résumé ».','Can’t save here. Use “Copy the summary”.')}}
  else{try{const u=URL.createObjectURL(new Blob([html],{type:'text/html'}));const a=document.createElement('a');a.href=u;a.download=fname();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);st.className='status ok';st.textContent=L('Fichier enregistré dans tes téléchargements. Passe à l’étape 2.','File saved to your downloads. Go to step 2.')}
    catch(e){st.className='status ko';st.textContent=L('Impossible d’enregistrer ici. Utilise « Copier le résumé ».','Can’t save here. Use “Copy the summary”.')}}
  b.disabled=false});

/* ================= fichier rempli : rapport GFX ================= */
function reportHtml(){
  const LOGO=document.querySelector('.hero img').src;compute();const s=calc.summary,e=esc;let n=0;
  const H2=t=>`<h2><span>${String(++n).padStart(2,'0')}</span>${e(t)}</h2>`,tr2=(l,v)=>`<tr><td>${e(l)}</td><td class="r">${v}</td></tr>`;
  const itemRows=(items,pre)=>items.map((x,i)=>[x,i]).filter(([x,i])=>val(x,pre+i)).map(([x])=>`<tr><td>${e(x.l||'(sans nom)')}</td><td class="r">${$$(num(x.a))}</td><td>${e(cap(flabelFR(x.f)))}</td><td class="r">${$$(pm(x))}</td></tr>`).join('');
  const tbl=(title,rows,ck)=>rows||has(S.cmt[ck])?`${H2(title)}${rows?`<table><tr><th>Poste</th><th class="r">Montant</th><th>Fréquence</th><th class="r">Par mois</th></tr>${rows}</table>`:''}${has(S.cmt[ck])?`<p class="cm"><b>Commentaire :</b> ${e(S.cmt[ck])}</p>`:''}`:'';
  const conf=[['rev','Autres revenus','Aucun'],['immo','Immeubles locatifs','Aucun'],['dettes','Dettes (à part l’hypothèque)','Aucune'],['assur','Assurances personnelles','Aucune'],['epa','Épargne','Rien pour l’instant']].filter(([k])=>S.gate[k]==='non');
  let body=`${H2('Profil')}<table>${tr2('Situation de travail',e(PROFFR[S.profile]||'Non indiquée'))}${tr2('Situation familiale',e(FAMFR[S.famille]||'Non indiquée'))}${S.pour&&(S.famille==='couple'||S.famille==='enf')?tr2('Ce budget couvre',e(POURFR[S.pour])):''}${tr2('Version remplie',S.mode==='express'?'Rapide':'Complète')}${tr2('Logement',e(LOGFR[S.logType]||'Non indiqué'))}${has(S.email)?tr2('Courriel',e(S.email)):''}${tr2('Rendez-vous',S.rdv==='oui'?'Déjà pris':S.rdvClic?'Pas encore (a ouvert la prise de rendez-vous)':S.rdv==='non'?'Pas encore':'Non indiqué')}${conf.map(([k,l,v])=>tr2(l,v+' (confirmé)')).join('')}</table>`;
  body+=`${H2('Salaire')}<table>${tr2('Paie',S.unk['sal.amt']?'À voir (« Je ne sais pas »)':$$(num(S.sal.amt))+' · '+e(flabelFR(S.sal.f))+' · '+e(S.sal.type))}${has(S.sal.vrai)?tr2('Vrai net par paie',$$(num(S.sal.vrai))):''}${tr2('Brut par année',O.salBrut)}${tr2('Net par année',O.salNet)}${tr2('Net par mois',O.salm)}${[['syn','Syndicat'],['pen','Fonds de pension'],['reer','REER collectif'],['ass','Assurance collective'],['aut','Autre']].filter(([k])=>num(S.ret[k])).map(([k,l])=>tr2('Retenue — '+l,$$(num(S.ret[k]))+' / paie')).join('')}</table>${has(S.cmt.sal)?`<p class="cm"><b>Commentaire :</b> ${e(S.cmt.sal)}</p>`:''}`;
  body+=tbl('Autres revenus',itemRows(S.rev,'rev.'),'rev');
  S.sec.forEach((sec,si)=>body+=tbl(sec.t,itemRows(sec.items,`sec.${si}.items.`),'sec'+si));
  const H=S.hyp;
  if(S.logType!=='loc'&&S.logType!=='autre'&&['solde','pmt','taux','valeur'].some(k=>has(H[k])))body+=`${H2('Hypothèque — résidence')}<table>${tr2('Solde restant',$$(num(H.solde)))}${tr2('Paiement',has(H.pmt)?$$(num(H.pmt))+' · '+e(flabelFR(H.f)):'—')}${tr2('Paiement par mois (utilisé)',O['hyp.used'])}${tr2('Taux annuel',has(H.taux)?e(H.taux)+' %':'—')}${tr2('Renouvellement',e(H.renouv||'—'))}${tr2('Valeur de la propriété',has(H.valeur)?$$(num(H.valeur)):'—')}${tr2('Prêt au départ / années restantes',`${e(H.pret||'?')} / ${e(H.amort||'?')} ans`)}${tr2('Terme restant',has(H.terme)?e(H.terme)+' ans':'—')}${has(H.raison)?tr2('Raison du paiement différent',e(H.raison)):''}${tr2('Paiement estimé / mois',O['hyp.estm'])}</table>${has(S.cmt.hyp)?`<p class="cm"><b>Commentaire :</b> ${e(S.cmt.hyp)}</p>`:''}`;
  if(S.immo.length)body+=`${H2('Immeubles locatifs')}<div class="sc"><table><tr><th>Immeuble</th><th class="r">Valeur</th><th class="r">Solde</th><th class="r">Taux</th><th class="r">Paiement</th><th class="r">Loyers</th><th class="r">Taxes/ass.</th><th class="r">Entretien</th><th>Prêt / reste</th><th>Renouv.</th></tr>${S.immo.map(b=>`<tr><td>${e(b.nom)}</td><td class="r">${$$(num(b.valeur))}</td><td class="r">${$$(num(b.solde))}</td><td class="r">${e(b.taux||'—')} %</td><td class="r">${$$(num(b.pmt))}</td><td class="r">${$$(num(b.loyers))}</td><td class="r">${$$(num(b.taxes))}</td><td class="r">${$$(num(b.entretien))}</td><td>${e(b.pret||'?')} / ${e(b.rest||'?')} ans</td><td>${e(b.renouv||'—')}</td></tr>`).join('')}</table></div>`;
  if(S.dettes.length)body+=`${H2('Dettes')}<table><tr><th>Dette</th><th class="r">Solde</th><th class="r">Paiement</th><th>Fréquence</th><th class="r">Taux</th><th>Commentaire</th></tr>${S.dettes.map(d=>`<tr><td>${e(d.l)}${has(d.nom)?' — '+e(d.nom):''}</td><td class="r">${$$(num(d.solde))}</td><td class="r">${$$(num(d.a))}</td><td>${e(cap(flabelFR(d.f)))}</td><td class="r">${has(d.taux)?e(d.taux)+' %':'—'}</td><td class="c">${e(d.c||'')}</td></tr>`).join('')}</table>${has(S.cmt.dettes)?`<p class="cm"><b>Commentaire :</b> ${e(S.cmt.dettes)}</p>`:''}`;
  const ag=S.assur.filter(g=>g.items.some(x=>pm(x)));
  if(ag.length)body+=`${H2('Assurances de personnes')}<table><tr><th>Contrat</th><th class="r">Prime</th><th>Fréquence</th><th class="r">Par mois</th><th class="r">Montant assuré</th></tr>${ag.map(g=>g.items.filter(x=>pm(x)).map(x=>`<tr><td>${e(cap(g.t))} — ${e(x.l||'contrat')}${x.terme?' · '+e(TERMFR[x.terme]):''}${has(x.ech)?' · échéance '+e(x.ech):''}</td><td class="r">${$$(num(x.a))}</td><td>${e(cap(flabelFR(x.f)))}</td><td class="r">${$$(pm(x))}</td><td class="r">${has(x.cov)?$$(num(x.cov)):'—'}</td></tr>`).join('')+`<tr><td><b>Coût total ${e(g.t)}</b></td><td></td><td></td><td class="r"><b>${O['aTot:'+S.assur.indexOf(g)]}</b></td><td></td></tr>`).join('')}</table>${has(S.cmt.assur)?`<p class="cm"><b>Commentaire :</b> ${e(S.cmt.assur)}</p>`:''}`;
  const U=Object.keys(S.unk).filter(k=>S.unk[k]);
  if(U.length)body+=`${H2('À voir ensemble')}<table>${U.map(p=>tr2(LBL[p]||p,'« Je ne sais pas »')).join('')}</table>`;
  const calRows=['10','11','12'].filter(k=>S.cal[k].length);
  if(calRows.length)body+=`${H2('Calendriers')}<table><tr><th>Mois</th><th class="r">Entrées</th><th class="r">Sorties</th><th class="r">Reste</th></tr>${calRows.map(k=>{const Lm=S.cal[k];const i=Lm.reduce((a,x)=>a+num(x.i),0),o=Lm.reduce((a,x)=>a+num(x.o),0);return `<tr><td>${MN[k]} 2026</td><td class="r">${$$(i)}</td><td class="r">${$$(o)}</td><td class="r">${$$(i-o)}</td></tr>`}).join('')}</table>`;
  const data=JSON.stringify(Object.assign({},S,{app:undefined})).replace(/</g,'\\u003c');
  return `\x3c!doctype html>\x3chtml lang="fr-CA">\x3chead>\x3cmeta charset="utf-8">\x3cmeta name="viewport" content="width=device-width,initial-scale=1">\x3ctitle>Budget — ${e(S.nom||'cliente')}\x3c/title>
\x3cstyle>*{box-sizing:border-box}body{font-family:"Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:#111B29;background:#F4F5F7;margin:0;font-size:15px;line-height:1.5}main{max-width:880px;margin:0 auto;padding:24px 16px 48px}
.cover{background:#0F1D30;color:#fff;border-radius:12px;padding:32px 24px;border-bottom:3px solid #C9A24A}.cover img{width:240px;max-width:70%;display:block;margin-bottom:24px}
.cover .eb{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#C9A24A;font-weight:700}.cover h1{font-size:28px;margin:6px 0 4px;letter-spacing:-.01em}.cover p{margin:0;color:#C3CBD7}
.k{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:24px 0}.k div{background:#fff;border:1px solid #E1E4E9;border-radius:12px;padding:16px}.k span{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#525E6E;font-weight:600}.k b{display:block;font-size:22px;margin-top:4px;font-variant-numeric:tabular-nums}
h2{display:flex;gap:12px;align-items:baseline;font-size:17px;margin:32px 0 8px;padding-bottom:8px;border-bottom:2px solid #C9A24A}h2 span{color:#8A6414;font-size:13px;font-weight:700}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E1E4E9;border-radius:8px;overflow:hidden;font-size:14px}td,th{padding:8px 12px;border-bottom:1px solid #E1E4E9;text-align:left}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#525E6E;background:#F7F8FA}.r{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.c{color:#525E6E}.sc{overflow-x:auto}.cm{background:#F7F0DE;border-radius:8px;padding:10px 12px;font-size:14px;margin:8px 0 0;white-space:pre-wrap}
footer{margin-top:40px;padding-top:16px;border-top:1px solid #E1E4E9;font-size:13px;color:#525E6E}\x3c/style>\x3c/head>\x3cbody><main>
<section class="cover"><img src="${LOGO}" alt="GFX — Groupe Financier Excellence"><div class="eb">Budget personnel</div><h1>${e(S.nom||'(nom)')}</h1><p>Rempli le ${e(S.date||new Date().toLocaleDateString('fr-CA'))} · Préparé avec Mickaël Léveillé, courtier et conseiller en sécurité financière</p></section>
<div class="k"><div><span>Entrées / mois</span><b>${$$(s.inTot)}</b></div><div><span>Sorties / mois</span><b>${$$(s.outTot)}</b></div><div><span>Reste</span><b style="color:${s.rest<0?'#A8261E':'#1E7040'}">${$$(s.rest)}</b></div><div><span>Total des dettes</span><b>${$$(s.dSolde)}</b></div></div>
${body}
<footer>Renseignements confidentiels, traités conformément à la Loi 25. Pour la version interactive, ouvre la page du budget, active le mode conseiller et choisis « Ouvrir un budget reçu ».<br>Mickaël Léveillé · ${MAIL}</footer></main>
\x3cscript type="application/json" id="budget-data">${data}\x3c/script>\x3c/body>\x3c/html>`;
}
$('#importFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const msg=$('#importMsg');
  try{const txt=await f.text();const m=txt.match(/\x3cscript type="application\/json" id="budget-data">([\s\S]*?)\x3c\/script>/);if(!m)throw 0;
    const d=JSON.parse(m[1]);if(!d||!d.sec)throw 0;S=d;migrate();save();msg.className='status ok';msg.textContent='Budget de '+(S.nom||'la cliente')+' ouvert.';
    boot();window.scrollTo({top:0,behavior:reduce?'auto':'smooth'})}
  catch(err){msg.className='status ko';msg.textContent="Ce fichier n'est pas un budget exporté depuis cette page."}
  e.target.value=''});

/* ================= traduction anglaise ================= */
const DICT=%%DICT%%;
const RX=[[/^ex\. :? ?(.+)$/,(m,a)=>'e.g. '+a],[/^\+ (.+)$/,(m,a)=>'+ '+(DICT[a]||a)],[/^Immeuble (\d+)$/,(m,a)=>'Property '+a]];
function trText(s){const k=s.trim();if(!k)return null;if(DICT[k])return s.replace(k,DICT[k]);for(const [re,fn] of RX)if(re.test(k))return s.replace(k,k.replace(re,fn));return null}
function trNode(n){if(n.nodeType===3){const t=trText(n.nodeValue);if(t!=null&&t!==n.nodeValue)n.nodeValue=t;return}
  if(n.nodeType!==1||n.tagName==='SCRIPT'||n.tagName==='STYLE'||n.tagName==='TEXTAREA')return;
  for(const a of ['placeholder','aria-label','title']){const v=n.getAttribute(a);if(v){const t=trText(v);if(t!=null&&t!==v)n.setAttribute(a,t)}}
  n.childNodes.forEach(trNode)}
function startTr(){document.body.classList.add('en');trNode(document.body);
  new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trNode(m.target);else if(m.type==='attributes')trNode(m.target);else m.addedNodes.forEach(trNode)}})
    .observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']})}

/* ================= Mon suivi au quotidien ================= */
const APPK=KEY+'-app',AVK=KEY+'-av';let APPON=false,AV='today',calSel=null,calMonth=null,expCat='',expMonth=null,editId=null,undoExp=null,undoT=null,envEdit=null,calMode='mois',flashKey=null,resetAsk=false;
const appS=()=>{if(!S.app||typeof S.app!=='object')S.app={};const a=S.app;a.dates=a.dates||{};a.paid=a.paid||{};a.exp=a.exp||[];return a};
const isoD=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const day0=d=>{const x=new Date(d);x.setHours(12,0,0,0);return x};
const today0=()=>day0(new Date());
const parseD=s=>s?day0(new Date(s+'T12:00')):null;
const fmtD=(d,o)=>d.toLocaleDateString(L('fr-CA','en-CA'),o||{weekday:'short',day:'numeric',month:'short'});
const sameD=(a,b)=>isoD(a)===isoD(b);
const FIXED_IN_VAR=new Set(['Garderie / frais de garde','Activités des enfants','Frais bancaires','Frais de scolarité et livres','Impôts à payer / acomptes provisionnels','Cotisations professionnelles / permis']);
const VAR_TRA=new Set(['Stationnement / péage','Transport en commun / taxi']);
const isVar=(sec,x)=>(['quo','loi','occ'].includes(sec.k)&&!FIXED_IN_VAR.has(x.l))||(sec.k==='tra'&&VAR_TRA.has(x.l));
function recurring(){compute();const R=[],s=S.sal,nb=NB[s.f]||0;
  const per=has(s.vrai)?num(s.vrai):(s.type==='Net'?num(s.amt):(calc.pay&&nb?calc.pay.netUsed/nb:0));
  if(per&&nb&&!S.unk['sal.amt'])R.push({key:'sal',l:L('Paie','Payday'),a:per,f:s.f,inc:1});
  S.rev.forEach((x,i)=>{if(val(x,'rev.'+i))R.push({key:'rev.'+i,l:x.l||L('Revenu','Income'),a:num(x.a),f:x.f,inc:1})});
  if(calc.used)R.push({key:'hyp',l:L('Hypothèque','Mortgage'),a:has(S.hyp.pmt)?num(S.hyp.pmt):calc.used,f:has(S.hyp.pmt)?(S.hyp.f||'mois'):'mois'});
  S.sec.forEach((sec,si)=>sec.items.forEach((x,i)=>{const p=`sec.${si}.items.${i}`;if(!val(x,p)||isVar(sec,x)||(x.k==='loyer'&&S.logType==='prop'))return;R.push({key:p,l:tr(x.l)||'—',a:num(x.a),f:x.f})}));
  S.dettes.forEach((d,i)=>{if(pm(d)&&!S.unk['dettes.'+i+'.a'])R.push({key:'dettes.'+i,l:tr(d.l)+(has(d.nom)?' — '+d.nom:''),a:num(d.a),f:d.f})});
  S.assur.forEach((g,gi)=>g.items.forEach((x,i)=>{const p=`assur.${gi}.items.${i}`;if(val(x,p))R.push({key:p,l:tr(cap(g.t))+(x.l?' — '+x.l:''),a:num(x.a),f:x.f})}));
  return R}
function envelopes(){const E=[];S.sec.forEach((sec,si)=>sec.items.forEach((x,i)=>{const p=`sec.${si}.items.${i}`;if(isVar(sec,x)&&(val(x,p)||x.u))E.push({key:p,l:tr(x.l)||L('Autre','Other'),b:val(x,p)})}));return E}
function occ(d0s,f,from,to){const d0=parseD(d0s);if(!d0||!F[f])return[];const out=[];
  if(f==='sem'||f==='2sem'){const st=f==='sem'?7:14;const d=new Date(d0);const diff=Math.floor((from-d)/864e5/st);d.setDate(d.getDate()+diff*st);while(d<from)d.setDate(d.getDate()+st);while(d<=to){out.push(new Date(d));d.setDate(d.getDate()+st)}return out}
  const days=f==='2fm'?[d0.getDate(),d0.getDate()<=15?d0.getDate()+15:d0.getDate()-15]:[d0.getDate()];const step=f==='2fm'?1:{mois:1,'2mois':2,'3mois':3,an:12}[f];
  const y=d0.getFullYear(),m=d0.getMonth();let k=Math.floor(((from.getFullYear()-y)*12+(from.getMonth()-m))/step)-1;
  for(let guard=0;guard<60;guard++,k++){const mm=m+k*step;const last=new Date(y,mm+1,0).getDate();let stop=false;
    days.forEach(dd=>{const d=new Date(y,mm,Math.min(dd,last),12);if(d>to)stop=true;else if(d>=from)out.push(d)});
    if(stop&&new Date(y,mm,1,12)>to)break}
  return out.sort((a,b)=>a-b)}
function eventsBetween(from,to){const A=appS(),ev=[];recurring().forEach(r=>{occ(A.dates[r.key],r.f,from,to).forEach(d=>{const id=r.key+'|'+isoD(d);ev.push(Object.assign({},r,{d,id,paid:!!A.paid[id]}))})});return ev.sort((a,b)=>a.d-b.d||(b.inc||0)-(a.inc||0))}
function monthSpent(y,m){const pre=`${y}-${String(m+1).padStart(2,'0')}`,by={};let tot=0;appS().exp.forEach(e=>{if(e.d&&e.d.startsWith(pre)){by[e.cat]=(by[e.cat]||0)+num(e.a);tot+=num(e.a)}});return{by,tot}}
const amtTxt=(a,inc)=>(inc?'+ ':'')+$$(a);
const dChip=d=>`<span class="dchip${sameD(d,today0())?' today':''}"><small>${esc(fmtD(d,{weekday:'short'}).replace('.',''))}</small><b>${d.getDate()}</b></span>`;
const evRow=(e,noChip)=>`<div class="aitem${e.paid?' paid':''}${noChip===true?' nochip':''}">${noChip===true?'':dChip(e.d)}<div class="lb"><b>${esc(e.l)}</b><span>${esc(flab(e.f))}${e.inc?' · '+L('entrée','income'):''}</span></div><div style="display:flex;gap:var(--s2);align-items:center"><span class="am${e.inc?' in':''}">${amtTxt(e.a,e.inc)}</span><button type="button" class="chkbtn" data-paid="${esc(e.id)}" aria-pressed="${e.paid}" aria-label="${e.inc?L('Reçu','Received'):L('Payé','Paid')}">${ic('i-check')}</button></div></div>`;
function catLabel(key){if(key==='autre')return L('Autre dépense','Other spending');const x=getP(key);return x?tr(x.l)||L('Autre','Other'):L('Autre dépense','Other spending')}

const greet=()=>{const h=new Date().getHours();return h<12?L('Bonjour','Good morning'):h<18?L('Bon après-midi','Good afternoon'):L('Bonsoir','Good evening')};
const round2=v=>Math.round(v*100)/100;
const byNewest=(a,b)=>(b.d+b.id).localeCompare(a.d+a.id);
const spentOn=iso=>appS().exp.filter(e=>e.d===iso).reduce((a,e)=>a+num(e.a),0);
function sortedCats(){const E=envelopes(),u={},lim=isoD(new Date(Date.now()-60*864e5));appS().exp.forEach(e=>{if(e.d>=lim)u[e.cat]=(u[e.cat]||0)+1});return E.map((e,i)=>Object.assign({},e,{i})).sort((a,b)=>(u[b.key]||0)-(u[a.key]||0)||a.i-b.i)}
function projection(){const A=appS();if(!has(A.bal))return null;const t=today0(),y=t.getFullYear(),m=t.getMonth(),last=new Date(y,m+1,0,12);
  const bud=envelopes().reduce((a,e)=>a+e.b,0),{tot}=monthSpent(y,m),days=last.getDate()-t.getDate()+1,perDay=Math.max(0,bud-tot)/days;
  const byDay={};eventsBetween(t,new Date(y,m,last.getDate(),23)).filter(e=>!e.paid).forEach(e=>{const k=isoD(e.d);byDay[k]=(byDay[k]||0)+(e.inc?e.a:-e.a)});
  let bal=num(A.bal),min=Infinity,minD=t;for(let d=new Date(t);d<=last;d.setDate(d.getDate()+1)){bal+=(byDay[isoD(d)]||0)-perDay;if(bal<min){min=bal;minD=new Date(d)}}
  return {end:bal,min,minD}}
const obStep=(done,txt,attr)=>`<button type="button" class="obs${done?' done':''}" ${attr}><span class="ck">${ic('i-check')}</span><span class="tx">${txt}</span>${done?'':`<svg class="i ob-chev" aria-hidden="true"><use href="#i-chev"/></svg>`}</button>`;
function viewToday(){const A=appS(),t=today0(),y=t.getFullYear(),m=t.getMonth(),E=envelopes(),bud=E.reduce((a,e)=>a+e.b,0),{tot}=monthSpent(y,m),left=bud-tot,last=lastD(y,m),dl=last-t.getDate()+1;
  const tIso=isoD(t),spentT=spentOn(tIso),allow=Math.max(0,bud-(tot-spentT))/dl,remT=allow-spentT,monthPct=t.getDate()/last,spentPct=bud?tot/bud:0;
  const fast=spentPct>monthPct+0.1,pace=spentPct>monthPct+0.1?L('Tu dépenses un peu plus vite que prévu ce mois-ci.','You’re spending a bit faster than planned this month.'):spentPct<monthPct-0.1?L('Tu es en avance sur ton budget. Bravo !','You’re ahead of your budget. Well done!'):L('Tu suis bien le rythme de ton budget.','You’re right on pace with your budget.');
  const ws=new Date(t);ws.setDate(t.getDate()-((t.getDay()+6)%7));const wsIso=isoD(ws),wkBud=bud*7/last;let wk=0;A.exp.forEach(e=>{if(e.d>=wsIso&&e.d<=tIso)wk+=num(e.a)});
  const R=recurring(),undated=R.filter(r=>!A.dates[r.key]);
  const up=eventsBetween(t,new Date(y,m,t.getDate()+7,23)),past=eventsBetween(new Date(y,m,t.getDate()-10,12),new Date(y,m,t.getDate()-1,23)).filter(e=>!e.paid);
  const pays=eventsBetween(t,new Date(y,m,t.getDate()+45,23)).filter(e=>e.key==='sal'),recent=[...A.exp].sort(byNewest).slice(0,4),top=sortedCats().slice(0,3);
  const obD=R.length>0&&!undated.length,obE=A.exp.length>0,obH=!!A.a2hs;
  let recap='';if(t.getDate()<=7){const pm=new Date(y,m-1,1,12),ps=monthSpent(pm.getFullYear(),pm.getMonth());if(ps.tot){const d=bud-ps.tot;
    recap=`<section class="acard"><h2>${L('Bilan de','Recap for')} ${esc(pm.toLocaleDateString(L('fr-CA','en-CA'),{month:'long'}))}</h2><p>${L(`Tu as dépensé ${$$(ps.tot)} sur ${$$(bud)} prévus.`,`You spent ${$$(ps.tot)} of ${$$(bud)} planned.`)} <b class="${d>=0?'okc':'koc'}">${d>=0?L(`${$$(d)} de moins que prévu. Bravo !`,`${$$(d)} less than planned. Well done!`):L(`${$$(-d)} de plus que prévu.`,`${$$(-d)} more than planned.`)}</b></p></section>`}}
  const pr=projection(),dueW=up.filter(e=>!e.inc&&!e.paid).reduce((a,e)=>a+e.a,0);
  return `<div class="ahello"><b>${greet()}${S.nom?' '+esc(S.nom.split(' ')[0]):''}</b><span>${esc(cap(fmtD(t,{weekday:'long',day:'numeric',month:'long'})))}</span></div>
  ${obD&&obE&&obH?'':`<section class="acard ob"><h2>${L('Pour bien commencer','Getting started')}</h2><div class="obl">${obStep(obD,L('Dater mes paiements','Set my payment dates'),'data-av="cal" data-setup="1"')}${obStep(obE,L('Inscrire ma première dépense','Enter my first expense'),'data-av="exp" data-focus="1"')}${obStep(obH,L("Ajouter l'app à mon écran d'accueil",'Add the app to my home screen'),'data-av="bud" data-goa2hs="1"')}</div></section>`}
  <section class="acard bigleft"><span class="small muted">${L('Aujourd’hui, tu peux encore dépenser','Today you can still spend')}</span>
    <span class="v${bud&&remT<0?' ko':''}">${bud?$$(Math.max(remT,0)):'—'}</span>
    ${bud&&remT<0?`<span class="small koc">${L(`Tu as dépassé ton montant du jour de ${$$(-remT)}. Pas grave : les prochains jours s’ajustent tout seuls.`,`You went ${$$(-remT)} over today’s amount. No worries: the next days adjust on their own.`)}</span>`:''}
    ${bud?`<div class="stat2"><div><span>${L('Reste ce mois-ci','Left this month')}</span><b class="${left<0?'koc':''}">${$$(left)}</b></div><div><span>${L('Cette semaine','This week')}</span><b class="${wk>wkBud?'koc':''}">${$$(wk)} <small>${L('sur','of')} ${$$(Math.round(wkBud))}</small></b></div></div>
    <div class="pace"><div class="track"><div class="fill${fast?' warn':''}" style="width:${Math.min(100,spentPct*100)}%"></div><i style="left:calc(${Math.min(100,monthPct*100)}% - 1px)"></i></div><span class="small ${fast?'warnc':'muted'}">${pace}</span></div>`
      :`<p class="small muted">${L('Ajoute tes dépenses variables (épicerie, restos, essence…) dans ton budget pour voir ce qu’il te reste.','Add your variable spending (groceries, restaurants, gas…) to your budget to see what’s left.')}</p>`}
    <div class="qadd2">${top.map(c=>`<button type="button" class="chip" data-quickcat="${esc(c.key)}">+ ${esc(c.l)}</button>`).join('')}<button type="button" class="btn primary" data-av="exp" data-focus="1">+ ${L('Ajouter une dépense','Add an expense')}</button></div></section>
  ${past.length?`<section class="acard"><h2>${L('As-tu payé ?','Did you pay?')}</h2><p class="small muted">${L('Ces paiements sont passés : coche-les une fois réglés.','These payments are past: tick them once paid.')}</p><div class="alist">${past.map(evRow).join('')}</div></section>`:''}
  <section class="acard"><div class="mhead"><h2>${L('À payer cette semaine','Due this week')}</h2>${dueW?`<b class="small">${$$(dueW)}</b>`:''}</div>
    ${up.length?`<div class="alist">${up.map(evRow).join('')}</div>`:`<p class="empty-a">${undated.length?L('Ajoute la date de tes paiements pour les voir ici.','Add your payment dates to see them here.'):L('Rien à payer d’ici 7 jours.','Nothing due in the next 7 days.')}</p>`}
    ${pays[0]?`<p class="small muted">${L('Prochaine paie','Next payday')} : <b>${esc(fmtD(pays[0].d,{weekday:'long',day:'numeric',month:'long'}))}</b> · ${$$(pays[0].a)}</p>`:''}</section>
  <section class="acard"><h2>${L('Mon solde prévu','My expected balance')}</h2>
    <label for="balIn" class="small"><b>${L('Solde actuel de ton compte','Current account balance')}</b></label><div class="qrow"><span class="unit" data-u="$" style="flex:1"><input class="fld num" id="balIn" inputmode="decimal" placeholder="${L('ex. 1 250','e.g. 1,250')}" value="${esc(A.bal||'')}" aria-label="${L('Solde actuel de ton compte','Current account balance')}" autocomplete="off"></span><button class="btn" type="button" id="balSave">${L('Calculer','Calculate')}</button></div>
    ${pr?`<p class="small">${L('Fin du mois prévue','Expected at month end')} : <b class="${pr.end<0?'koc':'okc'}">${$$(pr.end)}</b><br>${pr.min<0?`<b class="koc">${L(`Attention : ton compte pourrait passer sous zéro vers le ${fmtD(pr.minD,{day:'numeric',month:'long'})}.`,`Careful: your account could go below zero around ${fmtD(pr.minD,{month:'long',day:'numeric'})}.`)}</b>`:L(`Point le plus bas : ${$$(pr.min)} vers le ${fmtD(pr.minD,{day:'numeric',month:'long'})}.`,`Lowest point: ${$$(pr.min)} around ${fmtD(pr.minD,{month:'long',day:'numeric'})}.`)}</p>
      <p class="small muted">${L(`Calcul à partir de ton solde du ${fmtD(parseD(A.balD)||t,{day:'numeric',month:'long'})}, de tes paies et paiements prévus et de ton budget de dépenses. Mets-le à jour de temps en temps.`,`Based on your balance on ${fmtD(parseD(A.balD)||t,{month:'long',day:'numeric'})}, your expected pay and payments and your spending budget. Update it now and then.`)}</p>`
      :`<p class="small muted">${L('Facultatif : inscris le solde de ton compte pour savoir s’il restera assez d’argent jusqu’à la fin du mois.','Optional: enter your account balance to see if there will be enough money until month end.')}</p>`}</section>
  ${recap}
  ${recent.length?`<section class="acard"><div class="mhead"><h2>${L('Dernières dépenses','Latest spending')}</h2><button type="button" class="linkbtn" data-av="exp">${L('Tout voir','See all')}</button></div><div class="alist">${recent.map(e=>expRow(e)).join('')}</div></section>`:''}`}
const expRow=(e,noChip)=>`<div class="aitem exprow${noChip?' nochip':''}" data-expedit="${e.id}" role="button" tabindex="0" aria-label="${L('Modifier','Edit')} : ${esc(catLabel(e.cat))} ${$$(num(e.a))}">${noChip?'':dChip(parseD(e.d))}<div class="lb"><b>${esc(catLabel(e.cat))}</b><span>${esc(e.n||'')}</span></div><div style="display:flex;gap:var(--s1);align-items:center"><span class="am">${$$(num(e.a))}</span><button type="button" class="delbtn" data-expdel="${e.id}" aria-label="${L('Supprimer','Delete')}">${ic('i-x')}</button></div></div>`;
function viewCal(){const t=today0();if(!calMonth)calMonth=new Date(t.getFullYear(),t.getMonth(),1,12);const y=calMonth.getFullYear(),m=calMonth.getMonth();
  const first=new Date(y,m,1,12),start=new Date(first);start.setDate(1-((first.getDay()+6)%7));const last=new Date(y,m+1,0,12),end=new Date(last);end.setDate(last.getDate()+(7-((last.getDay()+6)%7)-1));
  const ev=eventsBetween(start,new Date(end.getFullYear(),end.getMonth(),end.getDate(),23)),by={};ev.forEach(e=>{(by[isoD(e.d)]=by[isoD(e.d)]||[]).push(e)});
  if(!calSel||calSel.getMonth()!==m)calSel=(t.getMonth()===m&&t.getFullYear()===y)?t:first;
  const DH=LANG==='en'?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  let g=DH.map(d=>`<span class="dh">${d}</span>`).join('');for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const k=isoD(d),es=by[k]||[];
    g+=`<button type="button" data-calday="${k}" class="${d.getMonth()!==m?'out':''}${sameD(d,t)?' today':''}" aria-pressed="${sameD(d,calSel)}" aria-label="${esc(fmtD(d,{day:'numeric',month:'long'}))}${es.length?', '+es.length+' '+L('paiement(s)','payment(s)'):''}">${d.getDate()}<span class="dots">${es.slice(0,3).map(e=>`<i class="${e.paid?'pd':e.inc?'in':''}"></i>`).join('')}</span></button>`}
  const sel=by[isoD(calSel)]||[],R=recurring(),A=appS();const ordered=[...R.filter(r=>!A.dates[r.key]),...R.filter(r=>A.dates[r.key])];
  const mt=cap(new Date(y,m,1).toLocaleDateString(L('fr-CA','en-CA'),{month:'long',year:'numeric'}));
  const monthOut=ev.filter(e=>!e.inc&&e.d.getMonth()===m).reduce((a,e)=>a+e.a,0),monthIn=ev.filter(e=>e.inc&&e.d.getMonth()===m).reduce((a,e)=>a+e.a,0);
  const seg=`<div class="seg calseg" role="group" aria-label="${L('Affichage','View')}"><button type="button" data-calmode="mois" aria-pressed="${calMode==='mois'}">${L('Mois','Month')}</button><button type="button" data-calmode="liste" aria-pressed="${calMode==='liste'}">${L('Liste','List')}</button></div>`;
  const inM=ev.filter(e=>e.d.getMonth()===m),lg={};inM.forEach(e=>{(lg[isoD(e.d)]=lg[isoD(e.d)]||[]).push(e)});
  const listHtml=`<section class="acard"><div class="mhead"><button type="button" class="mnav prev" data-calnav="-1" aria-label="${L('Mois précédent','Previous month')}">${ic('i-chev','')}</button><h2>${esc(mt)}</h2><button type="button" class="mnav" data-calnav="1" aria-label="${L('Mois suivant','Next month')}">${ic('i-chev','')}</button></div>${seg}
    ${inM.length?Object.keys(lg).sort().map(k=>`<div class="dayg${k<isoD(t)?' past':''}"><div class="dayh"><span>${esc(cap(fmtD(parseD(k),{weekday:'long',day:'numeric',month:'long'})))}</span></div><div class="alist">${lg[k].map(e=>evRow(e,true)).join('')}</div></div>`).join('')+`<p class="small muted">${L(`Ce mois-ci : ${$$(monthIn)} d'entrées prévues, ${$$(monthOut)} de paiements.`,`This month: ${$$(monthIn)} income expected, ${$$(monthOut)} in payments.`)}</p>`:`<p class="empty-a">${L('Aucun paiement daté ce mois-ci.','No dated payment this month.')}</p>`}</section>`;
  const icsHtml=!window.claude&&R.some(r=>A.dates[r.key])?`<section class="acard"><h2>${L('Dans le calendrier de mon téléphone','In my phone’s calendar')}</h2><p class="small muted">${L('Ajoute tous tes paiements datés à ton calendrier (iPhone, Google, Outlook), avec un rappel la veille.','Add all your dated payments to your calendar (iPhone, Google, Outlook), with a reminder the day before.')}</p><button class="btn" type="button" id="icsBtn">${ic('i-cal')}${L('Ajouter à mon calendrier','Add to my calendar')}</button><p class="status" id="icsMsg" aria-live="polite"></p></section>`:'';
  const calHtml=calMode==='liste'?listHtml:`<section class="acard"><div class="mhead"><button type="button" class="mnav prev" data-calnav="-1" aria-label="${L('Mois précédent','Previous month')}">${ic('i-chev','')}</button><h2>${esc(mt)}</h2><button type="button" class="mnav" data-calnav="1" aria-label="${L('Mois suivant','Next month')}">${ic('i-chev','')}</button></div>${seg}
    <div class="mcal">${g}</div><div class="calleg"><span><i class="in"></i>${L('Paie et entrées','Pay and income')}</span><span><i></i>${L('Paiements','Payments')}</span></div>
    ${ev.length?`<p class="small muted">${L(`Ce mois-ci : ${$$(monthIn)} d'entrées prévues, ${$$(monthOut)} de paiements.`,`This month: ${$$(monthIn)} income expected, ${$$(monthOut)} in payments.`)}</p>`:''}</section>
  <section class="acard" id="calDay"><h2>${esc(cap(fmtD(calSel,{weekday:'long',day:'numeric',month:'long'})))}</h2>${sel.length?`<div class="alist">${sel.map(evRow).join('')}</div>`:`<p class="empty-a">${L('Aucun paiement prévu cette journée-là.','No payment planned that day.')}</p>`}</section>
`;
  return R.some(r=>!A.dates[r.key])?dateSetup()+calHtml+icsHtml:calHtml+icsHtml+dateSetup()}
const ordN=n=>LANG==='en'?n+(n%10===1&&n!==11?'st':n%10===2&&n!==12?'nd':n%10===3&&n!==13?'rd':'th'):(n===1?'1er':String(n));
const lastD=(y,m)=>new Date(y,m+1,0).getDate();
function nextDay(day){const t=today0();let d=new Date(t.getFullYear(),t.getMonth(),Math.min(day,lastD(t.getFullYear(),t.getMonth())),12);if(d<t)d=new Date(t.getFullYear(),t.getMonth()+1,Math.min(day,lastD(t.getFullYear(),t.getMonth()+1)),12);return isoD(d)}
function whenTxt(r,ds){const d=parseD(ds);if(!d)return '';const wd=fmtD(d,{weekday:'long'});
  if(r.f==='sem')return L(`Chaque ${wd}`,`Every ${wd}`);if(r.f==='2sem')return L(`Un ${wd} sur deux · prochain le ${fmtD(d,{day:'numeric',month:'long'})}`,`Every other ${wd} · next ${fmtD(d,{month:'long',day:'numeric'})}`);
  if(r.f==='2fm'){const a=d.getDate(),b=a<=15?a+15:a-15;return L(`Le ${ordN(Math.min(a,b))} et le ${ordN(Math.max(a,b))} du mois`,`On the ${ordN(Math.min(a,b))} and ${ordN(Math.max(a,b))}`)}
  if(r.f==='an')return L(`Chaque année le ${fmtD(d,{day:'numeric',month:'long'})}`,`Every year on ${fmtD(d,{month:'long',day:'numeric'})}`);
  const base=L(`Le ${ordN(d.getDate())} du mois`,`On the ${ordN(d.getDate())} of the month`);return r.f==='mois'?base:base+' · '+flab(r.f)}
function picker(r,ds){const k=esc(r.key),d=parseD(ds),t=today0();
  if(r.f==='sem'||r.f==='2sem'){const n=r.f==='sem'?7:14;let h=`<span class="plabel">${L('Quand est le prochain ?','When is the next one?')}</span><div class="daychips">`;
    for(let i=0;i<n;i++){const x=new Date(t);x.setDate(t.getDate()+i);const on=d&&sameD(d,x);h+=`<button type="button" data-appset="${k}" data-d="${isoD(x)}" aria-pressed="${on}"><small>${esc(i===0?L('auj.','today'):fmtD(x,{weekday:'short'}).replace('.',''))}</small><b>${x.getDate()}</b></button>`}
    return h+`</div>`}
  if(r.f==='an')return `<label class="plabel" for="ad_${k}">${L('Prochaine date','Next date')}</label><input type="date" class="fld" id="ad_${k}" data-appdate="${k}" value="${esc(ds||'')}">`;
  const cur=d?d.getDate():'';let o=`<option value="">${L('Choisir le jour…','Pick the day…')}</option>`;for(let i=1;i<=31;i++)o+=`<option value="${i}"${i===cur?' selected':''}>${L('Le '+ordN(i),'The '+ordN(i))}</option>`;
  return `<label class="plabel" for="ad_${k}">${r.f==='2fm'?L('Premier paiement du mois (le 2e suit 15 jours plus tard)','First payment of the month (the 2nd follows 15 days later)'):L('Quel jour du mois ?','Which day of the month?')}</label><select class="fld" id="ad_${k}" data-appday="${k}">${o}</select>`}
function dateSetup(){const R=recurring(),A=appS(),done=R.filter(r=>A.dates[r.key]).length;
  if(!R.length)return `<section class="acard" id="dateSetup"><h2>${L('Dates de mes paiements','My payment dates')}</h2><p class="empty-a">${L('Remplis ton budget pour voir tes paiements ici.','Fill in your budget to see your payments here.')}</p></section>`;
  const ord=[...R.filter(r=>!A.dates[r.key]),...R.filter(r=>A.dates[r.key])];
  return `<section class="acard" id="dateSetup"><div class="mhead"><h2>${L('Dates de mes paiements','My payment dates')}</h2><b class="small">${done} / ${R.length}</b></div>
    <div class="track thin"><div class="fill" style="width:${done/R.length*100}%"></div></div>
    <p class="small muted">${done===R.length?L('Tout est daté. Ton calendrier se remplit tout seul chaque mois.','All set. Your calendar fills itself every month.'):L('Choisis une seule fois quand chaque paiement passe : le calendrier calcule tous les suivants.','Pick once when each payment happens: the calendar works out all the next ones.')}</p>
    <div class="paysets">${ord.map(r=>{const ds=A.dates[r.key];return `<div class="payset${ds?' ok':''}"><div class="ph"><span class="pic">${ic(ds?'i-check':r.inc?'i-cash':'i-cal')}</span><div class="lb"><b>${esc(r.l)}</b><span>${amtTxt(r.a,r.inc)} · ${esc(flab(r.f))}</span></div></div>
      ${ds?`<p class="when">${esc(whenTxt(r,ds))}</p><details class="chg"><summary>${L('Modifier','Change')}</summary>${picker(r,ds)}</details>`:picker(r,ds)}</div>`}).join('')}</div></section>`}
function viewExp(){const A=appS(),t=today0();if(!expMonth)expMonth=new Date(t.getFullYear(),t.getMonth(),1,12);const y=expMonth.getFullYear(),m=expMonth.getMonth(),cur=y===t.getFullYear()&&m===t.getMonth();
  const E=sortedCats(),{by,tot}=monthSpent(y,m);if(!expCat||(expCat!=='autre'&&!E.some(e=>e.key===expCat)))expCat=A.lastCat&&E.some(e=>e.key===A.lastCat)?A.lastCat:(E[0]?E[0].key:'autre');
  const ed=editId?A.exp.find(e=>e.id===editId):null,notes=[...new Set([...A.exp].sort(byNewest).map(e=>e.n).filter(Boolean))].slice(0,20);
  const mt=cap(expMonth.toLocaleDateString(L('fr-CA','en-CA'),{month:'long',year:'numeric'})),pre=isoD(expMonth).slice(0,7);
  const list=A.exp.filter(e=>e.d&&e.d.startsWith(pre)).sort(byNewest),groups={};list.forEach(e=>{(groups[e.d]=groups[e.d]||[]).push(e)});
  const bud=E.reduce((a,e)=>a+e.b,0),yest=new Date(t);yest.setDate(t.getDate()-1);const dv=ed?ed.d:isoD(t);
  const env=E.map(e=>{const s=by[e.key]||0,r=e.b?s/e.b:0,cls=(e.b&&s>e.b?' over':e.b&&r>=.8?' near':'')+(flashKey===e.key?' flash':'');
    return `<div class="env${cls}"><button type="button" class="envtop" data-envedit="${esc(e.key)}" aria-expanded="${envEdit===e.key}"><span>${esc(e.l)}</span><span>${$$(s)} <small>/ ${$$(e.b)}</small></span></button><div class="track"><div class="fill" style="width:${e.b?Math.min(100,r*100):(s?100:0)}%"></div></div><span class="sub">${!e.b?L('Pas de budget prévu : touche pour en mettre un.','No budget planned: tap to set one.'):s>e.b?L(`Dépassé de ${$$(s-e.b)}`,`Over by ${$$(s-e.b)}`):r>=.8?L(`Attention : il reste ${$$(e.b-s)}`,`Careful: ${$$(e.b-s)} left`):L(`Il reste ${$$(e.b-s)}`,`${$$(e.b-s)} left`)}</span>
    ${envEdit===e.key?`<div class="envedit"><label for="envAmt">${L('Budget par mois','Monthly budget')}</label><div class="qrow"><span class="unit" data-u="$" style="flex:1"><input class="fld num" id="envAmt" inputmode="decimal" value="${e.b?Math.round(e.b):''}" autocomplete="off"></span><button class="btn primary" type="button" data-envsave="${esc(e.key)}">${L('Enregistrer','Save')}</button></div><span class="small muted">${L('Ce montant est aussi mis à jour dans ton budget.','This amount is also updated in your budget.')}</span></div>`:''}</div>`}).join('');
  const oth=by.autre?`<div class="env"><div class="envtop static"><span>${L('Autre dépense','Other spending')}</span><span>${$$(by.autre)}</span></div></div>`:'';
  return `<section class="acard${ed?' editing':''}" id="expForm"><div class="mhead"><h2>${ed?L('Modifier la dépense','Edit expense'):L('Nouvelle dépense','New expense')}</h2>${ed?`<button class="btn quiet" type="button" id="expCancel">${L('Annuler','Cancel')}</button>`:''}</div>
    <input class="fld amtin" id="expAmt" inputmode="decimal" placeholder="${LANG==='en'?'$0.00':'0,00 $'}" value="${ed?esc(String(ed.a).replace('.',LANG==='en'?'.':',')):''}" aria-label="${L('Montant','Amount')}" autocomplete="off">
    <div class="amtq">${[5,10,20,50].map(v=>`<button type="button" data-amtadd="${v}">+ ${LANG==='en'?'$'+v:v+' $'}</button>`).join('')}</div>
    <div class="catchips" role="group" aria-label="${L('Catégorie','Category')}">${E.map(e=>`<button type="button" data-cat="${esc(e.key)}" aria-pressed="${expCat===e.key}">${esc(e.l)}</button>`).join('')}<button type="button" data-cat="autre" aria-pressed="${expCat==='autre'}">${L('Autre','Other')}</button></div>
    <div class="datechips" role="group" aria-label="${L('Date','Date')}"><button type="button" data-expday="${isoD(t)}" aria-pressed="${dv===isoD(t)}">${L("Aujourd'hui",'Today')}</button><button type="button" data-expday="${isoD(yest)}" aria-pressed="${dv===isoD(yest)}">${L('Hier','Yesterday')}</button><input class="fld" type="date" id="expDate" value="${dv}" max="${isoD(t)}" aria-label="${L('Autre date','Other date')}"></div>
    <input class="fld" id="expNote" placeholder="${L('Note (facultatif) : ex. IGA','Note (optional): e.g. IGA')}" list="noteList" autocomplete="off" value="${ed?esc(ed.n||''):''}" aria-label="${L('Note','Note')}"><datalist id="noteList">${notes.map(n=>`<option value="${esc(n)}">`).join('')}</datalist>
    <button class="btn primary big" type="button" id="expAdd">${ed?L('Enregistrer les changements','Save changes'):L('Ajouter la dépense','Add the expense')}</button>
    <p class="status" id="expMsg" aria-live="polite"></p></section>
  ${undoExp?`<div class="undo" id="undoBar"><span>${L('Dépense supprimée.','Expense deleted.')}</span><button type="button" class="linkbtn" id="expUndo">${L('Annuler','Undo')}</button></div>`:''}
  <section class="acard"><div class="mhead"><button type="button" class="mnav prev" data-expnav="-1" aria-label="${L('Mois précédent','Previous month')}">${ic('i-chev','')}</button><h2>${esc(mt)}</h2><button type="button" class="mnav" data-expnav="1" aria-label="${L('Mois suivant','Next month')}"${cur?' disabled':''}>${ic('i-chev','')}</button></div>
    <div class="stat2"><div><span>${L('Dépensé','Spent')}</span><b class="${bud&&tot>bud?'koc':''}">${$$(tot)}</b></div><div><span>${L('Prévu','Planned')}</span><b>${$$(bud)}</b></div></div>
    ${env||`<p class="empty-a">${L('Ajoute tes dépenses variables dans ton budget pour avoir des enveloppes.','Add variable spending to your budget to get envelopes.')}</p>`}${oth}
    ${env?`<p class="small muted">${L('Touche une enveloppe pour changer son budget.','Tap an envelope to change its budget.')}</p>`:''}</section>
  <section class="acard"><div class="mhead"><h2>${L('Dépenses du mois','Spending this month')}</h2>${list.length?`<button type="button" class="linkbtn" id="expCsv">${L('Exporter','Export')}</button>`:''}</div>
    ${list.length?Object.keys(groups).sort().reverse().map(d=>`<div class="dayg"><div class="dayh"><span>${esc(cap(fmtD(parseD(d),{weekday:'long',day:'numeric'})))}</span><b>${$$(groups[d].reduce((a,e)=>a+num(e.a),0))}</b></div><div class="alist">${groups[d].map(e=>expRow(e,true)).join('')}</div></div>`).join('')+`<p class="small muted">${L('Touche une dépense pour la modifier.','Tap an expense to edit it.')}</p>`
      :`<p class="empty-a">${L('Aucune dépense inscrite ce mois-là.','No spending entered that month.')}</p>`}</section>`}
function viewBud(){compute();const ua=navigator.userAgent||'',ios=/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),and=/Android/.test(ua);
  return `<section class="acard"><h2>${L('Mon budget','My budget')}</h2><div class="akpis"><div><span>${L('Entrées','Income')}</span><b>${$$(calc.inTot)}</b></div><div><span>${L('Sorties','Spending')}</span><b>${$$(calc.outTot)}</b></div><div><span>${L('Reste','Left')}</span><b style="color:${calc.rest<0?'var(--bad)':'var(--good)'}">${$$(calc.rest)}</b></div></div>
    <div class="abtns"><button class="btn" type="button" data-app-edit>${ic('i-doc')}${L('Modifier mon budget','Edit my budget')}</button><button class="btn" type="button" data-app-send>${ic('i-send')}${L('Envoyer mon budget à Mickaël','Send my budget to Mickaël')}</button><a class="btn bookA" href="${esc(bookHref())}"${BOOK_URL?' target="_blank" rel="noopener"':''}>${ic('i-cal')}<span class="bookT">${BOOK_URL?L('Réserver un rendez-vous','Book an appointment'):L('Demander un rendez-vous','Request an appointment')}</span></a></div></section>
  <section class="acard a2hs" id="a2hs"><h2>${L("Mettre l'app sur mon téléphone",'Put the app on my phone')}</h2>
    <div class="f"><label for="phoneSel">${L('Quel est ton téléphone ?','Which phone do you have?')}</label><select class="fld" id="phoneSel" data-phone>${opts(PHONES.map(p=>[p[0],p[1]]),phoneGuess())}</select></div>
    <div id="a2hsSteps">${a2hsSteps(phoneGuess())}</div></section>
  <section class="acard"><h2>${L('Mes données','My data')}</h2><p class="small muted">${ic('i-lock')} ${L('Tes dépenses et tes paiements restent sur cet appareil. Ils ne sont pas envoyés à Mickaël.','Your spending and payments stay on this device. They aren’t sent to Mickaël.')}</p>
    <div class="abtns">${appS().exp.length?`<button class="btn" type="button" id="expCsv">${ic('i-doc')}${L('Exporter mes dépenses (CSV)','Export my spending (CSV)')}</button>`:''}${resetAsk?`<div class="confirm"><p class="small"><b>${L('Effacer toutes tes dépenses et les dates de tes paiements ?','Erase all your spending and payment dates?')}</b> ${L('Ton budget, lui, est gardé.','Your budget is kept.')}</p><div class="tools" style="margin:0"><button class="btn danger" type="button" id="trkYes">${L('Oui, effacer','Yes, erase')}</button><button class="btn quiet" type="button" id="trkNo">${L('Annuler','Cancel')}</button></div></div>`:`<button class="btn quiet" type="button" id="trkAsk">${L('Effacer mes dépenses et mes dates','Erase my spending and dates')}</button>`}</div><p class="status" id="budMsg" aria-live="polite"></p></section>`}
const PHONES=[
 ['ios-safari',L('iPhone ou iPad (Safari)','iPhone or iPad (Safari)')],
 ['ios-chrome',L('iPhone ou iPad (Chrome)','iPhone or iPad (Chrome)')],
 ['pixel',L('Google Pixel (Chrome)','Google Pixel (Chrome)')],
 ['android',L('Android : Motorola, OnePlus, Xiaomi… (Chrome)','Android: Motorola, OnePlus, Xiaomi… (Chrome)')],
 ['samsung',L('Samsung Galaxy (Samsung Internet)','Samsung Galaxy (Samsung Internet)')],
 ['other',L('Ordinateur ou autre','Computer or other')]];
function phoneGuess(){let s='';try{s=localStorage.getItem(KEY+'-phone')||''}catch(e){}if(s)return s;const u=navigator.userAgent||'';
  if(/SamsungBrowser/.test(u))return 'samsung';if(/Pixel/.test(u))return 'pixel';if(/Android/.test(u))return 'android';
  if(/iPhone|iPad|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return /CriOS/.test(u)?'ios-chrome':'ios-safari';return 'other'}
function a2hsSteps(k){const S1={
  'ios-safari':[L('Ouvre ce lien dans <b>Safari</b>.','Open this link in <b>Safari</b>.'),L('Touche le bouton <b>Partager</b> : le carré avec une flèche vers le haut, en bas de l’écran.','Tap the <b>Share</b> button: the square with an upward arrow, at the bottom of the screen.'),L('Fais défiler et touche <b>Sur l’écran d’accueil</b>.','Scroll and tap <b>Add to Home Screen</b>.'),L('Touche <b>Ajouter</b>, en haut à droite.','Tap <b>Add</b>, at the top right.'),L('L’icône <b>Budget GFX</b> apparaît sur ton écran d’accueil.','The <b>GFX Budget</b> icon appears on your home screen.')],
  'ios-chrome':[L('Ouvre ce lien dans <b>Chrome</b>.','Open this link in <b>Chrome</b>.'),L('Touche le bouton <b>Partager</b>, dans la barre d’adresse en haut à droite.','Tap the <b>Share</b> button, in the address bar at the top right.'),L('Touche <b>Ajouter à l’écran d’accueil</b> (fais défiler au besoin).','Tap <b>Add to Home Screen</b> (scroll if needed).'),L('Touche <b>Ajouter</b>.','Tap <b>Add</b>.')],
  'pixel':[L('Ouvre ce lien dans <b>Chrome</b>.','Open this link in <b>Chrome</b>.'),L('Touche le menu <b>⋮</b>, en haut à droite.','Tap the <b>⋮</b> menu, at the top right.'),L('Touche <b>Ajouter à l’écran d’accueil</b> (ou <b>Installer l’application</b>).','Tap <b>Add to Home screen</b> (or <b>Install app</b>).'),L('Touche <b>Ajouter</b> ou <b>Installer</b> pour confirmer.','Tap <b>Add</b> or <b>Install</b> to confirm.')],
  'android':[L('Ouvre ce lien dans <b>Chrome</b>.','Open this link in <b>Chrome</b>.'),L('Touche le menu <b>⋮</b>, en haut à droite.','Tap the <b>⋮</b> menu, at the top right.'),L('Touche <b>Ajouter à l’écran d’accueil</b> (ou <b>Installer l’application</b>).','Tap <b>Add to Home screen</b> (or <b>Install app</b>).'),L('Confirme avec <b>Ajouter</b>. Tu peux ensuite déplacer l’icône où tu veux.','Confirm with <b>Add</b>. You can then move the icon wherever you like.')],
  'samsung':[L('Ouvre ce lien dans <b>Samsung Internet</b>.','Open this link in <b>Samsung Internet</b>.'),L('Touche le menu <b>☰</b>, en bas à droite.','Tap the <b>☰</b> menu, at the bottom right.'),L('Touche <b>Ajouter la page à</b>, puis <b>Écran d’accueil</b>.','Tap <b>Add page to</b>, then <b>Home screen</b>.'),L('Touche <b>Ajouter</b> pour confirmer.','Tap <b>Add</b> to confirm.')],
  'other':[L('Sur ton téléphone, ouvre le même lien que Mickaël t’a envoyé.','On your phone, open the same link Mickaël sent you.'),L('Choisis ton téléphone dans la liste ci-dessus pour voir les étapes.','Pick your phone in the list above to see the steps.')]}[k]||[];
  const note=k.startsWith('ios')?L('Sur iPhone, l’icône de l’écran d’accueil garde ses propres données. Ajoute-la d’abord, ouvre-la, puis touche « J’ai un code de reprise » pour y transférer ton budget.','On iPhone, the home-screen icon keeps its own data. Add it first, open it, then tap “I have a resume code” to transfer your budget.'):k==='other'?'':L('Si tes données n’apparaissent pas dans l’icône, utilise un code de reprise pour les transférer.','If your data doesn’t show up in the icon, use a resume code to transfer it.');
  return `<ol class="steps-a">${S1.map(s=>`<li><span>${s}</span></li>`).join('')}</ol>${note?`<p class="small muted">${note}</p><button class="btn" type="button" data-resume="out">${ic('i-dev')}${L('Créer mon code de reprise','Create my resume code')}</button>`:''}`}
function renderApp(){if(!APPON)return;const v={today:viewToday,cal:viewCal,exp:viewExp,bud:viewBud}[AV]||viewToday;$('#appMain').innerHTML=v();
  document.querySelectorAll('[data-av]').forEach(b=>{if(b.closest('#anav'))b.setAttribute('aria-current',b.dataset.av===AV?'page':'false')})}
function setAV(v,focus){AV=v;resetAsk=false;try{localStorage.setItem(AVK,v)}catch(e){}renderApp();toTop();if(focus==='exp'){const a=$('#expAmt');if(a)a.focus({preventScroll:true})}if(focus==='a2hs'){const s=$('#a2hs');if(s)s.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'})}if(focus==='setup'){const s=$('#dateSetup');if(s)s.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'})}}
function setApp(on,store=true){APPON=on;document.body.classList.toggle('appm',on);if(store)try{localStorage.setItem(APPK,on?'1':'')}catch(e){}
  if(on){appS();if(!S.app.on){S.app.on=true;save()}try{const cm=localStorage.getItem(KEY+'-calmode');if(cm==='liste'||cm==='mois')calMode=cm}catch(e){}try{const sv=localStorage.getItem(AVK);if(sv&&['today','cal','exp','bud'].includes(sv))AV=sv}catch(e){}AV=AV||'today';renderApp();toTop()}else{$('#welApp').hidden=!(S.app&&S.app.on);if(guide)goStep('res');else toTop()}}
function addExpense(){const inp=$('#expAmt'),a=num(inp.value),msg=$('#expMsg');if(!(a>0)){msg.className='status ko';msg.textContent=L('Inscris un montant.','Enter an amount.');inp.focus();return}
  const A=appS(),d=($('#expDate').value||isoD(today0())),n=$('#expNote').value.trim(),cat=expCat||'autre',was=!!editId;
  if(editId){const e=A.exp.find(x=>x.id===editId);if(e)Object.assign(e,{a:String(round2(a)),d,cat,n});editId=null}
  else A.exp.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),d,a:String(round2(a)),cat,n});
  A.lastCat=cat;flashKey=cat;save();const dd=parseD(d);expMonth=new Date(dd.getFullYear(),dd.getMonth(),1,12);renderApp();
  const env=envelopes().find(e=>e.key===cat),{by}=monthSpent(dd.getFullYear(),dd.getMonth()),rest=env&&env.b?env.b-(by[cat]||0):null;
  const m2=$('#expMsg');if(m2){m2.className='status ok';m2.textContent=(was?L('Dépense modifiée.','Expense updated.'):L(`Ajouté : ${$$(a)} en ${catLabel(cat)}.`,`Added: ${$$(a)} in ${catLabel(cat)}.`))+(rest!=null?' '+(rest>=0?L(`Il reste ${$$(rest)} dans cette enveloppe.`,`${$$(rest)} left in this envelope.`):L(`Enveloppe dépassée de ${$$(-rest)}.`,`Envelope over by ${$$(-rest)}.`)):'')}
  flashKey=null;const ai=$('#expAmt');if(ai&&!was)ai.focus({preventScroll:true})}
function downloadFile(name,data,type){return (async()=>{const DL=window.claude?await DLP:null;if(DL){try{await DL.save({filename:name,data});return true}catch(e){}}
  const u=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);return true})()}
function exportCSV(){const A=appS(),rows=[[L('Date','Date'),L('Catégorie','Category'),L('Note','Note'),L('Montant','Amount')]].concat([...A.exp].sort((a,b)=>a.d.localeCompare(b.d)).map(e=>[e.d,catLabel(e.cat),e.n||'',num(e.a).toFixed(2).replace('.',LANG==='en'?'.':',')]));
  const sep=LANG==='en'?',':';';const csv='﻿'+rows.map(r=>r.map(c=>(c.includes(sep)||/["\n]/.test(c))?'"'+String(c).replace(/"/g,'""')+'"':c).join(sep)).join('\r\n');
  downloadFile('depenses-budget-gfx.csv',csv,'text/csv').catch(()=>{})}
function exportICS(){const R=recurring(),A=appS(),RR={sem:'FREQ=WEEKLY',  '2sem':'FREQ=WEEKLY;INTERVAL=2',mois:'FREQ=MONTHLY','2mois':'FREQ=MONTHLY;INTERVAL=2','3mois':'FREQ=MONTHLY;INTERVAL=3',an:'FREQ=YEARLY'};
  const dt=s=>s.replace(/-/g,''),stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15)+'Z',escI=s=>String(s).replace(/([,;\\])/g,'\\$1');let ev='',n=0;
  R.forEach(r=>{const ds=A.dates[r.key];if(!ds)return;const d0=parseD(ds);const starts=r.f==='2fm'?[d0,(()=>{const x=new Date(d0);x.setDate(x.getDate()+15);return x})()]:[d0];
    starts.forEach(s=>{const rule=r.f==='2fm'?'FREQ=MONTHLY':RR[r.f];if(!rule)return;n++;const nd=new Date(s);nd.setDate(nd.getDate()+1);
      ev+=`BEGIN:VEVENT\r\nUID:gfx-${n}-${dt(isoD(s))}@budget-gfx\r\nDTSTAMP:${stamp}\r\nDTSTART;VALUE=DATE:${dt(isoD(s))}\r\nDTEND;VALUE=DATE:${dt(isoD(nd))}\r\nRRULE:${rule}\r\nSUMMARY:${escI((r.inc&&r.key!=='sal'?L('Entrée : ','Income: '):'')+r.l+' — '+$$(r.a))}\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${escI(r.l)}\r\nTRIGGER:-PT15H\r\nEND:VALARM\r\nEND:VEVENT\r\n`})});
  if(!n){const m=$('#icsMsg');if(m){m.className='status ko';m.textContent=L('Date d’abord tes paiements.','Set your payment dates first.')}return}
  downloadFile('paiements-budget-gfx.ics','BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//GFX//Budget//FR\r\nCALSCALE:GREGORIAN\r\n'+ev+'END:VCALENDAR\r\n','text/calendar').then(()=>{const m=$('#icsMsg');if(m){m.className='status ok';m.textContent=L('Fichier créé : ouvre-le pour ajouter tes paiements à ton calendrier, avec un rappel la veille.','File created: open it to add your payments to your calendar, with a reminder the day before.')}}).catch(()=>{})}
document.addEventListener('click',e=>{const t=e.target;let b;
  if((b=t.closest('[data-app-open]'))){setApp(true);return}
  if((b=t.closest('[data-app-edit]'))){setApp(false);return}
  if((b=t.closest('[data-app-send]'))){setApp(false);if(guide)goStep('send');else openExport();return}
  if((b=t.closest('[data-expdel]'))){const A=appS(),i=A.exp.findIndex(x=>x.id===b.dataset.expdel);if(i<0)return;undoExp={e:A.exp[i],i};A.exp.splice(i,1);if(editId===b.dataset.expdel)editId=null;save();const y=window.scrollY;renderApp();window.scrollTo(0,y);clearTimeout(undoT);undoT=setTimeout(()=>{undoExp=null;const u=$('#undoBar');if(u)u.remove()},7000);return}
  if((b=t.closest('#expUndo'))){const A=appS();if(undoExp){A.exp.splice(Math.min(undoExp.i,A.exp.length),0,undoExp.e);undoExp=null;save();const y=window.scrollY;renderApp();window.scrollTo(0,y)}return}
  if((b=t.closest('[data-expedit]'))){editId=b.dataset.expedit;const e=appS().exp.find(x=>x.id===editId);if(!e)return;expCat=e.cat;AV='exp';renderApp();const f=$('#expForm');if(f)f.scrollIntoView({block:'start',behavior:reduce?'auto':'smooth'});return}
  if((b=t.closest('#expCancel'))){editId=null;renderApp();return}
  if((b=t.closest('[data-quickcat]'))){expCat=b.dataset.quickcat;editId=null;setAV('exp','exp');return}
  if((b=t.closest('[data-amtadd]'))){const i=$('#expAmt');if(i){const v=round2(num(i.value)+(+b.dataset.amtadd));i.value=LANG==='en'?String(v):String(v).replace('.',',');i.focus({preventScroll:true})}return}
  if((b=t.closest('[data-expday]'))){const d=$('#expDate');if(d)d.value=b.dataset.expday;document.querySelectorAll('[data-expday]').forEach(x=>x.setAttribute('aria-pressed',x===b));return}
  if((b=t.closest('[data-expnav]'))){if(b.disabled)return;expMonth=new Date(expMonth.getFullYear(),expMonth.getMonth()+(+b.dataset.expnav),1,12);envEdit=null;renderApp();return}
  if((b=t.closest('[data-envsave]'))){const k=b.dataset.envsave,v=num(($('#envAmt')||{}).value);const x=getP(k);if(x){x.a=v>0?String(Math.round(v)):'';x.f='mois';delete S.unk[k+'.a'];save();try{paint()}catch(_){}}envEdit=null;renderApp();return}
  if((b=t.closest('[data-envedit]'))){envEdit=envEdit===b.dataset.envedit?null:b.dataset.envedit;renderApp();const a=$('#envAmt');if(a){a.focus({preventScroll:true});a.select()}return}
  if((b=t.closest('#balSave'))){const v=($('#balIn')||{}).value||'';const A=appS();if(v.trim()===''){delete A.bal;delete A.balD}else{A.bal=String(num(v));A.balD=isoD(today0())}save();const y=window.scrollY;renderApp();window.scrollTo(0,y);return}
  if((b=t.closest('#expCsv'))){exportCSV();return}
  if((b=t.closest('#icsBtn'))){exportICS();return}
  if((b=t.closest('[data-calmode]'))){calMode=b.dataset.calmode;try{localStorage.setItem(KEY+'-calmode',calMode)}catch(_){}renderApp();return}
  if((b=t.closest('#trkAsk'))){resetAsk=true;renderApp();return}
  if((b=t.closest('#trkNo'))){resetAsk=false;renderApp();return}
  if((b=t.closest('#trkYes'))){const A=appS();A.exp=[];A.dates={};A.paid={};delete A.bal;delete A.balD;delete A.lastCat;resetAsk=false;undoExp=null;save();renderApp();const m=$('#budMsg');if(m){m.className='status ok';m.textContent=L('C’est effacé. Ton budget est intact.','Erased. Your budget is intact.')}return}
  if((b=t.closest('[data-av]'))){if(b.closest('#anav')&&b.dataset.av!=='exp')editId=null;setAV(b.dataset.av,b.dataset.focus||(b.dataset.av==='exp'&&!b.closest('#anav'))?'exp':b.dataset.setup?'setup':b.dataset.goa2hs?'a2hs':null);return}
  if((b=t.closest('[data-paid]'))){const A=appS(),id=b.dataset.paid;if(A.paid[id])delete A.paid[id];else A.paid[id]=1;save();renderApp();return}
  if((b=t.closest('[data-cat]'))){expCat=b.dataset.cat;document.querySelectorAll('[data-cat]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.cat===expCat));return}
  if((b=t.closest('#expAdd'))){addExpense();return}
  if((b=t.closest('[data-appset]'))){const A=appS();A.dates[b.dataset.appset]=b.dataset.d;save();const y=window.scrollY;renderApp();window.scrollTo(0,y);return}
  if((b=t.closest('[data-a2hs-ok]'))){appS().a2hs=1;save();renderApp();return}
  if((b=t.closest('[data-calday]'))){calSel=parseD(b.dataset.calday);renderApp();return}
  if((b=t.closest('[data-calnav]'))){calMonth=new Date(calMonth.getFullYear(),calMonth.getMonth()+(+b.dataset.calnav),1,12);calSel=null;renderApp();return}
});
document.addEventListener('keydown',e=>{if(!APPON)return;const t=e.target;
  if(e.key==='Enter'){if(t.id==='balIn'){e.preventDefault();$('#balSave').click();return}if(t.id==='envAmt'){e.preventDefault();const s=document.querySelector('[data-envsave]');if(s)s.click();return}}
  if((e.key==='Enter'||e.key===' ')&&t.dataset&&t.dataset.expedit!=null&&t===e.target&&!e.target.closest('.delbtn')){e.preventDefault();t.click()}});
document.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.appday!=null){const A=appS();if(t.value)A.dates[t.dataset.appday]=nextDay(+t.value);else delete A.dates[t.dataset.appday];save();const y=window.scrollY;renderApp();window.scrollTo(0,y);return}
  if(t.dataset&&t.dataset.phone!=null){try{localStorage.setItem(KEY+'-phone',t.value)}catch(_){}const box=$('#a2hsSteps');if(box)box.innerHTML=a2hsSteps(t.value);return}
  if(t.dataset&&t.dataset.appdate!=null){const A=appS();if(t.value)A.dates[t.dataset.appdate]=t.value;else delete A.dates[t.dataset.appdate];save();
  const y=window.scrollY;renderApp();window.scrollTo(0,y)}});

/* ================= rendez-vous ================= */
const bookHref=()=>BOOK_URL||`mailto:${MAIL}?subject=${encodeURIComponent(L('Demande de rendez-vous — budget','Appointment request — budget'))}&body=${encodeURIComponent(L('Bonjour Mickaël,\n\nJ’aimerais prendre rendez-vous avec toi pour faire le point sur mon budget. Voici mes disponibilités :\n\n','Hi Mickaël,\n\nI’d like to book an appointment to go over my budget. Here are my availabilities:\n\n')+(S.nom||''))}`;
function paintRdv(){document.querySelectorAll('[data-rdv]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.rdv===S.rdv));
  $('#rdvStart').hidden=S.rdv!=='non';$('#rdvEnd').hidden=S.rdv==='oui';$('#rdvOk').hidden=true;
  $('#meetMsg').textContent=S.rdv==='oui'?L('On se voit à notre prochain rendez-vous !','See you at our next appointment!'):L('Prends rendez-vous avec moi : on transforme ton budget en plan, ensemble.','Book a meeting with me: together, we’ll turn your budget into a plan.');
  document.querySelectorAll('.bookA').forEach(a=>{a.href=bookHref();if(!BOOK_URL)a.removeAttribute('target');const t=a.querySelector('.bookT');if(t)t.textContent=BOOK_URL?L('Réserver mon rendez-vous','Book my appointment'):L('Demander un rendez-vous','Request an appointment')})}

/* ================= démarrage ================= */
function boot(){if(!has(S.date)){const d=new Date();S.date=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;save()}
  $('#nom').value=S.nom||'';$('#email').value=S.email||'';$('#date').value=S.date||'';
  renderProfSeg();paintRdv();renderBudget();renderRet();renderMvList();paint();paintCal();keyHints();if(guide)goStep(gcur,true)}
window.__budget={go:k=>goStep(k),get S(){return S},summaryText:()=>summaryText(),reportHtml:()=>reportHtml(),parseQuick,analyzeCSV,parseCSV,encodeState,decodeState};
const wantAdv=readParams();
try{if(localStorage.getItem(KEY+'-big'))setBig(true)}catch(e){}
$('#langBtn').textContent=LANG==='en'?'FR':'EN';$('#langBtn').setAttribute('aria-label',LANG==='en'?'Français':'English');
let advPref=false;try{advPref=!!localStorage.getItem(ADVK)}catch(e){}
ADV=wantAdv||advPref;document.body.classList.toggle('adv',ADV);
boot();
setAdv(ADV,false);
if(ADV){try{const t=localStorage.getItem(KEY+'-tab');if(t&&t!=='budget')selectTab(t)}catch(e){}}
{let pref=null;try{pref=localStorage.getItem(VKEY);gcur=localStorage.getItem(SKEY)||'wel'}catch(e){}
 const small=matchMedia('(max-width:720px), (pointer:coarse) and (max-height:500px)').matches;
 setGuide(pref?pref==='guide':small,false)}
{let ap=false;try{ap=!!localStorage.getItem(APPK)}catch(e){}$('#welApp').hidden=!(S.app&&S.app.on);if(ap)setApp(true,false)}
if(LANG==='en')startTr();
})();
