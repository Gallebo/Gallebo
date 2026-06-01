Flight Sharing Platform
Faza 8 — Flight Alert
Notifikacije za zeljene rute
 
Kako funkcionira

Putnik koji ne moze pronaci odgovarajuci let moze postaviti alert. Kada pilot objavi let koji odgovara kriterijima, putnik prima notifikaciju.

#	Korak	Detalji
1	Putnik pretrazuje letove	Nema odgovarajuceg leta
2	Putnik postavlja alert	Polaziste, odrediste (airfield ili regija), okvirni period
3	Alert aktivan 15 dana	Platforma prati objave novih letova
4	Pilot objavi odgovarajuci let	Matching logika provjeri sve aktivne alerte
5	Putnik prima notifikaciju	Push + email + in-app
6	Dan prije isteka alerta	Notifikacija putniku za produzenje jednim klikom
7	Isteklo 15 dana bez produzenja	Alert automatski ugasen

 
Alert forma

Putnik unosi minimalne podatke za postavljanje alerta. Sto vise fleksibilnosti, to vise sansa za match.

Polje	Opcije	Obavezno
Polaziste	Airfield ili regija	Da
Odrediste	Airfield ili regija	Da
Okvirni period	Od datuma do datuma	Da
Tip leta	Svi / Panoramski / Izlet / Jednosmjeran	Ne (default: svi)

Matching logika

Pri svakoj objavi novog leta, platforma provjerava sve aktivne alerte i trazi podudaranje.

Kriterij	Logika
Polaziste	Airfield se poklapa ILI je unutar iste regije
Odrediste	Airfield se poklapa ILI je unutar iste regije
Period	Datum leta unutar alertovog perioda
Tip leta	Poklapa se s alertovim tipom (ako nije "svi")

Pilot perspektiva

•	Pri objavi leta pilot vidi: "X putnika ceka ovu rutu"
•	Broj se racuna na osnovu aktivnih alerta koji odgovaraju ruti i periodu
•	Motivacija za objavu leta na popularnim rutama
•	Platforma moze prikazati i top rute s najvise cekanja u pilot dashboardu

Alert dashboard (passenger)

Funkcionalnost	Opis
Pregled alertova	Lista svih aktivnih alertova s datumom isteka
Produzenje	Jednim klikom produzi za jos 15 dana
Brisanje	Rucno gasenje alerta
Dodavanje	Novi alert bez ogranicenja broja

 
Faza 8 — Checklist

#	Zadatak	Status
1	Alert forma (polaziste, odrediste, period, tip)	[ ]
2	15 dana timer s notifikacijom dan prije isteka	[ ]
3	Produzenje alerta jednim klikom	[ ]
4	Automatsko gasenje po isteku	[ ]
5	Matching logika (let odgovara alert kriterijima)	[ ]
6	Notifikacija putniku kad pilot objavi odgovarajuci let	[ ]
7	Prikaz "X putnika ceka ovu rutu" pilotu	[ ]
8	Alert dashboard za putnika	[ ]


Flight Sharing Platform · Faza 8 · Flight Alert · Povjerljivo
