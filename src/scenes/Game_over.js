import Phaser from '../lib/phaser.js'

export default class GameOver extends Phaser.Scene{
    constructor(){
        super('game-over')
    }

    create(){
        const width = this.scale.width
        const height = this.scale.height

        // const value= `Carrots: ${this.carrotsCollected}`
        // this.carrotsCollectedText.text = value

        this.add.text(width*0.5, height*0.5, 'Game over!', {
            fontSize: 60
        })
        .setOrigin(0.5)
        this.add.text(width*0.5, height*0.8, 'press space to do over haha', {
            fontSize: 25
        })
        .setOrigin(0.5)

        this.input.keyboard.once('keydown-SPACE', ()=>{
            this.scene.start('game')
        })


    }
}
