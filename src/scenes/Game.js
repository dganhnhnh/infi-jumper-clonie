import Phaser from '../lib/phaser.js'

import Carrot from '../game/Carrot.js'

import Predator from '../game/Predator.js'

import Shit from '../game/Shit.js'

export default class Game extends Phaser.Scene{

    carrotsCollected =0

    /**@type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    /**@type {Phaser.Physics.Arcade.StaticGroup} */
    platforms
    /**@type {Phaser.Physics.Arcade.StaticGroup} */
    portals

    /**@type {Phaser.Physics.Arcade.Sprite} */
    player

    /**@type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors

    /**@type {Phaser.Physics.Arcade.Group} */
    carrots

    /**@type {Phaser.Physics.Arcade.Group*/
    predators

    /**@type {Phaser.Physics.Arcade.Group*/
    shits

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
        this.load.image('pred', 'assets/predator.png')
        this.load.image('shit', 'assets/shit.png')
        this.load.image('portal','assets/leap_hole.png')

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
        this.portals = this.physics.add.staticGroup().setDepth(1)
        

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

        //add holes
        for(let i=0;i<3;++i){
            const x=Phaser.Math.Between(80,400)
            const y=300*i

            /** @type {Phaser.Physics.Arcade.Sprite} */
            const portal = this.portals.create(x,y,'portal')
            // platform.scale =0.5

            /** @type {Phaser.Physics.Arcade.StaticBody}*/
            const body =portal.body
            body.updateFromGameObject()
        }

        this.player = this.physics.add.sprite(240,180,'bunny_stand')
            .setScale(0.5)

        this.physics.add.collider(this.platforms,this.player)
        // this.physics.add.collider(this.portals,this.player)

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
        this.predators = this.physics.add.group({
            classType: Predator
        })
        this.shits = this.physics.add.group({
            classType: Shit
        })


        this.physics.add.collider(this.platforms, this.carrots)
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot,
            undefined,
            this            //scope
        )

        this.physics.add.collider(this.platforms, this.predators)
        this.physics.add.overlap(
            this.player,
            this.predators,
            this.handleBeingEaten,
            undefined,
            this            //scope
        )

        this.physics.add.overlap(
            this.player,
            this.shits,
            this.handleBeingPoopedOn,
            undefined,
            this            //scope
        )
        //how to make it: pooped on 3 times,dead

        
        const style = {color:'pink', fontsize:40}
        this.carrotsCollectedText = this.add.text(240,10,'Carrots: 0', style)
            .setScrollFactor(0)
            .setOrigin(0.5,0)  
        
    }
    update(){

        const touchingDown =this.player.body.touching.down
        // this.handleMovement(this.player, this.cursors)

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
            const platforms = this.platforms.getChildren()

            const scrollY = this.cameras.main.scrollY

            if(platform.y >=scrollY+700){
                platform.y = scrollY -Phaser.Math.Between(50,100)
                platform.x=Phaser.Math.Between(50,400)
                platform.body.updateFromGameObject()

                this.addCarrotsAbove(platform)

                if(this.carrotsCollected>1 && this.carrotsCollected%5 === 0){
                    this.addPredatorsAbove(platform)
                }

                //still not a good algo

                // for(let i=0;i<1000;i++){
                //     if (i%40===0){
                //         this.addPredatorsAbove(platforms[Phaser.Math.Between(0,4)])
                //     }
                // }

                // why this doesn't work??
                if(this.carrotsCollected>=10){this.addShitsFromSky()}
            }
            
        })

        this.portals.children.iterate(child=>{
            /**@type {Phaser.Physics.Arcade.Sprite} */
            const portal =child
            const portals = this.portals.getChildren()

            const scrollY = this.cameras.main.scrollY

            if(portal.y >=scrollY+700){
                portal.y = scrollY -Phaser.Math.Between(50,100)
                portal.x=Phaser.Math.Between(50,400)
                portal.body.updateFromGameObject()
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
            this.player.setVelocity(-400)
            this.player.setTexture('bunny_jump')
            
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

        const upperPortal = this.findUpperPortal()
        // if()
        
        this.physics.add.overlap(
            this.player,
            this.portals,
            this.teleportLol,
            undefined,
            this            
        )                    //collide with portal, call a function
        

        
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

    
    addShitsFromSky(){
        /**@type {Phaser.Physics.Arcade.Sprite} */
        const shit = this.shits.get(Phaser.Math.Between(10,470),this.cameras.main.scrollY-320,'shit')
        shit.setActive(true)                //if this.scrollY, outcome is carrot!!
        shit.setVisible(true)

        this.add.existing(shit)

        this.physics.world.enable(shit)
        return shit
        
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
     * @param {Phaser.GameObjects.Sprite} sprite 
     */
    addPredatorsAbove(sprite){
        const y=sprite.y - sprite.displayHeight

        /**@type {Phaser.Physics.Arcade.Sprite} */
        const predator = this.predators.get((sprite.x - (Phaser.Math.Between(-50,50))), y,'pred')

        //set active and visible
        predator.setActive(true)
        predator.setVisible(true)
        
        this.add.existing(predator)

        predator.body.setSize(predator.width,predator.height)

        //enable body in physics world
        this.physics.world.enable(predator)

        return predator
    }


    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Phaser.Types.Input.Keyboard.CursorKeys} cursors
     */
    handleMovement(player,cursors){
        const touchingDown = player.body.touching.down

        player.setVelocityX(0)
        if(cursors.left.isDown && !touchingDown){
            player.setVelocityX(-400)
            cursors.left.isDown = false
        }
        else if(cursors.right.isDown && !touchingDown){
            player.setVelocityX(400)
            cursors.right.isDown=false
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

        
    }
    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Predator} predator
     */
    handleBeingEaten(player, predator){
        this.scene.start('game-over')
        
    }
    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Shit} shit
     */
     handleBeingPoopedOn(player, shit){
        this.scene.start('game-over')
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
    findUpperPortal(){
        const portals = this.portals.getChildren()
        let upperPortal = portals[0]

        for(let i=1; i<portals.length; ++i){
            const portal = portals[i]

            if(portal.y > upperPortal.y){continue}
            upperPortal = portal
        }

        return upperPortal
    }
    /**@param {Phaser.Physics.Arcade.Sprite} player */
    teleportLol(player){
        const upperPortal = this.findUpperPortal()
        player.x = upperPortal.x
        player.y = upperPortal.y
    }

}