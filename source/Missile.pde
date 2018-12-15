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

  void drawMissile() { //Draws a bork
    image(bork, x-40, y-20);
  }

  void moveMissile() { //This makes the missile shoot upwards
    y = y - speed;
  }

  void updateMissile() { //This draws and makes the missile move up
    drawMissile();
    moveMissile();
  }

  boolean hitAlien(Aliens alien) {
    if (dist(x, y, alien.x, alien.y) < alien.size) { //If the missile hits an alien, returns true
      return true;
    } else {
      return false;
    }
  }

  boolean hitSpaceShip(SpaceShip yeee) {
    if (dist(x, y, yeee.x, yeee.y) < yeee.size) { //If the missile hits the spaceship, returns true
      return true;
    } else {
      return false;
    }
  }

  boolean hitExtraLife(ExtraLife lifeUp) {
    if (dist(x, y, lifeUp.x, lifeUp.y) < lifeUp.size) { //If the missile hits the spaceship, returns true
      return true;
    } else {
      return false;
    }
  }
}