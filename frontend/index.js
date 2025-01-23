/************************
***** DECLARATIONS: *****
************************/
let cvs         //  canvas
let ctx         //  context'2d'
let description //  game description
let theme1      //  original theme
let theme2      //  original them v2
let bg          //  background
let bird        //  bird: yellow
let bird1       //  bird: red
let bird2       //  bird: blue
let pipes       //  top and bottom pipes
let ground      //  ground floor
let getReady    //  get ready screen
let gameOver    //  game over screen
let map         //  map of number images
let score       //  score counter
let gameState   //  state of game
let frame       //  ms/frame = 17; dx/frame = 2; fps = 59;
let degree      //  bird rotation degree
const SFX_SCORE = new Audio()         //  sound for scoring
const SFX_FLAP = new Audio()          //  sound for flying bird
const SFX_COLLISION = new Audio()     //  sound for collision
const SFX_FALL = new Audio()          //  sound for falling to the ground
const SFX_SWOOSH = new Audio()        //  sound for changing game state

cvs = document.getElementById('game')
ctx = cvs.getContext('2d')
description = document.getElementById('description')
theme1 = new Image()
theme1.src = 'img/og-theme.png'
theme2 = new Image()
theme2.src = 'img/og-theme-2.png'
frame = 0;
degree = Math.PI/180
SFX_SCORE.src = 'audio/sfx_point.wav'
SFX_FLAP.src = 'audio/sfx_wing.wav'
SFX_COLLISION.src = 'audio/sfx_hit.wav'
SFX_FALL.src = 'audio/sfx_die.wav'
SFX_SWOOSH.src = 'audio/sfx_swooshing.wav'

gameState = {
    _current: 0,
    registration: 0,
    getReady: 1,
    play: 2,
    gameOver: 3,
    
    set current(value) {
        if (value === this.gameOver && this._current !== this.gameOver) {
            const player = JSON.parse(localStorage.getItem('currentPlayer'));
            if (player) {
                leaderboard.addScore(player.name, player.class, score.current);
            }
        }
        this._current = value;
    },
    get current() {
        return this._current;
    }
}

//background
bg = {
    //object's key-value properties pinpointing its location
    imgX: 0,
    imgY: 0,
    width: 276,
    height: 228,
    //x,y coordinates of where image should be drawn on canvas
    x: 0,
    //https://stackoverflow.com/questions/7043509/this-inside-object
    //reason why 'y' cannot be defined as this.height or bg.height
    y: cvs.height - 228,
    w: 276,
    h: 228,
    dx: .2,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function() {
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)

        //image repeat and tile to fit canvas
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x + this.width,this.y,this.w,this.h)

        //image repeat again for continuous animation
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x + this.width*2,this.y,this.w,this.h)
    },

    position: function () {
        //still img on get ready frame
        if (gameState.current == gameState.getReady) {
            this.x = 0
        }    
        //ANIMATION: slowly move background on play game state by decrementing x
        if (gameState.current == gameState.play) {
            this.x = (this.x-this.dx) % (this.w)
        }
    }
}
//top and bottom pipes
pipes = {
    //object's key-value properties pinpointing its location
    //top pipe image x,y coordinate
    top: {
        imgX: 56,
        imgY: 323,
    },
    //bot pipe image x,y coordinate
    bot: {
        imgX: 84,
        imgY:323,
    },
    width: 26,
    height: 160,
    //pipes' values for drawing on canvas
    w: 55,
    h: 300,
    gap: 85,
    dx: 2,
    //acceptable y values must be -260 <= y <= -40
    minY: -260,
    maxY: -40,
    
    pipeGenerator: [],
    
    reset: function() {
        this.pipeGenerator = []
    },
    //object's render function that utilizes all above values to draw image onto canvas
    render: function() {
        //draw whatever is in the pipeGenerator
        for (let i = 0; i < this.pipeGenerator.length; i++) {
            let pipe = this.pipeGenerator[i]
            let topPipe = pipe.y
            let bottomPipe = pipe.y + this.gap + this.h

            ctx.drawImage(theme2, this.top.imgX,this.top.imgY,this.width,this.height, pipe.x,topPipe,this.w,this.h)
            ctx.drawImage(theme2, this.bot.imgX,this.bot.imgY,this.width,this.height, pipe.x,bottomPipe,this.w,this.h)
        }
    },
    position: function() {
        //if game is not in session, do nothing
        if (gameState.current !== gameState.play) {
            return
        }
        //if game is in session, generate set of pipes forever
        if (gameState.current == gameState.play) {
            
            //when pipes reach this frame, generate another set
            if (frame%100 == 0) {
                this.pipeGenerator.push(
                    {
                        //spawn off canvas
                        //pipes' x value needs to be width of canvas to render outside
                        x: cvs.width,
                        //random y-coordinates
                        //pipes' y value needs to vary randomly within acceptable parameters
                        y: Math.floor((Math.random() * (this.maxY-this.minY+1)) + this.minY)
                    }
                )
            }
            //iterate for all pipes generated (animation, collision, deletion)
            for (let i = 0; i < this.pipeGenerator.length; i++) {

                //decleration for bird and pipes' parameters (COLLISION)
                let pg = this.pipeGenerator[i]
                let b = {
                    left: bird.x - bird.r,
                    right: bird.x + bird.r,
                    top: bird.y - bird.r,
                    bottom: bird.y + bird.r,
                }
                let p = {
                    top: {
                        top: pg.y,
                        bottom: pg.y + this.h
                    },
                    bot: {
                        top: pg.y + this.h + this.gap,
                        bottom: pg.y + this.h*2 + this.gap
                    },
                    left: pg.x,
                    right: pg.x + this.w
                }

                //ANIMATION: set of pipes scroll from the right of canvas by decrementing x
                pg.x -= this.dx
                
                //delete pipes as they scroll off the canvas (memory management)
                if(pg.x < -this.w) {
                    this.pipeGenerator.shift()
                        //score up
                        score.current++
                        SFX_SCORE.play()
                    }

                //PIPE COLLISION
                //collision with top pipe
                if (b.left < p.right &&
                    b.right > p.left &&
                    b.top < p.top.bottom &&
                    b.bottom > p.top.top) {
                        gameState.current = gameState.gameOver
                        SFX_COLLISION.play()
                        const player = JSON.parse(localStorage.getItem('currentPlayer'));
                        if (player) {
                            leaderboard.addScore(player.name, player.class, score.current);
                        }
                }
                //collision with bottom pipe
                if (b.left < p.right &&
                    b.right > p.left &&
                    b.top < p.bot.bottom &&
                    b.bottom > p.bot.top) {
                        gameState.current = gameState.gameOver
                        SFX_COLLISION.play()
                        const player = JSON.parse(localStorage.getItem('currentPlayer'));
                        if (player) {
                            leaderboard.addScore(player.name, player.class, score.current);
                        }
                }
            }
        }
    }
}
//ground floor
ground = {
    //object's key-value properties pinpointing its location
    imgX: 276,
    imgY: 0,
    width: 224,
    height: 112,
    //values for drawing on canvas
    x: 0,
    y:cvs.height - 112,
    w:224,
    h:112,
    dx: 2,
    render: function() {
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)
        //image repeat and tile to fit canvas
        ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x + this.width,this.y,this.w,this.h)
    },
    //ANIMATION:  ground scrolls to the left in a continuous loop when game state is at play
    //needs to be at the same rate of pipes' scroll speed
    position: function() {
        if (gameState.current == gameState.getReady) {
            this.x = 0
        }
        if (gameState.current == gameState.play) {
            //modulus keeps this.x value infinitely cycling back to zero
            this.x = (this.x-this.dx) % (this.w/2)
        }
    }
}
//map of number images
map = [
    num0 = {
        imgX: 496,
        imgY: 60,
        width: 12,
        height: 18
    },
    num1 = {
        imgX: 135,
        imgY: 455,
        width: 10,
        height: 18
    },
    num2 = {
        imgX: 292,
        imgY: 160,
        width: 12,
        height: 18
    },
    num3 = {
        imgX: 306,
        imgY: 160,
        width: 12,
        height: 18
    },
    num4 = {
        imgX: 320,
        imgY: 160,
        width: 12,
        height: 18
    },
    num5 = {
        imgX: 334,
        imgY: 160,
        width: 12,
        height: 18
    },
    num6 = {
        imgX: 292,
        imgY: 184,
        width: 12,
        height: 18
    },
    num7 = {
        imgX: 306,
        imgY: 184,
        width: 12,
        height: 18
    },
    num8 = {
        imgX: 320,
        imgY: 184,
        width: 12,
        height: 18
    },
    num9 = {
        imgX: 334,
        imgY: 184,
        width: 12,
        height: 18
    }    
]
//current score, top score, tracker
score = {
    current: 0,
    best: null, // DO THIS STRETCH GOAL
    //values for drawing mapped numbers on canvas
    x: cvs.width/2,
    y: 40,
    w: 15,
    h: 25,
    reset: function() {
        this.current = 0
    },
    //display the score
    render: function() {
        if (gameState.current == gameState.play ||
            gameState.current == gameState.gameOver) {
            //change current score number value to string value and access each place value
            let string = this.current.toString()
            let ones = string.charAt(string.length-1)
            let tens = string.charAt(string.length-2)
            let hundreds = string.charAt(string.length-3)

            //if current score has thousands place value: the game is over
            if (this.current >= 1000) {
                gameState.current = gameState.gameOver;
                // Add this:
                const player = JSON.parse(localStorage.getItem('currentPlayer'));
                if (player) {
                    leaderboard.addScore(player.name, player.class, score.current);
                }
            
            //if current score has ones, tens, and hundreds place value only
            } else if (this.current >= 100) {
                ctx.drawImage(theme2, map[ones].imgX,map[ones].imgY,map[ones].width,map[ones].height, ( (this.x-this.w/2) + (this.w) + 3 ),this.y,this.w,this.h)

                ctx.drawImage(theme2, map[tens].imgX,map[tens].imgY,map[tens].width,map[tens].height, ( (this.x-this.w/2) ),this.y,this.w,this.h)

                ctx.drawImage(theme2, map[hundreds].imgX,map[hundreds].imgY,map[hundreds].width,map[hundreds].height, (   (this.x-this.w/2) - (this.w) - 3 ),this.y,this.w,this.h)

            //if current score has ones and tens place value only
            } else if (this.current >= 10) {
                ctx.drawImage(theme2, map[ones].imgX,map[ones].imgY,map[ones].width,map[ones].height, ( (this.x-this.w/2) + (this.w/2) + 3 ),this.y,this.w,this.h)

                ctx.drawImage(theme2, map[tens].imgX,map[tens].imgY,map[tens].width,map[tens].height, ( (this.x-this.w/2) - (this.w/2) - 3 ),this.y,this.w,this.h)
            
            //if current score has ones place value only
            } else {
                ctx.drawImage(theme2, map[ones].imgX,map[ones].imgY,map[ones].width,map[ones].height, ( this.x-this.w/2 ),this.y,this.w,this.h)
            }
        }
    }
}    
//bird : YELLOW BIRD
bird = {
    animation: [
        {imgX: 276, imgY: 114},  //  position 0
        {imgX: 276, imgY: 140},  //  position 1
        {imgX: 276, imgY: 166},  //  position 2
        {imgX: 276, imgY: 140}   //  position 1
    ],
    fr: 0,
    //object's key-value properties pinpointing its location
    width: 34,
    height: 24,
    //values for drawing on canvas
    x: 50,
    y: 160,
    w: 34,
    h: 24,
    //bird's radius
    r: 12,
    //how much the bird flies per flap()
    fly: 4.6,
    //gravity increments the velocity per frame
    gravity: 0.25,
    //velocity = pixels the bird will drop in a frame
    velocity: 0,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function() {
        let bird = this.animation[this.fr]
        //save all previous setting
        ctx.save()
        //target center of bird
        ctx.translate(this.x, this.y)
        //rotate bird by degree
        ctx.rotate(this.rotation)
        ctx.drawImage(theme1, bird.imgX,bird.imgY,this.width,this.height, -this.w/2,-this.h/2,this.w,this.h)
        ctx.restore()
        //bird is centered on x,y position
        // ctx.drawImage(theme1, bird.imgX,bird.imgY,this.width,this.height, this.x-this.w/2,this.y-this.h/2,this.w,this.h)
    },
    //bird flies
    flap: function() {
        this.velocity = - this.fly
    },
    //function checks gameState and updates bird's position
    position: function() {
        if (gameState.current == gameState.getReady) {
            this.y = 160
            this.rotation = 0 * degree
            //bird animation changes every 20 frames
            if (frame%20 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

        } else {
            //bird animation changes every 4 frames
            if (frame%4 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

            //bird falls to gravity
            this.velocity += this.gravity
            this.y += this.velocity

            //bird rotation
            if (this.velocity <= this.fly) {
                this.rotation = -15 * degree
            } else if (this.velocity >= this.fly+2) {
                this.rotation = 70 * degree
                this.fr = 1
            } else {
                this.rotation = 0
            }

            //check collision with ground
            if (this.y+this.h/2 >= cvs.height-ground.h) {
                this.y = cvs.height-ground.h - this.h/2
                //stop flapping when it hits the ground
                if (frame%1 == 0) {
                    this.fr = 2
                    this.rotation = 70 * degree
                }
                //then the game is over
                if (gameState.current == gameState.play) {
                    gameState.current = gameState.gameOver
                    SFX_FALL.play()
                    const player = JSON.parse(localStorage.getItem('currentPlayer'));
                    if (player) {
                        leaderboard.addScore(player.name, player.class, score.current);
                    }
                }
            }
            
            //bird cannot fly above canvas
            if (this.y-this.h/2 <= 0) {
                this.y = this.r
            }

        }
    }
}
//bird1 : RED BIRD
bird1 = {
    //ANIMATION: bird  //DO THIS STRETCH GOAL
    animation: [
        {imgX: 115, imgY: 381},  //  position 0
        {imgX: 115, imgY: 407},  //  position 1
        {imgX: 115, imgY: 433},  //  position 2
        {imgX: 115, imgY: 407}   //  position 1
    ],
    fr: 0,
    //object's key-value properties pinpointing its location
    width: 18,
    height: 12,
    //values for drawing on canvas
    x: 50,
    y: 160,
    w: 34,
    h: 24,
    //bird's radius
    r: 12,
    //how much the bird flies per flap()
    fly: 5.25,
    //gravity increments the velocity per frame
    gravity: .32,
    //velocity = pixels the bird will drop in a frame
    velocity: 0,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function() {
        let bird = this.animation[this.fr]
        //bird is centered on x,y position
        ctx.drawImage(theme2, bird.imgX,bird.imgY,this.width,this.height, this.x-this.w/2,this.y-this.h/2,this.w,this.h)
    },
    //bird flies
    flap: function() {
        this.velocity = - this.fly
    },
    //function checks gameState and updates bird's position
    position: function() {
        if (gameState.current == gameState.getReady) {
            this.y = 160
            //bird animation changes every 20 frames
            if (frame%20 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

        } else {
            //bird animation changes every 4 frames
            if (frame%4 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

            //bird falls to gravity
            this.velocity += this.gravity
            this.y += this.velocity

            //check collision with ground
            if (this.y+this.h/2 >= cvs.height-ground.h) {
                this.y = cvs.height-ground.h - this.h/2
                //stop flapping when it hits the ground
                if (frame%1 == 0) {
                    this.fr = 2
                }
                //then the game is over
                if (gameState.current == gameState.play) {
                    gameState.current = gameState.gameOver
                    SFX_FALL.play()
                    const player = JSON.parse(localStorage.getItem('currentPlayer'));
                    if (player) {
                        leaderboard.addScore(player.name, player.class, score.current);
                    }
                }
            }
            
            //bird cannot fly above canvas
            if (this.y-this.h/2 <= 0) {
                this.y = this.r
            }
        }
    }
}
//bird2 : BLUE BIRD
bird2 = {
    //ANIMATION: bird  //DO THIS STRETCH GOAL
    animation: [
        {imgX: 87, imgY: 491},   //  position 0
        {imgX: 115, imgY: 329},  //  position 1
        {imgX: 115, imgY: 355},  //  position 2
        {imgX: 115, imgY: 329}   //  position 1
    ],
    fr: 0,
    //object's key-value properties pinpointing its location
    //ANIMATION: bird2  //DO THIS STRETCH GOAL
    imgX: 87,
    imgY: 491,
    width: 18,
    height: 12,
    //values for drawing on canvas
    x: 50,
    y: 160,
    w: 34,
    h: 24,
    //bird's radius
    r: 12,
    //how much the bird flies per flap()
    fly: 5.25,
    //gravity increments the velocity per frame
    gravity: .32,
    //velocity = pixels the bird will drop in a frame
    velocity: 0,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function() {
        let bird = this.animation[this.fr]
        //bird is centered on x,y position
        ctx.drawImage(theme2, bird.imgX,bird.imgY,this.width,this.height, this.x-this.w/2,this.y-this.h/2,this.w,this.h)
    },
    //bird flies
    flap: function() {
        this.velocity = - this.fly
    },
    //function checks gameState and updates bird's position
    position: function() {
        if (gameState.current == gameState.getReady) {
            this.y = 160
            //bird animation changes every 20 frames
            if (frame%20 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

        } else {
            //bird animation changes every 4 frames
            if (frame%4 == 0) {
                this.fr += 1
            }
            //when bird animation reaches its last value, reset animation
            if (this.fr > this.animation.length - 1) {
                this.fr = 0
            }

            //bird falls to gravity
            this.velocity += this.gravity
            this.y += this.velocity

            //check collision with ground
            if (this.y+this.h/2 >= cvs.height-ground.h) {
                this.y = cvs.height-ground.h - this.h/2
                //stop flapping when it hits the ground
                if (frame%1 == 0) {
                    this.fr = 2
                }
                //then the game is over
                if (gameState.current == gameState.play) {
                    gameState.current = gameState.gameOver
                    SFX_FALL.play()
                    const player = JSON.parse(localStorage.getItem('currentPlayer'));
                    if (player) {
                        leaderboard.addScore(player.name, player.class, score.current);
                    }
                }
            }
            
            //bird cannot fly above canvas
            if (this.y-this.h/2 <= 0) {
                this.y = this.r
            }
        }
    }
}
//get ready screen
getReady = {
    //object's key-value properties pinpointing its location
    imgX: 0,
    imgY: 228,
    width: 174,
    height: 160,
    //values for drawing on canvas
    x: cvs.width/2 - 174/2,
    y: cvs.height/2 - 160,
    w: 174,
    h: 160,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function() {
        //only draw this if the game state is on get ready
        if (gameState.current == gameState.getReady) {    
            ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)
        }
    }
}
//game over screen
gameOver = {
    //object's key-value properties pinpointing its location
    imgX: 174,
    imgY: 228,
    width: 226,
    height: 40,
    //values for drawing on canvas
    x: cvs.width/2 - 226/2,
    y: cvs.height/2 - 120,
    w: 226,
    h: 50,
    //object's render function that utilizes all above values to draw image onto canvas
    render: function() {
        if (gameState.current == gameState.gameOver) {
            ctx.drawImage(theme1, this.imgX,this.imgY,this.width,this.height, this.x,this.y,this.w,this.h)
            description.style.visibility = "visible"
            
            // Display leaderboard
            const scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
            ctx.fillStyle = 'black';
            ctx.font = '15px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Top Scores:', cvs.width/2, this.y + this.h + 30);
            
            scores.slice(0, 5).forEach((entry, i) => {
                ctx.fillText(`${entry.name} (${entry.class}): ${   entry.score}`, 
                    cvs.width/2, this.y + this.h + 50 + (i * 20));
            });

            (e) => {
                if (e.keyCode == 32) {
                    switch(gameState.current) {
                        case gameState.gameOver:
                            pipes.reset();
                            score.reset();
                            gameState.current = gameState.getReady;
                            SFX_SWOOSH.play();
                            break;
                        case gameState.getReady:
                            gameState.current = gameState.play;
                            break;
                        case gameState.play:
                            bird.flap();
                            SFX_FLAP.play();
                            description.style.visibility = "hidden";
                            break;
                    }
                }
            }
        }
    }
}

// Add registration screen object
const registration = {
    active: true,
    render: function() {
        if (gameState.current === gameState.registration) {
            // Draw semi-transparent overlay
            // ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            // ctx.fillRect(0, 0, cvs.width, cvs.height);
            
            // // Draw registration box
            // ctx.fillStyle = 'white';
            // ctx.fillRect(50, 150, cvs.width - 100, 200);
            
            // // Draw text
            // ctx.fillStyle = 'black';
            // ctx.font = '20px Arial';
            // ctx.textAlign = 'center';
            // ctx.fillText('Enter Your Details', cvs.width/2, 190);
        }
    }
}

// Add leaderboard functionality
const leaderboard = {
    scores: [],
    
    addScore: function(playerName, playerClass, score) {
        const entry = {
            name: playerName,
            class: playerClass,
            score: score,
            date: new Date().toISOString()
        };
        
        // Get existing scores
        let scores = JSON.parse(localStorage.getItem('leaderboard') || '[]');

        const existingEntryIndex = scores.findIndex(entry => 
            entry.name === playerName && entry.class === playerClass
        );
        
        if (existingEntryIndex !== -1) {
            // If entry exists, update score only if new score is higher
            if (score > scores[existingEntryIndex].score) {
                scores[existingEntryIndex].score = score;
                scores[existingEntryIndex].date = new Date().toISOString();
            }
        } else {
            scores.push(entry);
        }
        
        // Sort by score (highest first)
        scores.sort((a, b) => b.score - a.score);
        
        // Keep only top 10
        scores = scores.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('leaderboard', JSON.stringify(scores));
        this.scores = scores;
    }
}

// Create and append registration form
const createRegistrationForm = () => {
    const form = document.createElement('div');
    form.id = 'registration-form';
    form.innerHTML = `
        <input type="text" id="player-name" placeholder="WHO ARE YOU?" required>
        <select id="player-class" required>
            <option value="">FROM?</option>

            <option value="CS2A">CS2A</option>
            <option value="CS4A">CS4A</option>
            <option value="CS6A">CS6A</option>
            <option value="CS8A">CS8A</option>

            <option value="CS2B">CS2B</option>
            <option value="CS4B">CS4B</option>
            <option value="CS6B">CS6B</option>
            <option value="CS8B">CS8B</option>

            <option value="CS2C">CS2C</option>
            <option value="CS4C">CS4C</option>
            <option value="CS6C">CS6C</option>
            <option value="CS8C">CS8C</option>

            <option value="CU2">CU2</option>
            <option value="CU4">CU4</option>
            <option value="CU6">CU6</option>

            <option value="EC2">EC2</option>
            <option value="EC4">EC4</option>
            <option value="EC6">EC6</option>
            <option value="EC8">EC8</option>

            <option value="EV2">EV2</option>
            <option value="EV4">EV4</option>

            <option value="EE2">EE2</option>
            <option value="EE4">EE4</option>
            <option value="EE6">EE6</option>
            <option value="EE8">EE8</option>

            <option value="ME2">ME2</option>
            <option value="ME4">ME4</option>
            <option value="ME6">ME6</option>
            <option value="ME8">ME8</option>

            <option value="EB2">EB2</option>
            <option value="EB4">EB4</option>
            <option value="EB6">EB6</option>
            <option value="EB8">EB8</option>

            <option value="OTHER">OTHER</option>
        </select>
        <button id="start-game">Start Game</button>
        <p>Enter Your Details to Continue</p>
        <a onclick="window.location.href='../'" style="margin-top: 10px; color:rgb(121, 37, 37); font-size: 19px; text-decoration-line: underline; cursor: pointer">Go Back</a>
        
    `;
    document.body.appendChild(form);
    
    // Add event listener to start button
    document.getElementById('start-game').addEventListener('click', () => {
        const name = document.getElementById('player-name').value;
        const playerClass = document.getElementById('player-class').value;
        
        if (name && playerClass) {
            // Store player info
            localStorage.setItem('currentPlayer', JSON.stringify({
                name: name,
                class: playerClass
            }));
            
            // Hide form and start game
            form.style.display = 'none';
            gameState.current = gameState.getReady;
        }
    });
}

/************************
***** FUNCTIONS: ********
************************/
//anything to be drawn on canvas goes in here
let draw = () => {
    //this clears canvas to default bg color
    ctx.fillStyle = '#00bbc4'
    ctx.fillRect(0,0, cvs.width,cvs.height)
    //things to draw
    bg.render()
    pipes.render()
    ground.render()
    score.render()
    bird.render()
    getReady.render()
    gameOver.render()
}
//updates on animation and position goes in here
let update = () => {
    //things to update
    bird.position()
    bg.position()
    pipes.position()
    ground.position()
}
//game looper
let loop = () => {
    // Only draw and update if we're past registration
    if (gameState.current !== gameState.registration) {
        draw()
        update()
        frame++
    } else {
        // Clear canvas with background color when in registration
        ctx.fillStyle = '#00bbc4'
        ctx.fillRect(0, 0, cvs.width, cvs.height)
        registration.render()
    }
}
loop()
setInterval(loop, 17)

/*************************
***** EVENT HANDLERS ***** 
*************************/
// on mouse click // tap screen
cvs.addEventListener('click', () => {
    switch(gameState.current) {
        case gameState.gameOver:
            pipes.reset();
            score.reset();
            bird.velocity = 0;
            gameState.current = gameState.getReady;
            SFX_SWOOSH.play();
            break;
        case gameState.getReady:
            gameState.current = gameState.play;
            break;
        case gameState.play:
            bird.flap();
            SFX_FLAP.play();
            description.style.visibility = "hidden";
            break;
    }
});

// on spacebar
document.body.addEventListener('keydown', (e) => {
    if (e.keyCode == 32) {
        switch(gameState.current) {
            case gameState.gameOver:
                pipes.reset();
                score.reset();
                bird.velocity = 0;
                gameState.current = gameState.getReady;
                SFX_SWOOSH.play();
                break;
            case gameState.getReady:
                gameState.current = gameState.play;
                break;
            case gameState.play:
                bird.flap();
                SFX_FLAP.play();
                description.style.visibility = "hidden";
                break;
        }
    }
});

// Initialize the game
window.onload = () => {
    createRegistrationForm();
    gameState.current = gameState.registration;
    loop();
}