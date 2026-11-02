# VOXEL STRIKE — FPS Testing Prototype

> **Prototipe Game FPS Hybrid:** Menggabungkan gunplay & pergerakan taktis ala *Counter-Strike* dengan mekanisme *destructible voxel cover* ala *Minecraft*.

---

## 🎮 Ringkasan Proyek

Setiap dinding dan objek cover di arena bukan sekadar objek statis, melainkan blok voxel yang dapat:
1. **Dihancurkan dengan tembakan senjata**: Menembus cover musuh untuk membuka sudut tembak baru (*angles*).
2. **Dibangun ulang secara instan**: Memasang blok cover darurat saat terdesak.
3. **Mengubah dinamika AI Bot**: Bot memiliki *line-of-sight* (LoS) berbasis raycast voxel yang mengenali cover hancur maupun cover yang baru dipasang.

---

## 🎯 Mode Permainan (Game Modes)

Game ini menyediakan 3 mode permainan berbeda yang dapat dipilih langsung dari menu lobi:

1. **Deathmatch (Free-For-All Race)**
   - Pertarungan cepat tanpa henti.
   - Siapa yang pertama kali mencapai target **20 Kills** dinyatakan sebagai pemenang!
   - Respawn cepat diaktifkan untuk pemain dan bot.

2. **Classic Tactical (Round Elimination)**
   - Mode ronde taktis berbasis eliminasi (terinspirasi Counter-Strike).
   - Eliminasi semua bot musuh untuk memenangkan ronde.
   - Tidak ada respawn di tengah ronde. Tim pertama yang memenangkan **3 ronde** memenangkan pertandingan!

3. **Capture The Flag (CTF)**
   - Ambil bendera musuh (**Red Flag**) dari markas musuh dan bawa pulang ke pangkalanmu (**Blue Base**).
   - Bendera yang dijatuhkan dapat dipungut kembali oleh kawan atau dikembalikan oleh musuh.
   - Tim pertama yang mengumpulkan **3 kali Flag Capture** memenangkan match!
   - Dilengkapi visual 3D flag pole dan status indikator real-time pada HUD.

---

## 🔫 Senjata & Sistem Attachment

Tersedia **7 senjata** dengan karakter balistik masing-masing:

| Senjata | Kelas | Damage | RPM | Mag | Slot Attachment |
| :--- | :--- | ---: | ---: | ---: | :--- |
| **AK-47** | Rifle | 30 | 600 | 30 | Optic, Muzzle, Underbarrel, Magazine, Laser |
| **M4A1** | Carbine | 26 | 750 | 30 | Optic, Muzzle, Underbarrel, Magazine, Laser |
| **MP5** | SMG | 20 | 900 | 30 | Optic, Muzzle, Magazine, Laser |
| **SPAS-12** | Shotgun | 13 × 9 pellet | 90 | 8 | Optic, Underbarrel, Laser |
| **AWP** | Sniper | 118 | 42 | 5 | Optic, Muzzle, Magazine, Underbarrel |
| **M249** | LMG | 31 | 700 | 100 | Optic, Muzzle, Underbarrel, Laser |
| **DEAGLE** | Pistol | 55 | 280 | 7 | Optic, Muzzle, Magazine, Laser |

### Sistem Attachment (5 Slot, 19 Pilihan)

- **🔭 Optic** — Iron Sights, Red Dot, Holo Sight, ACOG 2.5x, Sniper Scope 5x (zoom + akurasi).
- **🔇 Muzzle** — Suppressor, Compensator, Muzzle Brake (recoil vs noise trade-off).
- **✋ Underbarrel** — Vertical Grip, Angled Grip, Bipod (kontrol recoil / kecepatan ADS).
- **📦 Magazine** — Standard, Extended (+50%), Drum (+120%, reload lebih lambat).
- **🔴 Laser** — Laser Sight, IR Laser (mengurangi spread hip-fire).

Modifier attachment bersifat **multiplikatif** dan dihitung oleh `resolveWeaponStats()` tanpa mengubah stat dasar senjata. Setiap senjata menyimpan loadout-nya sendiri.

### Cara Memasang Attachment

1. Buka menu lobi (atau tekan **Esc** untuk pause).
2. Pada panel **Weapon & Attachment Loadout**, pilih senjata (AK-47, M4A1, MP5, SPAS-12, AWP, M249, DEAGLE).
3. Klik attachment pada baris slot yang diinginkan — slot yang tidak didukung senjata tersebut otomatis tidak ditampilkan.
4. Ringkasan attachment aktif muncul di bawah panel dan di HUD kanan bawah.
5. Klik **Click to play / Resume** untuk langsung memakainya.

### Aim Down Sights (ADS)

- Tahan **Klik Kanan** untuk membidik. FOV zoom mengikuti optic yang terpasang.
- **Sniper Scope 5x** menampilkan overlay scope bulat penuh dengan crosshair dan reticle merah; viewmodel disembunyikan otomatis.
- Saat ADS: spread mengecil, recoil berkurang, dan sensitivity mouse menyesuaikan zoom.

---

## 🗺️ Peta Pertempuran Voxel (Tactical Maps)

Game ini kini menyediakan 10 pilihan peta tematik dengan layout arsitektur, atmosfer kabut, dan pencahayaan unik:

1. **🏜️ Dust Compound (Desert Military)**
   - Peta taktis klasik dengan lorong sempit, tumpukan peti, dan dinding pemisah dengan 3 pintu tembak.
   - Suasana: Gurun pasir berdebu dengan langit biru terik.
2. **❄️ Frostbite Outpost (Winter & Snow)**
   - Hamparan salju putih dengan danau es beku di tengah, menara pengawas kayu, dan barisan pohon pinus voxel.
   - Suasana: Kabut es arktik dingin dengan matahari kutub yang pucat.
3. **🌋 Inferno Chasm (Lava & Volcano)**
   - Batuan vulkanik gelap (basalt) yang dibelah oleh sungai lahar membara di tengah, dihubungkan oleh 3 jembatan baja sempit.
   - Suasana: Langit merah menyala, kabut panas belerang, dan pijar lava.
4. **🏝️ Coral Atoll (Beach & Tropical Island)**
   - Garis pantai pasir putih dengan laguna air pirus dangkal, dermaga kayu, gubuk pantai, dan pohon kelapa.
   - Suasana: Tropis cerah dengan air laut biru kehijauan yang hangat.
5. **🏰 Stonehold Keep (Medieval Castle)**
   - Benteng batu megah dengan benteng bersudut empat (bastions), halaman dalam berlapis batu bulat, dan gerbang melengkung.
   - Suasana: Kastil berawan mendung dengan nuansa perang abad pertengahan.
6. **🏙️ Urban Warzone (Modern Warfare)**
   - Persimpangan jalan aspal kota yang hancur, barikade beton jalan raya, pos karung pasir militer, dan gedung perkantoran 2 lantai dengan jendela bidik sniper.
   - Suasana: Kabut asap perang modern abu-abu kehijauan.
7. **🌴 Emerald Canopy (Tropical Rainforest)**
   - Hutan hujan lebat dengan sungai melintang, 3 jembatan tali kayu, reruntuhan candi batu kuno, dan kanopi pohon raksasa sebagai cover alami.
   - Suasana: Kabut hijau tropis lembap dengan cahaya matahari menembus dedaunan.
8. **🌙 Blackout District (Night Operation)**
   - Blok kota gelap gulita yang hanya diterangi lampu reaktor magma, gudang-gudang dengan mezzanine, gang sempit, dan jalur flank senyap.
   - Suasana: Malam pekat dengan jarak pandang sangat pendek (fog 18–78).
9. **🚀 Orbital Station K-7 (Sci-Fi Space Station)**
   - Stasiun luar angkasa terbengkalai dengan inti reaktor menyala di tengah, koridor logam simetris, laboratorium samping, dan dek observasi.
   - Suasana: Luar angkasa hitam dengan cahaya dingin kebiruan.
10. **☁️ Aether Sky Fortress (Sky Citadel)**
    - Benteng melayang di atas awan dengan rampart terbuka, 4 menara bata, jembatan panjang tanpa pagar, dan pulau-pulau kecil terapung.
    - Suasana: Langit biru cerah di atas lautan awan, minim cover di jalur utama.

---

## 🤖 Tingkat Kesulitan AI Bot (Bot Levels)

Bot musuh dilengkapi dengan 4 tingkat kesulitan yang dapat disesuaikan:

| Level | Nama | HP | Kecepatan Tembak | Akurasi | Karakteristik |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | **Recruit** | 80 | Lambat (1.3s - 1.9s) | 62% | Cocok untuk latihan pemula & uji coba cover. |
| **2** | **Veteran** | 100 | Normal (0.8s - 1.4s) | 82% | Standar taktis dengan strafe movement berimbang. |
| **3** | **Elite** | 135 | Cepat (0.45s - 0.85s) | 93% | Refleks tajam, peluru beruntun, strafe agresif. |
| **4** | **Nightmare** | 220 | Ekstrem (0.3s - 0.55s) | 98% | Boss-level bot dengan visual armor merah menyala & damage mematikan. |

---

## ⚡ Dynamic In-Game Events

Secara berkala, arena akan memicu event dinamis yang mengubah alur permainan:

- 📦 **Supply Drop Inbound**: Peti perbekalan jatuh di arena; ambil untuk memulihkan +50 HP dan mengisi penuh amunisi.
- 🌙 **Low Gravity Engaged**: Gravitasi bulan diaktifkan; lompat lebih tinggi melompati dinding cover voxel.
- ☄️ **Voxel Meteor Shower**: Hujan meteor membombardir arena dan meledakkan bongkahan dinding cover di sekitarnya.
- ⚡ **Double Damage Active**: Semua senjata memberikan 200% lethal damage untuk waktu terbatas.
- 🔥 **Rapid Fire Overdrive**: Kecepatan tembak berlipat ganda dengan infinite magazine tanpa perlu reload!

---

## 🕹️ Kontrol Permainan

| Tombol | Aksi |
| :--- | :--- |
| **W, A, S, D** | Bergerak (*Movement*) |
| **Mouse** | Membidik (*Aim / Look*) |
| **Klik Kiri (LMB)** | Menembak / Menghancurkan blok voxel |
| **Klik Kanan (RMB)** | Membidik / ADS dan zoom scope |
| **F** | Memasang blok cover voxel (*Build cover*) |
| **Space** | Melompat (*Jump*) |
| **Shift** | Berlari cepat (*Sprint*) |
| **Ctrl** | Menunduk (*Crouch*) |
| **1 – 7** | Ganti senjata (AK-47, M4A1, MP5, SPAS-12, AWP, M249, DEAGLE) |
| **Scroll Wheel** | Siklus senjata cepat |
| **R** | Isi ulang peluru (*Reload*) |
| **Q** | Ganti tipe material blok (Stone, Crate, Sand, Metal, Brick, Grass, Snow, Ice, Magma, Basalt, Wood, Concrete, Foliage) |
| **Esc** | Pause / Buka kursor mouse |

---

## 🧪 Automated Testing Suite

Proyek ini dilengkapi dengan suite pengujian otomatis berbasis Node.js native test runner (`node:test` & `node:assert`) dengan 100% kelulusan:

- **`tests/maps.test.js`**: Uji generasi prosedural 10 map tematik (Compound, Winter, Lava, Beach, Castle, Modern Warfare, Jungle, Night Ops, Space Station, Sky Fortress), keunikan nama/tema, dan verifikasi zona spawn player & bot bebas rintangan.
- **`tests/attachments.test.js`**: Uji katalog attachment, resolusi stat, kompatibilitas slot senjata, dan loadout manager.
- **`tests/modes.test.js`**: Uji aturan mode Deathmatch, Classic round elimination, dan alur Capture The Flag (grab, return, capture).
- **`tests/events.test.js`**: Uji aktivasi event, timer durasi, supply drop pickup, dan ledakan voxel meteor.
- **`tests/botLevels.test.js`**: Uji penyesuaian stat HP, akurasi, dan scaling dinamis bot level 1-4.
- **`tests/voxelWorld.test.js`**: Uji batas grid, solid count, penghancuran blok, perakitan arena, dan normal raycast.
- **`tests/player.test.js`**: Uji status HP, damage system, kamera shake, pitch clamping, kematian, dan respawn.
- **`tests/weapons.test.js`**: Uji spesifikasi senjata, damage falloff, dan ray-AABB bounding box collision.
- **`tests/bots.test.js`**: Uji bot HP, eliminasi, respawn, serta line-of-sight terhalang dinding voxel.
- **`tests/integration.test.js`**: Uji simulasi gameplay *headless* (pergerakan 60 ticks, tembak dinding cover, pasang cover, eliminasi bot).

### Menjalankan Pengujian:
```bash
npm test
```

---

## 🚀 Cara Menjalankan Game

1. Jalankan server lokal:
   ```bash
   npm start
   ```
2. Buka browser di:
   ```
   http://localhost:8080
   ```
3. Pilih Mode dan Tingkat Kesulitan Bot pada menu, lalu klik **Click to play**.
