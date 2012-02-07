//JavaScript Image Resizer (c) 2012 - Grant Galitz
function Resize(widthOriginal, heightOriginal, targetWidth, targetHeight) {
	this.widthOriginal = widthOriginal >>> 0;
	this.heightOriginal = heightOriginal >>> 0;
	this.targetWidth = targetWidth >>> 0;
	this.targetHeight = targetHeight >>> 0;
	this.initialize();
}
Resize.prototype.initialize = function () {
	//Perform some checks:
	if (this.widthOriginal > 0 && this.heightOriginal > 0 && this.targetWidth > 0 && this.targetHeight > 0) {
		if (this.widthOriginal == this.targetWidth && this.heightOriginal == this.targetHeight) {
			//Setup a resizer bypass:
			this.resize = this.bypassResizer;
		}
		else if (this.widthOriginal == this.targetWidth) {
			//Bypass the width resizer pass:
			this.initializeSecondPassBuffer();
			this.compileHeightResize();
			this.resize = this.resizeHeight;
		}
		else if (this.heightOriginal == this.targetHeight) {
			//Bypass the height resizer pass:
			this.initializeFirstPassBuffer();
			this.compileWidthResize();
			this.resize = this.resizeWidth;
		}
		else {
			//Resize the image with two passes:
			this.initializeFirstPassBuffer();
			this.initializeSecondPassBuffer();
			this.compileWidthResize();
			this.compileHeightResize();
			this.resize = this.resizer;
		}
	}
	else {
		throw(new Error("Invalid settings specified for the resizer."));
	}
}
Resize.prototype.compileWidthResize = function () {
	this.ratioWidthWeight = this.widthOriginal / this.targetWidth;
	var pixelOffset = 0;
	var toCompile = "\
	var ratioWeight = this.ratioWidthWeight;\
	var weight = 0;\
	var actualPosition = 0;\
	var amountToNext = 0;\
	var outputBuffer = this.widthBuffer;\
	var outputOffset = 0;\
	var currentPosition = 0;";
	for (var line = 0; line < this.heightOriginal; ++line) {
		toCompile += "\
	var output" + line + " = 0;"
	}
	toCompile += "\
	do {\
		weight = ratioWeight;";
	for (line = 0; line < this.heightOriginal; ++line) {
		toCompile += "\
		output" + line + " = 0;"
	}
	toCompile += "\
		while (weight > 0 && actualPosition < " + this.widthOriginal + ") {\
			amountToNext = 1 + actualPosition - currentPosition;\
			if (weight >= amountToNext) {";
	for (pixelOffset = line = 0; line < this.heightOriginal; ++line, pixelOffset += this.widthOriginal) {
		toCompile += "\
				output" + line + " += buffer[actualPosition" + ((line > 0) ? (" + " + pixelOffset) : "") + "] * amountToNext;";
	}
	toCompile += "\
				currentPosition = ++actualPosition;\
				weight -= amountToNext;\
			}\
			else {";
	for (pixelOffset = line = 0; line < this.heightOriginal; ++line, pixelOffset += this.widthOriginal) {
		toCompile += "\
				output" + line + " += buffer[actualPosition" + ((line > 0) ? (" + " + pixelOffset) : "") + "] * weight;";
	}
	toCompile += "\
				currentPosition += weight;\
				break;\
			}\
		}";
	for (pixelOffset = line = 0; line < this.heightOriginal; ++line, pixelOffset += this.targetWidth) {
		toCompile += "\
		outputBuffer[outputOffset" + ((line > 0) ? (" + " + pixelOffset) : "") + "] = output" + line + " / ratioWeight;";
	}
	toCompile += "\
		++outputOffset;\
	} while (outputOffset < " + this.targetWidth + ");\
	return outputBuffer;";
	this.resizeWidth = Function("buffer", toCompile);
}
Resize.prototype.compileHeightResize = function () {
	this.ratioHeightWeight = this.heightOriginal / this.targetHeight;
	var toCompile = "\
	var ratioWeight = this.ratioHeightWeight;\
	var weight = 0;\
	var actualPosition = 0;\
	var amountToNext = 0;\
	var outputBuffer = this.heightBuffer;\
	var outputOffset = 0;\
	var lastRowBegin = 0;\
	var currentPosition = 0;";
	for (var pixelOffset = 0; pixelOffset < this.targetWidth; ++pixelOffset) {
		toCompile += "\
	var output" + pixelOffset + " = 0;"
	}
	toCompile += "\
	do {\
		weight = ratioWeight;";
	for (pixelOffset = 0; pixelOffset < this.targetWidth; ++pixelOffset) {
		toCompile += "\
		output" + pixelOffset + " = 0;"
	}
	toCompile += "\
		while (weight > 0 && actualPosition < " + (this.targetWidth * this.heightOriginal) + ") {\
			amountToNext = 1 + actualPosition - currentPosition;\
			if (weight >= amountToNext) {";
	for (pixelOffset = 0; pixelOffset < this.targetWidth; ++pixelOffset) {
		toCompile += "\
				output" + pixelOffset + " += buffer[actualPosition++] * amountToNext;"
	}
	toCompile += "\
				currentPosition = actualPosition;\
				weight -= amountToNext;\
			}\
			else {";
	for (pixelOffset = 0; pixelOffset < this.targetWidth; ++pixelOffset) {
		toCompile += "\
				output" + pixelOffset + " += buffer[actualPosition" + ((pixelOffset > 0) ? (" + " + pixelOffset) : "") + "] * weight;"
	}
	toCompile += "\
				currentPosition += weight;\
				break;\
			}\
		}";
	for (pixelOffset = 0; pixelOffset < this.targetWidth; ++pixelOffset) {
		toCompile += "\
		outputBuffer[outputOffset++] = output" + pixelOffset + " / ratioWeight;"
	}
	toCompile += "\
	} while (outputOffset < " + (this.targetWidth * this.targetHeight) + ");\
	return outputBuffer;";
	this.resizeHeight = Function("buffer", toCompile);
}
Resize.prototype.resizer = function (buffer) {
	return this.resizeHeight(this.resizeWidth(buffer));
}
Resize.prototype.bypassResampler = function (buffer) {
	//Just return the buffer passsed:
	return buffer;
}
Resize.prototype.initializeFirstPassBuffer = function () {
	//Initialize the internal width pass buffer:
	try {
		this.widthBuffer = new Float32Array(this.targetWidth * this.heightOriginal);
	}
	catch (error) {
		this.widthBuffer = [];
	}
}
Resize.prototype.initializeSecondPassBuffer = function () {
	//Initialize the internal buffer:
	try {
		this.heightBuffer = new Float32Array(this.targetWidth * this.targetHeight);
	}
	catch (error) {
		this.heightBuffer = [];
	}
}