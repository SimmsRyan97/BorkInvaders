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

  void drawMissile() { //Draws a reddit logo
    image(drop, x, y);
  }

  void moveMissile() { //This makes the missile shoot upwards
    y = y + speed;
  }

  void updateMissile() { //This draws and makes the missile move up
    drawMissile();
    moveMissile();
  }

  boolean hitDefender(Defender defender) {
    if (dist(x, y, defender.x, defender.y) < defender.size) { //If the missile hits the defender, returns true
      return true;
    } else {
      return false;
    }
  }
}