const addbatchServerURL = process.env.ADDBATCH_SERVER_URL;
const shortid = require('shortid');
const fs = require('fs');
const path = require('path');
const uniqueTempDir = require('unique-temp-dir');
const lS = localStorage;
const exec = require('child_process').exec;
var count = 1;
var ticketsValues = [];
var modifyingBatch = false;
var log4js = require('log4js');


try {
	fs.statSync(lS.getItem('tempFile'));
	// logger.info("File exist");
}
catch(e) {
	let tempDir = uniqueTempDir({create: true, thunk: true});
	// logger.info("File does not exist");
	let tempFile = path.join(tempDir(), 'addbatch.txt');
	lS.setItem('tempFile', tempFile);
	lS.setItem('tempDir', tempDir());
	// logger.info("File Creado");
	fs.writeFile(tempFile, "");
}
console.log(lS.getItem('tempFile'));

// log4js.replaceConsole();
var tempLog = path.join(lS.getItem('tempDir'), 'addbatch.log');
log4js.configure({
	appenders: [
		{type: 'console'},
		{
			type: 'file', 
			filename: tempLog
		}
	],
	replaceConsole: true
})
var logger = log4js.getLogger();
logger.setLevel("ERROR");


function jsonToArray (jsonData) {
	// loadingIn();
	jsonData = JSON.parse(jsonData);
	var tickets = jsonData.tickets;
	var arrayData = [];
	_.forEach(tickets, function(ticket, index) {
		let quantity = numeral(ticket.quantity).format("0,0.000");
		arrayData.push(putSpaceInFront(`${quantity} (${ticket.modified})`));
		if (tickets.length == (index + 1)) {
			let batchStatsArray = [
				"------------------------",
				putSpaceInFront(numeral(jsonData.total).format("0,0.000")),
				putSpaceInFront("Total"),
				" ",
				putSpaceInFront(jsonData.batchNumber.toString()),
				putSpaceInFront("Batch number"),
				" ",
				putSpaceInFront(jsonData.ticketsQuantity.toString()),
				putSpaceInFront("Tickets"),
				" ",
				putSpaceInFront(jsonData.modified + "x"),
				putSpaceInFront("Modified"),
				" ",
				putSpaceInFront(jsonData.addedBy),
				putSpaceInFront("Added by"),
				" ",
			];
			_.forEach(batchStatsArray, function(value, index) {
				arrayData.push(value);
				if (batchStatsArray.length == (index + 1)){
					saveToTextFile(arrayData);
				}
			});
		}
	});
}

function putSpaceInFront(string) {
	let size = string.length;
	let difference = 24 - size;
	return string = ' '.repeat(difference) + string;
}

function saveToTextFile(data) {
	fs.writeFile(lS.getItem('tempFile'), "", function(err) {
		if (err) {
			return logger.error("Error cleaning temp file");
		}
		data.forEach(function(line) {
			fs.appendFileSync(lS.getItem('tempFile'), line.toString() + '\n');
			logger.info(`File saved in ${lS.getItem('tempFile')}`);
		});
		let pathToFile = lS.getItem('tempFile');

		// Sending file to printer
		flashMessage("Printing batch");
		resetInputs();
		window.location = "#main-page";
		exec(`notepad /p ${pathToFile}`, (err, sto, ste) => {
			if (err) {
				loadingOut(err, "Error printing");
				return logger.error("Error sending CMD to print");
			}
			if (ste) {
				loadingOut(ste, "Error printing");
				logger.error(ste);
			}
			loadingOut(null, "Printing batch");
			console.log(sto);
			resetInputs();
			window.location = "#main-page";
		});
	});
}


Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
}

if (lS.getItem('userName')) {
	var user = lS.getItem('userName');
	$('input[name="added-by"]').val(user);
}

$('input[name="added-by"]').on('keydown', (e) => {
	if (e.which == 13 || e.keyCode == 13) {
		e.preventDefault();
		let input = $('input[name="added-by"]');
		input.blur();
		$('body').focus();
		lS.setItem('userName', input.val());
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
	resetInputs();
	if (!$('.btnDelete').hasClass('btnDelete--disabled')){
		$('.btnDelete').addClass('btnDelete--disabled');
		$('.btnPrint').addClass('btnPrint--disabled');
	}
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
	if (batchNumber == 0) {
		return flashMessage("Batch number can't be 0");
	}
	$('#jsBatchNumber').text(batchNumber);
	$('#jsModalInputContainer').addClass('no-display');
	$('input[name="number-input"]').focus();
	loadingIn();
	getAjax(batchNumber, 'searchBatch', null);
}

function btnModalSaveNewUser() {
	let userName = $('input[name="user"]').val();
	lS.setItem('userName', userName);
	$('#jsModalInputContainer').addClass('no-display');
	$('input[name="added-by"]').val(userName);
	$('input[name="user"]').val('');
	$('input[name="search"]').focus();
}

// lS.removeItem('userName');
if (!lS.getItem('userName')) {
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
		
		if (modifyingBatch === true) {
			let modifiedCurrentValue = $('#jsTimesModified').text();
			lS.setItem('modified', parseInt(modifiedCurrentValue) +1);
		}
	}

	if (e.which == 109 || e.keyCode == 109) {
		e.preventDefault();
		let value = $(this).val();
		value = '-' + value;
		addTicketsAndPopulateList(value, "00");

		if (modifyingBatch === true) {
			let modifiedCurrentValue = $('#jsTimesModified').text();
			lS.setItem('modified', parseInt(modifiedCurrentValue) +1);
		}
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

			lS.setItem('batchData', JSON.stringify(data));
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
$('#btn-edit-batch').on('click', function(e) {
	e.preventDefault();
	if ($('.btnDelete').hasClass('btnDelete--disabled')) {
		$('.btnDelete').removeClass('btnDelete--disabled');
		$('.btnPrint').removeClass('btnPrint--disabled');
	}
	$('input[name="search"]').trigger({type: "keydown", keyCode: 13});;
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
			<label for="quantity" class="quantity-icon fa fa-pencil">
			<input id="${count}" class="jsResetInput" type="text" name="quantity" value="${value}" maxlength="15"> 
			<span>(${modified})</span>
			</label>
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
		let $this = $(this);
		if (e.which == 13 || 
		e.keyCode == 13 || 
		e.which == 107 ||
		e.keyCode == 107 ) {
			e.preventDefault();
			let value = $(this).val();
			value = value.replace('-', '');
			$(this).val(value);
			recalculateBatch();
			modifying();
		}

		if (e.which == 109 || e.keyCode == 109) {
			e.preventDefault();
			let value = $(this).val();
			value = '-' + value;
			$(this).val(value);
			recalculateBatch();
			modifying();
		}

		function modifying() {
			console.log("Modifiying");
			if (modifyingBatch === true) {
				let modifiedCurrentValue = $('#jsTimesModified').text();
				lS.setItem('modified', parseInt(modifiedCurrentValue) +1);

				(function ticketModified() {
					let modifiedCurrentValue = $this.next().text();
					modifiedCurrentValue = modifiedCurrentValue.replace("(", "").replace(")", "");
					let modifiedNewValue = parseInt(modifiedCurrentValue) + 1;
					if (modifiedNewValue.toString().length == 1) {
						modifiedNewValue = "0"+modifiedNewValue;
						$this.next().text(`(${modifiedNewValue})`);
					}
				})();
			}
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
		obj.modified = obj.modified.replace('(' ,'').
			replace(')', '');
		resultArray.push(obj);
		if (i == (tickets-1))
			callback(resultArray);
	});
}

$('#jsBtnSaveAndPrint').on('click', (e) => {
    loadingIn();
    var id;
	if (modifyingBatch === true) {
		id = lS.getItem('batchId');
	} else {
		id = shortid.generate();
		lS.setItem('modified', $('#jsTimesModified').text());
	}
	let batchObj = {};
	let batchNumber = parseInt($('#jsBatchNumber').text());
	let ticketsQuantity = parseInt($('#jsTickets').text());
	let total = numeral().unformat($('#jsTotal').text());
	let modified = lS.getItem('modified');
	let addedBy = lS.getItem('userName');
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
	$.ajax({
		url: addbatchServerURL + 'saveBatchAndPrint',
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json',
		data: data,
		})
		.done(function(data, textStatus, jqXHR) {
			if (data.msg == 'error-saving') {
				logger.error('Error saving to DB');
				loadingOut(true, 'Error saving to DB');
			} else {
				logger.info(`success ${data.msg}`);
				loadingOut(null, 'Batch saved', jsonToArray(lS.getItem('batchData')));
				count = 1;
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			flashMessage("Couldn't connect to server");
			logger.error("Error sending request");
			loadingOut(true, "Error sending to server")
		})
		.always(function(data, textStatus, jqXHR) {
			console.log("complete");
			console.log(textStatus);
		});
}

function getAjax(data, route, callback) {
	$.ajax({
		url: addbatchServerURL+route,
		type: 'GET',
		data: {batchid: data}
		})
		.done(function(data, textStatus, jqXHR) {
			if (data.msg == 'error-searching') {
				logger.error('Error in search for batch');
				flashMessage("Error in search for batch");
				loadingOut(true, 'Error searching for batch');
			} 
			if (data.msg == 'batch-exist') {
				loadingOut(null, 'Batch Exist');
				resetInputs();
				$('#btn-create-page').trigger('click');
				count = 1;
			}
			if (data.msg == 'batch-no-exist') {
				flashMessage("Batch does not exist yet");
				loadingOut(null, 'Batch no exist');
			}
			if (callback) {
				callback(data);
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			flashMessage("Couldn't connect to server");
			logger.error("Error sending request");
			loadingOut(true, "Error sending to server")
		})
		.always(function(data, textStatus, jqXHR) {
			console.log("complete");
			console.log(textStatus);
		});
}

function resetInputs() {
	$('.jsResetInput').val('');
	$('#jsBatchNumber, #jsTotal, #jsTickets, #jsTimesModified').text('0');
	$('.quantity-list').empty();
	ticketsValues = [];
}

$('.btnCancel').on('click', (e) => {
	resetInputs();
	$('#jsModalInputContainer').addClass('no-display');
	$('#jsModalDeleteContainer').addClass('no-display');
	count = 1;
	if (!$('.header-menu').hasClass('no-display')){
		$('.header-menu').addClass('no-display');
	}
});

$('.btnPrint').on('click', (e) => {
	e.preventDefault();

	if($('.btnPrint').hasClass('btnPrint--disabled')) {
		return;
	}

	$('.header-menu').addClass('no-display');
	if (modifyingBatch === true) {
		return jsonToArray(lS.getItem('batchData'));
	}
	flashMessage("You have to save it first"); 
});

$('.btnDelete').on('click', (e) => {
	e.preventDefault();

	if($('.btnDelete').hasClass('btnDelete--disabled')) {
		return;
	}

	$('#jsModalDeleteContainer').removeClass('no-display');
	$('.header-menu').addClass('no-display');;
});

$('.jsModalBtnDelete').on('click', (e) => {
	e.preventDefault();
	$('#jsModalDeleteContainer').addClass('no-display');
	let batchID = lS.getObj('batchData').id;
	getAjax(batchID, "deleteBatch", (data) => {
		if (data == "error-deleting-batch") {
			log4js.info("Batch not deleted");
			return flashMessage("Batch not deleted");
		}
		flashMessage("Batch deleted");
		resetInputs();
		window.location = "#main-page";
	});
})

// Print from HTML
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

// Flash Message
function flashMessage(msg){
	if(hideFlashMessage)
		clearTimeout(hideFlashMessage);
	$('.flashmessage').removeClass('notVisible')
	.html('<p>'+msg+'</p>');
	var hideFlashMessage = setTimeout(function(){
		$('.flashmessage').addClass('notVisible').
		html('');
	}, 3000);
}
// Flash Message

$('.toggle-nav').on('click', function(e) {
	e.preventDefault();
	$('.header-menu').toggleClass('no-display');
});
