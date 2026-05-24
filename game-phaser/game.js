// --- KONFIGURASI GLOBAL ---
const GRID = 20;
let configWidth = 1000;
let configHeight = 700; // Standar Laptop
let isMobileMode = false;
let selectedSkin = 'kuning'; 

// Array untuk menyimpan riwayat poin (Leaderboard)
let scoreHistory = [];

// --- SCENE 1: PILIHAN MODE DEVICE ---
class DeviceSelectionScene extends Phaser.Scene {
    constructor() { super('DeviceSelectionScene'); }
    create() {
        this.add.text(configWidth/2, 150, 'SNAKE EVOLUTION', { fontSize: '50px', fill: '#4caf50', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(configWidth/2, 220, 'PILIH MODE PERMAINAN:', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

        // Tombol Mode Komputer
        let pcBtn = this.add.rectangle(configWidth/2, 320, 400, 60, 0x2196f3).setInteractive();
        this.add.text(configWidth/2, 320, 'MODE LAPTOP / PC', { fontSize: '22px', fontStyle: 'bold' }).setOrigin(0.5);
        
        // Tombol Mode HP
        let mobileBtn = this.add.rectangle(configWidth/2, 420, 400, 60, 0xe91e63).setInteractive();
        this.add.text(configWidth/2, 420, 'MODE HANDPHONE (DENGAN TOMBOL)', { fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);

        pcBtn.on('pointerdown', () => {
            isMobileMode = false;
            this.scene.start('MenuScene');
        });

        mobileBtn.on('pointerdown', () => {
            isMobileMode = true;
            this.scene.start('MenuScene');
        });
    }
}

// --- SCENE 2: MENU UTAMA ---
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        // Kredit Nama Pembuat Paling Atas
        this.add.text(configWidth/2, 50, 'Game Project By Gregorios Bayu K.', { fontSize: '22px', fill: '#fbbf24', fontStyle: 'italic' }).setOrigin(0.5);
        
        this.add.text(configWidth/2, 130, 'SNAKE EVOLUTION', { fontSize: '55px', fill: '#4caf50', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(configWidth/2, 220, 'PILIH WARNA ULAR (SKIN):', { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);

        // Mengubah Nama Skin Menjadi Warna
        const skins = [
            { id: 'kuning', name: 'KUNING', color: '#fbbf24' },
            { id: 'hijau', name: 'HIJAU', color: '#65a30d' },
            { id: 'merah', name: 'MERAH', color: '#dc2626' }
        ];

        skins.forEach((s, i) => {
            let btn = this.add.rectangle(configWidth/2 - 200 + (i * 200), 290, 150, 50, 0x334155).setInteractive();
            let txt = this.add.text(configWidth/2 - 200 + (i * 200), 290, s.name, { fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
            
            btn.on('pointerdown', () => {
                selectedSkin = s.id;
                this.highlightSkin(s.id);
            });
            this[s.id + 'Btn'] = btn;
        });

        this.highlightSkin(selectedSkin);

        // Tombol Start
        let startBtn = this.add.rectangle(configWidth/2, 420, 300, 60, 0x4caf50).setInteractive();
        this.add.text(configWidth/2, 420, 'START GAME', { fontSize: '26px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        
        startBtn.on('pointerdown', () => {
            this.scene.start('GameScene');
        });

        // Tampilkan Info Kontrol Aktif
        let controlTxt = isMobileMode ? "Kontrol: Gunakan tombol panah di bawah layar" : "Kontrol: Tombol Panah Keyboard / WASD";
        this.add.text(configWidth/2, 500, controlTxt, { fontSize: '16px', fill: '#94a3b8' }).setOrigin(0.5);
    }

    highlightSkin(id) {
        ['kuning', 'hijau', 'merah'].forEach(skin => {
            this[skin + 'Btn'].setStrokeStyle(skin === id ? 4 : 0, 0xffffff);
        });
    }
}

// --- SCENE 3: GAME UTAMA ---
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    preload() {
        // Membuat tekstur warna skin baru
        this.makeSkin('part_kuning', 0xfbbf24, 0xd97706);
        this.makeSkin('part_hijau', 0x65a30d, 0x3f6212);
        this.makeSkin('part_merah', 0xdc2626, 0x7f1d1d);
        
        // Tekstur Makanan (Apel)
        let g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(0xff0000).fillCircle(10, 10, 10);
        g.generateTexture('apple', 20, 20);
    }

    makeSkin(key, color1, color2) {
        let g = this.make.graphics({x:0, y:0, add:false});
        g.fillStyle(color1).fillRect(0,0,20,20);
        g.lineStyle(2, color2).strokeRect(1,1,18,18);
        g.generateTexture(key, 20, 20);
    }

    create() {
        this.snake = this.add.group();
        this.direction = 'RIGHT';
        this.nextDirection = 'RIGHT';
        this.moveTimer = 0;
        this.isDead = false;
        this.score = 0;

        // Batas tinggi area bermain game agar tidak menabrak tombol HP di bawah
        this.playAreaHeight = isMobileMode ? 500 : 700;

        // Gambar Garis Pembatas Layar jika di Mode HP
        if (isMobileMode) {
            let line = this.add.graphics();
            line.lineStyle(4, 0x475569);
            line.lineBetween(0, 500, 1000, 500);
            this.createMobileControls();
        }

        // Buat Ular awal (3 bagian)
        for (let i = 0; i < 3; i++) {
            this.snake.create(400 - (i * GRID), 260, 'part_' + selectedSkin).setOrigin(0);
        }

        // Group untuk menampung Maksimal 3 Apel Sekaligus
        this.apples = this.physics.add.group();
        for (let i = 0; i < 3; i++) {
            let apple = this.apples.create(0, 0, 'apple').setOrigin(0);
            this.repositionSingleApple(apple);
        }

        this.scoreText = this.add.text(20, 20, 'SKOR: 0', { fontSize: '24px', fill: '#fff', fontStyle: 'bold' });

        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys('W,A,S,D');
    }

    createMobileControls() {
        // Membuat Tombol Navigasi Virtual di luar Layar Bermain (Y > 500)
        const btnSize = 65;
        const cx = configWidth / 2;
        const cy = 600; // Tengah area kontrol bawah

        let btnUp = this.add.rectangle(cx, cy - 45, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx, cy - 45, '▲', { fontSize: '24px' }).setOrigin(0.5);

        let btnDown = this.add.rectangle(cx, cy + 45, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx, cy + 45, '▼', { fontSize: '24px' }).setOrigin(0.5);

        let btnLeft = this.add.rectangle(cx - 90, cy, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx - 90, cy, '◄', { fontSize: '24px' }).setOrigin(0.5);

        let btnRight = this.add.rectangle(cx + 90, cy, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx + 90, cy, '►', { fontSize: '24px' }).setOrigin(0.5);

        // Event Klik Tombol HP
        btnUp.on('pointerdown', () => { if (this.direction !== 'DOWN') this.nextDirection = 'UP'; });
        btnDown.on('pointerdown', () => { if (this.direction !== 'UP') this.nextDirection = 'DOWN'; });
        btnLeft.on('pointerdown', () => { if (this.direction !== 'RIGHT') this.nextDirection = 'LEFT'; });
        btnRight.on('pointerdown', () => { if (this.direction !== 'LEFT') this.nextDirection = 'RIGHT'; });
    }

    update(time, delta) {
        if (this.isDead) return;

        // Kontrol Keyboard (Laptop)
        if ((this.cursors.left.isDown || this.keys.A.isDown) && this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
        else if ((this.cursors.right.isDown || this.keys.D.isDown) && this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
        else if ((this.cursors.up.isDown || this.keys.W.isDown) && this.direction !== 'DOWN') this.nextDirection = 'UP';
        else if ((this.cursors.down.isDown || this.keys.S.isDown) && this.direction !== 'UP') this.nextDirection = 'DOWN';

        this.moveTimer += delta;
        if (this.moveTimer > 160) { // KECEPATAN ULAR SUDAH DIPERLAMBAT (160ms) agar mudah dikontrol
            this.moveTimer = 0;
            this.handleMove();
        }
    }

    handleMove() {
        const body = this.snake.getChildren();
        const head = body[0];
        const oldPos = { x: head.x, y: head.y };

        this.direction = this.nextDirection;

        if (this.direction === 'LEFT') head.x -= GRID;
        else if (this.direction === 'RIGHT') head.x += GRID;
        else if (this.direction === 'UP') head.y -= GRID;
        else if (this.direction === 'DOWN') head.y += GRID;

        // Deteksi Tabrak Dinding (Sesuai Batas Tinggi Mode yang Aktif)
        if (head.x < 0 || head.x >= configWidth || head.y < 0 || head.y >= this.playAreaHeight) {
            return this.die();
        }

        // Gerak Ekor & Deteksi Tabrak Diri Sendiri
        let prevX = oldPos.x;
        let prevY = oldPos.y;

        for (let i = 1; i < body.length; i++) {
            if (head.x === body[i].x && head.y === body[i].y) return this.die();
            let tx = body[i].x; let ty = body[i].y;
            body[i].setPosition(prevX, prevY);
            prevX = tx; prevY = ty;
        }

        // Cek jika Kepala Ular Memakan Salah Satu Apel
        this.apples.getChildren().forEach(apple => {
            if (head.x === apple.x && head.y === apple.y) {
                this.score += 10;
                this.scoreText.setText('SKOR: ' + this.score);
                
                // Ular Memanjang Secara Sempurna
                let lastPart = body[body.length - 1];
                this.snake.create(lastPart.x, lastPart.y, 'part_' + selectedSkin).setOrigin(0);

                // Ganti posisi apel yang dimakan ke tempat acak baru tanpa hilang
                this.repositionSingleApple(apple);
            }
        });
    }

    repositionSingleApple(apple) {
        let validPosition = false;
        let x, y;
        const body = this.snake.getChildren();

        while (!validPosition) {
            x = Phaser.Math.Between(0, (configWidth / GRID) - 1) * GRID;
            y = Phaser.Math.Between(0, (this.playAreaHeight / GRID) - 1) * GRID;

            validPosition = true;
            // Pastikan posisi apel tidak berada tepat di atas badan ular
            for (let i = 0; i < body.length; i++) {
                if (body[i].x === x && body[i].y === y) {
                    validPosition = false;
                    break;
                }
            }
        }
        apple.setPosition(x, y);
    }

    die() {
        this.isDead = true;
        // Simpan skor ke dalam Riwayat Poin Tertinggi
        scoreHistory.push(this.score);
        scoreHistory.sort((a, b) => b - a); // Urutkan dari tertinggi ke terendah
        if (scoreHistory.length > 5) scoreHistory.pop(); // Batasi hanya simpan top 5 skor

        this.scene.launch('GameOverScene', { currentScore: this.score });
    }
}

// --- SCENE 4: GAME OVER & RIWAYAT POIN ---
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    create(data) {
        // Overlay Latar Belakang Gelap transparan
        this.add.rectangle(configWidth/2, configHeight/2, configWidth, configHeight, 0x000000, 0.8);

        this.add.text(configWidth/2, 80, 'KAMU KALAH!', { fontSize: '50px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(configWidth/2, 140, 'SKOR KAMU: ' + data.currentScore, { fontSize: '26px', fill: '#fff' }).setOrigin(0.5);

        // --- TAMPILAN RIWAYAT POIN TERTINGGI (LEADERBOARD) ---
        this.add.text(configWidth/2, 200, '─── RIWAYAT POIN TERBARU (TERTINGGI KE TERENDAH) ───', { fontSize: '16px', fill: '#94a3b8' }).setOrigin(0.5);
        
        scoreHistory.forEach((score, index) => {
            let rankText = `Peringkat ${index + 1}: ${score} Poin`;
            if(score === data.currentScore && index === scoreHistory.indexOf(data.currentScore)) {
                rankText += " ★ (Skor Baru)";
            }
            this.add.text(configWidth/2, 230 + (index * 25), rankText, { 
                fontSize: '18px', 
                fill: score === scoreHistory[0] ? '#fbbf24' : '#fff',
                fontStyle: score === scoreHistory[0] ? 'bold' : 'normal'
            }).setOrigin(0.5);
        });

        // --- TOMBOL NAVIGASI MENU KALAH ---
        // Tombol Restart (Ulang)
        let restartBtn = this.add.rectangle(configWidth/2, 450, 350, 50, 0x4caf50).setInteractive();
        this.add.text(configWidth/2, 450, 'RESTART GAME', { fontSize: '20px', fontStyle: 'bold', color: '#000' }).setOrigin(0.5);

        // Tombol Kembali Ke Menu Utama
        let menuBtn = this.add.rectangle(configWidth/2, 520, 350, 50, 0x607d8b).setInteractive();
        this.add.text(configWidth/2, 520, 'KEMBALI KE MENU UTAMA', { fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.start('GameScene');
        });

        menuBtn.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.start('MenuScene');
        });
    }
}

// Konfigurasi Engine Phaser Utama
const config = {
    type: Phaser.AUTO,
    width: configWidth,
    height: configHeight,
    parent: 'game-container',
    backgroundColor: '#0f172a',
    physics: { default: 'arcade' },
    scene: [DeviceSelectionScene, MenuScene, GameScene, GameOverScene]
};

const game = new Phaser.Game(config);