"use strict";

// Pong source
var Pong = Pong || {};

// self-executing function limits the scope of what's within.
(function(window, document, Pong){

	Pong.Game = function(id){

		// dom elements
		this.elms = {
			'container': document.getElementById(id),
			'canvas': document.createElement('canvas'),
			'context': null
		};

		this.elms['canvas'].setAttribute('width', 800);
		this.elms['canvas'].setAttribute('height', 600);
		
		// append canvas to div
		this.elms['container'].appendChild(this.elms['canvas']);

		// get context
		this.elms['context'] = this.elms['canvas'].getContext('2d');

		// some options
		this.options = {
			'fps': 30,
			'showWinningScreen': false,
			'winningScore': 3,
		};

		this.default = {
			'xspeed': .2
		}

		this.ball = {
			x: 400,
			y: 300,
			radius: 15,
			collision_factor: 1.6, 
			collision_decay: 0.2, 
			state: 1, 
			xspeed: .2, 
			yspeed: .2,
			animate: false
		};

		this.paddles = {player1: {y: 350}, player2: {y: 350}, width: 10, height: 100};

		this.score = {player1: 0, player2: 0};

		this.ai = {
			difficulty: .4,
			debug: true,
			target: this.ball.x,
			paddleSpeed: .2,
		};

		this.time = null;
	}

	Pong.setup = function(id, width, height, difficulty) {
		var p = new Pong.Game(id);

		if (width) { p.elms['canvas'].setAttribute('width', width); }
		if (height) { p.elms['canvas'].setAttribute('height', height); }
		if (difficulty) {p.ai.difficulty = difficulty; }
		
		p.setup();

		return p;
	}

	Pong.Game.prototype.setup = function(){

		this.resetBall(0);
		this.draw();
		
		var self = this;
		
		// setup update function
		function step(timestamp) {
			self.draw();
			self.moveBall(timestamp);
			window.requestAnimationFrame(step);
		}

		window.requestAnimationFrame(step);

		// mouse click
		this.bindMouseClick();
		
		// mouse move
		this.bindMouseMove();
	}

	// 	$$\      $$\  $$$$$$\  $$\   $$\  $$$$$$\  $$$$$$$$\
	// 	$$$\    $$$ |$$  __$$\ $$ |  $$ |$$  __$$\ $$  _____|
	// 	$$$$\  $$$$ |$$ /  $$ |$$ |  $$ |$$ /  \__|$$ |
	// 	$$\$$\$$ $$ |$$ |  $$ |$$ |  $$ |\$$$$$$\  $$$$$\
	// 	$$ \$$$  $$ |$$ |  $$ |$$ |  $$ | \____$$\ $$  __|
	// 	$$ |\$  /$$ |$$ |  $$ |$$ |  $$ |$$\   $$ |$$ |
	// 	$$ | \_/ $$ | $$$$$$  |\$$$$$$  |\$$$$$$  |$$$$$$$$\
	// 	\__|     \__| \______/  \______/  \______/ \________|

	Pong.Game.prototype.bindMouseMove = function() {
		var self = this;
		
		// listen
		this.elms['canvas'].addEventListener('mousemove', function(evt) {
			var mousePos = self.calculateMousePos(evt);
			self.paddles['player1'].y = mousePos.y - (self.paddles['height'] / 2);
		});
	}

	Pong.Game.prototype.bindMouseClick = function() {
		var self = this;
		
		this.elms['canvas'].addEventListener('mousedown', function(evt){
			if(! self.options['showWinningScreen']) { return; }
			
			self.score.player1 = 0;
			self.score.player2 = 0;
			self.options['showWinningScreen'] = false;
			self.resetBall(0);
		});
	}

	Pong.Game.prototype.calculateMousePos = function(evt) {

		var rect = this.elms['canvas'].getBoundingClientRect();
		var doc = document.documentElement;
		var mouseX = evt.clientX - rect.left - doc.scrollLeft;
		var mouseY = evt.clientY - rect.top - doc.scrollTop;

		return { x: mouseX, y: mouseY};
	}

	// 	 $$$$$$\  $$\   $$\ $$$$$$$\  $$$$$$\  $$$$$$\
	// 	$$  __$$\ $$ |  $$ |$$  __$$\ \_$$  _|$$  __$$\
	// 	$$ /  $$ |$$ |  $$ |$$ |  $$ |  $$ |  $$ /  $$ |
	// 	$$$$$$$$ |$$ |  $$ |$$ |  $$ |  $$ |  $$ |  $$ |
	// 	$$  __$$ |$$ |  $$ |$$ |  $$ |  $$ |  $$ |  $$ |
	// 	$$ |  $$ |$$ |  $$ |$$ |  $$ |  $$ |  $$ |  $$ |
	// 	$$ |  $$ |\$$$$$$  |$$$$$$$  |$$$$$$\  $$$$$$  |
	// 	\__|  \__| \______/ \_______/ \______| \______/

	Pong.Game.prototype.playBoing = function() {
		// hack that creates the sound each time
		// 1) the same sound can not be played multiple times
		// 2) a proper buffering requires a server setup
		// 3) create element is used instead of New Audio(); because it is in practice is more stable
		var audio = document.createElement('audio');
	
		if(Math.random()<0.042)
		{
			audio.src = 'audio/booiing.wav';
			this.ball.state += 0.2 * (this.ball.state - 1);
		} 
		else
		{
			audio.src = 'audio/boing' + getRandomInt(1, 5) + '.wav';
		}
	
		audio.play();
	}
	
	// 	$$$$$$$\   $$$$$$\  $$\       $$\
	// 	$$  __$$\ $$  __$$\ $$ |      $$ |
	// 	$$ |  $$ |$$ /  $$ |$$ |      $$ |
	// 	$$$$$$$\ |$$$$$$$$ |$$ |      $$ |
	// 	$$  __$$\ $$  __$$ |$$ |      $$ |
	// 	$$ |  $$ |$$ |  $$ |$$ |      $$ |
	// 	$$$$$$$  |$$ |  $$ |$$$$$$$$\ $$$$$$$$\
	// 	\_______/ \__|  \__|\________|\________|

	Pong.Game.prototype.resetBall = function(multiplier) {

		if (! multiplier) { multiplier = 1;}
		if (multiplier == 0) {
			this.ball.xspeed = this.default.xspeed;
		}

		if(this.score.player1 >= this.options['winningScore'] ||
			this.score.player2 >= this.options['winningScore'])
		{
			this.options['showWinningScreen'] = true;
   		}

		this.ball.x = this.elms['canvas'].width / 2;
		this.ball.y = this.elms['canvas'].height / 2;

		this.ball.xspeed = - multiplier * this.ball.xspeed;
		this.ball.yspeed = multiplier * (2 * Math.random() -  1) * this.ball.xspeed;
	}

	Pong.Game.prototype.moveBall = function(timestamp){
		
		var dtime = this.time ? timestamp - this.time : 0;

		if(this.options['showWinningScreen']) { return; }

		// reduce bounce
		this.ball.state += (1 - this.ball.state)*this.ball['collision_decay']

		// update position
		this.ball.x += this.ball.xspeed * dtime;
		this.ball.y += this.ball.yspeed * dtime;

		// update ai move
		this.AIUpdatePosition(dtime);

		// hitting the bottom
		if(this.ball.y > this.elms['canvas'].height - this.ball.radius) 
		{
			this.ball.y = this.elms['canvas'].height - this.ball.radius;
			this.ball.yspeed = -1 * this.ball.yspeed;
			this.ball.state = 1 / this.ball['collision_factor'];

			this.playBoing();
		}
		// hitting the top
		else if (this.ball.y < this.ball.radius) {
			this.ball.y = this.ball.radius
			this.ball.yspeed = -1*this.ball.yspeed
			this.ball.state = 1/this.ball['collision_factor']

			this.playBoing();
		}

		// within left (player) paddle
		if( this.ball.x < this.ball.radius + this.paddles['width'] / 2 &&
				this.ball.y > this.paddles['player1'].y - this.ball.radius &&
				this.ball.y < this.paddles['player1'].y + this.paddles['height'] + this.ball.radius) {
			
			this.ball.x = this.ball.radius + this.paddles['width'] / 2;
			this.ball.xspeed = - this.ball.xspeed;
			
			var dy = this.ball.y - (this.paddles['player1'].y + this.paddles['height'] / 2);

			this.ball.yspeed = dy * .01;
			this.ball.state = this.ball['collision_factor'] - 0.1 + 0.3 * Math.abs(dy) / this.paddles['height'];

			this.playBoing();

		}

		// within right (ai) paddle
		if( this.ball.x > this.elms['canvas'].width - this.ball.radius - this.paddles['width'] / 2 &&
					this.ball.y > this.paddles['player2'].y - this.ball.radius &&
					this.ball.y < this.paddles['player2'].y + this.paddles['height'] + this.ball.radius){
			
			this.ball.x = this.elms['canvas'].width - this.ball.radius - this.paddles['width']/2;
			this.ball.xspeed = - this.ball.xspeed;

			var dy = this.ball.y - (this.paddles['player2'].y + this.paddles['height']/2);
			this.ball.yspeed = dy * .01;
			this.ball.state = this.ball['collision_factor'] - 0.1 + 0.3 * Math.abs(dy) / this.paddles['height'];

			this.playBoing();
		}

		// SCORING
		// right side
		if(this.ball.x > this.elms['canvas'].width + this.ball.radius) {
			this.score.player1 ++;
			// outside paddle       
			this.resetBall(1.1);
		}
		// left side
		else if (this.ball.x < - this.ball.radius){
			this.score.player2 ++;
			// outside paddle
			this.resetBall(1.1);
		}

		this.time = timestamp;
	}

	// 	$$$$$$$\  $$$$$$$\   $$$$$$\  $$\      $$\
	// 	$$  __$$\ $$  __$$\ $$  __$$\ $$ | $\  $$ |
	// 	$$ |  $$ |$$ |  $$ |$$ /  $$ |$$ |$$$\ $$ |
	// 	$$ |  $$ |$$$$$$$  |$$$$$$$$ |$$ $$ $$\$$ |
	// 	$$ |  $$ |$$  __$$< $$  __$$ |$$$$  _$$$$ |
	// 	$$ |  $$ |$$ |  $$ |$$ |  $$ |$$$  / \$$$ |
	// 	$$$$$$$  |$$ |  $$ |$$ |  $$ |$$  /   \$$ |
	// 	\_______/ \__|  \__|\__|  \__|\__/     \__|

	Pong.Game.prototype.drawBackground = function(){
		this.elms['context'].fillStyle = 'gray' 

		for(var i=10; i < this.elms['canvas'].height;i += 40){
			this.elms['context'].fillRect(this.elms['canvas'].width / 2 - 1, i, 3, 20, 'white');
		}

		this.elms['context'].strokeStyle = 'gray';
		this.elms['context'].lineWidth = 3;
		for(var i = Math.PI / 32; i <= 2 * Math.PI; i += Math.PI / 8){
			this.elms['context'].beginPath();
			this.elms['context'].arc(this.elms['canvas'].width / 2, this.elms['canvas'].height / 2, 100, i, i + Math.PI / 16, false);
			this.elms['context'].stroke();
			this.elms['context'].closePath();
		}
	}

	Pong.Game.prototype.drawPaddle = function(x, y) {
		this.elms['context'].fillStyle = 'white';
		this.elms['context'].fillRect(x, y, this.paddles['width'], this.paddles['height']);
	}

		// draw ball
	Pong.Game.prototype.drawBall = function(x, y, drawColor) {   
		console.log('drawball')
		console.log(x, y)
		// Begin path is important otherwise it, will remember old circles drawn?
		this.elms['context'].beginPath();
		this.elms['context'].arc(x, y, this.ball.radius, 0, 2 * Math.PI, false);
		this.elms['context'].fillStyle = drawColor;
		this.elms['context'].fill();
		this.elms['context'].closePath();
	}

	Pong.Game.prototype.draw = function(){

		// Top left corner is 0,0 and positive x is right
		// but positive y is down!
	
		// background
		this.elms['context'].fillStyle = 'black';
		this.elms['context'].fillRect(0, 0, this.elms['canvas'].width, this.elms['canvas'].height);

		// set font
		this.elms['context'].font = "30px New Courier";

		// draw winning screen (breaks)
		if(this.options['showWinningScreen']){
			
			this.elms['context'].fillStyle = 'white';

			if(this.score.player1 >= this.options['winningScore'])
			{
				this.elms['context'].fillText("Left player won", this.elms['canvas'].width / 2 - 75, 150)
			}
			else
			{
				this.elms['context'].fillText("Right player won",  this.elms['canvas'].width / 2 - 75, 150)
			}

			this.elms['context'].fillText("Click to continue",  this.elms['canvas'].width / 2 - 100, 500)
		
			return;
		}

		this.drawBackground();

		// draw left player paddle
		this.drawPaddle(0, this.paddles['player1']. y);
		
		// draw right opponents paddle
		this.drawPaddle(this.elms['canvas'].width - this.paddles['width'], this.paddles['player2'].y);
		 
		// draw ball
		this.elms['context'].save();
		if(this.ball.animate) {
			this.elms['context'].scale( 1 / this.ball.state, this.ball.state);
			this.drawBall(this.ball.x * this.ball.state, this.ball.y / this.ball.state, 'white');
		} else {
			this.drawBall(this.ball.x, this.ball.y, 'white');
		}
		this.elms['context'].restore();

		// score
		this.elms['context'].fillText(this.score.player1, this.elms['canvas'].width / 4 - 4, 100);
		this.elms['context'].fillText(this.score.player2, 3 * this.elms['canvas'].width / 4 - 4, 100);

		// ai debug 
		if(this.ai.debug){
			this.elms['context'].fillStyle = 'red';
			this.elms['context'].fillRect(this.elms['canvas'].width - 10, this.ai.target - 5, 10, 10);
		}
	}

	// 	 $$$$$$\  $$$$$$\
	// 	$$  __$$\ \_$$  _|
	// 	$$ /  $$ |  $$ |
	// 	$$$$$$$$ |  $$ |
	// 	$$  __$$ |  $$ |
	// 	$$ |  $$ |  $$ |
	// 	$$ |  $$ |$$$$$$\
	// 	\__|  \__|\______|

	// AI function 
	Pong.Game.prototype.AIUpdatePosition = function(dtime) {
		
		if (dtime == 0) return;

		this.ai.target = this.AIPredictImpactY();

		var dy = this.ai.target - this.paddles['player2'].y - this.paddles['height'] / 2;

		if (Math.abs(dy) > this.ai.paddleSpeed * dtime) {
			dy = Math.sign(dy) * this.ai.paddleSpeed * dtime;
		}
		
		this.paddles['player2'].y += dy;
	}

	Pong.Game.prototype.AIPredictImpactY = function() {
		// aiDifficulty determines when the computer will start calculating the correct end position
		if(this.ball.xspeed > 0 && this.ball.x > (1 - this.ai.difficulty) * this.elms['canvas'].width)
		{
			var time = (this.elms['canvas'].width - this.ball.x) / this.ball.xspeed // time to impact

			var hits = (this.ball.yspeed * time + this.ball.y) / this.elms['canvas'].height; // number of hits
			
			if(hits < 0){ hits = 1 - hits; }

			// n even
			if (hits % 2 < 1) 
			{
				return rmod(this.ball.yspeed * time + this.ball.y + 10 * this.elms['canvas'].height, this.elms['canvas'].height);
			}

			return this.elms['canvas'].height - rmod(this.ball.yspeed * time + this.ball.y + 10 * this.elms['canvas'].height, this.elms['canvas'].height);
		}
		else
		{
			return this.ball.y
		}
	}

	// Utilities
	function rmod(x, y) {
		// returns "x mod y" in interval 0 to y-1.
		var c = x % y;
		if(c<0){ return c + y; } 
		return c;
	}

	function getRandomInt(min, max) {
		// get a random integer
		return Math.floor(Math.random() * (max - min + 1)) + min
	}

})(window, document, Pong);
