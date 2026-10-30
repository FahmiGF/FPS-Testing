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

## 🗺️ Peta Pertempuran Voxel (Tactical Maps)

Game ini kini menyediakan 6 pilihan peta tematik dengan layout arsitektur, atmosfer kabut, dan pencahayaan unik:

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
| **Klik Kanan (RMB)** | Memasang blok cover voxel (*Build cover*) |
| **Space** | Melompat (*Jump*) |
| **Shift** | Berlari cepat (*Sprint*) |
| **Ctrl** | Menunduk (*Crouch*) |
| **1 / 2** | Ganti senjata (**AK-47** / **Desert Eagle**) |
| **R** | Isi ulang peluru (*Reload*) |
| **Q** | Ganti tipe material blok (Stone, Crate, Sand, Metal, Brick, Grass) |
| **Esc** | Pause / Buka kursor mouse |

---

## 🧪 Automated Testing Suite

Proyek ini dilengkapi dengan suite pengujian otomatis berbasis Node.js native test runner (`node:test` & `node:assert`) dengan 100% kelulusan:

- **`tests/maps.test.js`**: Uji generasi prosedural 6 map tematik (Compound, Winter, Lava, Beach, Castle, Modern Warfare) dan verifikasi zona spawn bebas rintangan.
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
