// Edit these.
const lengthLimit = 12;
const tailFrames = 24;
let startX = 438.5298438237497;
let startVel = 1.3675390440626363;
const targetX = 773.5;
const targetWindow = 0.01; 
const head = '49:R';

// Don't edit these.
let char = [];
let tasKeys = [];
const tasString = [''];

let levelTimer = 0;
let control = 0;
let cornerHangTimer = 0;
let charCount;

// Constants from the original game; do not edit.
const power = 1;
const jumpPower = 11;

function runAllSimulations() {
	tasString[0] = head;
	runSimulation();
	startX = char[0].x;
	startVel = char[0].vx;
	for (let i = 0; i < 3**lengthLimit; i++) {
		tasString[0] = i.toString(3)
			.replaceAll('0', '- ')
			.replaceAll('1', 'L ')
			.replaceAll('2', 'R ');
		// tasString[0] = tasString[0].slice(0, -1);
		tasString[0] += 'RU ' + tailFrames + ':-';
		// console.log(tasString[0]);
		runSimulation();
	}
}

function runSimulation() {
	char = [];
	char.push(new Character(1, startX, 0, 10));
	char[0].vx = startVel;
	char[0].onob = true;
	char.push(new Character(35, startX, 0, 6));
	control = 0;
	charCount = char.length;
	pickUp(1);
	char[1].y += yOff(1);
	char[1].x += xOff(1);

	parseTASString();
	levelTimer = 0;
	while (levelTimer < tasKeys[0].length) {
		simulateFrame();
	}
}

function simulateFrame() {
	const leftDown = tasKeys[0][levelTimer]?.includes(1);
	const rightDown = tasKeys[0][levelTimer]?.includes(2);
	const upDown = tasKeys[0][levelTimer]?.includes(3);
	const downDown = tasKeys[0][levelTimer]?.includes(4);
	for (let i = 0; i < char.length; i++) {
		char[i].justChanged--;
	}
	if (leftDown) {
		char[control].moveHorizontal(-power);
	} else if (rightDown) {
		char[control].moveHorizontal(power);
	}
	if (upDown) {
		if (char[control].carry) {
			putDown(control);
			charThrow(control);
			// console.log('throw vel:', char[control].vx);
		} else {
			for (let i = 0; i < charCount; i++) {
				pickUp(i);
				if (char[control].carry) break;
			}
		}
	}
	if (downDown) {
		if (char[control].carry) {
			putDown(control);
		}
	}
	/*for (let i = 0; i < char.length; i++) {
		char[i].applyForces(char[i].weight2, i == control, jumpPower * 0.7);
		char[i].charMove();
	}*/
	for (let i = 0; i < charCount; i++) {
		if (char[i].charState >= 5) {
			char[i].landTimer = char[i].landTimer + 1;
			if (char[i].carry && char[char[i].carryObject].justChanged < char[i].justChanged) {
				char[char[i].carryObject].justChanged = char[i].justChanged;
			}
			/*if (char[i].standingOn == -1) {
				if (char[i].onob) {
					if (char[i].charState >= 5) {
						char[i].fricGoal = onlyConveyorsUnder(i);
					}
				}
			} else char[i].fricGoal = char[char[i].standingOn].vx;*/

			char[i].applyForces(char[i].weight2, control == i, jumpPower * 0.7);
			if (char[i].deathTimer >= 30) char[i].charMove();
		}
		/*if (char[i].justChanged >= 1) {
			if (char[i].standingOn >= 1) {
				if (char[char[i].standingOn].charState == 4) {
					char[i].justChanged = 2;
				}
			}
			if (char[i].stoodOnBy.length >= 1) {
				for (let j = 0; j < char[i].stoodOnBy.length; j++) {
					char[char[i].stoodOnBy[j]].y = char[i].y - char[i].h;
					char[char[i].stoodOnBy[j]].vy = char[i].vy;
				}
			} else if (!char[i].carry && char[i].submerged >= 2) {
				char[i].weight2 = char[i].weight - 0.16;
			}
			if (char[i].charState >= 5 && !ifCarried(i)) {
				if (char[i].vy > 0 || (char[i].vy == 0 && char[i].vx != 0)) {
					landOnObject(i);
				}
				if (char[i].vy < 0 && (char[i].charState == 4 || char[i].charState == 6) && !ifCarried(i)) {
					objectsLandOn(i);
				}
			}
		}*/
	}
	for (let i = 0; i < charCount; i++) {
		if (char[i].vy != 0 || char[i].vx != 0 || char[i].x != char[i].px || char[i].py != char[i].y)
			char[i].justChanged = 2;
		if (char[i].justChanged >= 1 && char[i].charState >= 5) {
			if (ifCarried(i)) {
				char[i].vx = char[char[i].carriedBy].vx;
				char[i].vy = char[char[i].carriedBy].vy;

				if (char[char[i].carriedBy].x + xOff(i) >= char[i].x + 20) {
					char[i].x += 20;
				} else if (char[char[i].carriedBy].x + xOff(i) <= char[i].x - 20) {
					char[i].x -= 20;
				} else {
					char[i].x = char[char[i].carriedBy].x + xOff(i);
				}

				if (char[char[i].carriedBy].y - yOff(i) >= char[i].y + 20) {
					char[i].y += 20;
				} else if (char[char[i].carriedBy].y - yOff(i) <= char[i].y - 20) {
					char[i].y -= 20;
				} else {
					char[i].y = char[char[i].carriedBy].y - yOff(i);
				}
				char[i].dire = Math.ceil(char[char[i].carriedBy].dire / 2) * 2;
			}
		}
		if (char[i].charState >= 5) {
			char[i].px = char[i].x;
			char[i].py = char[i].y;
		}
	}
	if (!char[0].carry && char[1].vy > 0 && char[1].vx > 0 && char[1].x > targetX && char[1].x < targetX + targetWindow) {
		console.log(tasString[0], levelTimer - (tasKeys[0].length - tailFrames), '|', char[1].x);
	}
	levelTimer++;
}

const keyStringCodes = {'R':2,'L':1,'U':3,'D':4,'J':101,'E':102,'Z':103}

function parseTASString() {
	tasKeys = [];
	let loopLength = -1;
	let loopStart = -1;
	let remainingLoopCount = -1;
	for (var i = 0; i < tasString.length; i++) {
		let splittedString = tasString[i].split(' ');
		tasKeys.push([]);
		for (var j = 0; j < splittedString.length; j++) {
			if (j !== loopStart && /[\[\d]/.test(splittedString[j][0])) {
				loopStart = j;
				remainingLoopCount = parseInt(splittedString[j].replaceAll('[', '').split(':')[0]);
				if (isNaN(remainingLoopCount)) remainingLoopCount = 0;
				else remainingLoopCount--;
				if (splittedString[j][0] == '[') {
					for (loopLength = 0;
						loopLength + loopStart < splittedString.length &&
						splittedString[loopLength + loopStart].slice(-1) !== ']';
						loopLength++);
					loopLength++;
				} else {
					loopLength = 1;
				}
				// console.log('rlc:' + remainingLoopCount + ' ls:' + loopStart + ' ll:' + loopLength);
			}
			tasKeys[i].push([]);
			for (var k = 0; k < splittedString[j].length; k++) {
				tasKeys[i][tasKeys[i].length-1].push(keyStringCodes[splittedString[j][k]])
			}
			if (remainingLoopCount > 0 && j+1 == loopStart + loopLength) {
				remainingLoopCount--;
				j = loopStart - 1;
			}
		}
	}
}

// Functions from the original game
function pickUp(i) {
	if (
		i != control &&
		near(control, i) &&
		char[i].charState >= 6 &&
		char[control].standingOn != i &&
		onlyMovesOneBlock(i, control)
	) {
		if (char[i].carry) putDown(i);
		if (ifCarried(i)) putDown(char[i].carriedBy);
		char[control].carry = true;
		char[control].carryObject = i;
		// swapDepths(i, charCount * 2 + 1);
		char[i].carriedBy = control;
		char[i].weight2 = char[i].weight;
		char[control].weight2 = char[i].weight + char[control].weight;
		rippleWeight(control, char[i].weight2, 1);
		fallOff(i);
		aboveFallOff(i);
		char[i].justChanged = 2;
		char[control].justChanged = 2;
		if (char[i].submerged == 1) char[i].submerged = 0;
		if (char[i].onob && char[control].y - char[i].y > yOff(i)) {
			char[control].y = char[i].y + yOff(i);
			char[control].onob = false;
			char[i].onob = true;
		}
	}
}

function charThrow(i) {
	char[i].weight2 = char[i].weight;
	char[char[i].carryObject].weight2 = char[char[i].carryObject].weight;
	char[char[i].carryObject].vy = -7.5;
	char[char[i].carryObject].vx = char[i].vx;
	if (char[i].dire <= 2) {
		char[char[i].carryObject].vx -= 3;
	} else {
		char[char[i].carryObject].vx += 3;
	}
}

function putDown(i) {
	if (char[i].carry) {
		rippleWeight(i, char[char[i].carryObject].weight2, -1);
		char[i].weight2 = char[i].weight;
		char[char[i].carryObject].weight2 = char[char[i].carryObject].weight;
		char[i].carry = false;
		char[i].justChanged = 2;
		// swapDepths(char[i].carryObject, (charCount - char[i].carryObject - 1) * 2);
		char[char[i].carryObject].carriedBy = -1;
		char[char[i].carryObject].stopMoving();
	}
	cornerHangTimer = 0;
}

function rippleWeight(i, w, sign) {
	if (char[i].standingOn >= 0) {
		char[char[i].standingOn].weight2 += w * sign;
		if (char[char[i].standingOn].submerged == 1 && char[char[i].standingOn].weight2 < 0) {
			char[char[i].standingOn].submerged = 2;
		}
		if (
			char[char[i].standingOn].submerged >= 2 &&
			char[char[i].standingOn].weight2 < 0 &&
			char[char[i].standingOn].onob
		) {
			char[char[i].standingOn].onob = false;
		}
		rippleWeight(char[i].standingOn, w, sign);
	}
}

function near(c1, c2) {
	let yDist = char[c2].y - 23 - (char[c1].y - char[c1].h2 / 2);
	return Math.abs(yDist) <= char[c2].h / 2 + char[c1].h2 / 2 && Math.abs(char[c1].x + xOff2(c1) - char[c2].x) < 50;
}

function xOff(i) {
	return char[char[i].carriedBy].w * (Math.ceil(char[char[i].carriedBy].dire / 2) * 2 - 3) * 0.7;
}

function xOff2(i) {
	return char[i].w * (Math.ceil(char[i].dire / 2) * 2 - 3) * 0.7;
}

function yOff(i) {
	if (char[i].charState == 6) {
		return char[char[i].carriedBy].h2;
	}
	return char[char[i].carriedBy].h2 - 13;
}

function onlyMovesOneBlock(i, j) {
	let sign = Math.floor((char[j].dire - 1) / 2) * 2 - 1;
	let x1 = Math.ceil((sign * (char[i].x + char[i].w * sign)) / 30);
	let x2 = Math.ceil((sign * (char[control].x + xOff2(control) + char[i].w * sign)) / 30);
	return Math.abs(x2 - x1) <= 1;
}

function ifCarried(i) {
	if (char[i].carriedBy >= 0 && char[i].carriedBy <= 190) {
		return char[char[i].carriedBy].carry;
	}
	return false;
}

function fallOff(i) {
	if (char[i].standingOn >= 0) {
		let after = false;
		if (char[char[i].standingOn].submerged == 1) {
			char[char[i].standingOn].submerged = 2;
		} else {
			rippleWeight(i, char[i].weight2, -1);
		}
		let len = char[char[i].standingOn].stoodOnBy.length;
		for (let j = 0; j < len; j++) {
			if (char[char[i].standingOn].stoodOnBy[j] == i) {
				after = true;
			}
			if (after && j <= len - 2) {
				char[char[i].standingOn].stoodOnBy[j] = char[char[i].standingOn].stoodOnBy[j + 1];
			}
		}
		char[char[i].standingOn].stoodOnBy.pop();
		char[i].standingOn = -1;
		char[i].onob = false;
		for (let j = 0; j < char[i].stoodOnBy.length; j++) {
			fallOff(char[i].stoodOnBy[j]);
		}
	}
}

function aboveFallOff(i) {
	if (char[i].stoodOnBy.length >= 1) {
		for (let j = 0; j < char[i].stoodOnBy.length; j++) {
			fallOff(char[i].stoodOnBy[j]);
		}
	}
}

const charD = [
	[28,45.4,0.45,27,0.8,false,1,1,true,10],
	[23,56,0.36,31,0.8,false,1.7,1,true,10],
	[20,51,0.41,20,0.85,false,5,1,false,10],
	[10,86,0.26,31,0.8,false,1.6,1,true,10],
	[10,84,0.23,31,0.8,false,1.4,1,true,10],
	[28,70,0.075,28,0.8,false,9,1,true,10],
	[26,49,0.2,20,0.75,false,0.6,1,false,10],
	[44,65,0.8,20,0.75,false,0.8,1,false,10],
	[16,56,0.25,17,0.76,false,0.8,1,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[0,0,0,0,0,false,1,0,true,10],
	[36.5,72.8,1,20,0.6,false,0,1,true,6],
	[15.1,72.8,0.6,20,0.7,true,0,1,true,6],
	[20,40,0.15,20,0.7,true,0.7,1,true,6],
	[25,50,0.64,20,0.6,true,0.1,1,true,6],
	[25,10,1,5,0.7,true,0.2,1,true,4],
	[25,50,1,20,0.7,true,0.1,1,true,3],
	[25,29,0.1,20,0.8,true,1,1,true,6],
	[21.5,43,0.3,20,0.6,true,0.5,1,true,6],
	[35,60,1,20,0.7,true,0.1,1,true,3],
	[22.5,45,1,20,0.7,true,0.8,1,true,3],
	[25,50,1,20,0.7,true,0.1,27,true,3],
	[15,30,0.64,20,0.6,true,0.2,1,true,3],
	[10,55,0.8,20,0.3,true,0.4,1,true,6],
	[45,10,1,20,0.7,true,0.2,1,true,4],
	[20,40,1,20,0.8,false,0.8,5,true,3],
	[16,45,0.4,20,0.94,false,1.1,60,true,3],
	[25,10,1,20,0.7,true,0.3,1,true,3],
	[45,10,0.4,20,0.7,true,0.7,1,true,4],
	[15,50,0.1,20,0.8,true,1.9,1,true,6],
	[25,25,0.1,20,0.8,true,1.7,1,true,6],
	[30,540,10,20,0.4,true,0,1,true,3]
];
class Character {
	constructor(tid, tx, ty, tcharState) {
		this.id = tid;
		this.x = tx;
		this.y = ty;
		this.px = tx;
		this.py = ty;
		this.vx = 0;
		this.vy = 0;
		this.onob = false;
		this.dire = 4;
		this.carry = false;
		this.carryObject = 0;
		this.carriedBy = 200;
		this.landTimer = 200;
		this.deathTimer = 30;
		this.charState = tcharState;
		this.standingOn = -1;
		this.stoodOnBy = [];
		this.w = charD[this.id][0];
		this.h = charD[this.id][1];
		this.weight = charD[this.id][2];
		this.weight2 = this.weight;
		this.h2 = charD[this.id][3];
		this.atEnd = false;
		this.friction = charD[this.id][4];
		this.fricGoal = 0;
		this.justChanged = 2;
		this.speed = 0;
		this.motionString = [];
		this.buttonsPressed = [];
		this.pcharState = 0;
		this.submerged = 0;
		this.temp = 0;
		this.heated = 0;
		this.heatSpeed = charD[this.id][6];
		this.hasArms = charD[this.id][8];
		this.placed = true; // used in the level creator

		this.frame = 3;
		this.poseTimer = 0;
		this.leg1frame = 0;
		this.leg2frame = 0;
		this.legdire = 1;
		this.leg1skew = 0;
		this.leg2skew = 0;
		this.legAnimationFrame = [0, 0]; // Animation offset.
		this.burstFrame = -1;
		this.diaMouthFrame = 0;
		this.expr = 0;
		this.dExpr = 0;
		this.acidDropTimer = [0, 0]; // Why am I doing it like this
	}

	applyForces(grav, control, waterUpMaxSpeed) {
		let gravity = Math.sign(grav) * Math.sqrt(Math.abs(grav));

		if (!this.onob && this.submerged != 1) this.vy = Math.min(this.vy + gravity, 25);
		if (this.onob || control) {
			this.vx = (this.vx - this.fricGoal) * this.friction + this.fricGoal;
		} else {
			this.vx *= 1 - (1 - this.friction) * 0.12;
		}

		if (Math.abs(this.vx) < 0.01) this.vx = 0;

		if (this.submerged == 1) {
			this.vy = 0;
			if (this.weight2 > 0.18) this.submerged = 2;
		} else if (this.submerged >= 2) {
			if (this.vx > 1.5) this.vx = 1.5;
			if (this.vx < -1.5) this.vx = -1.5;

			if (this.vy > 1.8) this.vy = 1.8;
			if (this.vy < -waterUpMaxSpeed) this.vy = -waterUpMaxSpeed;
		}
	}

	charMove() {
		this.y += this.vy;
		this.x += this.vx;
	}

	moveHorizontal(power) {
		if (power * this.fricGoal <= 0 && !this.onob) this.fricGoal = 0;
		this.vx += power;
		if (power < 0) this.dire = 1;
		if (power > 0) this.dire = 3;
		this.justChanged = 2;
	}

	stopMoving() {
		if (this.dire == 1) this.dire = 2;
		if (this.dire == 3) this.dire = 4;
	}

	jump(jumpPower) {
		this.vy = jumpPower;
	}

	swimUp(jumpPower) {
		this.vy -= this.weight2 + jumpPower;
	}
}

// run everything
runAllSimulations();
