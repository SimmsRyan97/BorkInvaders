import processing.core.*; 
import processing.data.*; 
import processing.event.*; 
import processing.opengl.*; 

import ddf.minim.*; 
import java.io.BufferedWriter; 
import java.io.FileWriter; 
import controlP5.*; 
import java.util.Arrays; 
import java.util.Comparator; 

import ddf.minim.javasound.*; 
import ddf.minim.*; 
import ddf.minim.analysis.*; 
import ddf.minim.effects.*; 
import ddf.minim.signals.*; 
import ddf.minim.spi.*; 
import ddf.minim.ugens.*; 
import javazoom.spi.*; 
import javazoom.spi.mpeg.sampled.convert.*; 
import javazoom.spi.mpeg.sampled.file.*; 
import javazoom.spi.mpeg.sampled.file.tag.*; 
import org.tritonus.sampled.file.*; 
import org.tritonus.share.*; 
import org.tritonus.share.midi.*; 
import org.tritonus.share.sampled.*; 
import org.tritonus.share.sampled.convert.*; 
import org.tritonus.share.sampled.file.*; 
import org.tritonus.share.sampled.mixer.*; 

import java.util.HashMap; 
import java.util.ArrayList; 
import java.io.File; 
import java.io.BufferedReader; 
import java.io.PrintWriter; 
import java.io.InputStream; 
import java.io.OutputStream; 
import java.io.IOException; 

public class BorkInvaders extends PApplet {

//Main

 //Allows sounds to be used in game
 //Allows scoreboard





//Global Variables
AudioPlayer shoot, hit, menu, gameOver, extra, inGame, yeeSound, death; //Sounds
PImage splash, controls, game, ship, ship2, defender, bork, drop, yee, heart, scoreBackground; //Images
PFont roboto; //Custom font
Minim minim; //Allows sounds and music
Defender player; //Adds variables from Defender class
SpaceShip yeee; //Adds flying ship
ExtraLife lifeUp; //Adds life + 1 powerup
PrintWriter scoreboardWrite;
ControlP5 cp5;
int gameMode; //Game starts on main menu
int score; //Score start at 0
int highScore; //Highscore is 0 until beaten
int lives = 3; //Player begins with 5 lives
int x = 25; //Starting x point for aliens
int y = 50; //Starting y point for aliens
int speed; //Alien speed adapts to screen size;
int level = 1; //Level begins at 1;
int rows = 4; //Number of rows in 2D array
int columns = 15; //Number of columns in 2D array
int alienCounter = 0; //Counts number of aliens hit
float animationCounter = 0; //Keeps track of animations
int alienMissileCounter; //Keeps track of when aliens shoot
int yeeCounter; //Determines when spaceship flies across screen
int spaceShipShoot = 0;
boolean moveLeft;
boolean moveRight;
boolean shooting;
int shootTimer, extraLifeCounter;
boolean runonce = false;
float pw;
String outFileName = "scoreboard.txt";
String initials;

//Arrays
Aliens[][] alien = new Aliens[columns][rows]; // Creates a 2D array of aliens
ArrayList <Missile> missile = new ArrayList<Missile>(); //Creates a new array of missiles
ArrayList <MissileAlien> missileAlien = new ArrayList<MissileAlien>(); //Creates a new array of missiles from alien

String[] menuMusic = {
  "h3h3.wav", "all_star.wav", "rick_roll.wav"
};

String[] symbol = {
  "Reddit_Logo.png", "4Chan_Logo.png"
};

String[]inGameMusic = {
  "shooting_stars.wav", "vitas.wav", "mask_off.wav", "numa_numa.wav", "heyye.wav"
};

String[] scoreboard;

public void setup() {
   //Game is fullscreen
  rectMode(CENTER); //Center of the shape
  textAlign(CENTER, CENTER); //Aligns text to center
  minim = new Minim(this);
  shoot = minim.loadFile("shoot.wav"); //Loads custom sound
  hit = minim.loadFile("hit.wav"); //Loads custom sound
  yeeSound = minim.loadFile("yee.wav");
  death = minim.loadFile("death.wav");
  splash = loadImage("Splash.png"); //Loads custom image
  splash.resize(width, height);
  controls = loadImage("Controls.png"); //Loads custom image
  controls.resize(width, height);
  game = loadImage("inGame.png"); //Loads custom image
  game.resize(width, height);
  scoreBackground = loadImage("scoreboard.png");
  scoreBackground.resize(width, height);
  defender = loadImage("Defender.gif"); //Loads custom image
  defender.resize(50, 45); //Rezises the image
  ship = loadImage("Ship.png"); //Loads custom image
  ship.resize(42, 42); //Resizes the image
  ship2 = loadImage("Ship2.png"); //Loads custom image
  ship2.resize(42, 42); //Resizes the image
  bork = loadImage("bork.png");
  bork.resize(50, 25);
  yee = loadImage("Yee.png");
  yee.resize(50, 50);
  heart = loadImage("heart.png");
  heart.resize(42, 42);

  player = new Defender(width/2, height - height/16, 0, 45); //Gets the information from the Defender class
  yeee = new SpaceShip(-75, 50, 0, 40);
  lifeUp = new ExtraLife(-75, 100, 0, 40);

  speed = width/250; //Speed is based on how big screen is

  int song = PApplet.parseInt(random(menuMusic.length));
  String randomSong = menuMusic[song];
  menu = minim.loadFile(randomSong);
  menu.setGain(-5);

  int inGameSong = PApplet.parseInt(random(inGameMusic.length));
  String randomGameMusic = inGameMusic[inGameSong];
  inGame = minim.loadFile(randomGameMusic);
  inGame.setGain(-10);

  int bomb = PApplet.parseInt(random(symbol.length));
  String randomBomb = symbol[bomb];
  drop = loadImage(randomBomb);
  drop.resize(42, 42);

  newGame();

  roboto = createFont("Roboto-Regular.ttf", 32); //This makes all the fonts change to Roboto
  textFont(roboto);

  File scoresFile = new File(dataPath(outFileName));

  if (!scoresFile.exists()) {
    appendTextToFile(outFileName, "AAA - 0");
  }

  scoreboard = loadStrings(outFileName);

  Arrays.sort(scoreboard, new Comparator<String>() {
    public int compare(String one, String two) {
      return Integer.valueOf(two.substring(6)).compareTo(Integer.valueOf(one.substring(6)));
    }
  }
  );

  for (int i = 0; i < 1; i++) {
    highScore = Integer.valueOf(scoreboard[i].substring(6));
  }

  cp5 = new ControlP5(this);
  cp5.addTextfield("initials")
    .setPosition(width - width/1.7f, height - height/1.3f)
    .setSize(width/6, height/6)
    .setAutoClear(false)
    .setFocus(true)
    .setFont(roboto)
    .setColorBackground(100)
    .setColor(255)
    .setLabel("")
    ;
}

public void draw() {

  //Draws the main menu
  if (gameMode == 0) {
    cp5.get(Textfield.class, "initials").clear().hide();
    menu.play();
    inGame.pause();
    image(splash, 0, 0);

    if (!menu.isPlaying()) {
      int song = PApplet.parseInt(random(menuMusic.length));
      String randomSong = menuMusic[song];
      menu = minim.loadFile(randomSong);
      menu.rewind();
      menu.play();
    }

    if (keyPressed) {
      if (key == 's' || key == 'S') {
        gameMode = 4;
      }
    }

    if (mousePressed) {
      if ((mouseX >= width - width/1.55f && mouseX <= width - width/2.65f) && (mouseY >= height - height/2.75f && mouseY <= height - height/6.2f)) {
        gameMode = 1;
        inGame.rewind();
        inGame.play();
      } else if ((mouseX >= width - width/3 && mouseX <= width - width/12.5f) && (mouseY >= height - height/2.75f && mouseY <= height - height/6.2f)) {
        gameMode = 3;
      }
    }

    //Draws the level
  } else if (gameMode == 1) {
    cp5.get(Textfield.class, "initials").clear().hide();
    image(game, 0, 0);
    score();
    lives();
    level();
    progress();
    menu.pause();
    animationCounter += 1;
    yeeCounter = PApplet.parseInt(random(0, 5000));
    extraLifeCounter = PApplet.parseInt(random(0, 1000));

    if (!inGame.isPlaying()) {
      int inGameSong = PApplet.parseInt(random(inGameMusic.length));
      String randomGameMusic = inGameMusic[inGameSong];
      inGame = minim.loadFile(randomGameMusic);
      inGame.rewind();
      inGame.play();
    }

    if (animationCounter >= 20) {
      animationCounter = 0;
    }

    if (runonce) {
      lifeUp.x = PApplet.parseInt(random(50, width - 50));
      lifeUp.y = 300;
      runonce = false;
    }

    //Adds Aliens
    for (int j = 0; j < rows; j++) { //Adds aliens on the screen (15 by 4)
      for (int i = 0; i < columns; i++) {
        if (alien[i][j] != null) {
          alien[i][j].updateAlien();
          if (alien[i][j].spaceShipGo()) {
            spaceShipShoot = 1;
          }
          if (lifeUp != null) {
            lifeUp.updateExtraLife();
            if (extraLifeCounter == 500) {
              runonce = true;
            }
          }
          if (alien[i][j].x >= width) { //If the edge is hit
            for (int l = 0; l < rows; l++) {
              for (int k = 0; k < columns; k++) {
                if (alien[k][l] != null) {
                  alien[k][l].speed = -alien[k][l].speed; //the aliens move the opposite direction
                  alien[k][l].y = alien[k][l].y + 25; //the aliens move down a little
                }
              }
            }
          } else if (alien[i][j].x <= 0) { //If the edge is hit
            for (int l = 0; l < rows; l++) {
              for (int k = 0; k < columns; k++) {
                if (alien[k][l] != null) {
                  alien[k][l].speed = -alien[k][l].speed; //the aliens move the opposite direction
                  alien[k][l].y = alien[k][l].y + 25; //the aliens move down a little
                }
              }
            }
          }
          for (int l = 0; l < rows; l++) {
            for (int k = 0; k < columns; k++) {
              if (alien[k][l] != null) {
                alienMissileCounter = PApplet.parseInt(random(0, 120000));
                if (alienMissileCounter == 75) { //If the random int is divisible by 75 then the Aliens shoot a missile
                  missileAlien.add(new MissileAlien(alien[k][l].x, alien[k][l].y, 5));
                }
              }
            }
          }
        }
      }
    }

    //Adds a Defender and allows movement
    player.updateDefender();

    if (yeee != null) {
      yeee.updateSpaceShip();
      if (alienCounter < alien.length * alien[0].length && spaceShipShoot == 1) {
        spaceShipShoot = 0;
        if (yeeCounter == 1) {
          yeeSound.rewind();
          yeeSound.play();
          yeee.speed = 10;
        }
      }
      if (yeee.edgeDetection()) {
        yeee.x = -75;
        yeee.speed = 0;
      }
    }

    //Adds Missiles
    for (int n = missile.size()-1; n >= 1; n--) { //This adds one missile each time
      Missile missiles = missile.get(n); //This gets the number of missiles i.e. 1
      missiles.updateMissile(); //This draws and moves the missile

      if (yeee != null) {
        if (missiles.hitSpaceShip(yeee)) {
          yeee.x = -75;
          yeee.speed = 0;
          missile.remove(n);
          score = score + 100;
        }
      }

      if (lifeUp != null) {
        if (missiles.hitExtraLife(lifeUp)) {
          lives = lives + 1;
          missile.remove(n);
          lifeUp.x = -75;
        }
      }

      for (int j = 0; j < rows; j++) { //Adds aliens on the screen (15 by 4)
        for (int i = 0; i < columns; i++) {
          if (alien[i][j] != null) {
            if (missiles.hitAlien(alien[i][j])) {
              alien[i][j] = null; //Makes alien dissapear
              missile.remove(n); //Removes that missile
              hit.rewind(); //Plays hit sound
              hit.play();
              score = score + 10; //Adds one to score
              alienCounter = alienCounter + 1; //Adds one to number of Aliens hit
              pw = pw + 10;
              shootTimer = 0;
            }
          }

          //If the aliens reach the bottom of the screen or hit the defender the game is over
          if (alien[i][j] != null) {
            if (player.crash(alien[i][j]) || alien[i][j].bottomDetection()) {
              gameMode = 2;
              death.rewind();
              death.play();
            }
          }
        }
      }
    }

    for (int m = missileAlien.size()-1; m >= 1; m--) { //This adds one missile each time
      MissileAlien missilesalien = missileAlien.get(m); //This gets the number of missile i.e. 1
      missilesalien.updateMissile(); //This draws and moves the missile

      if (missilesalien.hitDefender(player)) { //If the defender is hit it loses a life
        missileAlien.remove(m);
        lives -= 1;
      }
    }

    if (lives <= 0) {
      gameMode = 2;
      death.rewind();
      death.play();
    }

    if (alienCounter >= alien.length * alien[0].length) { //When all the aliens are gone
      missile.clear();
      missileAlien.clear();
      nextLevel();
    }
  } else if (gameMode == 2) { //When it's game over the game over screen is drawn
    image(game, 0, 0);
    gameOver();
  } else if (gameMode == 3) { //Displays controls
    image(controls, 0, 0);
    if (mousePressed) {
      if ((mouseX >= width - width/6.2f && mouseX <= width - width/60) && (mouseY >= height - height/6.8f && mouseY <= height - height/38)) {
        gameMode = 0;
      }
    }
  } else if (gameMode == 4) {
    float ty = height - height/1.25f;
    image(scoreBackground, 0, 0);
    textSize(120);
    text("High Scores:", width/2, height - height/1.05f);
    textSize(60);

    for (int i = 0; i < scoreboard.length; i++) {
      if (i <= 10) {
        text(scoreboard[i], width/2, ty);
        ty += 60;
      }
    }
    textSize(40);
    text("Clear All Scores?", width/2, height - height/6);
    text("Press Enter", width/2, height - height/8);
    if (keyPressed) {
      if (key == ENTER) {
        String[] resetHighScore = {"AAA - 0"};
        saveStrings("data/scoreboard.txt", resetHighScore);
        gameMode = 0;
      }
    }
    if (mousePressed) {
      if ((mouseX >= width - width/6.2f && mouseX <= width - width/60) && (mouseY >= height - height/6.8f && mouseY <= height - height/38)) {
        gameMode = 0;
      }
    }
  }
}

//Scoreboard
public void score() {
  textSize(20);
  if (score >= 0 && score <= 99) {
    text("Score: " + score, 50, 15);
  } else if (score > 99 && score <= 999) {
    text("Score: " + score, 55, 15);
  } else if (score > 999 & score <= 9999) {
    text("Score: " + score, 65, 15);
  } else if (score > 9999) {
    text("Score: " + score, 70, 15);
  }

  if (highScore >= 0 && highScore <= 99) {
    text("High Score: " + highScore, width - width/22, 15);
  } else if (highScore > 99 && highScore <= 999) {
    text("High Score: " + highScore, width - width/20, 15);
  } else if (highScore > 999 && highScore <= 9999) {
    text("High Score: " + highScore, width - width/18, 15);
  } else if (highScore > 9999) {
    text("High Score: " + highScore, width - width/18, 15);
  }

  if (score > highScore) { //If the score is bigger than the current high score it overwrites
    highScore = score;
  }
}

public void lives() {
  textSize(20);
  if (lives > 1) {
    text("Lives: " + lives, 50, height - height/40);
  } else {
    text("Life: " + lives, 50, height - height/40);
  }
}

public void level() {
  textSize(20);
  text("Level: " + level, width - width/38, height - height/40);
}

public void progress() {
  fill(255);
  rect(width/2, height - height/38, 600, 20);
  fill(0, 255, 0);
  noStroke();
  rect(width/2, height - height/38, pw, 20);
  fill(255);
}

public void gameOver() { //Displays score and high score
  textSize(120);
  text("Game Over!", width/2, height - height/1.05f);
  textSize(60);
  text("Enter Initials:", width/2, height - height/1.2f);
  textSize(80);
  text("New Game?", width/2, height - height/2.4f);
  text("Main Menu?", width/2, height - height/4);
  textSize(40);
  text("Score: " + score, width/2, height - height/1.8f);
  text("High Score: " + highScore, width/2, height - height/1.95f);
  text("Press R", width/2, height - height/3);
  text("Press M", width/2, height - height/6);
  inGame.pause();
  cp5.get(Textfield.class, "initials").show();
}

public void nextLevel() { //When the user finishes a level, displays current level and next level
  textSize(75);
  text("Level " + level + " Complete!", width/2, height - height/1.8f);
  textSize(40);
  text("Press ENTER For Level " + (level+1) + " !", width/2, height - height/2.4f);

  if (key == ENTER) { //If the current level is less than 20 and they hit enter a new level starts
    level = level + 1; //New level
    speed = speed + 1; //Increases speed to make the next level harder
    alienCounter = 0; //Resets counter for aliens
    spaceShipShoot = 0;
    pw = 0;
    newGame();
  }
}

public void reset() { //Resets all stats when the game is over
  level = 1;
  score = 0;
  speed = width/250;
  lives = 3;
  alienCounter = 0;
  spaceShipShoot = 0;
  yeee.x = -75;
  yeee.speed = 0;
  missile.clear();
  missileAlien.clear();
  pw = 0;
}

public void newGame() {

  rows = 4; //Resets i
  columns = 15; //Resets j

  alien = new Aliens[columns][rows];

  x = 25;
  y = 50;


  for (int j = 0; j < rows; j++) { //Adds aliens on the screen (15 by 3) (Calling setup() did NOT work as there needs to be new values passed through)
    for (int i = 0; i < columns; i++) {
      alien[i][j] = new Aliens(x, y, speed, 30);
      x = x + 45;
    }
    x = 25;
    y = y + 60;
  }
}

public void paused() {
  if (alienCounter < 60) {
    textSize(60);
    text("GAME PAUSED", width/2, height/2);
    textSize(40);
    text("Press M For Main Menu", width/2, height - height/2.5f);
  } else {
    textSize(40);
    text("GAME PAUSED", width/2, height - height/3);
    textSize(20);
    text("Press M For Main Menu", width/2, height - height/3.5f);
  }
}

public void appendTextToFile(String filename, String text) {
  File f = new File(dataPath(filename));
  if (!f.exists()) {
    createFile(f);
  }
  try {
    PrintWriter out = new PrintWriter(new BufferedWriter(new FileWriter(f, true)));
    out.println(text);
    out.close();
  }
  catch (IOException e) {
    e.printStackTrace();
  }
}

public void createFile(File f) {
  File parentDir = f.getParentFile();
  try {
    parentDir.mkdirs(); 
    f.createNewFile();
  }
  catch(Exception e) {
    e.printStackTrace();
  }
}

public void keyPressed() {
  if (gameMode == 1) {
    if (looping && (key == 'p' || key == 'P')) { //Allows game to be paused
      noLoop();
      paused();
      inGame.pause();
    } else if (!looping && (key == 'p' || key == 'P')) {
      loop();
      inGame.play();
    } else if (!looping && (key == 'm' || key =='M')) {
      gameMode = 0;
      loop();
      reset();
      newGame();
      menu.play();
    }
  }

  if (gameMode == 2) {
    if (cp5.get(Textfield.class, "initials").isActive() == false) {
      if (key == 'r' || key == 'R') { //If the player hits the R key then the game restarts
        if (score > 0) {
          initials = cp5.get(Textfield.class, "initials").getText().toUpperCase().substring(0, 3);
          String newScore = initials + " - " + str(score);
          appendTextToFile(outFileName, newScore);
        }
        gameMode = 1;
        reset();
        newGame();
      } else if (key == 'm' || key == 'M') { //If the M key is pressed the game goes back to the main menu
        if (score > 0) {
          initials = cp5.get(Textfield.class, "initials").getText().toUpperCase().substring(0, 3);
          String newScore = initials + " - " + str(score);
          appendTextToFile(outFileName, newScore);
        }
        gameMode = 0;
        reset();
        newGame();
        menu.play();
      }
    }
  }
}

public void keyReleased() { //Had to use keyReleased to stop user from holding down the shoot button and being really easy
  //Allows the missile to be shot
  if (key == ' ') {
    missile.add(new Missile(PApplet.parseInt(abs(player.x)), player.y, 10)); //When space is pressed a new missile appears
    shoot.rewind();
    shoot.play();
  } else if (key == 'a' || key == 'A') {
    moveLeft = false;
  } else if (key == 'd' || key == 'D') {
    moveRight = false;
  }
}

public void mouseReleased() {
  if (gameMode == 0) {
    if ((mouseX >= width - width/1.85f && mouseX <= width - width/50) && (mouseY >= height - height/14 && mouseY <= height - height/40)) {
      link("https://www.ryan-simms.com/");
    }
  }
}
//Aliens

class Aliens 
{
  //Global Variables
  int x, y, size, speed;

  //Contructor
  Aliens (int x, int y, int speed, int size) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
  }

  public void moveAlien() { //This makes the alien move
    x = x + speed;
  }

  public void drawAlien() { //Draws a square alien and colours it white
    if (animationCounter >= 0 && animationCounter < 11) {
      image(ship, x-20, y-22);
    } else if (animationCounter >= 11 && animationCounter < 21) {
      image(ship2, x-20, y-22);
    }
  }

  public void updateAlien() { //Draws the alien and moves the alien
    drawAlien();
    moveAlien();
  }

  public boolean bottomDetection() { //If the aliens reach the bottom of the screen, returns true
    if (this.y > height - height / 28) {
      return true;
    } else {
      return false;
    }
  }

  public boolean spaceShipGo() {
    if (this.y > 250) {
      return true;
    } else {
      return false;
    }
  }
}

//Defender

class Defender {

  //Global Variables
  int y, size;
  float x, dx;

  //Constructor
  Defender (float x, int y, float dx, int size) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.size = size;
  }

  public void drawDefender() { //This places an image where the defender is
    image(defender, x - 22, y - 20);
  }

  public void moveDefender() { //This allows user to move the defender
    x = x + dx;
    if (keyPressed) {
      if (key == 'a' || key == 'A') { //When this key is pressed it moves left
        moveLeft = true;
        moveRight = false;
      } else if (key == 'd' || key == 'D') { //When this key is pressed it moves right
        moveRight = true;
        moveLeft = false;
      }
    }

    if (x >= width - 30) { //This is to stop the defender going off the screen
      x = x - 10;
    } else if (x <= 30) {
      x = x + 10;
    }

    if (moveLeft) {
      dx = -10;
    } else if (moveRight) {
      dx = 10;
    }
  }

  public void updateDefender() { //Draws the defender and moves the defender
    drawDefender();
    moveDefender();
  }

  public boolean crash(Aliens alien) {
    if (alien.y >= y && alien.x == x) { //If the defender hits an alien, returns true
      return true;
    } else {
      return false;
    }
  }
}
//ExtraLife

class ExtraLife {

  //Global Variables
  float x, y;
  int speed, size;

  //Constructor
  ExtraLife (float x, float y, int speed, int size) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
  }

  public void drawExtraLife() { //Draws a yee
    image(heart, x - 20, y - 20);
  }

  public void moveExtraLife() { //This makes the missile shoot upwards
    x = x + speed;
  }

  public void updateExtraLife() { //This draws and makes the missile move up
    drawExtraLife();
    moveExtraLife();
  }
}
//Missiles

class Missile {

  //Global Variables
  int x, y, speed;

  //Constructor
  Missile (int x, int y, int speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }

  public void drawMissile() { //Draws a bork
    image(bork, x-40, y-20);
  }

  public void moveMissile() { //This makes the missile shoot upwards
    y = y - speed;
  }

  public void updateMissile() { //This draws and makes the missile move up
    drawMissile();
    moveMissile();
  }

  public boolean hitAlien(Aliens alien) {
    if (dist(x, y, alien.x, alien.y) < alien.size) { //If the missile hits an alien, returns true
      return true;
    } else {
      return false;
    }
  }

  public boolean hitSpaceShip(SpaceShip yeee) {
    if (dist(x, y, yeee.x, yeee.y) < yeee.size) { //If the missile hits the spaceship, returns true
      return true;
    } else {
      return false;
    }
  }

  public boolean hitExtraLife(ExtraLife lifeUp) {
    if (dist(x, y, lifeUp.x, lifeUp.y) < lifeUp.size) { //If the missile hits the spaceship, returns true
      return true;
    } else {
      return false;
    }
  }
}
//Missiles

class MissileAlien {

  //Global Variables
  int x, y, speed;

  //Constructor
  MissileAlien (int x, int y, int speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }

  public void drawMissile() { //Draws a reddit logo
    image(drop, x, y);
  }

  public void moveMissile() { //This makes the missile shoot upwards
    y = y + speed;
  }

  public void updateMissile() { //This draws and makes the missile move up
    drawMissile();
    moveMissile();
  }

  public boolean hitDefender(Defender defender) {
    if (dist(x, y, defender.x, defender.y) < defender.size) { //If the missile hits the defender, returns true
      return true;
    } else {
      return false;
    }
  }
}
//SpaceShip

class SpaceShip {

  //Global Variables
  int x, y, speed, size;

  //Constructor
  SpaceShip (int x, int y, int speed, int size) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.size = size;
  }

  public void drawSpaceShip() { //Draws a yee
    image(yee, x - 20, y - 20);
  }

  public void moveSpaceShip() { //This makes the missile shoot upwards
    x = x + speed;
  }

  public void updateSpaceShip() { //This draws and makes the missile move up
    drawSpaceShip();
    moveSpaceShip();
  }

  public boolean edgeDetection() { //Test to see if any aliens have hit the edge of the screen
    if (this.x >= width + 80 || this.x <= - 80) { //When the alien touches the right hand side
      return true;
    } else {
      return false;
    }
  }
}
  public void settings() {  fullScreen(); }
  static public void main(String[] passedArgs) {
    String[] appletArgs = new String[] { "--present", "--window-color=#666666", "--stop-color=#cccccc", "BorkInvaders" };
    if (passedArgs != null) {
      PApplet.main(concat(appletArgs, passedArgs));
    } else {
      PApplet.main(appletArgs);
    }
  }
}
