Array.prototype.shuffle = function () {
	let currentIndex = this.length,  randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[this[currentIndex], this[randomIndex]] = [
			this[randomIndex], this[currentIndex]];
	}
}

Array.prototype.random = function () {
	var randomIndex = Math.floor(Math.random() * this.length);
	return this[randomIndex]
}

Array.prototype.awaitForEach = async function(func) {
	var proms = []

	this.forEach((...args) => {
		proms.push(func(...args))
	})

	return await Promise.all(proms)
}

Array.prototype.asyncForEach = async function(func) {
	// var i = 0
	// var length = this.length
	// var funcs = []
	// var reses = []
	// return new Promise(async (res, rej) => {
	// 	if (this.length > 0) {
	// 		this.forEach((...args) => {
	// 			funcs.push(func.bind(this, ...args))
	// 		})

	// 		async function loop() {
	// 			console.log(funcs)
	// 			var this_res = null
	// 			if (typeof funcs[i] == "function") {
	// 				this_res = await funcs[i]()
	// 			}
	// 			reses.push(this_res)
	// 			i++
	// 			if (i == length) {
	// 				res(reses)
	// 			} else {
	// 				loop()
	// 			}
	// 		}

	// 		loop()
	// 	} else {
	// 		res([])
	// 	}
	// })
}

Array.prototype.last = function(offset = 1) {
	return this[this.length-offset]
}

Array.prototype.remove = function (index) {
    if (index > -1 && index < this.length-1) {
    	var return_value = this.splice(index, 1)
    	return return_value
    }
}