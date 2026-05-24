// --- KONFIGURASI GLOBAL ---
const GRID = 20;
const V_WIDTH = 800;
const V_HEIGHT = 600;
let isMobileMode = false;
let selectedSkin = 'kuning'; 
let scoreHistory = [];

// Kecepatan game (Makin kecil angkanya, makin cepat ularnya jalan)
const SPEED_NORMAL = 150;
const SPEED_TURBO = 60; // Kecepatan saat tombol ditahan (Akselerasi)

// --- SCENE 1: PILIHAN MODE DEVICE ---
class DeviceSelectionScene extends Phaser.Scene {
    constructor() { super('DeviceSelectionScene'); }
    create() {
        this.add.text(V_WIDTH/2, 120, 'SNAKE EVOLUTION', { fontSize: '42px', fill: '#4caf50', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(V_WIDTH/2, 190, 'PILIH MODE PERMAINAN:', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        let pcBtn = this.add.rectangle(V_WIDTH/2, 280, 360, 50, 0x2196f3).setInteractive();
        this.add.text(V_WIDTH/2, 280, 'MODE LAPTOP / PC', { fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
        
        let mobileBtn = this.add.rectangle(V_WIDTH/2, 370, 360, 50, 0xe91e63).setInteractive();
        this.add.text(V_WIDTH/2, 370, 'MODE HANDPHONE (DENGAN TOMBOL)', { fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);

        pcBtn.on('pointerdown', () => { isMobileMode = false; this.scene.start('MenuScene'); });
        mobileBtn.on('pointerdown', () => { isMobileMode = true; this.scene.start('MenuScene'); });
    }
}

// --- SCENE 2: MENU UTAMA ---
class MenuScene extends Phaser.Scene {
    constructor() { super('MenuScene'); }
    create() {
        this.add.text(V_WIDTH/2, 50, 'Game Project By Gregorios Bayu K.', { fontSize: '18px', fill: '#fbbf24', fontStyle: 'italic' }).setOrigin(0.5);
        this.add.text(V_WIDTH/2, 110, 'SNAKE EVOLUTION', { fontSize: '46px', fill: '#4caf50', fontStyle: 'bold' }).setOrigin(0.5);
        
        // Penjelasan Kontrol Tambahan Sesuai Request
        let infoBox = this.add.rectangle(V_WIDTH/2, 200, 500, 70, 0x1e293b).setStrokeStyle(2, 0x475569);
        let infoText = isMobileMode 
            ? "KONTROL HP:\n- Tekan tombol panah untuk belok\n- TAHAN tombol panah lama-lama untuk LARI CEPAT!" 
            : "KONTROL LAPTOP:\n- Gunakan tombol Keyboard PANAH atau W, A, S, D\n- TAHAN tombol keyboard tersebut untuk LARI CEPAT!";
        this.add.text(V_WIDTH/2, 200, infoText, { fontSize: '14px', fill: '#cbd5e1', align: 'center' }).setOrigin(0.5);

        this.add.text(V_WIDTH/2, 300, 'PILIH WARNA ULAR (SKIN):', { fontSize: '18px', fill: '#fff' }).setOrigin(0.5);
        const skins = [{ id: 'kuning', name: 'KUNING' }, { id: 'hijau', name: 'HIJAU' }, { id: 'merah', name: 'MERAH' }];

        skins.forEach((s, i) => {
            let btn = this.add.rectangle(V_WIDTH/2 - 160 + (i * 160), 360, 120, 40, 0x334155).setInteractive();
            this.add.text(V_WIDTH/2 - 160 + (i * 160), 360, s.name, { fontSize: '15px', fontStyle: 'bold' }).setOrigin(0.5);
            btn.on('pointerdown', () => { selectedSkin = s.id; this.highlightSkin(s.id); });
            this[s.id + 'Btn'] = btn;
        });
        this.highlightSkin(selectedSkin);

        let startBtn = this.add.rectangle(V_WIDTH/2, 470, 250, 50, 0x4caf50).setInteractive();
        this.add.text(V_WIDTH/2, 470, 'START GAME', { fontSize: '22px', color: '#000', fontStyle: 'bold' }).setOrigin(0.5);
        startBtn.on('pointerdown', () => { this.scene.start('GameScene'); });
    }

    highlightSkin(id) {
        ['kuning', 'hijau', 'merah'].forEach(skin => {
            this[skin + 'Btn'].setStrokeStyle(skin === id ? 3 : 0, 0xffffff);
        });
    }
}

// --- SCENE 3: GAME UTAMA ---
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    preload() {
        this.makeSkin('part_kuning', 0xfbbf24, 0xd97706);
        this.makeSkin('part_hijau', 0x65a30d, 0x3f6212);
        this.makeSkin('part_merah', 0xdc2626, 0x7f1d1d);
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
        this.isTurboActive = false; // Status apakah lari cepat aktif
        this.playAreaHeight = isMobileMode ? 420 : 600;

        if (isMobileMode) {
            let line = this.add.graphics();
            line.lineStyle(4, 0x475569).lineBetween(0, 420, V_WIDTH, 420);
            this.createMobileControls();
        }

        for (let i = 0; i < 3; i++) {
            this.snake.create(300 - (i * GRID), 200, 'part_' + selectedSkin).setOrigin(0);
        }

        this.apples = this.physics.add.group();
        for (let i = 0; i < 3; i++) {
            let apple = this.apples.create(0, 0, 'apple').setOrigin(0);
            this.repositionSingleApple(apple);
        }

        this.scoreText = this.add.text(20, 20, 'SKOR: 0', { fontSize: '20px', fill: '#fff', fontStyle: 'bold' });
        
        // Setup Keyboard Input (Panah + WASD)
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,A,S,D');
    }

    createMobileControls() {
        const btnSize = 55; const cx = V_WIDTH / 2; const cy = 510;
        let btnUp = this.add.rectangle(cx, cy - 35, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx, cy - 35, '▲', { fontSize: '20px' }).setOrigin(0.5);
        let btnDown = this.add.rectangle(cx, cy + 35, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx, cy + 35, '▼', { fontSize: '20px' }).setOrigin(0.5);
        let btnLeft = this.add.rectangle(cx - 75, cy, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx - 75, cy, '◄', { fontSize: '20px' }).setOrigin(0.5);
        let btnRight = this.add.rectangle(cx + 75, cy, btnSize, btnSize, 0x475569).setInteractive();
        this.add.text(cx + 75, cy, '►', { fontSize: '20px' }).setOrigin(0.5);

        // Fitur Tahan Lama untuk Turbo di HP
        const setupTurboButton = (btn, dir, oppDir) => {
            btn.on('pointerdown', () => { 
                if (this.direction !== oppDir) this.nextDirection = dir; 
                this.isTurboActive = true; 
            });
            btn.on('pointerout', () => { this.isTurboActive = false; });
            btn.on('pointerup', () => { this.isTurboActive = false; });
        };

        setupTurboButton(btnUp, 'UP', 'DOWN');
        setupTurboButton(btnDown, 'DOWN', 'UP');
        setupTurboButton(btnLeft, 'LEFT', 'RIGHT');
        setupTurboButton(btnRight, 'RIGHT', 'LEFT');
    }

    update(time, delta) {
        if (this.isDead) return;

        // Cek Deteksi Input Keyboard Laptop (Panah atau WASD)
        let leftPressed = this.cursors.left.isDown || this.wasd.A.isDown;
        let rightPressed = this.cursors.right.isDown || this.wasd.D.isDown;
        let upPressed = this.cursors.up.isDown || this.wasd.W.isDown;
        let downPressed = this.cursors.down.isDown || this.wasd.S.isDown;

        if (leftPressed && this.direction !== 'RIGHT') this.nextDirection = 'LEFT';
        else if (rightPressed && this.direction !== 'LEFT') this.nextDirection = 'RIGHT';
        else if (upPressed && this.direction !== 'DOWN') this.nextDirection = 'UP';
        else if (downPressed && this.direction !== 'UP') this.nextDirection = 'DOWN';

        // Jika di laptop ada tombol yang sedang ditahan, aktifkan Turbo Akselerasi
        if (!isMobileMode) {
            this.isTurboActive = (leftPressed || rightPressed || upPressed || downPressed);
        }

        this.moveTimer += delta;
        // Menentukan jeda jalan berdasarkan status turbo aktif/tidak
        let currentInterval = this.isTurboActive ? SPEED_TURBO : SPEED_NORMAL;

        if (this.moveTimer > currentInterval) { 
            this.moveTimer = 0;
            this.handleMove();
        }
    }

    handleMove() {
        const body = this.snake.getChildren(); const head = body[0]; const oldPos = { x: head.x, y: head.y };
        this.direction = this.nextDirection;

        if (this.direction === 'LEFT') head.x -= GRID;
        else if (this.direction === 'RIGHT') head.x += GRID;
        else if (this.direction === 'UP') head.y -= GRID;
        else if (this.direction === 'DOWN') head.y += GRID;

        if (head.x < 0 || head.x >= V_WIDTH || head.y < 0 || head.y >= this.playAreaHeight) return this.die();

        let prevX = oldPos.x; let prevY = oldPos.y;
        for (let i = 1; i < body.length; i++) {
            if (head.x === body[i].x && head.y === body[i].y) return this.die();
            let tx = body[i].x; let ty = body[i].y;
            body[i].setPosition(prevX, prevY);
            prevX = tx; prevY = ty;
        }

        this.apples.getChildren().forEach(apple => {
            if (head.x === apple.x && head.y === apple.y) {
                this.score += 10; this.scoreText.setText('SKOR: ' + this.score);
                let lastPart = body[body.length - 1];
                this.snake.create(lastPart.x, lastPart.y, 'part_' + selectedSkin).setOrigin(0);
                this.repositionSingleApple(apple);
            }
        });
    }

    repositionSingleApple(apple) {
        let validPosition = false; let x, y; const body = this.snake.getChildren();
        while (!validPosition) {
            x = Phaser.Math.Between(0, (V_WIDTH / GRID) - 1) * GRID;
            y = Phaser.Math.Between(0, (this.playAreaHeight / GRID) - 1) * GRID;
            validPosition = true;
            for (let i = 0; i < body.length; i++) {
                if (body[i].x === x && body[i].y === y) { validPosition = false; break; }
            }
        }
        apple.setPosition(x, y);
    }

    die() {
        this.isDead = true; scoreHistory.push(this.score); scoreHistory.sort((a, b) => b - a);
        if (scoreHistory.length > 5) scoreHistory.pop();
        this.scene.launch('GameOverScene', { currentScore: this.score });
    }
}

// --- SCENE 4: GAME OVER ---
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    create(data) {
        this.add.rectangle(V_WIDTH/2, V_HEIGHT/2, V_WIDTH, V_HEIGHT, 0x000000, 0.8);
        this.add.text(V_WIDTH/2, 80, 'KAMU KALAH!', { fontSize: '42px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
        this.add.text(V_WIDTH/2, 140, 'SKOR KAMU: ' + data.currentScore, { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);

        this.add.text(V_WIDTH/2, 200, '─── RIWAYAT POIN TERTINGGI ───', { fontSize: '15px', fill: '#94a3b8' }).setOrigin(0.5);
        scoreHistory.forEach((score, index) => {
            let rankText = `Peringkat ${index + 1}: ${score} Poin`;
            if(score === data.currentScore && index === scoreHistory.indexOf(data.currentScore)) rankText += " ★";
            this.add.text(V_WIDTH/2, 230 + (index * 25), rankText, { 
                fontSize: '16px', fill: score === scoreHistory[0] ? '#fbbf24' : '#fff', fontStyle: score === scoreHistory[0] ? 'bold' : 'normal'
            }).setOrigin(0.5);
        });

        let restartBtn = this.add.rectangle(V_WIDTH/2, 430, 300, 45, 0x4caf50).setInteractive();
        this.add.text(V_WIDTH/2, 430, 'RESTART GAME', { fontSize: '18px', fontStyle: 'bold', color: '#000' }).setOrigin(0.5);

        let menuBtn = this.add.rectangle(V_WIDTH/2, 495, 300, 45, 0x607d8b).setInteractive();
        this.add.text(V_WIDTH/2, 495, 'KEMBALI KE MENU UTAMA', { fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => { this.scene.stop('GameScene'); this.scene.start('GameScene'); });
        menuBtn.on('pointerdown', () => { this.scene.stop('GameScene'); this.scene.start('DeviceSelectionScene'); });
    }
}

// --- ENGINE CONFIG ---
const config = {
    type: Phaser.AUTO,
    width: V_WIDTH,
    height: V_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0f172a',
    physics: { default: 'arcade' },
    scene: [DeviceSelectionScene, MenuScene, GameScene, GameOverScene]
};
const game = new Phaser.Game(config);