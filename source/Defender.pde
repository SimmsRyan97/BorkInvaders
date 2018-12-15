
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

  void drawDefender() { //This places an image where the defender is
    image(defender, x - 22, y - 20);
  }

  void moveDefender() { //This allows user to move the defender
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

  void updateDefender() { //Draws the defender and moves the defender
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