import Phaser from '../lib/phaser.js'

import Carrot from '../game/Carrot.js'

export default class Game extends Phaser.Scene{

    carrotsCollected =0

    /**@type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    /**@type {Phaser.Physics.Arcade.StaticGroup} */
    platforms

    /**@type {Phaser.Physics.Arcade.Sprite} */
    player

    /**@type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    /**@type {Phaser.Physics.Arcade.Group} */
    carrots

    constructor(){
        super('game')       //defining a unique key
    }

    init(){
        this.carrotsCollected=0
    }

    preload(){          //to specify assets
        this.load.image('background', 'assets/bg_layer1.png')
        this.load.image('platform', 'assets/grass.png')

        this.load.image('bunny_stand','assets/bunny_stand.png')
        this.load.image('bunny_jump', 'assets/bunny_jump.png')
        this.load.image('carrot','assets/carrot.png')

        this.load.audio('jump', 'assets/sfx/jump.mp3')
        this.load.audio('nom-nom', 'assets/sfx/nomnom.mp3')

        this.cursors = this.input.keyboard.createCursorKeys()
        
    }

    create(){
        this.add.image(240,320, 'background')
            .setScrollFactor(1,0)
        // this.physics.add.staticImage(240,320, 'platform')
        //     .setScale(0.5)

        this.platforms = this.physics.add.staticGroup()

        for(let i=0;i<5;++i){
            const x=Phaser.Math.Between(80,400)
            const y=150*i

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x,y,'platform')
            platform.scale =0.5

            /** @type {Phaser.Physics.Arcade.StaticBody}*/
            const body =platform.body
            body.updateFromGameObject()
        }

        this.player = this.physics.add.sprite(240,180,'bunny_stand')
            .setScale(0.5)

        this.physics.add.collider(this.platforms,this.player)

        this.player.body.checkCollision.up =false
        this.player.body.checkCollision.left =false
        this.player.body.checkCollision.right =false

        this.cameras.main.startFollow(this.player)

        this.cameras.main.setDeadzone(this.scale.width *1.5)

        // const carrot = new Carrot(this,240,320,'carrot')
        // this.add.existing(carrot)

        this.carrots = this.physics.add.group({
            classType: Carrot
        })

        this.physics.add.collider(this.platforms, this.carrots)

        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot,
            undefined,
            this            //scope
        )

        
        const style = {color:'pink', fontsize:40}
        this.carrotsCollectedText = this.add.text(240,10,'Carrots: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5,0)  
        
    }
    update(){
        const touchingDown =this.player.body.touching.down

        this.player.setVelocityX(0)
        if(this.cursors.left.isDown && !touchingDown){
            this.player.setVelocityX(-300)
            this.cursors.left.isDown = false
        }
        else if(this.cursors.right.isDown && !touchingDown){
            this.player.setVelocityX(300)
            this.cursors.right.isDown=false
        }
        else{this.player.setVelocityX(0)}

        if(this.cameras.main.scrollY >= Math.pow(10,9)){
            this.cameras.main.scrollY=0
        }

        this.platforms.children.iterate(child=>{
            /**@type {Phaser.Physics.Arcade.Sprite} */
            const platform =child

            const scrollY = this.cameras.main.scrollY

            if(platform.y >=scrollY+700){
                platform.y = scrollY -Phaser.Math.Between(50,100)
                platform.x=Phaser.Math.Between(50,400)
                platform.body.updateFromGameObject()

                this.addCarrotsAbove(platform)
            }
        })


        //improvise to delete skipped-over carrots

        this.carrots.children.iterate(child=>{
            /**@type {Phaser.Physics.Arcade.Sprite} */
            const carrot =child

            const scrollY = this.cameras.main.scrollY

            if(carrot.y >=scrollY+700){
                this.carrots.killAndHide(carrot)
                this.physics.world.disableBody(carrot.body)
            }
        })


        if(touchingDown){
            this.player.setVelocity(-500)
            this.player.setTexture('bunny_jump')
            this.sound.play('jump')
        }
        const veloY = this.player.body.velocity.y
        if(veloY >0 && this.player.texture.key !== 'bunny_stand'){
            this.player.setTexture('bunny_stand')
        }
        this.horizontalWrap(this.player)

        

        const bottomPlatform = this.findBottommostPlatform()
        if (this.player.y > bottomPlatform.y +200){
            
            this.scene.start('game-over')
            
        }
        
    }
    /**
     * 
     * @param {Phaser.GameObjects.Sprite} sprite 
     */
    horizontalWrap(sprite){
        const halfWidth =sprite.displayWidth*0.5
        const gameWidth = this.scale.width
        if(sprite.x < -halfWidth){
            sprite.x =gameWidth + halfWidth
        }
        else if(sprite.x > gameWidth + halfWidth){
            sprite.x = -halfWidth
        }
    }
    
    /**
     * @param {Phaser.GameObjects.Sprite} sprite 
     */
    addCarrotsAbove(sprite){
        const y=sprite.y - sprite.displayHeight

        /**@type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get((sprite.x - (Phaser.Math.Between(-40,40))), y,'carrot')

        //set active and visible
        carrot.setActive(true)
        carrot.setVisible(true)
        
        this.add.existing(carrot)

        carrot.body.setSize(carrot.width,carrot.height)

        //enable body in physics world
        this.physics.world.enable(carrot)

        return carrot
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors
     */
    handleMovement(player,cursors){

        const touchingDown =this.player.body.touching.down
        //dont miss this
        
        this.player.setVelocityX(0)
        if(this.cursors.left.isDown && !touchingDown){
            this.player.setVelocityX(-150)
        }
        else if(this.cursors.right.isDown && !touchingDown){
            this.player.setVelocityX(150)
        } 
        
        
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Carrot} carrot
     */

    handleCollectCarrot(player, carrot){
        this.carrots.killAndHide(carrot)
        this.physics.world.disableBody(carrot.body)

        this.carrotsCollected++

        const value= `Carrots: ${this.carrotsCollected}`
        this.carrotsCollectedText.text = value

        this.sound.play('nom-nom')
    }

    findBottommostPlatform(){
        const platforms = this.platforms.getChildren()
        let bottomPlatform = platforms[0]

        for(let i=1; i<platforms.length; ++i){
            const platform = platforms[i]

            if(platform.y < bottomPlatform.y){continue}
            bottomPlatform = platform
        }

        return bottomPlatform
    }
}