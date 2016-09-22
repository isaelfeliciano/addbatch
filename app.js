const shortid = require('shortid');
const fs = require('fs');
const path = require('path');
const uniqueTempDir = require('unique-temp-dir');
const lS = localStorage;
const exec = require('child_process').exec;
var count = 1;
var ticketsValues = [];
var modifyingBatch = false;

const tempDir = uniqueTempDir({create: true, thunk: true});
if (!lS.getItem('tempFile')){
	var tempFile = path.join(tempDir(), 'addbatch.txt');
	lS.setItem('tempFile', tempFile);
}
console.log(lS.getItem('tempFile'));

var testJSON = {
	"batchNumber" : 1,
	"ticketsQuantity" : 2,
	"total" : 65462,
	"modified" : "0",
	"addedBy" : "Rogelio Feliciano",
	"tickets" : [
		{
			"quantity" : 1,
			"modified" : "00"
		},
		{
			"quantity" : 65461,
			"modified" : "00"
		}
	]
}

var testArray = [];

testTickets = testJSON.tickets;
_.forEach(testTickets, function(ticket, index) {
	let quantity = numeral(ticket.quantity).format("0,0.000");
	testArray.push(putSpaceInFront(`${quantity} (${ticket.modified})`));
	if (testTickets.length == (index + 1)) {
		let batchStatsArray = [
			"------------------------",
			putSpaceInFront(numeral(testJSON.total).format("0,0.000")),
			putSpaceInFront("Total"),
			" ",
			putSpaceInFront(testJSON.batchNumber.toString()),
			putSpaceInFront("Batch number"),
			" ",
			putSpaceInFront(testJSON.ticketsQuantity.toString()),
			putSpaceInFront("Tickets"),
			" ",
			putSpaceInFront(testJSON.modified + "x"),
			putSpaceInFront("Modified"),
			" "
		];
		_.forEach(batchStatsArray, function(value, index) {
			testArray.push(value);
			if (batchStatsArray.length == (index + 1)){
				printToTextFile(testArray);
			}
		});
	}
});

function putSpaceInFront(string) {
	let size = string.length;
	let difference = 24 - size;
	return string = ' '.repeat(difference) + string;
}

function printToTextFile(data) {
	fs.writeFile(lS.getItem('tempFile'), "", function(err) {
		if (err) {
			return console.log("Error cleaning temp file");
		}
		data.forEach(function(line) {
			fs.appendFileSync(lS.getItem('tempFile'), line.toString() + '\n');
		});
		let pathToFile = lS.getItem('tempFile');
		exec(`notepad /p ${pathToFile}`, (err, sto, ste) => {
			if (err) {
				return console.log("Error sending CMD to print");
			}
			if (ste) {
				console.log(ste);
			}
			console.log(sto);
		});
	});
}


Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
}

if (lS.getItem('firstTime')) {
	var user = lS.getObj('firstTime');
	$('input[name="added-by"]').val(user.userName);
}

$('input[name="added-by"]').on('keydown', (e) => {
	if (e.which == 13 || e.keyCode == 13) {
		e.preventDefault();
		let input = $('input[name="added-by"]')
		input.blur();
		$('body').focus();
		lS.setObj('firstTime', {userName: input.val()})
	}
})

function updateNumberFormat() {
	$('input[name="quantity"]').each(function() {
		let value = $(this).val();
		value = numeral(value).format('0,0.000');
		$(this).val(value);
	});

	(function() {
		let value = $('#jsTotal').text();
		value = numeral(value).format('0,0.000');
		$('#jsTotal').text(value);
	})();
};
updateNumberFormat();

$('#btn-create-page').on('click', (e) => {
	e.preventDefault();
	modifyingBatch = false;
	window.location = "#create-page";
	$('#jsModalIcon').attr('class', 'fa fa-5x fa-book').text('');
	$('#jsModalInput').attr('name', 'batchNumber');
	$('#jsModalInput').attr('placeholder', 'Enter batch number');
	$('#jsModalInputContainer').removeClass('no-display');
	$('#jsModalInput').focus();
	$('.jsModalBtnSave').text('Start adding').on('click', (e) => {
		e.preventDefault();
		btnModalSaveNewBatch();
	});
});

$('#jsModalInput').on('keydown', (e) => {
	if (e.which == 13 || e.keyCode == 13) {
		if ($('.modal__box i').hasClass('fa-book')) {
			btnModalSaveNewBatch();
		} else {
			btnModalSaveNewUser();
		}
	}
});

function btnModalSaveNewBatch() {
	let batchNumber = $('#jsModalInput').val();
	$('#jsBatchNumber').text(batchNumber);
	$('#jsModalInputContainer').addClass('no-display');
	$('input[name="number-input"]').focus();
	loadingIn();
	getAjax(batchNumber, 'searchBatch', null);
}

function btnModalSaveNewUser() {
	let userName = $('input[name="user"]').val();
	let firstTime = {userName: userName};
	firstTime = JSON.stringify(firstTime);
	lS.setItem('firstTime', firstTime);
	$('#jsModalInputContainer').addClass('no-display');
	$('input[name="added-by"]').val(userName);
	$('input[name="user"]').val('');
	$('input[name="search"]').focus();
}

// lS.removeItem('firstTime');
if (!lS.getItem('firstTime')) {
	$('#jsModalInputContainer').removeClass('no-display');
	$('input[name="user"]').focus();
	$('.jsModalBtnSave').on('click', function(e) {
		e.preventDefault();
		btnModalSaveNewUser();
	});
}

$('input[name="number-input"]' ).on('keydown', function(e) {
	if (e.which == 13 || 
	e.keyCode == 13 || 
	e.which == 107 ||
	e.keyCode == 107 ) {
		e.preventDefault();
		let value = $(this).val();
		addTicketsAndPopulateList(value, "00");
	}

	if (e.which == 109 || e.keyCode == 109) {
		e.preventDefault();
		let value = $(this).val();
		value = '-' + value;
		addTicketsAndPopulateList(value, "00");
	}
});

$('input[name="search"]').on('keydown', function(e) {
	if (e.which == 13 || e.keyCode == 13) {
		e.preventDefault();
		let batchNumber = $(this).val();
		getAjax(batchNumber, 'searchBatchGetJSON', function(data) {
			$('#jsTotal').text(data.total);
			$('#jsBatchNumber').text(data.batchNumber);
			$('#jsTickets').text(data.ticketsQuantity);
			$('#jsTimesModified').text(data.modified);
			$('input[name="added-by"]').val(data.addedBy);

			lS.setItem('batchId', data.id);
			var tickets = data.tickets;
			_.forEach(tickets, function(ticket, index) {
				count = index++;
				addTicketsAndPopulateList(ticket.quantity, ticket.modified);
				if (index == tickets.length) {
					location = '#create-page';
					modifyingBatch = true;
				}
			});
		});
	}
});

function recalculateBatch() {
	let tempStorage = [];
	let ticketsQuantity = parseInt($('#jsTickets').text());
	$('input[name="quantity"]').each(function(i, value) {
		tempStorage.push(numeral().unformat($(this).val()));
		if (i == (ticketsQuantity - 1)) {
			console.log("recalculateBatch");
			let total = _.sum(tempStorage);
			$('#jsTotal').text(total);
			updateNumberFormat();
		}
	});
}


function addTicketsAndPopulateList(value, modified) {
	$('.quantity-list').append(
		`<li>
			<input id="${count}" class="jsResetInput" type="text" name="quantity" value="${value}" maxlength="15"> 
			<span>(${modified})</span>
		</li>`
	);
	$('input[name="number-input"]').val('');
	
	/*var backSpace = jQuery.Event("keydown");
	backSpace.which = 8;
	$('input[name="number-input"]').trigger(backSpace);*/
	
	updateNumberFormat();

	$('#jsTickets').text($('.quantity-list').children().length);

	if (typeof(value) == 'string'){
		value = numeral().unformat(value);
	}
	value = parseFloat(value);
	recalculateBatch();

	$('input#'+count).on('keydown', function(e) {
		if (e.which == 13 || 
		e.keyCode == 13 || 
		e.which == 107 ||
		e.keyCode == 107 ) {
			e.preventDefault();
			let value = $(this).val();
			value = value.replace('-', '');
			$(this).val(value);
			recalculateBatch();
		}

		if (e.which == 109 || e.keyCode == 109) {
			e.preventDefault();
			let value = $(this).val();
			value = '-' + value;
			$(this).val(value);
			recalculateBatch();
		}
	});
	count++;
}

var decimal = false;
$(document).on('keyup', 'input[data-type="number"]', function() {
	let value = $(this).val();
	valueStr = value.toString();
	if (valueStr.indexOf('.') !== -1) {
		decimal = true;
	  } else {decimal = false}
	if (value.length >= 3 && decimal == false) {
		value = numeral(value).format('0,0');
		$(this).val(value);
	}
});

var getTickets = function(tickets, callback) {
	let resultArray = [];
	$('input[name="quantity"]').each(function(i, value) {
		let obj = {};
		obj.quantity = numeral().unformat($(this).val());
		obj.modified = $(this).next().text();
		obj.modified = numeral(obj.modified).format();
		resultArray.push(obj);
		if (i == (tickets-1))
			callback(resultArray);
	});
}

$('#jsBtnSaveAndPrint').on('click', (e) => {
    loadingIn();
	let batchObj = {};
	let batchNumber = parseInt($('#jsBatchNumber').text());
	let ticketsQuantity = parseInt($('#jsTickets').text());
	let total = numeral().unformat($('#jsTotal').text());
	let modified = $('#jsTimesModified').text();
	let addedBy = $('input[name="added-by"]').val();
	if (modifyingBatch === true) {
		var id = lS.getItem('batchId');
	} else {
		var id = shortid.generate();
	}
	getTickets(ticketsQuantity, function(tickets){
		batchObj = {
			id: id,
			batchNumber: batchNumber,
			ticketsQuantity: ticketsQuantity,
			total: total,
			modified: modified,
			addedBy: addedBy,
			tickets: tickets
		}
		lS.setObj('batchData', batchObj);
		// batchObj = JSON.stringify(batchObj);
		sendJSON(batchObj);
	});
});

function loadingIn() {
	$('#jsModalLoading span').text("Loading...");
	$('#jsModalLoading i')
		.addClass('fa-cog fa-spin fa-fw')
		.removeClass('fa-check');
    $('#jsModalLoading').removeClass('no-display')
    $('#jsModalLoading').removeClass('fadeOutUpBig')
    .addClass('fadeInUpBig');
};

function loadingOut(err, text, printAfter) {
	if (err) {
		setTimeout(function waitOneSec() {
		$('#jsModalLoading span').text(text);
		$('#jsModalLoading i')
		.removeClass('fa-cog fa-spin fa-fw')
		.addClass('fa-times');
	}, 1000);
	} else {
		setTimeout(function waitOneSec() {
			$('#jsModalLoading span').text(text);
			$('#jsModalLoading i')
			.removeClass('fa-cog fa-spin fa-fw')
			.addClass('fa-check');
		}, 1000);
	    setTimeout(function waitTwoSec() {
	    $('#jsModalLoading').removeClass('fadeInUpBig')
	    .addClass('fadeOutUpBig');
	    if (printAfter) {
	    	printAfter();
	    }
	    }, 2500);
	}
}

function sendJSON(data) {
	data = localStorage.getItem('batchData');
	console.log(data);
	$.ajax({
		url: 'http://localhost:3131/saveBatchAndPrint',
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json',
		data: data,
		})
		.done(function(data, textStatus, jqXHR) {
			if (data.msg == 'error-saving') {
				console.log('error-saving');
				loadingOut(true, 'Error Saving to DB');
			} else {
				console.log(`success ${data.msg}`);
				loadingOut(null, 'Batch saved', printTape);
				count = 1;
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			console.log(errorThrown);
			loadingOut(true, "Error sending to server")
		})
		.always(function(data, textStatus, jqXHR) {
			console.log("complete");
			console.log(textStatus);
		});
}

function getAjax(data, route, callback) {
	$.ajax({
		url: 'http://localhost:3131/'+route,
		type: 'GET',
		data: {batchid: data}
		})
		.done(function(data, textStatus, jqXHR) {
			if (data.msg == 'error-searching') {
				console.log('error-searching');
				loadingOut(true, 'Error searching for batch');
			} 
			if (data.msg == 'batch-exist') {
				loadingOut(null, 'Batch Exist');
				resetInputs();
				$('#btn-create-page').trigger('click');
				count = 1;
			}
			if (data.msg == 'batch-no-exist') {
				loadingOut(null, 'Batch no exist');
			}
			if (callback) {
				callback(data);
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			console.log(errorThrown);
			loadingOut(true, "Error sending to server")
		})
		.always(function(data, textStatus, jqXHR) {
			console.log("complete");
			console.log(textStatus);
		});
}

function resetInputs() {
	$('.jsResetInput').val('');
	$('#jsBatchNumber, #jsTotal, #jsTickets').text('0');
	$('.quantity-list').empty();
	ticketsValues = [];
}

$('.btnCancel').on('click', (e) => {
	resetInputs();
	$('#jsModalInputContainer').addClass('no-display');
	count = 1;
});

function printTape() {
	hideOnPrint();
	window.print({
		"headerFooterEnabled": true,
		"shouldPrintBackgrounds": false
	});
	hideOnPrint(); // Unhide elements
	resetInputs();
}

function hideOnPrint() {
	$('.jsHideOnPrint').toggleClass('no-display');
}