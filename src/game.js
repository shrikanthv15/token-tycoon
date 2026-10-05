import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }
  preload() {
    // Load UI assets (example placeholder)
    this.load.image('panel', 'assets/ui/ui-panel.png');
    // TODO: load other assets like icons, job sprites
  }
  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width/2, height/2, width*0.9, height*0.9, 0x001a33).setStrokeStyle(2, 0x00ffff);
    this.add.text(20,20, 'Token Tycoon v1 prototype', {font: '24px monospace', fill:'#0ff'});
    // Department HUD label
    this.deptHud = this.add.text(20,70, 'Current: Dept 1', {font: '20px monospace', fill:'#0ff'});
    // Add placeholder belt
    this.add.rectangle(width/2, height-100, width*0.8, 50, 0x003355).setOrigin(0.5);
    // Model roster cards (7 models)
    for(let i=0;i<7;i++){
      const x=100 + i*150; const y=height-200;
      const rect = this.add.rectangle(x,y,120,180,0x004466).setStrokeStyle(2,0x00ffff);
      const txt = this.add.text(x-50, y-10, `Model ${i+1}`, {font:'16px monospace', fill:'#0ff'});
      // Make the rectangle interactive for clicks
      rect.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        console.log(`Model ${i+1} selected`);
        // Highlight selection
        rect.setFillStyle(0x006688);
      });
    }
    // Tokens and profit display
    this.tokens = 1000;
    this.profit = 0;
    this.tokenText = this.add.text(20,50, `Tokens: ${this.tokens}`, {font:'20px monospace', fill:'#0ff'});
    this.profitText = this.add.text(20,80, `Profit: ${this.profit}`, {font:'20px monospace', fill:'#0ff'});
  }
  update(time, delta){
    // placeholder update loop
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#000',
  scene: [MainScene]
};

new Phaser.Game(config);
