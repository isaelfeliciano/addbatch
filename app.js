const lS = localStorage;
let ticketsValues = [];

function updateNumberFormat() {
	// $('input[name="number-input"]').number(true, 3);
	// $('input[name="quantity"]').number(true, 3);
	$('input[name="quantity"]').each(function() {
		let value = $(this).val();
		value = numeral(value).format('0,0.000');
		$(this).val(value);
	});
};
updateNumberFormat();

$('#btn-create-page').on('click', (e) => {
	e.preventDefault();
	window.location = "#create-page";
	$('.modal__box i').attr('class', 'fa fa-5x fa-book').text('');
	$('#jsModalInput').attr('name', 'batchNumber');
	$('#jsModalInput').attr('placeholder', 'Enter batch number');
	$('.modal').removeClass('no-display');
	$('#jsModalInput').focus();
	$('.jsModal-save').on('click', (e) => {
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
	$('.modal').addClass('no-display');
	$('input[name="number-input"]').focus();
}

function btnModalSaveNewUser() {
	let userName = $('input[name="user"]').val();
	lS.setItem('firstTime', `{userName: ${userName}}`);
	$('.modal').addClass('no-display');
	$('input[name="user"]').val('');
	$('input[name="search"]').focus();
}

// lS.removeItem('firstTime');
if (!lS.getItem('firstTime')) {
	$('.modal').removeClass('no-display');
	$('input[name="user"]').focus();
	$('.jsModal-save').on('click', function(e) {
		e.preventDefault();
		btnModalSaveNewUser();
	});
}

$('input[name="number-input"]').on('keydown', (e) => {
	if (e.which == 13 || 
	e.keyCode == 13 || 
	e.which == 107 ||
	e.keyCode == 107 ) {
		e.preventDefault();
		let value = $('input[name="number-input"]').val();
		addTicketsAndPopulateList(value);
	}

	if (e.which == 109 || e.keyCode == 109) {
		e.preventDefault();
		let value = $('input[name="number-input"]').val();
		value = '-' + value;
		addTicketsAndPopulateList(value);
	}
});

function addTicketsAndPopulateList(value) {
	$('.quantity-list').append(
		`<li>
			<input data-type="number" type="text" name="quantity" value="${value}" maxlength="15"> 
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
	ticketsValues.push(value);
	$('#jsTotal').text(_.sum(ticketsValues));
	$('#jsTotal').number(true, 3);
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
