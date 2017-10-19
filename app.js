const lS = localStorage;
var addbatchServerURL = lS.getItem('serverAddress');
const shortid = require('shortid');
const fs = require('fs');
const path = require('path');
const uniqueTempDir = require('unique-temp-dir');
const exec = require('child_process').exec;
var count = 1;
var ticketsValues = [];
var log4js = require('log4js');
var windowLocation = window.location;
var gui = require('nw.gui');
var win = nw.Window.get();

function noDisplay(element) {
	$(element).addClass('no-display');
}

function yesDisplay(element) {
	$(element).removeClass('no-display');
}

$('#new-window').on('click', function(e) {
	e.preventDefault()
	window.open("./index.html");
});

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

function getStatistics() {
	$.ajax({
		url: addbatchServerURL+'getStatistics',
		type: 'GET'
	}).done((data, textStatus, jqXHR) => {
		stats.addedBatches = data.addedBatches;
		stats.batchesTotal = data.batchesTotal;
		stats.modifiedBatches = data.modifiedBatches;
		stats.modifiedBatchesTimes = data.modifiedBatchesTimes;
		stats.addedTickets = data.addedTickets;
		stats.modifiedTickets = data.modifiedTickets;
		stats.modifiedTicketsTimes = data.modifiedTicketsTimes;
	}).fail((jqXHR, textStatus, errorThrown) => {
		flashMessage("Couldn't get statistics");
		logger.error("Error sending request --Get Statistics");
		// loadingOut(true, "Error sending to server");
		window.location = '#main-page'
		// resetInputs();
	})
};
getStatistics();

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
				putSpaceInFront("Added by")
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
	console.log(string);
	let size = string.length;
	let difference = 24 - size;
	return string = ' '.repeat(difference) + string;
}

function saveToTextFile(data) {
	console.log(data.length);
	window.location = "#main-page";
	fs.writeFile(lS.getItem('tempFile'), "", function(err) {
		if (err) {
			return logger.error("Error cleaning temp file");
		}
		var dataCounter = 0;
		data.forEach(function(line) {
			dataCounter++;
			fs.appendFileSync(lS.getItem('tempFile'), line.toString() + '\n');
			logger.info(`File saved in ${lS.getItem('tempFile')}`);
			if (data.length === dataCounter) {
				// Sending file to printer
				let pathToFile = lS.getItem('tempFile');
				flashMessage("Printing batch");
				// window.location = "#main-page";
				resetInputs();
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
				});
			}
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
});

$('.btnSetServerIp').on('click', (e) => {
	hideHeaderMenu();
	$('#jsModalSetServerContainer').removeClass('no-display');
	$('.jsModalBtnSetServer').on('click', (e) => {
		e.preventDefault();
		let serverAddress = $('input[name="server-address"]').val();
		lS.setItem('serverAddress', serverAddress);
		addbatchServerURL = serverAddress;
		$('#jsModalSetServerContainer').addClass('no-display');
	});
}); 
$('input[name="server-address"]').val(lS.getItem('serverAddress'));

$('.btnUpdateStatistics').on('click', (e) => {
	e.preventDefault();
	hideHeaderMenu();
	getStatistics();
});

$('.btnSelectPrinters').on('click', (e) => {
	e.preventDefault();
	hideHeaderMenu();
	vmModalSelectPrinter.getPrinters();
	vmModalSelectPrinter.showModal = true;
});


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
	createPage.modifyingBatch = false;
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
	let ticketNumber = $('#jsModalInput').val();
	if (ticketNumber == 0 || ticketNumber.length !== 5) {
		return flashMessage("Wrong Ticket Number");
	}

	let beginingNumber = getBeginingNumber(ticketNumber);
	console.log(beginingNumber);

	
	$('#jsModalInputContainer').addClass('no-display');
	$('input[name="number-input"]').focus();
	loadingIn();
	getAjax(beginingNumber, 'getBatchNumberByBeginingNumber', (batchNumber) => {
		$('#jsBatchNumber').text(batchNumber);
		batchTypeTime.showModal = true;
	});
}

function btnModalSaveNewUser() {
	let userName = $('input[name="user"]').val();
	lS.setItem('userName', userName);
	$('#jsModalInputContainer').addClass('no-display');
	$('input[name="added-by"]').val(userName);
	$('input[name="user"]').val('');
	$('input[name="search"]').focus();
}

function getBeginingNumber(ticketNumber) {
	let lastTwoNumbers = ticketNumber.slice(3);
	lastTwoNumbers = parseInt(lastTwoNumbers);

	let middleNumber = parseInt(ticketNumber.slice(2, 3)) - 1;
	if (lastTwoNumbers === 00) return ticketNumber.slice(0, 2) + middleNumber + '76';
	if (lastTwoNumbers <= 25) return ticketNumber.slice(0, 3) + '01';
	if (lastTwoNumbers <= 50) return ticketNumber.slice(0, 3) + '26';
	if (lastTwoNumbers <= 75) return ticketNumber.slice(0, 3) + '51';
	if (lastTwoNumbers <= 99) return ticketNumber.slice(0, 3) + '76';
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
	var rightCol = document.getElementById("right-col");
	if (e.which == 13 || 
	e.keyCode == 13 || 
	e.which == 107 ||
	e.keyCode == 107 ) {
		e.preventDefault();
		let value = $(this).val();
		addTicketsAndPopulateList(value, "00");
		
		if (createPage.modifyingBatch === true) {
			let modifiedCurrentValue = $('#jsTimesModified').text();
			lS.setItem('modified', parseInt(modifiedCurrentValue) +1);
		}
	}

	if (e.which == 109 || e.keyCode == 109) {
		e.preventDefault();
		let value = $(this).val();
		value = '-' + value;
		addTicketsAndPopulateList(value, "00");

		if (createPage.modifyingBatch === true) {
			let modifiedCurrentValue = $('#jsTimesModified').text();
			lS.setItem('modified', parseInt(modifiedCurrentValue) +1);
		}
	}
	rightCol.scrollTop = rightCol.scrollHeight;
	// $('input[name="number-input"]' ).focus();
	// location = '#create-page';
	// Disabled, update quantity input wont work  
	//Hack so back button can work
	// Test if works on windows
});

$('input[name="search"]').on('keydown', function(e) {
	if (e.which == 13 || e.keyCode == 13) {
		e.preventDefault();
		if ($('.btnDelete').hasClass('btnDelete--disabled')) {
			$('.btnDelete').removeClass('btnDelete--disabled');
			$('.btnPrint').removeClass('btnPrint--disabled');
		}

		let batchNumber = $(this).val();
		if (batchNumber === '') return;
		flashMessage("Searching Batch");
		getAjax(batchNumber, 'searchBatchGetJSON', function(data) {
			flashMessage("Batch loaded");
			$('.search-batch').blur();
			createPage.modifyingBatch = true;
			$('#jsTotal').text(data.total);
			$('#jsBatchNumber').text(data.batchNumber);
			$('#jsTickets').text(data.ticketsQuantity);
			$('#jsTimesModified').text(data.modified);
			$('input[name="added-by"]').val(data.addedBy);
			createPage.arrivalTime = data.arrivalTime;
			createPage.arrivalDate = data.arrivalDate;
			createPage.beginingTicket = data.beginingTicket;
			createPage.endingTicket = data.endingTicket;
			createPage.batchType = data.batchType;

			lS.setItem('batchData', JSON.stringify(data));
			lS.setItem('batchId', data.id);
			var tickets = data.tickets;
			_.forEach(tickets, function(ticket, index) {
				count = index++;
				addTicketsAndPopulateList(ticket.quantity, numeral(ticket.modified).format('00'));
				if (index == tickets.length) {
					location = '#create-page';
				}
				console.log(createPage.modifyingBatch);
			});
		});
	}
});
$('#btn-edit-batch').on('click', function(e) {
	e.preventDefault();
	$('input[name="search"]').trigger({type: "keydown", keyCode: 13});;
});

function recalculateBatch() {
	let tempStorage = [];
	let ticketsQuantity = parseInt($('#jsTickets').text());
	$('input[name="quantity"]').each(function(i, value) {
		tempStorage.push(numeral($(this).val())._value);
		if (i == (ticketsQuantity - 1)) {
			console.log("recalculateBatch");
			let total = _.sum(tempStorage);
			$('#jsTotal').text(total);
			updateNumberFormat();
		}
	});
}


function addTicketsAndPopulateList(value, modified) {
	if (createPage.modifyingBatch === false){
		$('.quantity-list').append(
			`<li>
				<label for="quantity" class="quantity-icon fa fa-pencil">
				<i for="quantity" id="jsDelTicketBtn${count}" class="fa fa-trash"></i>
				<input id="${count}" class="jsResetInput" type="text" name="quantity" value="${value}" maxlength="15"> 
				<span>(${modified})</span>
				</label>
			</li>`
		);
	} else {
		$('.quantity-list').append(
			`<li>
				<label for="quantity" class="quantity-icon fa fa-pencil">
				<input id="${count}" class="jsResetInput" type="text" name="quantity" value="${value}" maxlength="15"> 
				<span>(${modified})</span>
				</label>
			</li>`
		);
	}

	//Binding event
	$(`#jsDelTicketBtn${count}`).on("click", (e) => {
		$(e.target).parent().parent().remove();
		$("#jsTickets").text(parseInt($("#jsTickets").text()) - 1);
		recalculateBatch();
		if ($(".quantity-list li").length === 0) {
			$("#jsTotal").text("0");
		}
	});

	$('input[name="number-input"]').val('');
	
	/*var backSpace = jQuery.Event("keydown");
	backSpace.which = 8;
	$('input[name="number-input"]').trigger(backSpace);*/
	
	updateNumberFormat();

	$('#jsTickets').text($('.quantity-list').children().length);

	if (typeof(value) == 'string'){
		value = numeral(value)._value;
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
			if (createPage.modifyingBatch === true) {
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
		obj.quantity = numeral($(this).val())._value;
		obj.modified = numeral('-'+$(this).next().text())._value;
		resultArray.push(obj);
		if (i == (tickets-1))
			callback(resultArray);
	});
}

$('#jsBtnSaveAndPrint').on('click', (e) => {
    loadingIn();
    var id;
	if (createPage.modifyingBatch === true) {
		id = lS.getItem('batchId');
	} else {
		id = shortid.generate();
		lS.setItem('modified', $('#jsTimesModified').text());
	}
	let batchObj = {};
	let batchNumber = parseInt($('#jsBatchNumber').text());
	let ticketsQuantity = parseInt($('#jsTickets').text());
	let total = numeral($('#jsTotal').text())._value;
	let modified = lS.getItem('modified');
	let addedBy = lS.getItem('userName');
	getTickets(ticketsQuantity, function(tickets){
		batchObj = {
			id: id,
			batchNumber: batchNumber,
			ticketsQuantity: ticketsQuantity,
			total: total,
			modified: parseInt(modified),
			addedBy: addedBy,
			tickets: tickets,
			batchType: createPage.batchType,
			beginingTicket: createPage.beginingTicket,
			endingTicket: createPage.endingTicket,
			arrivalTime: createPage.arrivalTime,
			arrivalDate: createPage.arrivalDate
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
		.removeClass('fa-check fa-times');
    $('.modal--loading').removeClass('no-display');
    $('#jsModalLoading').removeClass('fadeOutUpBig')
    .addClass('fadeInUpBig');
};

function loadingOut(err, text, printAfter) {
	$('.flashmessage').addClass('notVisible');
	if (err) {
		setTimeout(function waitOneSec() {
		$('#jsModalLoading span').text(text);
		$('#jsModalLoading i')
		.removeClass('fa-cog fa-spin fa-fw fa-check')
		.addClass('fa-times');
		noDisplayLoading();
	}, 1000);
	} else {
		setTimeout(function waitOneSec() {
			$('#jsModalLoading span').text(text);
			$('#jsModalLoading i')
			.removeClass('fa-cog fa-spin fa-fw fa-times')
			.addClass('fa-check');
			noDisplayLoading();
		}, 1000);
	    setTimeout(function waitTwoSec() {
	    $('#jsModalLoading').removeClass('fadeInUpBig')
	    .addClass('fadeOutUpBig');
	    noDisplayLoading();
	    if (printAfter) {
	    	printAfter();
	    }
	    }, 2500);
	}

	function noDisplayLoading() {
		setTimeout(function() {
			$('.modal--loading').addClass('no-display');
			$('.flashmessage').addClass('notVisible');
		}, 1800);
	}
}

function sendJSON(data) {
	dataToSend = localStorage.getItem('batchData');
	$.ajax({
		url: addbatchServerURL + 'saveBatchAndPrint',
		type: 'POST',
		dataType: 'json',
		contentType: 'application/json',
		data: dataToSend,
		})
		.done(function(data, textStatus, jqXHR) {
			if (data.msg == 'error-saving') {
				logger.error('Error saving to DB');
				loadingOut(true, 'Error saving to DB');
			} else {
				logger.info(`success ${data.msg}`);
				loadingOut(null, 'Batch saved, now printing', () => {
					printPage();
				});
				count = 1;
				stats.lastBatchAdded = JSON.parse(dataToSend).batchNumber;
				getStatistics();
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
			if (data.msg === 'error-searching') {
				logger.error('Error in search for batch');
				flashMessage("Error in search for batch");
				loadingOut(true, 'Error searching for batch');
			} 
			if (data.msg === 'range-no-exist') {
				loadingOut(null, 'No exist batch for this ticket');
				resetInputs();
				$('#btn-create-page').trigger('click');
				count = 1;
			}
			if (data.msg === 'batch-no-exist') {
				loadingOut(null, 'Batch not found');
				resetInputs();
				// $('#btn-create-page').trigger('click');
				count = 1;
			}
			if (data.msg === 'batch-exist') {
				loadingOut(null, 'Batch already added');
				resetInputs();
				$('#btn-create-page').trigger('click');
				count = 1;
			}
			if (data.msg === 'batch-no-added') {
				flashMessage("You can add this batch");
				$('.btnPrint').addClass('btnPrint--disabled');
				$('.btnDelete').addClass('btnDelete--disabled');
				loadingOut(null, 'Batch ready to be added');
				console.log(data);
				createPage.beginingTicket = data.data.beginingNumber;
				createPage.endingTicket = data.data.endingNumber;
				callback(data.data.batchNumber);
			}
			if (data.msg === 'batch-deleted'){
				callback(data);
			}
			if (data.msg === "batch-json") {
				callback(data);
			}
		})
		.fail(function(jqXHR, textStatus, errorThrown) {
			flashMessage("Couldn't connect to server");
			logger.error("Error sending request");
			loadingOut(true, "Error sending to server");
			window.location = '#main-page'
			resetInputs();
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

	$('.btnPrint').addClass('btnPrint--disabled');
	$('.btnDelete').addClass('btnDelete--disabled');
});

$('.btnPrint').on('click', (e) => {
	e.preventDefault();

	if($('.btnPrint').hasClass('btnPrint--disabled')) {
		return;
	}

	hideHeaderMenu();
	if (createPage.modifyingBatch === true) {
		return printPage();
	}
	flashMessage("You have to save it first"); 
});

$('.btnOpenNewWindow').on('click', (e) => {
	e.preventDefault();
	hideHeaderMenu();
	window.open("./index.html");
});

$('.btnDelete').on('click', (e) => {
	e.preventDefault();

	if($('.btnDelete').hasClass('btnDelete--disabled')) {
		return;
	}

	$('#jsModalDeleteContainer').removeClass('no-display');
	hideHeaderMenu();
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

$('.toggle-nav').on('blur', function(e) {
	if ($(e.relatedTarget).hasClass('header-menu-btn')){
		return;
	}
	hideHeaderMenu();
});

function hideHeaderMenu() {
	$('.header-menu').addClass('no-display');
}

function printPage() {
	window.open('./batch-add-and-control.html');
	window.location = "#main-page";
	resetInputs();
}
