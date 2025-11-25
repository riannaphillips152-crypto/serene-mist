let calmInstance; 
let meditationSlider; 
let capture; // Variable for webcam

const calmPalette1 = {
  bg: '#F8F8FF',     // Ghost White
  primary: '#B3E5FC',  // Light Blue Pastel
  accent1: '#C8E6C9',  // Pastel Green (near Mint Cream)
  accent2: '#E1BEE7',  // Pastel Lavender
};

const calmPalette2 = {
  bg: '#FFF8DC',     // Cornsilk - very light, creamy yellow
  primary: '#FFD1DC',  // Pastel Pink (Pink Lace)
  accent1: '#D7ECD9',  // Slightly different Pastel Green
  accent2: '#DDC9EC',  // Slightly different Pastel Lavender
};

// --- UI Logic ---
function toggleInfo() {
    const infoBox = document.getElementById('interaction-instructions');
    const icon = document.getElementById('toggle-icon');
    
    // Toggle the class
    infoBox.classList.toggle('collapsed');

    // Update icon text
    if (infoBox.classList.contains('collapsed')) {
        icon.innerText = "+";
    } else {
        icon.innerText = "−"; // minus sign
    }
}

function setup() {
  console.log("setup() called - creating canvas for Calm");
  createCanvas(windowWidth, windowHeight);
  
  // Use HSB color mode as requested in your code
  colorMode(HSB, 360, 100, 100, 1);
  
  // FIX: Performance Optimization
  pixelDensity(1);
  
  // --- VIDEO CAPTURE SETUP ---
  capture = createCapture(VIDEO);
  capture.size(320, 240); 
  capture.hide(); 
  
  meditationSlider = document.getElementById('meditationSlider');
  if (!meditationSlider) {
      console.error("Meditation slider not found!");
  }
  
  // Attach the event listener to the info box
  const infoBox = document.getElementById('interaction-instructions');
  if (infoBox) {
      infoBox.addEventListener('click', toggleInfo);
  }
  
  calmInstance = new Calm();
  calmInstance.setup();
  console.log("calmInstance setup complete");
}

function draw() {
  if (calmInstance) {
    // IMPORTANT: Your Calm class uses translate(width/2, height/2).
    // We must wrap it in push/pop so it doesn't mess up the video drawing coordinates.
    push(); 
    calmInstance.draw();
    pop();
  } else {
    background(0); 
    fill(0, 100, 100); 
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Error: calmInstance not loaded", width/2, height/2);
  }
  
  // --- DRAW VIDEO CAPTURE (Bottom Left) ---
  if (capture && capture.loadedmetadata) {
      // Match the visual width of the info box (approx 230px + padding)
      let vidWidth = 260; 
      let vidHeight = (capture.height / capture.width) * vidWidth; 
      
      let x = 20; // Left margin
      let y = height - vidHeight - 20; // Bottom margin
      
      push();
      // Draw video
      image(capture, x, y, vidWidth, vidHeight);
      
      // Border styling matching the Calm theme
      noFill();
      stroke(200, 20, 90, 0.5); // HSB stroke (Light pastel blue-ish)
      strokeWeight(2);
      rect(x, y, vidWidth, vidHeight);
      pop();
  }
}

function windowResized() {
  console.log("windowResized() called");
  resizeCanvas(windowWidth, windowHeight);
  if (calmInstance) {
    calmInstance.onResize();
  }
}

function mousePressed(event) {
  // Prevent ripple effect if clicking inside the interaction box or slider
  if (event && (event.target.closest('#interaction-instructions') || event.target.closest('#slider-container'))) return;

  if (calmInstance) {
    calmInstance.mousePressed();
  }
}

class Calm {
  constructor() {
    this.particles = [];
    this.numParticles = 100; 
    this.backgroundColor;
    this.currentPalette;

    this.zOff = 0; 

    this.meditationLevel = 0.5; 
    this.flowFieldStrength = 0.1; 
    
    this.rippleEffect = 0; 
    this.rippleMax = 300; // Increased max ripple size for better visibility
    this.rippleDecay = 7; // Adjusted decay rate
    this.rippleOrigin = createVector(0,0); 
    this.rippleZOff = 0; // New: For dynamic waviness of the ripple
  }

  setup() {
    angleMode(DEGREES);
    this.applyPalette(calmPalette1); 
    background(this.backgroundColor); 

    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push(new CalmParticle(i, this.currentPalette));
    }
  }

  draw() {
    if (meditationSlider) { 
      // Map slider 0-100 to meditation level 1-0 (0 is still, 100 is active)
      this.meditationLevel = map(meditationSlider.value, 0, 100, 1, 0); 
    } else {
      this.meditationLevel = 1; 
    }

    let fadeAlpha = map(this.meditationLevel, 0, 1, 10, 3); 
    fill(hue(this.backgroundColor), saturation(this.backgroundColor), brightness(this.backgroundColor), fadeAlpha / 255); 
    rect(0, 0, width, height);

    translate(width / 2, height / 2); 

    let noiseInfluence = map(this.meditationLevel, 0, 1, 1.5, 0.5); 
    let particleSpeedModifier = map(this.meditationLevel, 0, 1, 1.0, 0.3); 

    // DRAW THE WAVY RIPPLE EFFECT
    if (this.rippleEffect > 0) {
        let currentRadius = this.rippleEffect;
        let rippleAlpha = map(currentRadius, 0, this.rippleMax, 0.5, 0); // Fades out as it expands
        let rippleWeight = map(currentRadius, 0, this.rippleMax, 8, 1); // Starts thicker, gets thinner

        stroke(hue(this.currentPalette.primary), saturation(this.currentPalette.primary), brightness(this.currentPalette.primary), rippleAlpha);
        strokeWeight(rippleWeight);
        noFill();

        beginShape();
        for (let a = 0; a < 360; a += 5) { // Draw points every 5 degrees for a smooth shape
            let xOff = map(cos(a), -1, 1, 0, 3);
            let yOff = map(sin(a), -1, 1, 0, 3);
            // Noise based on angle and rippleZOff for dynamic waviness
            let displacement = map(noise(xOff, yOff, this.rippleZOff), 0, 1, -20, 20); // Waviness amount
            
            let r = currentRadius + displacement; // Apply displacement to current radius
            let x = this.rippleOrigin.x + r * cos(a);
            let y = this.rippleOrigin.y + r * sin(a);
            vertex(x, y);
        }
        endShape(CLOSE); // Connect the last point to the first

        this.rippleEffect += this.rippleDecay; // INCREASE rippleEffect to expand the wave
        this.rippleZOff += 0.03; // Increment rippleZOff for wave animation
    }

    // Decay the ripple after it has expanded
    if (this.rippleEffect >= this.rippleMax) {
        this.rippleEffect = 0; // Reset after full expansion
        this.rippleZOff = 0; // Reset noise seed for next ripple
    }


    for (let i = this.particles.length - 1; i >= 0; i--) {
      let particle = this.particles[i];
      particle.update(this.zOff, noiseInfluence, particleSpeedModifier, this.meditationLevel); 
      particle.show(this.meditationLevel); 
      
      if (particle.isOffscreen()) {
          particle.reset(this.currentPalette);
      }
    }

    this.zOff += 0.0008 * (1 - this.meditationLevel * 0.5); 
  }

  applyPalette(palette) {
    this.currentPalette = palette;
    this.backgroundColor = color(palette.bg);
    this.particlePalette = {
        primary: color(palette.primary),
        accent1: color(palette.accent1), 
        accent2: color(palette.accent2)  
    };
  }

  onResize() {
    this.particles = []; 
    for (let i = 0; i < this.numParticles; i++) {
        this.particles.push(new CalmParticle(i, this.currentPalette));
    }
    background(this.backgroundColor); 
  }

  mousePressed() {
    // Switch palette on click
    if (this.currentPalette === calmPalette1) {
      this.applyPalette(calmPalette2);
    } else {
      this.applyPalette(calmPalette1);
    }
    background(this.backgroundColor); 

    // TRIGGER THE RIPPLE EFFECT
    this.rippleEffect = 1; // Start ripple at a very small size (almost 0)
    this.rippleOrigin = createVector(mouseX - width/2, mouseY - height/2); 
    this.rippleZOff = random(1000); // Give a new random noise seed for each ripple
  }
}


class CalmParticle {
  constructor(id, palette) {
    this.id = id;
    this.colors = palette; 
    this.reset(palette); 
  }

  reset(palette) {
    this.pos = createVector(random(-width/2, width/2), random(-height/2, height/2)); 
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxspeed = 0.7; 
    this.life = random(300, 500); 
    this.initialColorBase = random(1); 
    this.colors = palette; 
    this.baseSize = random(8, 18); 
  }

  update(zOff, flowNoiseInfluence, speedModifier, meditationLevel) { 
    let xOff = this.pos.x * 0.002 * flowNoiseInfluence; 
    let yOff = this.pos.y * 0.002 * flowNoiseInfluence;
    let angle = noise(xOff, yOff, zOff) * 360 * 2; 
    let perlinForce = p5.Vector.fromAngle(angle);

    this.acc.add(perlinForce.setMag(0.01 * speedModifier)); 

    this.vel.add(this.acc);
    this.vel.limit(this.maxspeed * speedModifier); 
    this.pos.add(this.vel);
    this.acc.mult(0.9); 

    this.life -= 1 * (1 - meditationLevel * 0.5); 
    this.life = constrain(this.life, 0, 500);
  }

  isOffscreen() {
    let buffer = 100; 
    return this.pos.x > width / 2 + buffer || this.pos.x < -width / 2 - buffer ||
           this.pos.y > height / 2 + buffer || this.pos.y < -height / 2 - buffer ||
           this.life <= 0; 
  }

  show(meditationLevel) {
    let colorBase = this.initialColorBase;
    
    let primaryCol = calmInstance.particlePalette.primary;
    let accent1Col = calmInstance.particlePalette.accent1; 
    let accent2Col = calmInstance.particlePalette.accent2; 

    let tempColor;
    if (colorBase < 0.5) {
        tempColor = lerpColor(primaryCol, accent1Col, colorBase * 2);
    } else {
        tempColor = lerpColor(accent1Col, accent2Col, (colorBase - 0.5) * 2);
    }

    let h = hue(tempColor);
    let s = saturation(tempColor);
    let b = brightness(tempColor);

    s = constrain(s * (1 - meditationLevel * 0.4), 10, 80); 
    b = constrain(b * (1 + meditationLevel * 0.1), 70, 100); 
    
    let finalParticleColor = color(h, s, b);

    let particleAlpha = map(this.life, 0, 500, 0.2, 0.7); 

    let pointSize = this.baseSize * (1 - meditationLevel * 0.3); 
    pointSize = constrain(pointSize, 4, 18); 

    noStroke();
    fill(hue(finalParticleColor), saturation(finalParticleColor), brightness(finalParticleColor), particleAlpha);
    ellipse(this.pos.x, this.pos.y, pointSize);
  }
}