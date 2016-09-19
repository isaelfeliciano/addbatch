var shortid = require('shortid');

var ticketsValues = [];
Storage.prototype.setObj = function(key, obj) {
    return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key))
}
const lS = localStorage;

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
	/*$('input[name="quantity"]').each(function() {
		let value = $(this).val();
		value = numeral(value).format('0,0.000');
		$(this).val(value);
	});*/

	(function() {
		let value = $('#jsTotal').text();
		value = numeral(value).format('0,0.000');
		$('#jsTotal').text(value);
	})();
};
updateNumberFormat();

$('#btn-create-page').on('click', (e) => {
	e.preventDefault();
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
		addTicketsAndPopulateList(value);
	}

	if (e.which == 109 || e.keyCode == 109) {
		e.preventDefault();
		let value = $(this).val();
		value = '-' + value;
		addTicketsAndPopulateList(value);
	}
});


function recalculateBatch() {
	let tempStorage = [];
	let ticketsQuantity = parseFloat($('#jsTickets').text());
	$('input[name="quantity"]').each(function(i, value) {
		tempStorage.push(numeral().unformat($(this).val()));
		if (i == (ticketsQuantity-1)) {
			let total = _.sum(tempStorage);
			$('#jsTotal').text(total);
			updateNumberFormat();
		}
	});
}

function addTicketsAndPopulateList(value) {
	$('.quantity-list').append(
		`<li>
			<input class="jsResetInput" type="text" name="quantity" value="${value}" maxlength="15"> 
			<span>(0)</span>
		</li>`
	);
	$('input[name="number-input"]').val('');
	
	/*var backSpace = jQuery.Event("keydown");
	backSpace.which = 8;
	$('input[name="number-input"]').trigger(backSpace);*/
	
	updateNumberFormat();

	$('#jsTickets').text($('.quantity-list').children().length);

	value = numeral().unformat(value);
	value = parseFloat(value);
	recalculateBatch();
	/*ticketsValues.push(value);
	let sumResult = _.sum(ticketsValues);
	sumResult = numeral(sumResult).format('0,0.000')
	$('#jsTotal').text(sumResult);*/

	$('input[name="quantity"]' ).on('keydown', function(e) {
		var selector = $(this);
		if (e.which == 13 || 
		e.keyCode == 13 || 
		e.which == 107 ||
		e.keyCode == 107 ) {
			e.preventDefault();
			let value = $(selector).val();
			value = value.replace('-', '');
			$(selector).val(value);
			recalculateBatch();
		}

		if (e.which == 109 || e.keyCode == 109) {
			e.preventDefault();
			let value = $(selector).val();
			value = '-' + value;
			$(selector).val(value);
			console.log(value);
			recalculateBatch();
		}
	});
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
	getTickets(ticketsQuantity, function(tickets){
		batchObj = {
			id: shortid.generate(),
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

function loadingOut(err, text) {
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
	    }, 2500);
	}
}

function sendJSON(data) {
	$.ajax({
		url: 'http://localhost:3131/saveBatchAndPrint',
		type: 'POST',
		dataType: 'JSON',
		data: data,
		})
		.done(function(data, textStatus, jqXHR) {
			if (data.msg == 'error-saving') {
				console.log('error-saving');
				loadingOut(true, 'Error Saving to DB');
			} else {
				console.log(`success ${data.msg}`);
				loadingOut(null, 'Batch saved');
				resetInputs();
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

$('#btnCancel').on('click', (e) => {
	resetInputs();
});