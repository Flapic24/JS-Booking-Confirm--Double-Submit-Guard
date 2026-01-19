# Double Submit Guard – Idempotent Booking Demo

Ez a mini projekt egy **idempotens submit flow** működését demonstrálja egy egyszerű, 3-lépéses foglalási folyamaton keresztül.

A cél annak bemutatása, hogyan lehet **biztonságosan kezelni dupla kattintást, újraküldést (retry)** és **hálózati hibákat** úgy, hogy a foglalás **ne jöjjön létre többször**.

---

## 🎯 Mit demonstrál a projekt?

- **Idempotency key használata**
- **Double submit védelem**
- Retry-safe működés hálózati hiba után
- Különbség:
  - *“nem lett feldolgozva”* hiba
  - *“feldolgozva lett, de a válasz elveszett”* hiba között
- UI állapotkezelés:
  - submitting
  - success
  - error
- Deduplication logika backend-szimulációval

---

## 🧠 Fő koncepciók

### Idempotency
Minden foglalás egy egyedi `idempotencyKey`-jel történik.  
Ha ugyanazzal a kulccsal érkezik újra a kérés:
- a backend **nem hoz létre új foglalást**
- hanem a korábban eltárolt eredményt adja vissza

### Double Submit Guard
- A submit gomb `submitting` állapotban le van tiltva
- Gyors dupla kattintás vagy retry **nem okoz duplikációt**

### Retry-safe működés
Ha a feldolgozás sikeres volt, de a válasz elveszett:
- a felhasználó **biztonságosan újrapróbálhatja**
- ugyanazt a foglalási eredményt kapja vissza

---

## 🧪 Szimulált hibák

A fake API kétféle hibát tud szimulálni:

1. **Pre-process hiba**  
   A kérés nem lett feldolgozva (klasszikus server error)

2. **Post-success network error**  
   A foglalás létrejött, de a válasz nem érkezett meg  
   → retry esetén idempotens deduplikáció történik

---

## 🖥 Debug panel

A projekt tartalmaz egy egyszerű **debug log panelt**, amely:
- a kulcs eseményeket mutatja (submit, retry, dedup)
- kizárólag demonstrációs célt szolgál
- nem production UI elem

Ez segít vizuálisan követni az idempotency működését.

---

## 🛠 Technológia

- Vanilla JavaScript
- HTML / CSS
- Backend nélküli, szimulált API (`fakeConfirmBooking`)
- Állapotkezelés egy központi `state` objektumban

---

## 🚀 Hogyan próbáld ki?

1. Válassz szolgáltatást
2. Válassz időpontot
3. Kattints a **Foglalás megerősítése** gombra
4. Próbáld ki:
   - gyors dupla kattintást
   - retry gombot hiba után
   - network error szimulációt

Figyeld a debug panelt és az állapotváltozásokat.

---

## 📌 Miért készült?

Ez a projekt egy **tanulási és portfólió célú demo**, amely:
- frontend szemszögből mutatja be az idempotens submit logikát
- felkészít komplexebb booking / checkout folyamatokra
- alapot ad valódi backend integrációhoz

---

## 🔒 Megjegyzés

A projekt **nem használ valódi backend-et**.  
A logika viszont megegyezik azzal, ahogy egy valódi API-val történő idempotens submit-et érdemes kezelni.

---

Készítette: Zöldi Tamás *portfólió és tanulási célból*