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

  void moveAlien() { //This makes the alien move
    x = x + speed;
  }

  void drawAlien() { //Draws a square alien and colours it white
    if (animationCounter >= 0 && animationCounter < 11) {
      image(ship, x-20, y-22);
    } else if (animationCounter >= 11 && animationCounter < 21) {
      image(ship2, x-20, y-22);
    }
  }

  void updateAlien() { //Draws the alien and moves the alien
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